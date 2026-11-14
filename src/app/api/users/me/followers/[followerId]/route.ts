import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { removeFollower } from "@/lib/queries";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ followerId: string }> }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  const { followerId } = await context.params;
  const removed = removeFollower(viewer.id, followerId);
  if (!removed) return jsonError("Follower relationship not found.", 404);
  return jsonOk({ ok: true });
}
