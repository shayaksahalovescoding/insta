import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { getExploreGridPosts } from "@/lib/phase2-queries";

export async function GET(req: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(req.url);
  const limit = Math.min(60, Math.max(1, Number(searchParams.get("limit") ?? 36) || 36));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0) || 0);
  const posts = getExploreGridPosts(limit, offset);
  return jsonOk({ posts });
}
