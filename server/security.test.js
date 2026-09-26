import { test } from "node:test";
import assert from "node:assert/strict";
import { passwordHash, verifyPassword, validProgress } from "./security.js";
const state = () => ({
  version: 1,
  name: "Test Explorer",
  branch: "ECE",
  target: 2027,
  dailyMinutes: 60,
  onboarded: true,
  completed: [],
  attempts: [],
  sessions: [],
  bookmarks: [],
  notes: [],
  cosmetic: "classic",
});
test("passwords use independent salts and verification rejects wrong passwords and malformed hashes", () => {
  const a = passwordHash("local-test-password");
  const b = passwordHash("local-test-password");
  assert.notEqual(a, b);
  assert.ok(verifyPassword("local-test-password", a));
  assert.equal(verifyPassword("wrong-password", a), false);
  assert.equal(verifyPassword("local-test-password", "invalid"), false);
});
test("progress validates nested arrays and restricts values before persistence", () => {
  assert.ok(validProgress(state()));
  for (const invalid of [
    null,
    {},
    { ...state(), branch: "admin" },
    { ...state(), dailyMinutes: -1 },
    { ...state(), attempts: [null] },
    {
      ...state(),
      attempts: [
        {
          questionId: "b1",
          topicId: "boolean",
          answer: 7,
          correct: true,
          at: new Date().toISOString(),
        },
      ],
    },
    {
      ...state(),
      notes: [
        { id: "1", title: "hello", body: 123, at: new Date().toISOString() },
      ],
    },
    { ...state(), completed: Array(501).fill("boolean") },
  ])
    assert.equal(validProgress(invalid), false);
});
const base = process.env.TEST_BASE_URL;
test(
  "API auth, private progress, origin rejection, validation, and session invalidation",
  { skip: !base },
  async () => {
    const suffix = crypto.randomUUID();
    const password = `local-${suffix}`;
    const request = async (path, method = "GET", body, cookie, origin) => {
      const res = await fetch(`${base}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(cookie ? { Cookie: cookie } : {}),
          ...(origin ? { Origin: origin } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return res;
    };
    assert.equal((await request("/api/progress")).status, 401);
    assert.equal(
      (
        await request("/api/auth/signup", "POST", {
          name: "Test",
          email: "invalid",
          password: "weak",
        })
      ).status,
      400,
    );
    const created = await request("/api/auth/signup", "POST", {
      name: "Validation Explorer",
      email: `test-${suffix}@example.test`,
      password,
    });
    assert.equal(created.status, 201);
    const cookie = created.headers.get("set-cookie").split(";")[0];
    assert.match(created.headers.get("set-cookie"), /HttpOnly/);
    assert.match(created.headers.get("set-cookie"), /SameSite=Lax/i);
    const user = await created.json();
    assert.equal(user.user.password, undefined);
    assert.equal(
      (await request("/api/auth/me", "GET", undefined, cookie)).status,
      200,
    );
    assert.equal(
      (
        await request(
          "/api/progress",
          "PUT",
          { state: state() },
          cookie,
          "https://foreign.invalid",
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await request(
          "/api/progress",
          "PUT",
          { state: { ...state(), notes: [null] } },
          cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await request(
          "/api/progress",
          "PUT",
          { state: state(), revision: 0 },
          cookie,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await request(
          "/api/progress",
          "PUT",
          { state: state(), revision: 0 },
          cookie,
        )
      ).status,
      409,
    );
    const saved = await (
      await request("/api/progress", "GET", undefined, cookie)
    ).json();
    assert.equal(saved.state.name, "Test Explorer");
    const second = await request("/api/auth/signup", "POST", {
      name: "Second User",
      email: `second-${suffix}@example.test`,
      password,
    });
    const secondCookie = second.headers.get("set-cookie").split(";")[0];
    const isolated = await (
      await request("/api/progress", "GET", undefined, secondCookie)
    ).json();
    assert.equal(isolated.state, null);
    assert.equal(
      (
        await request("/api/auth/login", "POST", {
          email: `test-${suffix}@example.test`,
          password: "incorrect",
        })
      ).status,
      401,
    );
    const login = await request("/api/auth/login", "POST", {
      email: `test-${suffix}@example.test`,
      password,
    });
    assert.equal(login.status, 200);
    const loginCookie = login.headers.get("set-cookie").split(";")[0];
    assert.equal(
      (
        await (
          await request("/api/progress", "GET", undefined, loginCookie)
        ).json()
      ).state.name,
      "Test Explorer",
    );
    assert.equal(
      (await request("/api/auth/logout", "POST", {}, cookie)).status,
      204,
    );
    assert.equal(
      (await request("/api/auth/me", "GET", undefined, cookie)).status,
      401,
    );
    await request("/api/auth/logout", "POST", {}, loginCookie);
    await request("/api/auth/logout", "POST", {}, secondCookie);
  },
);
