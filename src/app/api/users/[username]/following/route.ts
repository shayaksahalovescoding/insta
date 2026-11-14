import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { listFollowing } from "@/lib/queries";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const viewer = await getCurrentUser();
  const users = listFollowing(username, viewer?.id ?? null);
  if (!users) return jsonError("User not found.", 404);
  return jsonOk({ users });
}
