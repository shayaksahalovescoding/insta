import { redirect } from "next/navigation";
import React from "react";
import { ReelsClient } from "@/components/ReelsClient";
import { getCurrentUser } from "@/lib/auth";
import { getReelsFeed } from "@/lib/phase3-queries";

export const dynamic = "force-dynamic";

export default async function ReelByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/accounts/login/");

  const { id } = await params;
  const reels = getReelsFeed(user.id, id);
  return <ReelsClient initialReelId={id} initialReels={reels} viewerId={user.id} />;
}
