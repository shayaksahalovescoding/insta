import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api-helpers";
import { deleteDmMessage } from "@/lib/phase3-queries";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return jsonError("Unauthorized", 401);

  const { id } = await context.params;
  const deleted = deleteDmMessage(id, user.id);
  if (!deleted) return jsonError("Message not found or forbidden.", 404);
  return jsonOk({ deleted: true });
}
