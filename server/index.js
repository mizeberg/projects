import express from "express";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { passwordHash, verifyPassword, validProgress } from "./security.js";
const app = express();
const production = process.env.NODE_ENV === "production";
mkdirSync(".data", { recursive: true, mode: 0o700 });
const db = new DatabaseSync(".data/gatenova.sqlite");
db.exec(
  `PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT UNIQUE NOT NULL,password TEXT NOT NULL); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires INTEGER NOT NULL); CREATE TABLE IF NOT EXISTS progress(user_id TEXT PRIMARY KEY,state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS throttle(key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset INTEGER NOT NULL);`,
);
if (
  !db
    .prepare("PRAGMA table_info(progress)")
    .all()
    .some((c) => c.name === "revision")
)
  db.exec(
    "ALTER TABLE progress ADD COLUMN revision INTEGER NOT NULL DEFAULT 0",
  );
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  res.set("X-Content-Type-Options", "nosniff");
  if (!["GET", "HEAD"].includes(req.method) && req.headers.origin) {
    let origin;
    try {
      origin = new URL(req.headers.origin);
    } catch {
      return res.status(403).json({ error: "Request not allowed." });
    }
    if (origin.host !== req.headers.host)
      return res.status(403).json({ error: "Request not allowed." });
  }
  next();
});
const hash = (t) => createHash("sha256").update(t).digest("hex");
function token(req) {
  const cookie = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("nova_session="));
  return cookie?.slice(13) || "";
}
function userFor(req) {
  return db
    .prepare(
      "SELECT u.id,u.name,u.email FROM users u JOIN sessions s ON u.id=s.user_id WHERE s.token=? AND s.expires>?",
    )
    .get(hash(token(req)), Date.now());
}
function session(res, id) {
  const t = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
    hash(t),
    id,
    Date.now() + 7 * 86400000,
  );
  res.cookie("nova_session", t, {
    httpOnly: true,
    sameSite: "lax",
    secure: production,
    maxAge: 7 * 86400000,
    path: "/",
  });
}
function limit(req, res, next) {
  const key = req.socket.remoteAddress || "unknown";
  const now = Date.now();
  db.prepare("DELETE FROM throttle WHERE reset<?").run(now);
  const entry = db.prepare("SELECT * FROM throttle WHERE key=?").get(key);
  if (entry && entry.count >= 30)
    return res
      .status(429)
      .json({ error: "Too many attempts. Please try again in 15 minutes." });
  db.prepare(
    "INSERT INTO throttle VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1",
  ).run(key, now + 900000);
  next();
}
app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.post("/api/auth/signup", limit, (req, res) => {
  const { name, email, password } = req.body || {};
  if (
    typeof name !== "string" ||
    !name.trim() ||
    name.length > 60 ||
    typeof email !== "string" ||
    email.length > 254 ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    typeof password !== "string" ||
    password.length < 10 ||
    password.length > 128
  )
    return res.status(400).json({
      error: "Enter a name, valid email, and a password of 10–128 characters.",
    });
  const id = randomBytes(16).toString("hex");
  try {
    db.prepare("INSERT INTO users VALUES(?,?,?,?)").run(
      id,
      name.trim(),
      email.trim().toLowerCase(),
      passwordHash(password),
    );
  } catch {
    return res.status(409).json({
      error:
        "Could not create this account. Try signing in or use a different email.",
    });
  }
  session(res, id);
  res.status(201).json({
    user: { id, name: name.trim(), email: email.trim().toLowerCase() },
  });
});
app.post("/api/auth/login", limit, (req, res) => {
  const { email, password } = req.body || {};
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    password.length > 128 ||
    email.length > 254
  )
    return res.status(400).json({ error: "Enter a valid email and password." });
  const u = db
    .prepare("SELECT * FROM users WHERE email=?")
    .get(email.trim().toLowerCase());
  const valid = verifyPassword(password, u?.password || dummyHash);
  if (!u || !valid)
    return res.status(401).json({ error: "Email or password is incorrect." });
  session(res, u.id);
  res.json({ user: { id: u.id, name: u.name, email: u.email } });
});
const dummyHash = passwordHash(randomBytes(32).toString("hex"));
app.post("/api/auth/logout", (req, res) => {
  db.prepare("DELETE FROM sessions WHERE token=?").run(hash(token(req)));
  res.clearCookie("nova_session", { path: "/" });
  res.sendStatus(204);
});
app.get("/api/auth/me", (req, res) => {
  const user = userFor(req);
  return user
    ? res.json({ user })
    : res.status(401).json({ error: "Not signed in." });
});
app.use("/api/progress", (req, res, next) => {
  req.user = userFor(req);
  if (!req.user)
    return res.status(401).json({ error: "Sign in to sync progress." });
  next();
});
app.get("/api/progress", (req, res) => {
  const row = db
    .prepare("SELECT state,revision FROM progress WHERE user_id=?")
    .get(req.user.id);
  res.json({
    state: row ? JSON.parse(row.state) : null,
    revision: row?.revision || 0,
  });
});
app.put("/api/progress", (req, res) => {
  if (!validProgress(req.body?.state))
    return res.status(400).json({
      error: "This progress could not be saved. Please check your data.",
    });
  const row = db
    .prepare("SELECT revision FROM progress WHERE user_id=?")
    .get(req.user.id);
  const revision = row?.revision || 0;
  if (req.body.revision !== revision)
    return res.status(409).json({
      error:
        "Progress changed in another tab. Sync again to merge your learning activity.",
    });
  db.prepare(
    "INSERT INTO progress(user_id,state,revision) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET state=excluded.state,revision=excluded.revision",
  ).run(req.user.id, JSON.stringify(req.body.state), revision + 1);
  res.json({ saved: true, revision: revision + 1 });
});
app.use("/api", (req, res) =>
  res.status(404).json({ error: "This service is not available." }),
);
if (production) {
  app.use(express.static("dist"));
  app.get("/{*path}", (req, res) => res.sendFile(resolve("dist/index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
app.use((err, req, res, next) => {
  console.error(err.message);
  res
    .status(err.status || 500)
    .json({ error: "Nova could not complete this request. Please try again." });
});
app.listen(Number(process.env.PORT) || 3000, "0.0.0.0", () =>
  console.log("GATENOVA ready on http://localhost:3000"),
);
