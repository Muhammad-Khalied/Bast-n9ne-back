import { prisma } from "../../config/database";
import { cloudinary } from "../../config/cloudinary";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

const BLOCKED_WORDS = [
  "nude", "naked", "porn", "sex", "violence", "gore", "blood",
  "drug", "weapon", "gun", "kill", "hate", "racist", "terrorism",
];

export class AiDesignerService {
  /**
   * Generate a t-shirt design using OpenAI Images API
   */
  async generateDesign(userId: string, prompt: string, shirtColor: string, size: string) {
    if (!env.OPENAI_API_KEY) {
      throw new AppError("AI image generation is not configured", 503, "AI_NOT_CONFIGURED");
    }

    // Check for inappropriate content
    const lowerPrompt = prompt.toLowerCase();
    for (const word of BLOCKED_WORDS) {
      if (lowerPrompt.includes(word)) {
        throw new AppError(
          "Your prompt contains inappropriate content. Please describe a different design.",
          400,
          "INAPPROPRIATE_PROMPT"
        );
      }
    }

    // Check generation limits from settings
    const limitSetting = await prisma.siteSetting.findUnique({
      where: { key: "ai_generation_limit" },
    });
    const hourlyLimit = limitSetting ? Number(limitSetting.value) : 5;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.customTShirtDesign.count({
      where: {
        userId,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= hourlyLimit) {
      throw new AppError(
        `You have reached the limit of ${hourlyLimit} designs per hour. Please try again later.`,
        429,
        "GENERATION_LIMIT_REACHED"
      );
    }

    // Check if AI designer is enabled
    const enabledSetting = await prisma.siteSetting.findUnique({
      where: { key: "ai_designer_enabled" },
    });
    if (enabledSetting && enabledSetting.value === false) {
      throw new AppError("AI Designer is currently disabled", 503, "AI_DESIGNER_DISABLED");
    }

    // Build the OpenAI prompt
    const aiPrompt = `Create a clean printable t-shirt artwork for a ${shirtColor.toUpperCase()} t-shirt.

Design description:
${prompt}

Requirements:
- centered composition
- high quality
- suitable for screen printing
- transparent background
- no mockup
- no person
- no folded shirt
- no realistic clothing
- only the artwork itself`;

    const model = env.AI_IMAGE_MODEL || "gpt-image-1-mini";

    // Call OpenAI Images API
    let imageBase64: string;
    let revisedPrompt: string | undefined;

    try {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          prompt: aiPrompt,
          n: 1,
          size: "1024x1024",
          quality: "medium",
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error("OpenAI API error:", errorBody);
        throw new AppError(
          "Failed to generate design. Please try again.",
          502,
          "AI_GENERATION_FAILED"
        );
      }

      const data = await response.json();
      const result = data.data?.[0];

      if (!result) {
        throw new AppError("No image was generated. Please try again.", 502, "AI_NO_RESULT");
      }

      imageBase64 = result.b64_json;
      revisedPrompt = result.revised_prompt;

      // If the API returned a URL instead of base64, fetch it
      if (!imageBase64 && result.url) {
        const imgResponse = await fetch(result.url);
        const buffer = Buffer.from(await imgResponse.arrayBuffer());
        imageBase64 = buffer.toString("base64");
      }

      if (!imageBase64) {
        throw new AppError("No image data received. Please try again.", 502, "AI_NO_IMAGE_DATA");
      }
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error("OpenAI API call failed:", error);
      throw new AppError(
        "AI generation service is temporarily unavailable. Please try again.",
        502,
        "AI_SERVICE_ERROR"
      );
    }

    // Upload to Cloudinary
    let imageUrl: string;
    let imagePublicId: string;

    try {
      if (!cloudinary.config().cloud_name) {
        throw new AppError("Cloud storage is not configured", 500, "CLOUDINARY_NOT_CONFIGURED");
      }

      const uploadResult = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          cloudinary.uploader.upload(
            `data:image/png;base64,${imageBase64}`,
            {
              folder: "velura/ai-designs",
              resource_type: "image",
            },
            (error, result) => {
              if (error || !result) {
                return reject(error || new Error("Upload failed"));
              }
              resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
              });
            }
          );
        }
      );

      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error("Cloudinary upload failed:", error);
      throw new AppError(
        "Failed to save generated design. Please try again.",
        500,
        "UPLOAD_FAILED"
      );
    }

    // Save design record
    const design = await prisma.customTShirtDesign.create({
      data: {
        userId,
        prompt,
        revisedPrompt,
        imageUrl,
        imagePublicId,
        shirtColor,
        size,
        status: "GENERATED",
      },
    });

    return design;
  }

  /**
   * Get a single design by ID
   */
  async getDesign(userId: string, designId: string) {
    const design = await prisma.customTShirtDesign.findFirst({
      where: { id: designId, userId },
    });

    if (!design) {
      throw new AppError("Design not found", 404, "DESIGN_NOT_FOUND");
    }

    return design;
  }

  /**
   * List all designs for a user
   */
  async getUserDesigns(userId: string) {
    return prisma.customTShirtDesign.findMany({
      where: { userId, status: { not: "DELETED" } },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Add a custom design to cart
   */
  async addToCart(userId: string, designId: string, quantity: number) {
    const design = await prisma.customTShirtDesign.findFirst({
      where: { id: designId, userId, status: "GENERATED" },
    });

    if (!design) {
      throw new AppError("Design not found or already ordered", 400, "DESIGN_NOT_AVAILABLE");
    }

    // Get the current price
    const price = await this.getCurrentPrice();

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }

    // Upsert custom cart item
    return prisma.customCartItem.upsert({
      where: { cartId_designId: { cartId: cart.id, designId } },
      update: { quantity, unitPrice: price },
      create: {
        cartId: cart.id,
        designId,
        quantity,
        unitPrice: price,
      },
      include: { design: true },
    });
  }

  /**
   * Get custom cart items for a user
   */
  async getCustomCartItems(userId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return [];

    return prisma.customCartItem.findMany({
      where: { cartId: cart.id },
      include: { design: true },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Update custom cart item quantity
   */
  async updateCustomCartItemQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      throw new AppError("Cart not found", 404, "CART_NOT_FOUND");
    }

    const item = await prisma.customCartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new AppError("Custom item not found in cart", 404, "ITEM_NOT_FOUND");
    }

    return prisma.customCartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { design: true },
    });
  }

  /**
   * Remove custom cart item
   */
  async removeCustomCartItem(userId: string, itemId: string) {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      return { message: "Item removed" };
    }

    await prisma.customCartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });
    return { message: "Item removed" };
  }

  /**
   * Get AI designer settings (public)
   */
  async getSettings() {
    const settings = await prisma.siteSetting.findMany({
      where: { group: "ai_designer" },
    });

    const settingsMap: Record<string, any> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    // Apply defaults if not set
    if (!settingsMap.ai_designer_enabled) settingsMap.ai_designer_enabled = true;
    if (!settingsMap.ai_tshirt_price) settingsMap.ai_tshirt_price = Number(env.CUSTOM_TSHIRT_DEFAULT_PRICE);
    if (!settingsMap.ai_tshirt_colors) settingsMap.ai_tshirt_colors = ["White", "Black", "Navy", "Gray", "Red"];
    if (!settingsMap.ai_max_prompt_length) settingsMap.ai_max_prompt_length = 500;
    if (!settingsMap.ai_generation_limit) settingsMap.ai_generation_limit = 5;

    return settingsMap;
  }

  /**
   * Update AI designer settings (admin)
   */
  async updateSettings(settings: { key: string; value: any; group: string }[]) {
    return Promise.all(
      settings.map((s) =>
        prisma.siteSetting.upsert({
          where: { key: s.key },
          update: { value: s.value, group: s.group || "ai_designer" },
          create: { key: s.key, value: s.value, group: s.group || "ai_designer" },
        })
      )
    );
  }

  /**
   * Get current custom t-shirt price from settings
   */
  async getCurrentPrice(): Promise<number> {
    const priceSetting = await prisma.siteSetting.findUnique({
      where: { key: "ai_tshirt_price" },
    });
    return priceSetting ? Number(priceSetting.value) : Number(env.CUSTOM_TSHIRT_DEFAULT_PRICE);
  }
}
