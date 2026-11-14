import { redirect } from "next/navigation";
import React from "react";
import { NotificationsPanel } from "@/components/NotificationsPanel";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/accounts/login/");
  return <NotificationsPanel isDrawer={false} />;
}
