import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuid } from "uuid";
import { store } from "./store.js";
import { nowIso } from "./constants.js";
import { DEFAULT_JWT } from "./env.js";

const JWT_SECRET = (process.env.JWT_SECRET || "").trim() || DEFAULT_JWT;
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";
const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  return bcrypt.hash(String(password), SALT_ROUNDS);
}

export async function verifyPassword(password, passwordHash) {
  if (!passwordHash) return false;
  // Legacy SHA-256 demo hashes (64 hex chars) — reject; force reseed/signup
  if (/^[a-f0-9]{64}$/i.test(passwordHash) && !passwordHash.startsWith("$2")) {
    return false;
  }
  return bcrypt.compare(String(password), passwordHash);
}

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

export function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    zoneId: user.zoneId || null,
    workerId: user.workerId || null,
    favorites: user.favorites || [],
    createdAt: user.createdAt,
  };
}

export async function createUser({ name, email, password, role, zoneId, workerId }) {
  const normalized = String(email).trim().toLowerCase();
  const existing = store.read().users.find((u) => u.email === normalized);
  if (existing) throw new Error("Email already registered");
  if (!["resident", "worker"].includes(role)) throw new Error("Role must be resident or worker");
  if (String(password).length < 6) throw new Error("Password must be at least 6 characters");

  const user = {
    id: uuid(),
    name: String(name).trim(),
    email: normalized,
    passwordHash: await hashPassword(password),
    role,
    zoneId: zoneId || null,
    workerId: workerId || null,
    favorites: [],
    createdAt: nowIso(),
  };
  store.write((db) => {
    if (!db.users) db.users = [];
    db.users.push(user);
  });
  return user;
}

export function findUserByEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  return store.read().users.find((u) => u.email === normalized);
}

export function findUserById(id) {
  return store.read().users.find((u) => u.id === id);
}

export async function authenticate(email, password) {
  const user = findUserByEmail(email);
  if (!user) throw new Error("Invalid email or password");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    throw new Error(
      /^[a-f0-9]{64}$/i.test(user.passwordHash)
        ? "Demo data outdated — click Reset demo or re-seed, then login again"
        : "Invalid email or password"
    );
  }
  return user;
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Login required" });
  try {
    const payload = verifyToken(token);
    const user = findUserById(payload.sub);
    if (!user) return res.status(401).json({ error: "User not found" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed for this role" });
    }
    next();
  };
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = verifyToken(token);
      req.user = findUserById(payload.sub) || null;
    } catch {
      req.user = null;
    }
  }
  next();
}
