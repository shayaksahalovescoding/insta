import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { markNotificationsRead } from "@/lib/phase2-queries";

export async function POST() {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  markNotificationsRead(viewer.id);
  return jsonOk({ ok: true });
}
