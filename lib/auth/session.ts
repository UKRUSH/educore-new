import { createHash, createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

const SESSION_COOKIE = "educore_session"
const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-in-production"

// ── Password hashing (SHA-256 — matches seed.ts) ─────────────────────────────
// For production, replace with bcrypt or argon2.

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

export function verifyPassword(plain: string, hashed: string): boolean {
  const hash = Buffer.from(hashPassword(plain))
  const stored = Buffer.from(hashed)
  if (hash.length !== stored.length) return false
  return timingSafeEqual(hash, stored)
}

// ── Session token (HMAC-signed) ───────────────────────────────────────────────

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex")
}

function createToken(userId: number, role: string): string {
  const payload = `${userId}:${role}`
  const sig = sign(payload)
  return Buffer.from(`${payload}.${sig}`).toString("base64url")
}

function parseToken(token: string): { userId: number; role: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    const lastDot = decoded.lastIndexOf(".")
    const payload = decoded.slice(0, lastDot)
    const sig = decoded.slice(lastDot + 1)
    if (sign(payload) !== sig) return null
    const [userId, role] = payload.split(":")
    return { userId: Number(userId), role }
  } catch {
    return null
  }
}

// ── Cookie helpers ────────────────────────────────────────────────────────────

export async function setSession(
  userId: number,
  role: string,
  remember = false
) {
  const store = await cookies()
  store.set(SESSION_COOKIE, createToken(userId, role), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}), // 30 days if remember me
  })
}

export async function getSession(): Promise<{
  userId: number
  role: string
} | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return parseToken(token)
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}
