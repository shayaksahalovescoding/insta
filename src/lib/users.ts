import crypto from "node:crypto";
import { getDb } from "./db";
import {
  AuthUser,
  hashPassword,
  validateEmail,
  validatePassword,
  validateUsername,
  verifyPassword,
} from "./auth";

export class ValidationError extends Error {}
export class ConflictError extends Error {}
export class UnauthorizedError extends Error {}

export function registerUser(input: {
  email: string;
  fullName: string;
  username: string;
  password: string;
}): AuthUser {
  const email = input.email.trim();
  const username = input.username.trim();
  const fullName = input.fullName.trim();

  const emailErr = validateEmail(email);
  if (emailErr) throw new ValidationError(emailErr);

  const usernameErr = validateUsername(username);
  if (usernameErr) throw new ValidationError(usernameErr);

  const passwordErr = validatePassword(input.password);
  if (passwordErr) throw new ValidationError(passwordErr);

  if (fullName.length > 60) {
    throw new ValidationError("Full name must be 60 characters or fewer.");
  }

  const db = getDb();
  const existingEmail = db.prepare("SELECT 1 FROM users WHERE email = ?").get(email);
  if (existingEmail) {
    throw new ConflictError("Another account is using the same email.");
  }

  const existingUsername = db.prepare("SELECT 1 FROM users WHERE username = ?").get(username);
  if (existingUsername) {
    throw new ConflictError("This username isn't available. Please try another.");
  }

  const id = crypto.randomUUID();
  const passwordHash = hashPassword(input.password);
  const now = Date.now();

  db.prepare(
    `INSERT INTO users (id, username, email, password_hash, full_name, bio, gender, avatar_url, theme_preference, created_at)
     VALUES (?, ?, ?, ?, ?, '', 'Prefer not to say', NULL, 'dark', ?)`
  ).run(id, username, email, passwordHash, fullName, now);

  return {
    id,
    username,
    email,
    fullName,
    bio: "",
    gender: "Prefer not to say",
    avatarUrl: null,
    themePreference: "dark",
    createdAt: now,
  };
}

export function authenticateUser(identifier: string, password: string): AuthUser {
  const trimmed = identifier.trim();
  if (!trimmed || !password) {
    throw new UnauthorizedError("Please enter your username or email and password.");
  }

  const db = getDb();
  const row = db
    .prepare(
      `SELECT id, username, email, password_hash, full_name, bio, gender, avatar_url, theme_preference, created_at
       FROM users
       WHERE username = ? OR email = ?`
    )
    .get(trimmed, trimmed) as
    | {
        id: string;
        username: string;
        email: string;
        password_hash: string;
        full_name: string;
        bio: string;
        gender: string;
        avatar_url: string | null;
        theme_preference: string;
        created_at: number;
      }
    | undefined;

  if (!row || !verifyPassword(password, row.password_hash)) {
    throw new UnauthorizedError(
      "Sorry, your password was incorrect. Please double-check your password."
    );
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

export function updateUserProfile(
  userId: string,
  updates: {
    username?: string;
    fullName?: string;
    bio?: string;
    gender?: string;
    themePreference?: "dark" | "light";
  }
): AuthUser {
  const db = getDb();
  const current = db
    .prepare(
      `SELECT id, username, email, full_name, bio, gender, avatar_url, theme_preference, created_at
       FROM users WHERE id = ?`
    )
    .get(userId) as
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
      }
    | undefined;

  if (!current) {
    throw new UnauthorizedError("User not found.");
  }

  let nextUsername = current.username;
  if (updates.username !== undefined) {
    const candidate = updates.username.trim();
    const err = validateUsername(candidate);
    if (err) throw new ValidationError(err);
    if (candidate.toLowerCase() !== current.username.toLowerCase()) {
      const taken = db
        .prepare("SELECT 1 FROM users WHERE username = ? AND id <> ?")
        .get(candidate, userId);
      if (taken) throw new ConflictError("This username isn't available.");
    }
    nextUsername = candidate;
  }

  let nextFullName = current.full_name;
  if (updates.fullName !== undefined) {
    const fn = updates.fullName.trim();
    if (fn.length > 60) throw new ValidationError("Name must be 60 characters or fewer.");
    nextFullName = fn;
  }

  let nextBio = current.bio;
  if (updates.bio !== undefined) {
    if (updates.bio.length > 150) {
      throw new ValidationError("Bio must be 150 characters or fewer.");
    }
    nextBio = updates.bio;
  }

  const allowedGenders = new Set(["Prefer not to say", "Female", "Male", "Custom"]);
  let nextGender = current.gender;
  if (updates.gender !== undefined) {
    nextGender = allowedGenders.has(updates.gender) ? updates.gender : "Prefer not to say";
  }

  let nextTheme: "dark" | "light" =
    current.theme_preference === "light" ? "light" : "dark";
  if (updates.themePreference === "light" || updates.themePreference === "dark") {
    nextTheme = updates.themePreference;
  }

  db.prepare(
    `UPDATE users
     SET username = ?, full_name = ?, bio = ?, gender = ?, theme_preference = ?
     WHERE id = ?`
  ).run(nextUsername, nextFullName, nextBio, nextGender, nextTheme, userId);

  return {
    id: current.id,
    username: nextUsername,
    email: current.email,
    fullName: nextFullName,
    bio: nextBio,
    gender: nextGender,
    avatarUrl: current.avatar_url,
    themePreference: nextTheme,
    createdAt: current.created_at,
  };
}

export function setUserAvatarUrl(userId: string, avatarUrl: string | null): void {
  const db = getDb();
  db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(avatarUrl, userId);
}

export function findUserByUsername(
  username: string
): { id: string; username: string } | null {
  const db = getDb();
  const row = db
    .prepare("SELECT id, username FROM users WHERE username = ?")
    .get(username) as { id: string; username: string } | undefined;
  return row ?? null;
}
