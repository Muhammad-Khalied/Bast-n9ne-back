import { PrismaClient } from '@prisma/client';
import { WishlistService } from '../src/modules/wishlist/wishlist.service';

const prisma = new PrismaClient();
const service = new WishlistService();

async function run() {
  console.log("Creating user...");
  let user = await prisma.user.findFirst({ where: { email: "test_wishlist@example.com" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "test_wishlist@example.com",
        passwordHash: "hash",
        firstName: "Test",
        lastName: "User",
      }
    });
  }

  console.log("Finding a product...");
  const product = await prisma.product.findFirst({ where: { status: "PUBLISHED" } });
  if (!product) {
    console.log("No product found!");
    return;
  }

  console.log(`Adding product ${product.id} to wishlist...`);
  await service.addItem(user.id, product.id);

  console.log("Fetching wishlist...");
  let wishlist = await service.getWishlist(user.id);
  console.log("Wishlist items count:", wishlist?.items.length);
  console.log("First item productId:", wishlist?.items[0]?.productId);

  console.log(`Removing product ${product.id} from wishlist...`);
  await service.removeItem(user.id, product.id);

  console.log("Fetching wishlist again...");
  wishlist = await service.getWishlist(user.id);
  console.log("Wishlist items count after removal:", wishlist?.items.length);
}

run().catch(console.error).finally(() => prisma.$disconnect());
