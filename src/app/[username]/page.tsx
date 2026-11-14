import { notFound } from "next/navigation";
import React from "react";
import { ProfileClient } from "@/components/ProfileClient";
import { getCurrentUser } from "@/lib/auth";
import {
  getProfileGridPosts,
  getProfileSummary,
  getSavedGridPosts,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function UserProfilePage(context: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { username } = await context.params;
  const { tab } = await context.searchParams;
  const viewer = await getCurrentUser();
  const profile = getProfileSummary(username, viewer?.id ?? null);
  if (!profile) notFound();

  const posts = getProfileGridPosts(profile.id);
  const savedPosts = profile.isOwnProfile ? getSavedGridPosts(profile.id) : [];

  return (
    <ProfileClient
      initialPosts={posts}
      initialProfile={profile}
      initialSavedPosts={savedPosts}
      initialTab={tab === "saved" ? "saved" : "posts"}
      viewerId={viewer?.id ?? null}
    />
  );
}
