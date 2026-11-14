import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const ALLOWED_VIDEO_EXTENSIONS: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const EXT_TO_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024;
export const MAX_POST_MEDIA_COUNT = 10;

export function resolveUploadRoot(): string {
  return process.env.INSTA_UPLOAD_DIR || path.join(process.cwd(), "storage", "uploads");
}

export function validateImageUpload(file: { type: string; size: number; name?: string }): string | null {
  if (!ALLOWED_IMAGE_EXTENSIONS[file.type]) {
    return "Only JPEG, PNG, WebP, and GIF images are supported.";
  }
  if (file.size <= 0) {
    return "Uploaded file is empty.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Image exceeds the 10 MB size limit.";
  }
  return null;
}

export function validateMediaUpload(file: { type: string; size: number; name?: string }): string | null {
  const isImage = Boolean(ALLOWED_IMAGE_EXTENSIONS[file.type]);
  const isVideo = Boolean(ALLOWED_VIDEO_EXTENSIONS[file.type]);
  if (!isImage && !isVideo) {
    return "Only JPEG, PNG, WebP, GIF images and MP4, WebM, MOV videos are supported.";
  }
  if (file.size <= 0) {
    return "Uploaded file is empty.";
  }
  if (isImage && file.size > MAX_UPLOAD_BYTES) {
    return "Image exceeds the 10 MB size limit.";
  }
  if (isVideo && file.size > MAX_VIDEO_UPLOAD_BYTES) {
    return "Video exceeds the 50 MB size limit.";
  }
  return null;
}

export async function saveUploadedImage(
  folder: string,
  file: File
): Promise<{ relativePath: string; mediaUrl: string; mimeType: string }> {
  const error = validateImageUpload(file);
  if (error) {
    throw new Error(error);
  }
  return writeUploadedFile(folder, file, ALLOWED_IMAGE_EXTENSIONS[file.type] || ".jpg");
}

export async function saveUploadedMedia(
  folder: string,
  file: File
): Promise<{ relativePath: string; mediaUrl: string; mimeType: string }> {
  const error = validateMediaUpload(file);
  if (error) {
    throw new Error(error);
  }
  const ext =
    ALLOWED_IMAGE_EXTENSIONS[file.type] ||
    ALLOWED_VIDEO_EXTENSIONS[file.type] ||
    ".bin";
  return writeUploadedFile(folder, file, ext);
}

async function writeUploadedFile(
  folder: string,
  file: File,
  ext: string
): Promise<{ relativePath: string; mediaUrl: string; mimeType: string }> {
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeFolder) {
    throw new Error("Invalid upload folder.");
  }

  const root = path.resolve(/*turbopackIgnore: true*/ resolveUploadRoot());
  const targetDir = path.join(/*turbopackIgnore: true*/ root, safeFolder);
  fs.mkdirSync(/*turbopackIgnore: true*/ targetDir, { recursive: true });

  const fileName = `${crypto.randomUUID()}${ext}`;
  const fullPath = path.join(/*turbopackIgnore: true*/ targetDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(/*turbopackIgnore: true*/ fullPath, buffer);

  const relativePath = `${safeFolder}/${fileName}`;
  return {
    relativePath,
    mediaUrl: `/api/media/${relativePath}`,
    mimeType: file.type === "image/jpg" ? "image/jpeg" : file.type,
  };
}

export function readStoredMedia(segments: string[]): { data: Buffer; mimeType: string } | null {
  if (!segments.length) return null;
  const root = path.resolve(/*turbopackIgnore: true*/ resolveUploadRoot());
  const target = path.resolve(/*turbopackIgnore: true*/ root, ...segments);
  const rootPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (!target.startsWith(rootPrefix)) {
    return null;
  }
  if (!fs.existsSync(/*turbopackIgnore: true*/ target) || !fs.statSync(/*turbopackIgnore: true*/ target).isFile()) {
    return null;
  }
  const ext = path.extname(target).toLowerCase();
  const mimeType = EXT_TO_MIME[ext] || "application/octet-stream";
  const data = fs.readFileSync(/*turbopackIgnore: true*/ target);
  return { data, mimeType };
}

export function deleteStoredMediaByRelativePath(relativePath: string): void {
  const root = path.resolve(/*turbopackIgnore: true*/ resolveUploadRoot());
  const target = path.resolve(/*turbopackIgnore: true*/ root, relativePath);
  const rootPrefix = root.endsWith(path.sep) ? root : `${root}${path.sep}`;
  if (!target.startsWith(rootPrefix)) return;
  if (fs.existsSync(/*turbopackIgnore: true*/ target)) {
    fs.unlinkSync(/*turbopackIgnore: true*/ target);
  }
}
