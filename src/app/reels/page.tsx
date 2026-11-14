import { redirect } from "next/navigation";
import React from "react";
import { ReelsClient } from "@/components/ReelsClient";
import { getCurrentUser } from "@/lib/auth";
import { getReelsFeed } from "@/lib/phase3-queries";

export const dynamic = "force-dynamic";

export default async function ReelsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/accounts/login/");

  const reels = getReelsFeed(user.id);
  return <ReelsClient initialReels={reels} viewerId={user.id} />;
}
