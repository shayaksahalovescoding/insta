import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { sendDmMessage } from "@/lib/phase3-queries";
import { saveUploadedMedia, validateMediaUpload } from "@/lib/storage";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id: threadId } = await context.params;
  const contentType = req.headers.get("content-type") || "";

  let bodyText = "";
  let sharedPostId: string | null = null;
  let mediaPath: string | null = null;
  let mediaMime: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData().catch(() => null);
    if (!formData) return jsonError("Invalid multipart form data.", 400);

    bodyText = String(formData.get("body") ?? "");
    const rawShared = formData.get("sharedPostId");
    sharedPostId = typeof rawShared === "string" && rawShared.trim() ? rawShared.trim() : null;

    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      const err = validateMediaUpload(file);
      if (err) return jsonError(err, 400);
      const saved = await saveUploadedMedia(`dm_${threadId}`, file);
      mediaPath = saved.relativePath;
      mediaMime = saved.mimeType;
    }
  } else {
    const json = await req.json().catch(() => null);
    if (!json) return jsonError("Invalid request body.", 400);
    bodyText = typeof json.body === "string" ? json.body : "";
    sharedPostId =
      typeof json.sharedPostId === "string" && json.sharedPostId.trim()
        ? json.sharedPostId.trim()
        : null;
  }

  if (bodyText.length > 2000) {
    return jsonError("Message cannot exceed 2,000 characters.", 400);
  }

  try {
    const message = sendDmMessage({
      threadId,
      senderId: user.id,
      body: bodyText,
      mediaPath,
      mediaMime,
      sharedPostId,
    });
    if (!message) {
      return jsonError("Conversation not found.", 404);
    }
    return jsonOk({ message }, 201);
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : "Could not send message.", 400);
  }
}
