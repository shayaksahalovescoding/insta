"use client";

import Link from "next/link";
import React, { useState } from "react";
import { PostDTO } from "@/lib/queries";
import { formatCount, formatRelativeTime } from "@/lib/time";
import { Avatar } from "./Avatar";
import {
  BookmarkFilledIcon,
  BookmarkOutlineIcon,
  ChevronIcon,
  CommentIcon,
  HeartFilledIcon,
  HeartOutlineIcon,
  MoreOptionsIcon,
  ShareIcon,
} from "./icons/InstagramIcons";

interface PostCardProps {
  post: PostDTO;
  viewerId: string;
  onUpdate: (post: PostDTO) => void;
  onDelete: (postId: string) => void;
  onOpenDetail: (postId: string) => void;
}

export function PostCard({
  post,
  viewerId,
  onUpdate,
  onDelete,
  onOpenDetail,
}: PostCardProps) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [captionExpanded, setCaptionExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const activeMedia = post.media[slideIndex] ?? post.media[0];
  const isOwner = viewerId === post.author.id;

  const aspectRatioCss =
    post.aspectRatio === "4:5"
      ? "4 / 5"
      : post.aspectRatio === "16:9"
        ? "16 / 9"
        : post.aspectRatio === "1:1"
          ? "1 / 1"
          : undefined;

  async function handleLike() {
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    onUpdate({ ...post, isLiked: data.isLiked, likesCount: data.likesCount });
  }

  async function handleSave() {
    const res = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    onUpdate({ ...post, isSaved: data.isSaved });
  }

  async function handleDelete() {
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      onDelete(post.id);
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/p/${post.id}/`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const shouldTruncateCaption = post.caption.length > 140 && !captionExpanded;
  const displayedCaption = shouldTruncateCaption
    ? post.caption.slice(0, 140)
    : post.caption;

  return (
    <article className="ig-post-card">
      <div className="ig-post-header">
        <div className="ig-post-author">
          <Link href={`/${post.author.username}/`}>
            <Avatar
              avatarUrl={post.author.avatarUrl}
              size={32}
              username={post.author.username}
            />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Link className="ig-post-author-name" href={`/${post.author.username}/`}>
                {post.author.username}
              </Link>
              <span className="ig-post-time">•</span>
              <span className="ig-post-time">{formatRelativeTime(post.createdAt)}</span>
            </div>
            {post.location && <div className="ig-post-location">{post.location}</div>}
          </div>
        </div>

        <div style={{ position: "relative" }}>
          <button
            aria-label="More options"
            onClick={() => setMenuOpen((o) => !o)}
            type="button"
          >
            <MoreOptionsIcon size={24} />
          </button>
          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 28,
                width: 170,
                background: "rgb(var(--ig-menu-background-color))",
                borderRadius: 12,
                boxShadow: "var(--ig-strong-shadow)",
                padding: 6,
                zIndex: 10,
              }}
            >
              <Link
                className="ig-more-item"
                href={`/p/${post.id}/`}
                style={{ height: 38, margin: 0, width: "100%" }}
              >
                Go to post
              </Link>
              <button
                className="ig-more-item"
                onClick={() => {
                  handleShare();
                  setMenuOpen(false);
                }}
                style={{ height: 38, margin: 0, width: "100%" }}
                type="button"
              >
                Copy link
              </button>
              {isOwner && (
                <button
                  className="ig-more-item"
                  onClick={handleDelete}
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
      </div>

      <div
        className="ig-post-media-frame"
        onDoubleClick={() => {
          if (!post.isLiked) handleLike();
        }}
        style={{ aspectRatio: aspectRatioCss }}
      >
        {activeMedia && (
          <img
            alt={post.caption || `Post by ${post.author.username}`}
            className="ig-post-media-img"
            src={activeMedia.url}
          />
        )}

        {post.media.length > 1 && slideIndex > 0 && (
          <button
            aria-label="Go back"
            className="ig-carousel-btn ig-carousel-btn-prev"
            onClick={() => setSlideIndex((i) => i - 1)}
            type="button"
          >
            <ChevronIcon direction="left" size={14} />
          </button>
        )}

        {post.media.length > 1 && slideIndex < post.media.length - 1 && (
          <button
            aria-label="Next"
            className="ig-carousel-btn ig-carousel-btn-next"
            onClick={() => setSlideIndex((i) => i + 1)}
            type="button"
          >
            <ChevronIcon direction="right" size={14} />
          </button>
        )}

        {post.media.length > 1 && (
          <div className="ig-carousel-dots">
            {post.media.map((m, idx) => (
              <button
                aria-label={`Go to slide ${idx + 1}`}
                className={`ig-carousel-dot ${idx === slideIndex ? "is-active" : ""}`}
                key={m.id}
                onClick={() => setSlideIndex(idx)}
                type="button"
              />
            ))}
          </div>
        )}
      </div>

      <section className="ig-post-actions">
        <div className="ig-post-actions-left">
          <button
            aria-label={post.isLiked ? "Unlike" : "Like"}
            className="ig-action-btn"
            onClick={handleLike}
            type="button"
          >
            {post.isLiked ? (
              <HeartFilledIcon size={24} />
            ) : (
              <HeartOutlineIcon size={24} title="Like" />
            )}
            {post.likesCount > 0 && (
              <span className="ig-action-count">{formatCount(post.likesCount)}</span>
            )}
          </button>

          <button
            aria-label="Comment"
            className="ig-action-btn"
            onClick={() => onOpenDetail(post.id)}
            type="button"
          >
            <CommentIcon size={24} />
            {post.commentsCount > 0 && (
              <span className="ig-action-count">{formatCount(post.commentsCount)}</span>
            )}
          </button>

          <button
            aria-label="Share"
            className="ig-action-btn"
            onClick={handleShare}
            type="button"
          >
            <ShareIcon size={24} />
            {copied && <span style={{ fontSize: 12 }}>Copied</span>}
          </button>
        </div>

        <button
          aria-label={post.isSaved ? "Remove" : "Save"}
          className="ig-action-btn"
          onClick={handleSave}
          type="button"
        >
          {post.isSaved ? (
            <BookmarkFilledIcon size={24} />
          ) : (
            <BookmarkOutlineIcon size={24} />
          )}
        </button>
      </section>

      {post.likesCount > 0 && (
        <div className="ig-post-likes">
          {post.likesCount === 1 ? "1 like" : `${formatCount(post.likesCount)} likes`}
        </div>
      )}

      {post.caption && (
        <div className="ig-post-caption">
          <Link className="ig-post-caption-user" href={`/${post.author.username}/`}>
            {post.author.username}
          </Link>
          <span>{displayedCaption}</span>
          {shouldTruncateCaption && (
            <>
              <span>...</span>
              <button
                className="ig-post-more-btn"
                onClick={() => setCaptionExpanded(true)}
                type="button"
              >
                more
              </button>
            </>
          )}
        </div>
      )}

      {post.commentsCount > 0 && (
        <button
          className="ig-post-comments-trigger"
          onClick={() => onOpenDetail(post.id)}
          type="button"
        >
          View all {post.commentsCount} {post.commentsCount === 1 ? "comment" : "comments"}
        </button>
      )}
    </article>
  );
}
