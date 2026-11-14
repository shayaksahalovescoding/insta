import { redirect } from "next/navigation";
import React from "react";
import { PhaseNotice } from "@/components/PhaseNotice";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/accounts/login/");
  return (
    <PhaseNotice
      description="Real-time likes, comments, and follow notifications will be built in Phase 2."
      phase="Phase 2"
      title="Notifications"
    />
  );
}
