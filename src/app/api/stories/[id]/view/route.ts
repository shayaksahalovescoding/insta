import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { markStoryViewed } from "@/lib/phase2-queries";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  const { id } = await context.params;
  const ok = markStoryViewed(id, viewer.id);
  if (!ok) return jsonError("Story not found.", 404);
  return jsonOk({ ok: true });
}
