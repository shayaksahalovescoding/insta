import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { getHomeFeed } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20) || 20));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? 0) || 0);

  const posts = getHomeFeed(user.id, limit, offset);
  return jsonOk({ posts });
}
