import { redirect } from "next/navigation";
import React from "react";
import { DirectClient } from "@/components/DirectClient";
import { getCurrentUser } from "@/lib/auth";
import { getOrCreateDirectThread, listDmThreads } from "@/lib/phase3-queries";
import { findUserByUsername } from "@/lib/users";

export const dynamic = "force-dynamic";

export default async function DirectInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/accounts/login/");

  const sp = await searchParams;
  if (sp.with) {
    const target = findUserByUsername(sp.with.trim());
    if (target && target.id !== user.id) {
      const threadId = getOrCreateDirectThread(user.id, target.id);
      if (threadId) {
        redirect(`/direct/t/${threadId}/`);
      }
    }
  }

  const threads = listDmThreads(user.id);
  return (
    <DirectClient
      currentUser={{
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      }}
      initialActiveThread={null}
      initialThreads={threads}
    />
  );
}
