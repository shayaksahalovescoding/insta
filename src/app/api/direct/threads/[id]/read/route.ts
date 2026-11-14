import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { getUnreadDmThreadsCount, markDmThreadRead } from "@/lib/phase3-queries";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await context.params;
  const ok = markDmThreadRead(id, user.id);
  if (!ok) return jsonError("Conversation not found.", 404);

  const unreadThreadsCount = getUnreadDmThreadsCount(user.id);
  return jsonOk({ ok: true, unreadThreadsCount });
}
