import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { toggleLike } from "@/lib/queries";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const result = toggleLike(id, viewer.id);
  if (!result) return jsonError("Post not found.", 404);
  return jsonOk(result);
}
