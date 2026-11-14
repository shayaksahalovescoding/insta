"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { AuthUser } from "@/lib/auth";
import { StoryGroupDTO } from "@/lib/phase2-queries";
import { formatRelativeTime } from "@/lib/time";
import { Avatar } from "./Avatar";
import {
  CloseIcon,
  CreateMediaPlaceholderIcon,
  HeartFilledIcon,
  HeartOutlineIcon,
  PauseIcon,
  PlayIcon,
  StoryNextIcon,
  StoryPrevIcon,
} from "./icons/InstagramIcons";

interface StoriesBarProps {
  currentUser: AuthUser;
  initialGroups: StoryGroupDTO[];
}

export function StoriesBar({ currentUser, initialGroups }: StoriesBarProps) {
  const [groups, setGroups] = useState<StoryGroupDTO[]>(initialGroups);
  const [viewerState, setViewerState] = useState<{
    groupIndex: number;
    storyIndex: number;
  } | null>(null);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const ownGroup = groups.find((g) => g.isOwn);
  const otherGroups = groups.filter((g) => !g.isOwn);

  const activeGroup =
    viewerState !== null ? groups[viewerState.groupIndex] ?? null : null;
  const activeStory =
    activeGroup && viewerState !== null
      ? activeGroup.stories[viewerState.storyIndex] ?? null
      : null;

  useEffect(() => {
    return () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    };
  }, [uploadPreview]);

  useEffect(() => {
    if (!activeStory) return;
    if (!activeStory.isViewed) {
      fetch(`/api/stories/${activeStory.id}/view`, { method: "POST" }).catch(() => {});
      setGroups((prev) =>
        prev.map((g, gIdx) => {
          if (gIdx !== viewerState?.groupIndex) return g;
          const nextStories = g.stories.map((s, sIdx) =>
            sIdx === viewerState.storyIndex ? { ...s, isViewed: true } : s
          );
          return {
            ...g,
            stories: nextStories,
            hasUnseen: nextStories.some((s) => !s.isViewed),
          };
        })
      );
    }
  }, [activeStory?.id]);

  useEffect(() => {
    if (!viewerState || !activeStory || paused) return;
    setProgress(0);
    const start = Date.now();
    const duration = 5000;
    const timer = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        window.clearInterval(timer);
        goNext();
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [viewerState?.groupIndex, viewerState?.storyIndex, paused]);

  function openGroup(groupId: string) {
    const idx = groups.findIndex((g) => g.userId === groupId);
    if (idx === -1) return;
    const firstUnseen = groups[idx].stories.findIndex((s) => !s.isViewed);
    setPaused(false);
    setProgress(0);
    setViewerState({
      groupIndex: idx,
      storyIndex: firstUnseen >= 0 ? firstUnseen : 0,
    });
  }

  function goNext() {
    if (!viewerState) return;
    const grp = groups[viewerState.groupIndex];
    if (!grp) {
      setViewerState(null);
      return;
    }
    if (viewerState.storyIndex + 1 < grp.stories.length) {
      setProgress(0);
      setViewerState({
        groupIndex: viewerState.groupIndex,
        storyIndex: viewerState.storyIndex + 1,
      });
      return;
    }
    if (viewerState.groupIndex + 1 < groups.length) {
      setProgress(0);
      setViewerState({
        groupIndex: viewerState.groupIndex + 1,
        storyIndex: 0,
      });
      return;
    }
    setViewerState(null);
  }

  function goPrev() {
    if (!viewerState) return;
    if (viewerState.storyIndex > 0) {
      setProgress(0);
      setViewerState({
        groupIndex: viewerState.groupIndex,
        storyIndex: viewerState.storyIndex - 1,
      });
      return;
    }
    if (viewerState.groupIndex > 0) {
      const prevGrp = groups[viewerState.groupIndex - 1];
      setProgress(0);
      setViewerState({
        groupIndex: viewerState.groupIndex - 1,
        storyIndex: Math.max(0, prevGrp.stories.length - 1),
      });
    }
  }

  async function handleLikeStory() {
    if (!activeStory || !viewerState) return;
    const res = await fetch(`/api/stories/${activeStory.id}/like`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setGroups((prev) =>
      prev.map((g, gIdx) =>
        gIdx === viewerState.groupIndex
          ? {
              ...g,
              stories: g.stories.map((s, sIdx) =>
                sIdx === viewerState.storyIndex ? { ...s, isLiked: data.isLiked } : s
              ),
            }
          : g
      )
    );
  }

  async function handleDeleteActiveStory() {
    if (!activeStory) return;
    const res = await fetch(`/api/stories/${activeStory.id}`, { method: "DELETE" });
    if (!res.ok) return;
    const refreshed = await fetch("/api/stories");
    if (refreshed.ok) {
      const data = await refreshed.json();
      setGroups(data.groups || []);
    }
    setViewerState(null);
  }

  function handleSelectStoryFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  }

  async function handlePublishStory() {
    if (!uploadFile || uploading) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("caption", uploadCaption);
      const res = await fetch("/api/stories", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Failed to share story.");
        setUploading(false);
        return;
      }
      const listRes = await fetch("/api/stories");
      if (listRes.ok) {
        const listData = await listRes.json();
        setGroups(listData.groups || []);
      }
      setUploadOpen(false);
      setUploadFile(null);
      setUploadCaption("");
      if (uploadPreview) {
        URL.revokeObjectURL(uploadPreview);
        setUploadPreview(null);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div className="ig-stories-tray" role="region" aria-label="Stories">
        {/* Own Story slot */}
        <div className="ig-story-slot">
          <div
            className={`ig-story-ring ${
              !ownGroup
                ? "is-empty"
                : ownGroup.hasUnseen
                  ? ""
                  : "is-seen"
            }`}
          >
            <button
              aria-label={ownGroup ? "View your story" : "Add to your story"}
              className="ig-story-ring-inner"
              onClick={() => {
                if (ownGroup) openGroup(ownGroup.userId);
                else setUploadOpen(true);
              }}
              type="button"
            >
              <Avatar
                avatarUrl={currentUser.avatarUrl}
                size={74}
                username={currentUser.username}
              />
            </button>
            <button
              aria-label="Add story"
              className="ig-story-add-badge"
              onClick={() => setUploadOpen(true)}
              type="button"
            >
              +
            </button>
          </div>
          <span className="ig-story-label">Your story</span>
        </div>

        {/* Followed users' active stories */}
        {otherGroups.map((group) => (
          <button
            aria-label={`Story by ${group.username}`}
            className="ig-story-slot"
            key={group.userId}
            onClick={() => openGroup(group.userId)}
            type="button"
          >
            <div className={`ig-story-ring ${group.hasUnseen ? "" : "is-seen"}`}>
              <span className="ig-story-ring-inner">
                <Avatar
                  avatarUrl={group.avatarUrl}
                  size={74}
                  username={group.username}
                />
              </span>
            </div>
            <span className="ig-story-label">{group.username}</span>
          </button>
        ))}
      </div>

      {/* Add Story Modal */}
      {uploadOpen && (
        <div
          className="ig-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget && !uploading) setUploadOpen(false);
          }}
          role="presentation"
        >
          <button
            aria-label="Close"
            className="ig-modal-close-corner"
            onClick={() => setUploadOpen(false)}
            type="button"
          >
            <CloseIcon size={18} strokeWidth={3} />
          </button>

          <div aria-modal="true" className="ig-create-modal" role="dialog">
            <div className="ig-create-header">
              <span style={{ width: 48 }} />
              <h1 className="ig-create-title">Add to your story</h1>
              {uploadFile ? (
                <button
                  className="ig-create-header-action"
                  disabled={uploading}
                  onClick={handlePublishStory}
                  type="button"
                >
                  {uploading ? "Sharing..." : "Share"}
                </button>
              ) : (
                <span style={{ width: 48 }} />
              )}
            </div>

            {!uploadPreview ? (
              <div className="ig-create-dropzone">
                <CreateMediaPlaceholderIcon />
                <h3 className="ig-create-heading">Share a photo to your story</h3>
                <p style={{ color: "rgb(var(--ig-secondary-text))", margin: 0 }}>
                  Stories stay visible to your followers for 24 hours.
                </p>
                {uploadError && (
                  <p style={{ color: "rgb(var(--ig-error-or-destructive))", margin: 0 }}>
                    {uploadError}
                  </p>
                )}
                <input
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  hidden
                  id="story-upload-file"
                  name="storyFile"
                  onChange={handleSelectStoryFile}
                  type="file"
                />
                <button
                  className="ig-btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  type="button"
                >
                  Select from computer
                </button>
              </div>
            ) : (
              <div className="ig-create-workspace">
                <div className="ig-create-preview-pane">
                  <img
                    alt="Story preview"
                    src={uploadPreview}
                    style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                  />
                </div>
                <div className="ig-create-details-pane">
                  <textarea
                    id="story-caption"
                    maxLength={300}
                    name="caption"
                    onChange={(e) => setUploadCaption(e.target.value)}
                    placeholder="Add a caption (optional)..."
                    rows={4}
                    style={{
                      width: "100%",
                      border: "1px solid rgb(var(--ig-separator))",
                      borderRadius: 10,
                      background: "transparent",
                      padding: 12,
                      fontSize: 14,
                      outline: "none",
                    }}
                    value={uploadCaption}
                  />
                  {uploadError && (
                    <p style={{ color: "rgb(var(--ig-error-or-destructive))", margin: 0 }}>
                      {uploadError}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-Screen Story Viewer */}
      {viewerState && activeGroup && activeStory && (
        <div className="ig-story-viewer-backdrop" role="dialog" aria-modal="true">
          <button
            aria-label="Close"
            className="ig-modal-close-corner"
            onClick={() => setViewerState(null)}
            type="button"
          >
            <CloseIcon size={24} strokeWidth={3} />
          </button>

          {(viewerState.groupIndex > 0 || viewerState.storyIndex > 0) && (
            <button
              aria-label="Previous"
              className="ig-story-arrow-btn is-prev"
              onClick={goPrev}
              type="button"
            >
              <StoryPrevIcon size={24} />
            </button>
          )}

          <div className="ig-story-viewer-card">
            <img
              alt={activeStory.caption || `Story by ${activeGroup.username}`}
              className="ig-story-viewer-media"
              src={activeStory.mediaUrl}
            />

            <div className="ig-story-viewer-top">
              <div className="ig-story-progress-row">
                {activeGroup.stories.map((st, idx) => (
                  <div className="ig-story-progress-track" key={st.id}>
                    <div
                      className="ig-story-progress-fill"
                      style={{
                        width:
                          idx < viewerState.storyIndex
                            ? "100%"
                            : idx === viewerState.storyIndex
                              ? `${progress}%`
                              : "0%",
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="ig-story-viewer-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Link
                    href={`/${activeGroup.username}/`}
                    onClick={() => setViewerState(null)}
                  >
                    <Avatar
                      avatarUrl={activeGroup.avatarUrl}
                      size={32}
                      username={activeGroup.username}
                    />
                  </Link>
                  <Link
                    href={`/${activeGroup.username}/`}
                    onClick={() => setViewerState(null)}
                    style={{ fontWeight: 600, color: "#fff" }}
                  >
                    {activeGroup.username}
                  </Link>
                  <span style={{ opacity: 0.75 }}>
                    {formatRelativeTime(activeStory.createdAt)}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    aria-label={paused ? "Play" : "Pause"}
                    onClick={() => setPaused((p) => !p)}
                    style={{ width: 32, height: 32, color: "#fff" }}
                    type="button"
                  >
                    {paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
                  </button>
                  {activeGroup.isOwn && (
                    <button
                      onClick={handleDeleteActiveStory}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "rgb(255, 110, 120)",
                        padding: "4px 8px",
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="ig-story-viewer-bottom">
              <div
                style={{
                  flex: 1,
                  color: "#fff",
                  fontSize: 14,
                  textShadow: "0 1px 4px rgba(0,0,0,0.8)",
                }}
              >
                {activeStory.caption}
              </div>

              <button
                aria-label={activeStory.isLiked ? "Unlike" : "Like"}
                onClick={handleLikeStory}
                style={{ width: 40, height: 40, color: "#fff" }}
                type="button"
              >
                {activeStory.isLiked ? (
                  <HeartFilledIcon size={24} />
                ) : (
                  <HeartOutlineIcon size={24} title="Like" />
                )}
              </button>
            </div>
          </div>

          {(viewerState.groupIndex < groups.length - 1 ||
            viewerState.storyIndex < activeGroup.stories.length - 1) && (
            <button
              aria-label="Next"
              className="ig-story-arrow-btn is-next"
              onClick={goNext}
              type="button"
            >
              <StoryNextIcon size={24} />
            </button>
          )}
        </div>
      )}
    </>
  );
}
