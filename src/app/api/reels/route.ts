import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { getReelsFeed } from "@/lib/phase3-queries";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const postId = req.nextUrl.searchParams.get("postId") || undefined;
  const reels = getReelsFeed(user.id, postId);
  return jsonOk({ reels });
}
