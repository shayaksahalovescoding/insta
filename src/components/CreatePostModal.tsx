"use client";

import React, { useEffect, useRef, useState } from "react";
import { AuthUser } from "@/lib/auth";
import { PostDTO } from "@/lib/queries";
import { Avatar } from "./Avatar";
import {
  ChevronIcon,
  CloseIcon,
  CreateMediaPlaceholderIcon,
} from "./icons/InstagramIcons";

interface CreatePostModalProps {
  currentUser: AuthUser;
  onClose: () => void;
  onCreated: (post: PostDTO) => void;
}

interface PreviewFile {
  file: File;
  previewUrl: string;
}

export function CreatePostModal({
  currentUser,
  onClose,
  onCreated,
}: CreatePostModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [step, setStep] = useState<"select" | "crop" | "details">("select");
  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "4:5" | "16:9" | "original">("1:1");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, submitting]);

  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
  }, [files]);

  function handleSelectedFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    setError(null);
    const chosen = Array.from(fileList).slice(0, 10);
    const allowed = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);
    for (const f of chosen) {
      if (!allowed.has(f.type)) {
        setError("Only JPEG, PNG, WebP, and GIF images are supported.");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError("Each image must be 10 MB or smaller.");
        return;
      }
    }
    files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setFiles(chosen.map((file) => ({ file, previewUrl: URL.createObjectURL(file) })));
    setActiveIndex(0);
    setStep("crop");
  }

  async function handleShare() {
    if (!files.length || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((item) => formData.append("files", item.file));
      formData.append("caption", caption);
      formData.append("location", location);
      formData.append("aspectRatio", aspectRatio);

      const res = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not share post.");
        setSubmitting(false);
        return;
      }
      onCreated(data.post);
    } catch {
      setError("Network error while uploading post.");
      setSubmitting(false);
    }
  }

  const aspectCss =
    aspectRatio === "1:1"
      ? "1 / 1"
      : aspectRatio === "4:5"
        ? "4 / 5"
        : aspectRatio === "16:9"
          ? "16 / 9"
          : undefined;

  return (
    <div
      className="ig-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      role="presentation"
    >
      <button
        aria-label="Close"
        className="ig-modal-close-corner"
        disabled={submitting}
        onClick={onClose}
        type="button"
      >
        <CloseIcon size={18} strokeWidth={3} />
      </button>

      <div
        aria-modal="true"
        className={`ig-create-modal ${step === "details" ? "is-wide" : ""}`}
        role="dialog"
      >
        <div className="ig-create-header">
          {step === "select" ? (
            <span style={{ width: 48 }} />
          ) : (
            <button
              className="ig-create-header-action"
              disabled={submitting}
              onClick={() => setStep(step === "details" ? "crop" : "select")}
              style={{ color: "rgb(var(--ig-primary-text))" }}
              type="button"
            >
              Back
            </button>
          )}

          <h1 className="ig-create-title" role="heading" aria-level={1}>
            {step === "crop" ? "Crop" : "Create new post"}
          </h1>

          {step === "select" ? (
            <span style={{ width: 48 }} />
          ) : step === "crop" ? (
            <button
              className="ig-create-header-action"
              onClick={() => setStep("details")}
              type="button"
            >
              Next
            </button>
          ) : (
            <button
              className="ig-create-header-action"
              disabled={submitting}
              onClick={handleShare}
              type="button"
            >
              {submitting ? "Sharing..." : "Share"}
            </button>
          )}
        </div>

        {step === "select" ? (
          <div
            className={`ig-create-dropzone ${isDragging ? "is-dragging" : ""}`}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleSelectedFiles(e.dataTransfer.files);
            }}
          >
            <CreateMediaPlaceholderIcon />
            <h3 className="ig-create-heading">Drag photos and videos here</h3>
            {error && (
              <p style={{ color: "rgb(var(--ig-error-or-destructive))", margin: 0 }}>
                {error}
              </p>
            )}
            <input
              ref={inputRef}
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              id="create-post-files"
              multiple
              name="files"
              onChange={(e) => handleSelectedFiles(e.target.files)}
              type="file"
            />
            <button
              className="ig-btn-primary"
              onClick={() => inputRef.current?.click()}
              type="button"
            >
              Select from computer
            </button>
          </div>
        ) : (
          <div className="ig-create-workspace">
            <div className="ig-create-preview-pane">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 12,
                }}
              >
                <img
                  alt={`Selected media ${activeIndex + 1}`}
                  src={files[activeIndex]?.previewUrl}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    aspectRatio: aspectCss,
                    objectFit: aspectRatio === "original" ? "contain" : "cover",
                    borderRadius: 4,
                  }}
                />
              </div>

              {files.length > 1 && activeIndex > 0 && (
                <button
                  aria-label="Go back"
                  className="ig-carousel-btn ig-carousel-btn-prev"
                  onClick={() => setActiveIndex((i) => i - 1)}
                  type="button"
                >
                  <ChevronIcon direction="left" size={14} />
                </button>
              )}

              {files.length > 1 && activeIndex < files.length - 1 && (
                <button
                  aria-label="Next"
                  className="ig-carousel-btn ig-carousel-btn-next"
                  onClick={() => setActiveIndex((i) => i + 1)}
                  type="button"
                >
                  <ChevronIcon direction="right" size={14} />
                </button>
              )}

              {step === "crop" && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 14,
                    left: 14,
                    display: "flex",
                    gap: 6,
                    background: "rgba(12, 16, 20, 0.8)",
                    padding: "6px 10px",
                    borderRadius: 12,
                  }}
                >
                  {(["1:1", "4:5", "16:9", "original"] as const).map((ratio) => (
                    <button
                      key={ratio}
                      onClick={() => setAspectRatio(ratio)}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        background:
                          aspectRatio === ratio
                            ? "rgb(var(--ig-primary-button))"
                            : "transparent",
                        color: "#fff",
                      }}
                      type="button"
                    >
                      {ratio === "original" ? "Original" : ratio}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {step === "details" && (
              <div className="ig-create-details-pane">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar
                    avatarUrl={currentUser.avatarUrl}
                    size={28}
                    username={currentUser.username}
                  />
                  <span style={{ fontWeight: 600 }}>{currentUser.username}</span>
                </div>

                <textarea
                  id="create-post-caption"
                  maxLength={2200}
                  name="caption"
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  rows={7}
                  style={{
                    width: "100%",
                    border: "1px solid rgb(var(--ig-separator))",
                    borderRadius: 10,
                    background: "transparent",
                    padding: 12,
                    fontSize: 14,
                    lineHeight: "18px",
                    resize: "vertical",
                    outline: "none",
                  }}
                  value={caption}
                />
                <div
                  style={{
                    fontSize: 12,
                    color: "rgb(var(--ig-secondary-text))",
                    textAlign: "right",
                  }}
                >
                  {caption.length}/2,200
                </div>

                <input
                  id="create-post-location"
                  maxLength={100}
                  name="location"
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  style={{
                    width: "100%",
                    border: "1px solid rgb(var(--ig-separator))",
                    borderRadius: 10,
                    background: "transparent",
                    padding: "10px 12px",
                    fontSize: 14,
                    outline: "none",
                  }}
                  type="text"
                  value={location}
                />

                {error && (
                  <p
                    style={{
                      color: "rgb(var(--ig-error-or-destructive))",
                      fontSize: 13,
                      margin: 0,
                    }}
                  >
                    {error}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
