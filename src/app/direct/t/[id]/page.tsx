import { notFound, redirect } from "next/navigation";
import React from "react";
import { DirectClient } from "@/components/DirectClient";
import { getCurrentUser } from "@/lib/auth";
import {
  getDmThreadDetail,
  listDmThreads,
  markDmThreadRead,
} from "@/lib/phase3-queries";

export const dynamic = "force-dynamic";

export default async function DirectThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/accounts/login/");

  const { id } = await params;
  markDmThreadRead(id, user.id);
  const activeThread = getDmThreadDetail(id, user.id);
  if (!activeThread) {
    notFound();
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
      initialActiveThread={activeThread}
      initialThreads={threads}
    />
  );
}
