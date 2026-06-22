import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    include: {
      wishlist: { include: { items: true } },
      cart: { include: { items: true } },
    }
  });

  for (const user of users) {
    if (user.wishlist?.items?.length || user.cart?.items?.length) {
      console.log(`User: ${user.email}`);
      console.log(`Wishlist items:`, user.wishlist?.items);
      console.log(`Cart items:`, user.cart?.items);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
