const supertest = require("supertest");

// Stripe is mocked. Names must start with "mock" so Jest allows them in the
// hoisted jest.mock factory.
const mockProductRetrieve = jest.fn();
const mockSessionCreate = jest.fn();

jest.mock("stripe", () =>
  jest.fn(() => ({
    products: { retrieve: mockProductRetrieve },
    checkout: { sessions: { create: mockSessionCreate } },
  })),
);

const app = require("../app");
const api = supertest(app);

describe("POST /api/checkout/create-checkout-session-guest", () => {
  beforeEach(() => {
    mockProductRetrieve.mockReset();
    mockSessionCreate.mockReset();
  });

  test("ignores client-sent price/name and uses Stripe's authoritative values", async () => {
    mockProductRetrieve.mockResolvedValue({
      id: "prod_123",
      active: true,
      name: "Real Shirt",
      description: "A real product",
      images: ["http://img/front.png"],
      default_price: { unit_amount: 5000 }, // €50.00 — the real price
    });
    mockSessionCreate.mockResolvedValue({ url: "https://stripe.test/session" });

    await api
      .post("/api/checkout/create-checkout-session-guest")
      .send({
        items: [
          { productId: "prod_123", price: 1, name: "HACKED", quantity: 2 },
        ],
      })
      .expect(200);

    expect(mockProductRetrieve).toHaveBeenCalledWith(
      "prod_123",
      expect.objectContaining({ expand: ["default_price"] }),
    );

    const sessionArg = mockSessionCreate.mock.calls[0][0];
    const line = sessionArg.line_items[0];
    expect(line.price_data.unit_amount).toBe(5000); // NOT 1
    expect(line.price_data.product_data.name).toBe("Real Shirt"); // NOT "HACKED"
    expect(line.quantity).toBe(2);
  });

  test("rejects an empty cart", async () => {
    const res = await api
      .post("/api/checkout/create-checkout-session-guest")
      .send({ items: [] })
      .expect(400);
    expect(res.body.error).toMatch(/empty/i);
  });

  test("clamps quantity to a maximum of 99", async () => {
    mockProductRetrieve.mockResolvedValue({
      active: true,
      name: "X",
      default_price: { unit_amount: 1000 },
    });
    mockSessionCreate.mockResolvedValue({ url: "u" });

    await api
      .post("/api/checkout/create-checkout-session-guest")
      .send({ items: [{ productId: "p", quantity: 9999 }] })
      .expect(200);

    expect(mockSessionCreate.mock.calls[0][0].line_items[0].quantity).toBe(99);
  });
});
