const supertest = require("supertest");

// Cart POST hits Stripe to resolve authoritative name/price — mock it.
const mockProductRetrieve = jest.fn();

jest.mock("stripe", () =>
  jest.fn(() => ({
    products: { retrieve: mockProductRetrieve },
  })),
);

const app = require("../app");
const api = supertest(app);

const validUser = {
  username: "alice",
  email: "alice@example.com",
  password: "Str0ng!pass",
};

// Register + log in, returning the access token for Bearer auth.
const signUpAndLogin = async () => {
  await api.post("/api/users").send(validUser).expect(201);
  const res = await api
    .post("/api/login")
    .send({ username: validUser.username, password: validUser.password })
    .expect(200);
  return res.body.accessToken;
};

describe("/api/cart", () => {
  let token;

  beforeEach(async () => {
    mockProductRetrieve.mockReset();
    mockProductRetrieve.mockResolvedValue({
      id: "prod_123",
      name: "Real Shirt",
      description: "A real product",
      images: ["http://img/front.png"],
      default_price: { unit_amount: 5000 },
    });
    token = await signUpAndLogin();
  });

  const auth = (req) => req.set("Authorization", `Bearer ${token}`);

  test("rejects an unauthenticated request with 401", async () => {
    const res = await api.get("/api/cart").expect(401);
    expect(res.body.error).toMatch(/authentication required/i);
  });

  test("adds a new item using Stripe's authoritative name and price", async () => {
    const res = await auth(
      api.post("/api/cart").send({ productId: "prod_123", quantity: 2 }),
    ).expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe("Real Shirt");
    expect(res.body[0].price).toBe(5000);
    expect(res.body[0].quantity).toBe(2);
  });

  test("increments quantity when the same product+size is added again", async () => {
    await auth(
      api.post("/api/cart").send({ productId: "prod_123", quantity: 2 }),
    ).expect(200);
    const res = await auth(
      api.post("/api/cart").send({ productId: "prod_123", quantity: 3 }),
    ).expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].quantity).toBe(5);
  });

  test("PATCH with quantity <= 0 removes the item", async () => {
    const added = await auth(
      api.post("/api/cart").send({ productId: "prod_123", quantity: 1 }),
    ).expect(200);
    const itemId = added.body[0].id;

    const res = await auth(
      api.patch(`/api/cart/${itemId}`).send({ quantity: 0 }),
    ).expect(200);
    expect(res.body).toHaveLength(0);
  });

  test("DELETE removes the item by productId", async () => {
    await auth(
      api.post("/api/cart").send({ productId: "prod_123", quantity: 1 }),
    ).expect(200);

    const res = await auth(
      api.delete("/api/cart").send({ productId: "prod_123" }),
    ).expect(200);
    expect(res.body).toHaveLength(0);
  });
});
