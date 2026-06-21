const supertest = require("supertest");

const mockProductRetrieve = jest.fn();
const mockSessionCreate = jest.fn();
const mockConstructEvent = jest.fn();

jest.mock("stripe", () =>
  jest.fn(() => ({
    products: { retrieve: mockProductRetrieve },
    checkout: { sessions: { create: mockSessionCreate } },
    webhooks: { constructEvent: mockConstructEvent },
  })),
);

const app = require("../app");
const User = require("../models/User");
const Order = require("../models/Order");

const api = supertest(app);

const validUser = {
  username: "alice",
  email: "alice@example.com",
  password: "Str0ng!pass",
};

const signUpAndLogin = async () => {
  await api.post("/api/users").send(validUser).expect(201);
  const res = await api
    .post("/api/login")
    .send({ username: validUser.username, password: validUser.password })
    .expect(200);
  return res.body.accessToken;
};

// constructEvent is mocked, so the raw body is irrelevant — it just needs to be sent.
const fireWebhook = (event) => {
  mockConstructEvent.mockReturnValueOnce(event);
  return api
    .post("/api/checkout/webhook")
    .set("stripe-signature", "test-sig")
    .set("Content-Type", "application/json")
    .send(JSON.stringify({ raw: true }));
};

describe("orders", () => {
  beforeEach(() => {
    mockProductRetrieve.mockReset();
    mockSessionCreate.mockReset();
    mockConstructEvent.mockReset();
  });

  describe("webhook persistence", () => {
    test("authenticated completion creates an order, clears the cart, and is idempotent", async () => {
      const token = await signUpAndLogin();
      const auth = (req) => req.set("Authorization", `Bearer ${token}`);

      mockProductRetrieve.mockResolvedValue({
        id: "prod_123",
        name: "Real Shirt",
        description: "d",
        images: ["http://img/a.png"],
        default_price: { unit_amount: 5000 },
      });
      await auth(
        api.post("/api/cart").send({ productId: "prod_123", quantity: 2 }),
      ).expect(200);

      const user = await User.findOne({ email: validUser.email });

      const event = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_1",
            metadata: { userId: user._id.toString() },
            amount_total: 10000,
            currency: "eur",
            payment_status: "paid",
            customer_details: { email: "alice@example.com" },
          },
        },
      };

      await fireWebhook(event).expect(200);

      const orders = await auth(api.get("/api/orders")).expect(200);
      expect(orders.body).toHaveLength(1);
      expect(orders.body[0].items).toHaveLength(1);
      expect(orders.body[0].items[0].price).toBe(5000);
      expect(orders.body[0].items[0].quantity).toBe(2);
      expect(orders.body[0].amountTotal).toBe(10000);
      expect(orders.body[0].email).toBe("alice@example.com");

      // cart was cleared
      const cart = await auth(api.get("/api/cart")).expect(200);
      expect(cart.body).toHaveLength(0);

      // replayed delivery → still exactly one order
      await fireWebhook(event).expect(200);
      const after = await auth(api.get("/api/orders")).expect(200);
      expect(after.body).toHaveLength(1);
    });

    test("guest completion persists an order with userId null and items from metadata", async () => {
      const event = {
        type: "checkout.session.completed",
        data: {
          object: {
            id: "cs_test_guest",
            metadata: {
              items: JSON.stringify([
                { productId: "prod_9", name: "Hat", price: 2500, quantity: 1, size: "M" },
              ]),
            },
            amount_total: 2500,
            currency: "eur",
            payment_status: "paid",
            customer_details: { email: "guest@example.com" },
          },
        },
      };

      await fireWebhook(event).expect(200);

      const order = await Order.findOne({ stripeSessionId: "cs_test_guest" });
      expect(order).not.toBeNull();
      expect(order.userId).toBeNull();
      expect(order.email).toBe("guest@example.com");
      expect(order.items).toHaveLength(1);
      expect(order.items[0].size).toBe("M");
      expect(order.amountTotal).toBe(2500);
    });
  });

  describe("GET /api/orders", () => {
    test("rejects an unauthenticated request with 401", async () => {
      const res = await api.get("/api/orders").expect(401);
      expect(res.body.error).toMatch(/authentication required/i);
    });
  });
});
