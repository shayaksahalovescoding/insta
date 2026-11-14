"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { CommentDTO, PostDTO } from "@/lib/queries";
import { ReelItemDTO } from "@/lib/phase3-queries";
import { formatCount, formatRelativeTime } from "@/lib/time";
import { Avatar } from "./Avatar";
import { ShareToDmModal } from "./ShareToDmModal";
import {
  BookmarkFilledIcon,
  BookmarkOutlineIcon,
  CloseIcon,
  CommentIcon,
  HeartFilledIcon,
  HeartOutlineIcon,
  MoreOptionsIcon,
  MusicNoteIcon,
  PlayIcon,
  ReelsArrowIcon,
  ReelsIcon,
  ShareIcon,
  VolumeMutedIcon,
  VolumePlayingIcon,
} from "./icons/InstagramIcons";

interface ReelsClientProps {
  initialReels: ReelItemDTO[];
  viewerId: string;
  initialReelId?: string;
}

export function ReelsClient({
  initialReels,
  viewerId,
  initialReelId,
}: ReelsClientProps) {
  const [reels, setReels] = useState<ReelItemDTO[]>(initialReels);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [pausedIds, setPausedIds] = useState<Record<string, boolean>>({});
  const [expandedCaptions, setExpandedCaptions] = useState<Record<string, boolean>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [sharePostId, setSharePostId] = useState<string | null>(null);
  const [commentTarget, setCommentTarget] = useState<ReelItemDTO | null>(null);
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});

  useEffect(() => {
    function onPostCreated(e: Event) {
      const post = (e as CustomEvent<PostDTO>).detail;
      const vid = post?.media?.find((m) => m.mimeType.startsWith("video/"));
      if (!post || !vid) return;
      const newReel: ReelItemDTO = {
        id: post.id,
        caption: post.caption,
        location: post.location,
        aspectRatio: post.aspectRatio,
        createdAt: post.createdAt,
        videoUrl: vid.url,
        mimeType: vid.mimeType,
        author: {
          ...post.author,
          isFollowing: false,
        },
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        isLiked: post.isLiked,
        isSaved: post.isSaved,
      };
      setReels((prev) =>
        prev.some((r) => r.id === newReel.id) ? prev : [newReel, ...prev]
      );
      setActiveIndex(0);
      viewportRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.addEventListener("ig:post-created", onPostCreated);
    return () => window.removeEventListener("ig:post-created", onPostCreated);
  }, []);

  useEffect(() => {
    const root = viewportRef.current;
    if (!root || reels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) {
              setActiveIndex(idx);
            }
          }
        }
      },
      { root, threshold: 0.6 }
    );

    itemRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [reels.length]);

  useEffect(() => {
    const activeReel = reels[activeIndex];
    if (activeReel && typeof window !== "undefined") {
      const targetPath = `/reels/${activeReel.id}/`;
      if (window.location.pathname !== targetPath && (initialReelId || reels.length > 0)) {
        window.history.replaceState(null, "", targetPath);
      }
    }

    reels.forEach((reel, idx) => {
      const video = videoRefs.current[reel.id];
      if (!video) return;
      video.muted = muted;
      if (idx === activeIndex && !pausedIds[reel.id]) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [activeIndex, reels, muted, pausedIds, initialReelId]);

  function scrollToIndex(idx: number) {
    const clamped = Math.max(0, Math.min(reels.length - 1, idx));
    const el = itemRefs.current[clamped];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveIndex(clamped);
    }
  }

  function togglePlayPause(reelId: string) {
    const video = videoRefs.current[reelId];
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPausedIds((prev) => ({ ...prev, [reelId]: false }));
    } else {
      video.pause();
      setPausedIds((prev) => ({ ...prev, [reelId]: true }));
    }
  }

  async function handleLike(reel: ReelItemDTO) {
    const res = await fetch(`/api/posts/${reel.id}/like`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setReels((prev) =>
      prev.map((r) =>
        r.id === reel.id
          ? { ...r, isLiked: data.isLiked, likesCount: data.likesCount }
          : r
      )
    );
  }

  async function handleSave(reel: ReelItemDTO) {
    const res = await fetch(`/api/posts/${reel.id}/save`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setReels((prev) =>
      prev.map((r) => (r.id === reel.id ? { ...r, isSaved: data.isSaved } : r))
    );
  }

  async function handleToggleFollow(reel: ReelItemDTO) {
    const res = await fetch(
      `/api/users/${encodeURIComponent(reel.author.username)}/follow`,
      { method: "POST" }
    );
    if (!res.ok) return;
    const data = await res.json();
    setReels((prev) =>
      prev.map((r) =>
        r.author.id === reel.author.id
          ? { ...r, author: { ...r.author, isFollowing: data.isFollowing } }
          : r
      )
    );
  }

  async function handleDeleteReel(reelId: string) {
    const res = await fetch(`/api/posts/${reelId}`, { method: "DELETE" });
    if (!res.ok) return;
    setReels((prev) => prev.filter((r) => r.id !== reelId));
    setOpenMenuId(null);
  }

  async function openComments(reel: ReelItemDTO) {
    setCommentTarget(reel);
    setComments([]);
    setCommentsLoading(true);
    try {
      const res = await fetch(`/api/posts/${reel.id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } finally {
      setCommentsLoading(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentTarget || postingComment) return;
    const trimmed = commentText.trim();
    if (!trimmed) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/posts/${commentTarget.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setCommentText("");
        setReels((prev) =>
          prev.map((r) =>
            r.id === commentTarget.id
              ? { ...r, commentsCount: r.commentsCount + 1 }
              : r
          )
        );
      }
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!commentTarget) return;
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setReels((prev) =>
      prev.map((r) =>
        r.id === commentTarget.id
          ? { ...r, commentsCount: Math.max(0, r.commentsCount - 1) }
          : r
      )
    );
  }

  if (reels.length === 0) {
    return (
      <div
        style={{
          minHeight: "85dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div className="ig-empty-card">
          <ReelsIcon size={56} />
          <h1 className="ig-empty-title" style={{ marginTop: 8 }}>
            No Reels yet
          </h1>
          <p className="ig-empty-subtitle">
            Upload a video from Create to publish your first Reel.
          </p>
          <button
            className="ig-btn-primary"
            onClick={() => window.dispatchEvent(new CustomEvent("ig:open-create"))}
            style={{ marginTop: 8 }}
            type="button"
          >
            Upload Reel
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="ig-reels-viewport" ref={viewportRef}>
        {reels.map((reel, idx) => {
          const isPaused = Boolean(pausedIds[reel.id]);
          const isOwner = reel.author.id === viewerId;
          const captionExpanded = Boolean(expandedCaptions[reel.id]);
          const longCaption = reel.caption.length > 70;
          const displayedCaption =
            longCaption && !captionExpanded
              ? `${reel.caption.slice(0, 70)} `
              : reel.caption;

          return (
            <div
              className="ig-reel-snap-item"
              data-index={idx}
              key={reel.id}
              ref={(el) => {
                itemRefs.current[idx] = el;
              }}
            >
              <div className="ig-reel-stage">
                <div className="ig-reel-card">
                  <video
                    className="ig-reel-video"
                    loop
                    muted={muted}
                    onClick={() => togglePlayPause(reel.id)}
                    playsInline
                    preload="metadata"
                    ref={(el) => {
                      videoRefs.current[reel.id] = el;
                    }}
                    src={reel.videoUrl}
                  />

                  <div className="ig-reel-scrim" />

                  {isPaused && (
                    <div aria-hidden="true" className="ig-reel-play-center">
                      <PlayIcon size={24} />
                    </div>
                  )}

                  <button
                    aria-label={muted ? "Unmute audio" : "Mute audio"}
                    className="ig-reel-mute-btn"
                    onClick={() => setMuted((m) => !m)}
                    type="button"
                  >
                    {muted ? (
                      <VolumeMutedIcon size={12} />
                    ) : (
                      <VolumePlayingIcon size={12} />
                    )}
                  </button>

                  <div className="ig-reel-bottom-left">
                    <div className="ig-reel-author-row">
                      <Link
                        href={`/${reel.author.username}/`}
                        style={{ display: "inline-flex", alignItems: "center", gap: 10 }}
                      >
                        <Avatar
                          avatarUrl={reel.author.avatarUrl}
                          size={32}
                          username={reel.author.username}
                        />
                        <span className="ig-reel-username">{reel.author.username}</span>
                      </Link>
                      {!isOwner && (
                        <button
                          className="ig-reel-follow-btn"
                          onClick={() => handleToggleFollow(reel)}
                          type="button"
                        >
                          {reel.author.isFollowing ? "Following" : "Follow"}
                        </button>
                      )}
                    </div>

                    {reel.caption && (
                      <div className="ig-reel-caption">
                        <span>{displayedCaption}</span>
                        {longCaption && !captionExpanded && (
                          <button
                            onClick={() =>
                              setExpandedCaptions((prev) => ({
                                ...prev,
                                [reel.id]: true,
                              }))
                            }
                            style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}
                            type="button"
                          >
                            … more
                          </button>
                        )}
                      </div>
                    )}

                    <div className="ig-reel-audio-row">
                      <MusicNoteIcon size={12} />
                      <span>{reel.author.username} · Original audio</span>
                    </div>
                  </div>
                </div>

                <div className="ig-reel-actions-col">
                  <button
                    aria-label={reel.isLiked ? "Unlike" : "Like"}
                    className="ig-reel-action-btn"
                    onClick={() => handleLike(reel)}
                    type="button"
                  >
                    {reel.isLiked ? (
                      <HeartFilledIcon size={24} />
                    ) : (
                      <HeartOutlineIcon size={24} title="Like" />
                    )}
                    <span className="ig-reel-action-count">
                      {formatCount(reel.likesCount)}
                    </span>
                  </button>

                  <button
                    aria-label="Comment"
                    className="ig-reel-action-btn"
                    onClick={() => openComments(reel)}
                    type="button"
                  >
                    <CommentIcon size={24} />
                    <span className="ig-reel-action-count">
                      {formatCount(reel.commentsCount)}
                    </span>
                  </button>

                  <button
                    aria-label="Share"
                    className="ig-reel-action-btn"
                    onClick={() => setSharePostId(reel.id)}
                    type="button"
                  >
                    <ShareIcon size={24} />
                  </button>

                  <button
                    aria-label={reel.isSaved ? "Remove" : "Save"}
                    className="ig-reel-action-btn is-compact"
                    onClick={() => handleSave(reel)}
                    type="button"
                  >
                    {reel.isSaved ? (
                      <BookmarkFilledIcon size={24} />
                    ) : (
                      <BookmarkOutlineIcon size={24} />
                    )}
                  </button>

                  <div style={{ position: "relative" }}>
                    <button
                      aria-label="More options"
                      className="ig-reel-action-btn is-compact"
                      onClick={() =>
                        setOpenMenuId((cur) => (cur === reel.id ? null : reel.id))
                      }
                      type="button"
                    >
                      <MoreOptionsIcon size={24} />
                    </button>

                    {openMenuId === reel.id && (
                      <div
                        style={{
                          position: "absolute",
                          right: 36,
                          bottom: 12,
                          width: 170,
                          background: "rgb(var(--ig-menu-background-color))",
                          borderRadius: 12,
                          boxShadow: "var(--ig-strong-shadow)",
                          padding: 6,
                          zIndex: 20,
                        }}
                      >
                        <Link
                          className="ig-more-item"
                          href={`/p/${reel.id}/`}
                          style={{ height: 38, margin: 0, width: "100%" }}
                        >
                          Go to post
                        </Link>
                        <button
                          className="ig-more-item"
                          onClick={() => {
                            navigator.clipboard
                              ?.writeText(`${window.location.origin}/reels/${reel.id}/`)
                              .catch(() => {});
                            setOpenMenuId(null);
                          }}
                          style={{ height: 38, margin: 0, width: "100%" }}
                          type="button"
                        >
                          Copy link
                        </button>
                        {isOwner && (
                          <button
                            className="ig-more-item"
                            onClick={() => handleDeleteReel(reel.id)}
                            style={{
                              height: 38,
                              margin: 0,
                              width: "100%",
                              color: "rgb(var(--ig-error-or-destructive))",
                              fontWeight: 600,
                            }}
                            type="button"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <Link
                    aria-label={`${reel.author.username} profile`}
                    className="ig-reel-cover-thumb"
                    href={`/${reel.author.username}/`}
                  >
                    <Avatar
                      avatarUrl={reel.author.avatarUrl}
                      size={24}
                      username={reel.author.username}
                    />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {reels.length > 1 && (
        <div className="ig-reel-nav-arrows">
          <button
            aria-label="Previous reel"
            className="ig-reel-nav-circle"
            disabled={activeIndex <= 0}
            onClick={() => scrollToIndex(activeIndex - 1)}
            type="button"
          >
            <ReelsArrowIcon direction="up" size={24} />
          </button>
          <button
            aria-label="Next reel"
            className="ig-reel-nav-circle"
            disabled={activeIndex >= reels.length - 1}
            onClick={() => scrollToIndex(activeIndex + 1)}
            type="button"
          >
            <ReelsArrowIcon direction="down" size={24} />
          </button>
        </div>
      )}

      {commentTarget && (
        <div
          className="ig-reel-comments-sheet"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCommentTarget(null);
          }}
          role="presentation"
        >
          <div aria-modal="true" className="ig-reel-comments-card" role="dialog">
            <div className="ig-dm-new-header">
              <span style={{ width: 24 }} />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Comments</h2>
              <button
                aria-label="Close"
                onClick={() => setCommentTarget(null)}
                type="button"
              >
                <CloseIcon size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
              {commentsLoading ? (
                <div style={{ textAlign: "center", color: "rgb(var(--ig-secondary-text))" }}>
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div style={{ textAlign: "center", color: "rgb(var(--ig-secondary-text))", marginTop: 40 }}>
                  No comments yet. Start the conversation.
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
                      <Avatar
                        avatarUrl={c.avatarUrl}
                        size={32}
                        username={c.username}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div>
                          <Link
                            href={`/${c.username}/`}
                            style={{ fontWeight: 600, marginRight: 6 }}
                          >
                            {c.username}
                          </Link>
                          <span style={{ wordBreak: "break-word" }}>{c.content}</span>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "rgb(var(--ig-secondary-text))",
                            marginTop: 4,
                          }}
                        >
                          {formatRelativeTime(c.createdAt)}
                        </div>
                      </div>
                    </div>
                    {(c.userId === viewerId || commentTarget.author.id === viewerId) && (
                      <button
                        aria-label="Delete comment"
                        onClick={() => handleDeleteComment(c.id)}
                        style={{
                          fontSize: 12,
                          color: "rgb(var(--ig-secondary-text))",
                          flexShrink: 0,
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleSubmitComment}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                borderTop: "1px solid rgb(var(--ig-elevated-separator))",
              }}
            >
              <input
                aria-label="Add a comment"
                id="reel-comment-input"
                name="reelComment"
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                style={{
                  flex: 1,
                  border: 0,
                  outline: "none",
                  background: "transparent",
                  color: "rgb(var(--ig-primary-text))",
                  fontSize: 14,
                }}
                type="text"
                value={commentText}
              />
              <button
                disabled={!commentText.trim() || postingComment}
                style={{
                  color: commentText.trim()
                    ? "rgb(var(--ig-colors-button-primary-link-text))"
                    : "rgb(var(--ig-secondary-text))",
                  fontWeight: 600,
                }}
                type="submit"
              >
                Post
              </button>
            </form>
          </div>
        </div>
      )}

      {sharePostId && (
        <ShareToDmModal
          onClose={() => setSharePostId(null)}
          postId={sharePostId}
          postUrl={
            typeof window !== "undefined"
              ? `${window.location.origin}/reels/${sharePostId}/`
              : `/reels/${sharePostId}/`
          }
        />
      )}
    </>
  );
}
