import { cloudinary } from "../../config/cloudinary";
import { prisma } from "../../config/database";
import { AppError } from "../../utils/AppError";

export class MediaService {
  async upload(file: Express.Multer.File, productId?: string, altText?: string) {
    if (!cloudinary.config().cloud_name) {
      throw new AppError("Cloudinary not configured", 500, "CLOUDINARY_NOT_CONFIGURED");
    }

    const result = await new Promise<{ secure_url: string; public_id: string; width: number; height: number }>(
      (resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "velura/products",
            transformation: [
              { quality: "auto:good", fetch_format: "auto" },
              { width: 1200, height: 1600, crop: "limit" },
            ],
          },
          (error, uploadResult) => {
            if (error || !uploadResult) {
              return reject(error || new Error("Upload failed"));
            }
            resolve({
              secure_url: uploadResult.secure_url,
              public_id: uploadResult.public_id,
              width: uploadResult.width,
              height: uploadResult.height,
            });
          }
        );
        stream.end(file.buffer);
      }
    );

    // If productId provided, save to database
    if (productId) {
      const lastMedia = await prisma.productMedia.findFirst({
        where: { productId },
        orderBy: { sortOrder: "desc" },
      });

      const media = await prisma.productMedia.create({
        data: {
          productId,
          type: "IMAGE",
          url: result.secure_url,
          publicId: result.public_id,
          altText: altText || null,
          sortOrder: (lastMedia?.sortOrder ?? -1) + 1,
          width: result.width,
          height: result.height,
        },
      });

      return media;
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  }

  async delete(mediaId: string) {
    const media = await prisma.productMedia.findUnique({ where: { id: mediaId } });
    if (!media) throw new AppError("Media not found", 404, "MEDIA_NOT_FOUND");

    // Delete from Cloudinary
    if (cloudinary.config().cloud_name) {
      await cloudinary.uploader.destroy(media.publicId).catch(() => {});
    }

    await prisma.productMedia.delete({ where: { id: mediaId } });
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    await prisma.$transaction(
      items.map((item) =>
        prisma.productMedia.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );
  }
}
