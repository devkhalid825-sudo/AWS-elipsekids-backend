import crypto from "node:crypto";

const SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString("hex");
const TTL_MS = 12 * 60 * 60 * 1000;

const b64 = (b) => Buffer.from(b).toString("base64url");
const mac = (data) => crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

export function signToken(name) {
  const payload = b64(JSON.stringify({ name, exp: Date.now() + TTL_MS }));
  return `${payload}.${mac(payload)}`;
}

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function checkCredentials(name, password) {
  const okName = safeEqual(name ?? "", process.env.ADMIN_NAME || "admin");
  const okPass = safeEqual(password ?? "", process.env.ADMIN_PASSWORD || "change-me-now");
  return okName && okPass;
}

export function requireAdmin(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const [payload, sig] = token.split(".");
  if (!payload || !sig || !safeEqual(sig, mac(payload))) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!exp || exp < Date.now()) return res.status(401).json({ detail: "Session expired" });
  } catch {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  next();
}

// Tiny in-memory rate limiter (per IP + bucket).
const hits = new Map();
export function rateLimit(bucket, max, windowMs) {
  return (req, res, next) => {
    const key = `${bucket}:${req.ip}`;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ detail: "Too many requests, try again later." });
    arr.push(now);
    hits.set(key, arr);
    next();
  };
}
