import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { createComment, listComments } from "@/lib/queries";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const comments = listComments(id);
  return jsonOk({ comments });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);

  const body = await req.json().catch(() => null);
  const content = String(body?.content ?? "").trim();
  if (!content) return jsonError("Comment cannot be empty.", 400);
  if (content.length > 2200) return jsonError("Comment is too long.", 400);

  const { id } = await context.params;
  const comment = createComment(id, viewer.id, content);
  if (!comment) return jsonError("Post not found.", 404);
  return jsonOk({ comment }, 201);
}
