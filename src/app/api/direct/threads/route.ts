import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import {
  getOrCreateDirectThread,
  getUnreadDmThreadsCount,
  listDmThreads,
} from "@/lib/phase3-queries";
import { findUserByUsername } from "@/lib/users";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const q = req.nextUrl.searchParams.get("q") || "";
  const threads = listDmThreads(user.id, q);
  const unreadThreadsCount = getUnreadDmThreadsCount(user.id);
  return jsonOk({ threads, unreadThreadsCount });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  if (!body) return jsonError("Invalid request body.", 400);

  let targetUserId = typeof body.recipientId === "string" ? body.recipientId.trim() : "";
  if (!targetUserId && typeof body.username === "string" && body.username.trim()) {
    const found = findUserByUsername(body.username.trim());
    if (found) targetUserId = found.id;
  }

  if (!targetUserId) {
    return jsonError("Recipient user not found.", 404);
  }
  if (targetUserId === user.id) {
    return jsonError("Cannot create a thread with yourself.", 400);
  }

  const threadId = getOrCreateDirectThread(user.id, targetUserId);
  if (!threadId) {
    return jsonError("Unable to start conversation.", 400);
  }

  return jsonOk({ threadId }, 201);
}
