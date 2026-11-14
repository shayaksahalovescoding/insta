import { notFound } from "next/navigation";
import React from "react";
import { PostDetailView } from "@/components/PostDetailView";
import { getCurrentUser } from "@/lib/auth";
import { getPostDetail } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function PostPage(context: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await context.params;
  const viewer = await getCurrentUser();
  const detail = getPostDetail(id, viewer?.id ?? null);
  if (!detail) notFound();

  return (
    <PostDetailView
      initialComments={detail.comments}
      initialPost={detail.post}
      isModal={false}
      viewerId={viewer?.id ?? null}
    />
  );
}
