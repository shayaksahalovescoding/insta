import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { createStory, getStoryTrayGroups } from "@/lib/phase2-queries";
import { saveUploadedImage, validateImageUpload } from "@/lib/storage";

export async function GET() {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  const groups = getStoryTrayGroups(viewer.id);
  return jsonOk({ groups });
}

export async function POST(req: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return jsonError("Please select an image for your story.", 400);
  }

  const err = validateImageUpload(file);
  if (err) return jsonError(err, 400);

  const caption = String(formData?.get("caption") ?? "").slice(0, 300);
  const storyId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const saved = await saveUploadedImage(`stories_${storyId}`, file);

  const story = createStory({
    id: storyId,
    userId: viewer.id,
    relativePath: saved.relativePath,
    mimeType: saved.mimeType,
    caption,
  });

  return jsonOk({ story }, 201);
}
