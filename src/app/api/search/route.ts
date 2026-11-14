import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { searchUsersAndPosts } from "@/lib/phase2-queries";

export async function GET(req: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") ?? "");
  const results = searchUsersAndPosts(q, viewer.id);
  return jsonOk(results);
}
