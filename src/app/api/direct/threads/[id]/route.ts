import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import {
  getDmThreadDetail,
  markDmThreadRead,
  toggleDmThreadMute,
} from "@/lib/phase3-queries";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await context.params;
  if (req.nextUrl.searchParams.get("markRead") === "1") {
    markDmThreadRead(id, user.id);
  }

  const thread = getDmThreadDetail(id, user.id);
  if (!thread) return jsonError("Conversation not found.", 404);
  return jsonOk({ thread });
}

export async function PATCH(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await context.params;
  const result = toggleDmThreadMute(id, user.id);
  if (!result) return jsonError("Conversation not found.", 404);
  return jsonOk(result);
}
