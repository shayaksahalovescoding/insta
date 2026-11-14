import React from "react";
import { LoginView } from "@/components/AuthForms";
import { HomeFeedClient } from "@/components/HomeFeedClient";
import { getCurrentUser } from "@/lib/auth";
import { getHomeFeed, getSuggestedUsers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return <LoginView />;
  }

  const posts = getHomeFeed(currentUser.id, 20, 0);
  const suggested = getSuggestedUsers(currentUser.id, 5);

  return (
    <HomeFeedClient
      currentUser={currentUser}
      initialPosts={posts}
      initialSuggested={suggested}
    />
  );
}
