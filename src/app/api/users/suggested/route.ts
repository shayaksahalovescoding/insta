import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { getSuggestedUsers } from "@/lib/queries";

export async function GET() {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  const users = getSuggestedUsers(viewer.id, 5);
  return jsonOk({ users });
}
