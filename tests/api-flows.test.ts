import request from "supertest";
import { createApp } from "../src/config/app";
import { prisma } from "../src/config/database";

const app = createApp();
const agent = request.agent(app);
const runId = Date.now().toString();

const categorySlug = `api-flow-category-${runId}`;
const productSlug = `api-flow-product-${runId}`;
const testEmail = `flow-${runId}@api-flow.test`;
const testPassword = "FlowPass123!";

let productId: string;
let variantId: string;

describe("core customer API flows", () => {
  beforeAll(async () => {
    const category = await prisma.category.create({
      data: {
        name: `API Flow Category ${runId}`,
        slug: categorySlug,
        description: "Category used by backend integration tests",
      },
    });

    const product = await prisma.product.create({
      data: {
        title: `API Flow Product ${runId}`,
        slug: productSlug,
        description: "Product used by backend integration tests",
        shortDescription: "Integration test product",
        price: 100,
        categoryId: category.id,
        status: "PUBLISHED",
        tags: ["test"],
        sizes: ["M"],
        colors: [{ name: "Black", hex: "#000000" }],
        media: {
          create: [
            {
              url: "https://example.com/test-product.jpg",
              publicId: `tests/${productSlug}`,
              altText: "Integration test product",
              sortOrder: 0,
            },
          ],
        },
        variants: {
          create: [
            {
              size: "M",
              color: "Black",
              sku: `TEST-${runId}`,
              stock: 5,
            },
          ],
        },
      },
      include: { variants: true },
    });

    productId = product.id;
    variantId = product.variants[0].id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });

    if (productId) {
      await prisma.cartItem.deleteMany({ where: { productId } });
      await prisma.wishlistItem.deleteMany({ where: { productId } });
      await prisma.productVariant.deleteMany({ where: { productId } });
      await prisma.productMedia.deleteMany({ where: { productId } });
      await prisma.product.deleteMany({ where: { id: productId } });
    }

    await prisma.category.deleteMany({ where: { slug: categorySlug } });
    await prisma.$disconnect();
  });

  it("supports signup, immediate refresh, cart, and wishlist", async () => {
    const registerResponse = await agent
      .post("/api/v1/auth/register")
      .send({
        email: testEmail,
        password: testPassword,
        firstName: "Flow",
        lastName: "User",
      })
      .expect(201);

    expect(registerResponse.body.data.accessToken).toEqual(expect.any(String));

    const refreshResponse = await agent.post("/api/v1/auth/refresh").expect(200);
    const accessToken = refreshResponse.body.data.accessToken;
    expect(accessToken).toEqual(expect.any(String));

    await agent
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId, variantId, quantity: 2 })
      .expect(201);

    await agent
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId, variantId, quantity: 3 })
      .expect(201);

    const outOfStockResponse = await agent
      .post("/api/v1/cart/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId, variantId, quantity: 1 })
      .expect(400);
    expect(outOfStockResponse.body.error.code).toBe("OUT_OF_STOCK");

    const cartResponse = await agent
      .get("/api/v1/cart")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(cartResponse.body.data.items).toHaveLength(1);
    expect(cartResponse.body.data.items[0].quantity).toBe(5);

    await agent
      .post("/api/v1/wishlist/items")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ productId })
      .expect(201);

    const wishlistResponse = await agent
      .get("/api/v1/wishlist")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
    expect(wishlistResponse.body.data.items).toHaveLength(1);
    expect(wishlistResponse.body.data.items[0].product.id).toBe(productId);

    await agent
      .delete(`/api/v1/wishlist/items/${productId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    await agent
      .delete(`/api/v1/wishlist/items/${productId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);
  });
});
