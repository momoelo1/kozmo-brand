const supertest = require("supertest");
const app = require("../app");

const api = supertest(app);

const validUser = {
  username: "alice",
  email: "alice@example.com",
  password: "Str0ng!pass",
};

describe("POST /api/login", () => {
  beforeEach(async () => {
    // Register a known-good user through the real signup flow so the
    // password is hashed exactly as production does it.
    await api.post("/api/users").send(validUser).expect(201);
  });

  test("returns 401 for a wrong password", async () => {
    const res = await api
      .post("/api/login")
      .send({ username: validUser.username, password: "wrongpass" })
      .expect(401);
    expect(res.body.error).toMatch(/invalid/i);
    expect(res.body.accessToken).toBeUndefined();
  });

  test("returns 401 for an unknown username", async () => {
    const res = await api
      .post("/api/login")
      .send({ username: "nobody", password: validUser.password })
      .expect(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  test("returns 200 with an access token and sets httpOnly cookies on valid login", async () => {
    const res = await api
      .post("/api/login")
      .send({ username: validUser.username, password: validUser.password })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.username).toBe(validUser.username);
    expect(res.body.email).toBe(validUser.email);
    expect(res.body.passwordHash).toBeUndefined();

    // Both auth cookies are set, both httpOnly.
    const cookies = res.headers["set-cookie"];
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^accessToken=.*HttpOnly/i),
      ]),
    );
    // The refresh-token system was removed — no refreshToken cookie is set.
    expect(cookies.some((c) => c.startsWith("refreshToken="))).toBe(false);
  });
});
