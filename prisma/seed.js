"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const adminEmail = "admin@velura.local";
    const adminPassword = "Admin123!";
    const passwordHash = await bcryptjs_1.default.hash(adminPassword, 12);
    const adminUser = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            passwordHash,
            firstName: "Velura",
            lastName: "Admin",
            role: client_1.Role.ADMIN,
        },
    });
    const categories = [
        { name: "Streetwear", slug: "streetwear" },
        { name: "Outerwear", slug: "outerwear" },
        { name: "Footwear", slug: "footwear" },
        { name: "Accessories", slug: "accessories" },
    ];
    for (const category of categories) {
        await prisma.category.upsert({
            where: { slug: category.slug },
            update: {},
            create: category,
        });
    }
    const streetwear = await prisma.category.findUnique({ where: { slug: "streetwear" } });
    if (streetwear) {
        await prisma.product.upsert({
            where: { slug: "sage-essentials-hoodie" },
            update: {},
            create: {
                title: "Sage Essentials Hoodie",
                slug: "sage-essentials-hoodie",
                description: "Premium heavyweight hoodie with brushed interior.",
                shortDescription: "Signature hoodie in sage.",
                price: 140,
                categoryId: streetwear.id,
                status: client_1.ProductStatus.PUBLISHED,
                tags: ["new-arrival", "bestseller"],
                sizes: ["S", "M", "L", "XL"],
                colors: [{ name: "Sage", hex: "#7c8c6c" }],
                featured: true,
                media: {
                    create: [
                        {
                            url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
                            publicId: "demo/hoodie-1",
                            altText: "Sage Essentials Hoodie",
                            sortOrder: 0,
                        },
                    ],
                },
                variants: {
                    create: [
                        { size: "S", color: "Sage", sku: "VEL-HOODIE-S", stock: 20 },
                        { size: "M", color: "Sage", sku: "VEL-HOODIE-M", stock: 25 },
                        { size: "L", color: "Sage", sku: "VEL-HOODIE-L", stock: 15 },
                    ],
                },
            },
        });
        const seededVariant = await prisma.productVariant.findFirst({
            where: { product: { slug: "sage-essentials-hoodie" } },
            orderBy: { createdAt: "asc" },
        });
        if (seededVariant) {
            await prisma.inventoryMovement.create({
                data: {
                    variantId: seededVariant.id,
                    type: "STOCK_IN",
                    quantity: 20,
                    reason: "Initial seed",
                    performedBy: adminUser.id,
                },
            });
        }
    }
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
