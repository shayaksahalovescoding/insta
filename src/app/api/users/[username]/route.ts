import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import {
  getProfileGridPosts,
  getProfileSummary,
  getSavedGridPosts,
} from "@/lib/queries";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const viewer = await getCurrentUser();
  const profile = getProfileSummary(username, viewer?.id ?? null);
  if (!profile) return jsonError("User not found.", 404);

  const posts = getProfileGridPosts(profile.id);
  const savedPosts = profile.isOwnProfile ? getSavedGridPosts(profile.id) : [];

  return jsonOk({ profile, posts, savedPosts });
}
