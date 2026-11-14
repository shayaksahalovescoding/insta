import { redirect } from "next/navigation";
import React from "react";
import { PhaseNotice } from "@/components/PhaseNotice";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReelsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/accounts/login/");
  return (
    <PhaseNotice
      description="Reels vertical video feed and real video uploads will be built in Phase 3."
      phase="Phase 3"
      title="Reels"
    />
  );
}
