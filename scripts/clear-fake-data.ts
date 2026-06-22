import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing fake products and related data...");

  // Delete in correct order to avoid foreign key constraints
  await prisma.auditLog.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.productMedia.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  
  // Delete test users (keep ADMIN)
  await prisma.address.deleteMany();
  await prisma.user.deleteMany({
    where: {
      role: {
        not: "ADMIN"
      }
    }
  });

  console.log("✅ Fake data cleared!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
