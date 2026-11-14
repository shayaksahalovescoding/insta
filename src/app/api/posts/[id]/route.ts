import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { deletePost, getPostDetail } from "@/lib/queries";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const viewer = await getCurrentUser();
  const detail = getPostDetail(id, viewer?.id ?? null);
  if (!detail) return jsonError("Post not found.", 404);
  return jsonOk(detail);
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const deleted = deletePost(id, viewer.id);
  if (!deleted) return jsonError("Post not found or forbidden.", 404);
  return jsonOk({ ok: true });
}
