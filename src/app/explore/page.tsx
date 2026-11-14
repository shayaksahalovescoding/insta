import { redirect } from "next/navigation";
import React from "react";
import { ExploreClient } from "@/components/ExploreClient";
import { getCurrentUser } from "@/lib/auth";
import { getExploreGridPosts } from "@/lib/phase2-queries";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/accounts/login/");
  const posts = getExploreGridPosts(36, 0);
  return <ExploreClient initialPosts={posts} viewerId={user.id} />;
}
