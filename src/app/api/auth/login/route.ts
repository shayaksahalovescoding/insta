import { NextRequest, NextResponse } from "next/server";
import { buildSessionCookieOptions, createSessionForUser } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-helpers";
import { authenticateUser } from "@/lib/users";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonError("Invalid request body.", 400);
    }

    const user = authenticateUser(
      String(body.identifier ?? body.username ?? ""),
      String(body.password ?? "")
    );

    const session = createSessionForUser(user.id);
    const res = NextResponse.json({ user }, { status: 200 });
    res.cookies.set({
      ...buildSessionCookieOptions(session.expiresAt),
      value: session.token,
    });
    return res;
  } catch (err) {
    return handleApiError(err);
  }
}
