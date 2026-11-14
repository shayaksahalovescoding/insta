import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import {
  getUnreadNotificationsCount,
  listNotifications,
} from "@/lib/phase2-queries";

export async function GET(req: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  const { searchParams } = new URL(req.url);
  const rawFilter = searchParams.get("filter") ?? "all";
  const filter =
    rawFilter === "comments" || rawFilter === "likes" || rawFilter === "follows"
      ? rawFilter
      : "all";
  const notifications = listNotifications(viewer.id, filter);
  const unreadCount = getUnreadNotificationsCount(viewer.id);
  return jsonOk({ notifications, unreadCount });
}
