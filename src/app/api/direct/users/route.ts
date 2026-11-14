import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { searchUsersForDm } from "@/lib/phase3-queries";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const q = req.nextUrl.searchParams.get("q") || "";
  const users = searchUsersForDm(user.id, q);
  return jsonOk({ users });
}
