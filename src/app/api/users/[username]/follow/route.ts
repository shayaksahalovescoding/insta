import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { toggleFollow } from "@/lib/queries";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  const { username } = await context.params;
  const result = toggleFollow(username, viewer.id);
  if (!result) return jsonError("Cannot follow this user.", 400);
  return jsonOk(result);
}
