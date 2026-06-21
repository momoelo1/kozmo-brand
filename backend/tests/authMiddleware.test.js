const supertest = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// /api/cart GET is guarded by tokenExtractor; mock Stripe so importing the
// app's cart controller doesn't reach the network (GET itself never calls it).
jest.mock("stripe", () => jest.fn(() => ({ products: { retrieve: jest.fn() } })));

const app = require("../app");
const User = require("../models/User");

const api = supertest(app);

const sign = (userId, opts = {}) =>
  jwt.sign({ userId }, process.env.SECRET, opts);

describe("tokenExtractor (via GET /api/cart)", () => {
  let user;

  beforeEach(async () => {
    user = await User.create({
      username: "alice",
      email: "alice@example.com",
      passwordHash: "irrelevant-for-token-tests",
    });
  });

  test("rejects a malformed token with 401", async () => {
    const res = await api
      .get("/api/cart")
      .set("Authorization", "Bearer not-a-real-jwt")
      .expect(401);
    expect(res.body.error).toMatch(/authentication required/i);
  });

  test("rejects an expired token with 401", async () => {
    const token = sign(user._id, { expiresIn: "-1s" });
    await api
      .get("/api/cart")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });

  test("rejects a well-signed token whose user no longer exists", async () => {
    const token = sign(new mongoose.Types.ObjectId().toString());
    await api
      .get("/api/cart")
      .set("Authorization", `Bearer ${token}`)
      .expect(401);
  });

  test("accepts a valid token sent as an httpOnly cookie", async () => {
    const token = sign(user._id);
    const res = await api
      .get("/api/cart")
      .set("Cookie", `accessToken=${token}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
