import crypto from "node:crypto";
import { getDb } from "./db";

export const SESSION_COOKIE_NAME = "ig_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  bio: string;
  gender: string;
  avatarUrl: string | null;
  themePreference: "dark" | "light";
  createdAt: number;
}

const USERNAME_REGEX = /^[a-zA-Z0-9._]{1,30}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateUsername(username: string): string | null {
  const trimmed = username.trim();
  if (!trimmed) return "Username is required.";
  if (!USERNAME_REGEX.test(trimmed)) {
    return "Usernames can only use letters, numbers, underscores, and periods (max 30 chars).";
  }
  if (trimmed.startsWith(".") || trimmed.endsWith(".") || trimmed.includes("..")) {
    return "Username cannot start/end with a period or contain consecutive periods.";
  }
  const reserved = new Set([
    "accounts",
    "api",
    "explore",
    "reels",
    "direct",
    "p",
    "stories",
    "settings",
  ]);
  if (reserved.has(trimmed.toLowerCase())) {
    return "This username is reserved.";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required.";
  if (!EMAIL_REGEX.test(trimmed) || trimmed.length > 254) {
    return "Enter a valid email address.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password || password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  if (password.length > 128) {
    return "Password is too long.";
  }
  return null;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function createSessionForUser(userId: string): { token: string; expiresAt: number } {
  const db = getDb();
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const now = Date.now();
  const expiresAt = now + SESSION_TTL_MS;
  const id = crypto.randomUUID();
  db.prepare(
    "INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, userId, tokenHash, expiresAt, now);
  return { token, expiresAt };
}

export function deleteSessionByToken(token: string): void {
  const db = getDb();
  const tokenHash = hashSessionToken(token);
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

export function getUserBySessionToken(token: string | undefined | null): AuthUser | null {
  if (!token) return null;
  const db = getDb();
  const tokenHash = hashSessionToken(token);
  const now = Date.now();

  const row = db
    .prepare(
      `SELECT
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.bio,
        u.gender,
        u.avatar_url,
        u.theme_preference,
        u.created_at,
        s.expires_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ?`
    )
    .get(tokenHash) as
    | {
        id: string;
        username: string;
        email: string;
        full_name: string;
        bio: string;
        gender: string;
        avatar_url: string | null;
        theme_preference: string;
        created_at: number;
        expires_at: number;
      }
    | undefined;

  if (!row) return null;
  if (row.expires_at <= now) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
    return null;
  }

  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    bio: row.bio,
    gender: row.gender,
    avatarUrl: row.avatar_url,
    themePreference: row.theme_preference === "light" ? "light" : "dark",
    createdAt: row.created_at,
  };
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getUserBySessionToken(token);
}

export function buildSessionCookieOptions(expiresAt: number) {
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(expiresAt),
    secure: process.env.NODE_ENV === "production",
  };
}
