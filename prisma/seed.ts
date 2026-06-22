import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding VELURA database...");

  // ── Admin User ──────────────────────────────────────────────
  const adminEmail = "admin@velura.local";
  const adminPassword = "Admin123!";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash,
      firstName: "Velura",
      lastName: "Admin",
      role: "ADMIN",
    },
  });
  console.log("✅ Admin user created:", adminEmail);

  // ── Categories ──────────────────────────────────────────────
  const categoryData = [
    { name: "Streetwear", slug: "streetwear", description: "Urban essentials for the modern wardrobe" },
    { name: "Outerwear", slug: "outerwear", description: "Premium jackets and coats for every season" },
    { name: "Footwear", slug: "footwear", description: "Statement shoes crafted for comfort" },
    { name: "Accessories", slug: "accessories", description: "The finishing touches to complete your look" },
  ];

  for (const cat of categoryData) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { description: cat.description },
      create: cat,
    });
  }
  console.log("✅ Categories created");

  console.log("\n🎉 Seed complete!");
  console.log("   Admin login: admin@velura.local / Admin123!");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
