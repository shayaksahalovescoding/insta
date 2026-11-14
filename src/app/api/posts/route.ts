import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { createPost } from "@/lib/queries";
import {
  MAX_POST_MEDIA_COUNT,
  saveUploadedImage,
  validateImageUpload,
} from "@/lib/storage";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const formData = await req.formData().catch(() => null);
  if (!formData) return jsonError("Invalid multipart form data.", 400);

  const files = formData
    .getAll("files")
    .filter((item): item is File => item instanceof File);

  if (!files.length) {
    return jsonError("Please select at least one photo.", 400);
  }
  if (files.length > MAX_POST_MEDIA_COUNT) {
    return jsonError(`You can upload up to ${MAX_POST_MEDIA_COUNT} photos per post.`, 400);
  }

  for (const file of files) {
    const err = validateImageUpload(file);
    if (err) return jsonError(err, 400);
  }

  const caption = String(formData.get("caption") ?? "");
  if (caption.length > 2200) {
    return jsonError("Caption cannot exceed 2,200 characters.", 400);
  }
  const location = String(formData.get("location") ?? "").slice(0, 100);
  const aspectRatio = String(formData.get("aspectRatio") ?? "1:1");

  const postId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const savedMedia: Array<{ relativePath: string; mimeType: string }> = [];

  for (const file of files) {
    const saved = await saveUploadedImage(`posts_${postId}`, file);
    savedMedia.push({ relativePath: saved.relativePath, mimeType: saved.mimeType });
  }

  const post = createPost({
    id: postId,
    userId: user.id,
    caption,
    location,
    aspectRatio,
    mediaFiles: savedMedia,
  });

  return jsonOk({ post }, 201);
}
