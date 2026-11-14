import { NextResponse } from "next/server";
import { ConflictError, UnauthorizedError, ValidationError } from "./users";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ValidationError) {
    return jsonError(error.message, 400);
  }
  if (error instanceof ConflictError) {
    return jsonError(error.message, 409);
  }
  if (error instanceof UnauthorizedError) {
    return jsonError(error.message, 401);
  }
  console.error("API error:", error);
  return jsonError("Something went wrong. Please try again.", 500);
}
