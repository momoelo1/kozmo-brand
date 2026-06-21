const supertest = require("supertest");
const app = require("../app");
const User = require("../models/User");

const api = supertest(app);

const validUser = {
  username: "alice",
  email: "alice@example.com",
  password: "Str0ng!pass",
};

describe("POST /api/users (signup)", () => {
  test("rejects when fields are missing", async () => {
    const res = await api.post("/api/users").send({ username: "bob" }).expect(400);
    expect(res.body.error).toMatch(/required/i);
  });

  test("rejects a username shorter than 3 chars", async () => {
    const res = await api
      .post("/api/users")
      .send({ ...validUser, username: "ab" })
      .expect(400);
    expect(res.body.error).toMatch(/at least 3/i);
  });

  test("rejects a weak password", async () => {
    const res = await api
      .post("/api/users")
      .send({ ...validUser, password: "weak" })
      .expect(400);
    expect(res.body.error).toMatch(/password/i);
  });

  test("creates a valid user and never returns the password hash", async () => {
    const res = await api.post("/api/users").send(validUser).expect(201);
    expect(res.body.passwordHash).toBeUndefined();
    expect(res.body.username).toBe("alice");

    const inDb = await User.findOne({ email: validUser.email });
    expect(inDb).not.toBeNull();
    expect(inDb.passwordHash).not.toBe(validUser.password); // stored hashed
  });

  test("rejects a duplicate email", async () => {
    await api.post("/api/users").send(validUser).expect(201);
    const res = await api.post("/api/users").send(validUser).expect(400);
    expect(res.body.error).toMatch(/unique/i);
  });
});
