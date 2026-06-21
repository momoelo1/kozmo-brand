const supertest = require("supertest");
const jwt = require("jsonwebtoken");

const mockProductCreate = jest.fn();
const mockPriceCreate = jest.fn();
const mockProductUpdate = jest.fn();
const mockPriceList = jest.fn();
const mockPriceUpdate = jest.fn();

jest.mock("stripe", () =>
  jest.fn(() => ({
    products: {
      create: mockProductCreate,
      update: mockProductUpdate,
      list: jest.fn(),
      search: jest.fn(),
      retrieve: jest.fn(),
    },
    prices: { create: mockPriceCreate, list: mockPriceList, update: mockPriceUpdate },
  })),
);

const app = require("../app");
const User = require("../models/User");

const api = supertest(app);
const sign = (id) => jwt.sign({ userId: id }, process.env.SECRET, { expiresIn: "15m" });

describe("admin product endpoints", () => {
  let adminToken;
  let userToken;

  beforeEach(async () => {
    mockProductCreate.mockReset();
    mockPriceCreate.mockReset();
    mockProductUpdate.mockReset();
    mockPriceList.mockReset();
    mockPriceUpdate.mockReset();

    const admin = await User.create({
      username: "admin",
      email: "admin@example.com",
      passwordHash: "x",
      isAdmin: true,
    });
    const user = await User.create({
      username: "bob",
      email: "bob@example.com",
      passwordHash: "x",
    });
    adminToken = sign(admin._id);
    userToken = sign(user._id);
  });

  test("rejects an unauthenticated create with 401", async () => {
    const res = await api
      .post("/api/products")
      .send({ name: "X", priceEuros: 10 })
      .expect(401);
    expect(res.body.error).toMatch(/authentication/i);
  });

  test("rejects a non-admin create with 403", async () => {
    const res = await api
      .post("/api/products")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ name: "X", priceEuros: 10 })
      .expect(403);
    expect(res.body.error).toMatch(/admin/i);
  });

  test("admin creates a product (price → cents, sizes → csv, default price set)", async () => {
    mockProductCreate.mockResolvedValue({ id: "prod_1" });
    mockPriceCreate.mockResolvedValue({ id: "price_1" });
    mockProductUpdate.mockResolvedValue({ id: "prod_1", default_price: "price_1" });

    const res = await api
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Shirt",
        priceEuros: 49.99,
        category: "tops",
        sizes: ["S", "M"],
        images: ["http://img/a.png"],
      })
      .expect(201);

    expect(mockProductCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Shirt",
        metadata: { category: "tops", sizes: "S,M" },
      }),
    );
    expect(mockPriceCreate).toHaveBeenCalledWith(
      expect.objectContaining({ product: "prod_1", unit_amount: 4999, currency: "eur" }),
    );
    expect(mockProductUpdate).toHaveBeenCalledWith("prod_1", { default_price: "price_1" });
    expect(res.body.id).toBe("prod_1");
  });

  test("rejects an invalid price on create with 400", async () => {
    await api
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "X", priceEuros: 0 })
      .expect(400);
    expect(mockProductCreate).not.toHaveBeenCalled();
  });

  test("admin changes price (new price set as default, old prices archived)", async () => {
    mockPriceCreate.mockResolvedValue({ id: "price_2" });
    mockProductUpdate.mockResolvedValue({ id: "prod_1", default_price: "price_2" });
    mockPriceList.mockResolvedValue({ data: [{ id: "price_1" }, { id: "price_2" }] });
    mockPriceUpdate.mockResolvedValue({});

    await api
      .post("/api/products/prod_1/price")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ priceEuros: 25 })
      .expect(200);

    expect(mockPriceCreate).toHaveBeenCalledWith(
      expect.objectContaining({ product: "prod_1", unit_amount: 2500 }),
    );
    expect(mockProductUpdate).toHaveBeenCalledWith("prod_1", { default_price: "price_2" });
    // old price archived, the new one left active
    expect(mockPriceUpdate).toHaveBeenCalledWith("price_1", { active: false });
    expect(mockPriceUpdate).not.toHaveBeenCalledWith("price_2", expect.anything());
  });

  test("admin archives a product (active:false)", async () => {
    mockProductUpdate.mockResolvedValue({ id: "prod_1", active: false });

    await api
      .delete("/api/products/prod_1")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(mockProductUpdate).toHaveBeenCalledWith("prod_1", { active: false });
  });

  test("rejects a non-admin archive with 403", async () => {
    await api
      .delete("/api/products/prod_1")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(403);
    expect(mockProductUpdate).not.toHaveBeenCalled();
  });
});
