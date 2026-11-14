import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api-helpers";
import { updateUserProfile } from "@/lib/users";

export async function PATCH(req: NextRequest) {
  const viewer = await getCurrentUser();
  if (!viewer) return jsonError("Unauthorized", 401);

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonError("Invalid request body.", 400);
    }

    const updated = updateUserProfile(viewer.id, {
      username: body.username !== undefined ? String(body.username) : undefined,
      fullName: body.fullName !== undefined ? String(body.fullName) : undefined,
      bio: body.bio !== undefined ? String(body.bio) : undefined,
      gender: body.gender !== undefined ? String(body.gender) : undefined,
      themePreference:
        body.themePreference === "light" || body.themePreference === "dark"
          ? body.themePreference
          : undefined,
    });
    return jsonOk({ user: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
