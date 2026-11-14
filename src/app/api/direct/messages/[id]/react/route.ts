import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { toggleDmReaction } from "@/lib/phase3-queries";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id: messageId } = await context.params;
  const body = await req.json().catch(() => null);
  const emoji = typeof body?.emoji === "string" ? body.emoji : "";
  if (!emoji.trim()) return jsonError("Reaction emoji is required.", 400);

  const reactions = toggleDmReaction(messageId, user.id, emoji);
  if (!reactions) return jsonError("Message not found.", 404);
  return jsonOk({ reactions });
}
