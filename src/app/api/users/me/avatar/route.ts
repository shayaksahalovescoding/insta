import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { saveUploadedImage, validateImageUpload } from "@/lib/storage";
import { setUserAvatarUrl } from "@/lib/users";

export async function POST(req: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return jsonError("Please choose an image file.", 400);
  }

  const err = validateImageUpload(file);
  if (err) return jsonError(err, 400);

  const saved = await saveUploadedImage(`avatars_${viewer.id}`, file);
  setUserAvatarUrl(viewer.id, saved.mediaUrl);
  return jsonOk({ avatarUrl: saved.mediaUrl });
}

export async function DELETE() {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);
  setUserAvatarUrl(viewer.id, null);
  return jsonOk({ avatarUrl: null });
}
