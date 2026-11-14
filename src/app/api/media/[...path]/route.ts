import { NextRequest, NextResponse } from "next/server";
import { readStoredMedia } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await context.params;
  const media = readStoredMedia(segments ?? []);
  if (!media) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const total = media.data.byteLength;
  const range = req.headers.get("range");

  if (range && range.startsWith("bytes=")) {
    const [rawStart, rawEnd] = range.slice(6).split("-");
    const start = rawStart ? Number.parseInt(rawStart, 10) : 0;
    const end = rawEnd ? Math.min(Number.parseInt(rawEnd, 10), total - 1) : total - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || start > end || start >= total) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${total}`,
        },
      });
    }

    const slice = media.data.subarray(start, end + 1);
    return new NextResponse(new Uint8Array(slice), {
      status: 206,
      headers: {
        "Content-Type": media.mimeType,
        "Content-Length": String(slice.byteLength),
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return new NextResponse(new Uint8Array(media.data), {
    status: 200,
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(total),
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
