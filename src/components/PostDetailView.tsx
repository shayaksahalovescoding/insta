"use client";

import Link from "next/link";
import React, { useState } from "react";
import { CommentDTO, PostDTO } from "@/lib/queries";
import { formatCount, formatRelativeTime } from "@/lib/time";
import { Avatar } from "./Avatar";
import { ShareToDmModal } from "./ShareToDmModal";
import {
  BookmarkFilledIcon,
  BookmarkOutlineIcon,
  ChevronIcon,
  CloseIcon,
  CommentIcon,
  EmojiIcon,
  HeartFilledIcon,
  HeartOutlineIcon,
  MoreOptionsIcon,
  ShareIcon,
} from "./icons/InstagramIcons";

interface PostDetailViewProps {
  initialPost: PostDTO;
  initialComments: CommentDTO[];
  viewerId: string | null;
  isModal?: boolean;
  onClose?: () => void;
  onPostMutated?: (post: PostDTO) => void;
  onPostDeleted?: (postId: string) => void;
}

export function PostDetailView({
  initialPost,
  initialComments,
  viewerId,
  isModal = false,
  onClose,
  onPostMutated,
  onPostDeleted,
}: PostDetailViewProps) {
  const [post, setPost] = useState<PostDTO>(initialPost);
  const [comments, setComments] = useState<CommentDTO[]>(initialComments);
  const [slideIndex, setSlideIndex] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const media = post.media;
  const activeMedia = media[slideIndex] ?? media[0];
  const isOwner = viewerId === post.author.id;

  async function handleLike() {
    if (!viewerId) return;
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    const updated = { ...post, isLiked: data.isLiked, likesCount: data.likesCount };
    setPost(updated);
    onPostMutated?.(updated);
  }

  async function handleSave() {
    if (!viewerId) return;
    const res = await fetch(`/api/posts/${post.id}/save`, { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    const updated = { ...post, isSaved: data.isSaved };
    setPost(updated);
    onPostMutated?.(updated);
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed || !viewerId || postingComment) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setCommentText("");
        const updated = { ...post, commentsCount: post.commentsCount + 1 };
        setPost(updated);
        onPostMutated?.(updated);
      }
    } finally {
      setPostingComment(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    const res = await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    if (!res.ok) return;
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    const updated = { ...post, commentsCount: Math.max(0, post.commentsCount - 1) };
    setPost(updated);
    onPostMutated?.(updated);
  }

  async function handleDeletePost() {
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      onPostDeleted?.(post.id);
      onClose?.();
    }
  }

  function handleShare() {
    const url = `${window.location.origin}/p/${post.id}/`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const content = (
    <article className="ig-post-detail-box">
      <div className="ig-post-detail-media">
        {activeMedia &&
          (activeMedia.mimeType.startsWith("video/") ? (
            <video
              controls
              loop
              playsInline
              preload="metadata"
              src={activeMedia.url}
              style={{ width: "100%", height: "100%", objectFit: "contain", backgroundColor: "#000" }}
            />
          ) : (
            <img alt={post.caption || "Post media"} src={activeMedia.url} />
          ))}
        {media.length > 1 && slideIndex > 0 && (
          <button
            aria-label="Go back"
            className="ig-carousel-btn ig-carousel-btn-prev"
            onClick={() => setSlideIndex((i) => i - 1)}
            type="button"
          >
            <ChevronIcon direction="left" size={14} />
          </button>
        )}
        {media.length > 1 && slideIndex < media.length - 1 && (
          <button
            aria-label="Next"
            className="ig-carousel-btn ig-carousel-btn-next"
            onClick={() => setSlideIndex((i) => i + 1)}
            type="button"
          >
            <ChevronIcon direction="right" size={14} />
          </button>
        )}
        {media.length > 1 && (
          <div className="ig-carousel-dots">
            {media.map((m, idx) => (
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

      <div className="ig-post-detail-sidebar">
        <header className="ig-post-detail-header">
          <div className="ig-post-author">
            <Link href={`/${post.author.username}/`} onClick={onClose}>
              <Avatar
                avatarUrl={post.author.avatarUrl}
                size={32}
                username={post.author.username}
              />
            </Link>
            <div>
              <Link
                className="ig-post-author-name"
                href={`/${post.author.username}/`}
                onClick={onClose}
              >
                {post.author.username}
              </Link>
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
                  top: 30,
                  width: 180,
                  background: "rgb(var(--ig-menu-background-color))",
                  borderRadius: 12,
                  boxShadow: "var(--ig-strong-shadow)",
                  padding: 6,
                  zIndex: 10,
                }}
              >
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
                    onClick={handleDeletePost}
                    style={{
                      height: 38,
                      margin: 0,
                      width: "100%",
                      color: "rgb(var(--ig-error-or-destructive))",
                      fontWeight: 600,
                    }}
                    type="button"
                  >
                    Delete post
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        <ul className="ig-post-detail-comments">
          {post.caption && (
            <li className="ig-comment-row">
              <div className="ig-comment-body">
                <Link href={`/${post.author.username}/`} onClick={onClose}>
                  <Avatar
                    avatarUrl={post.author.avatarUrl}
                    size={32}
                    username={post.author.username}
                  />
                </Link>
                <div>
                  <div>
                    <Link
                      className="ig-post-caption-user"
                      href={`/${post.author.username}/`}
                      onClick={onClose}
                    >
                      {post.author.username}
                    </Link>
                    <span>{post.caption}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgb(var(--ig-secondary-text))",
                      marginTop: 4,
                    }}
                  >
                    {formatRelativeTime(post.createdAt)}
                  </div>
                </div>
              </div>
            </li>
          )}

          {comments.map((c) => (
            <li className="ig-comment-row" key={c.id}>
              <div className="ig-comment-body">
                <Link href={`/${c.username}/`} onClick={onClose}>
                  <Avatar avatarUrl={c.avatarUrl} size={32} username={c.username} />
                </Link>
                <div>
                  <div>
                    <Link
                      className="ig-post-caption-user"
                      href={`/${c.username}/`}
                      onClick={onClose}
                    >
                      {c.username}
                    </Link>
                    <span>{c.content}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "rgb(var(--ig-secondary-text))",
                      marginTop: 4,
                      display: "flex",
                      gap: 12,
                    }}
                  >
                    <span>{formatRelativeTime(c.createdAt)}</span>
                    {(viewerId === c.userId || isOwner) && (
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        style={{
                          fontSize: 12,
                          color: "rgb(var(--ig-secondary-text))",
                        }}
                        type="button"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}

          {!post.caption && comments.length === 0 && (
            <li
              style={{
                textAlign: "center",
                color: "rgb(var(--ig-secondary-text))",
                marginTop: 40,
              }}
            >
              No comments yet. Start the conversation.
            </li>
          )}
        </ul>

        <div className="ig-post-detail-actions">
          <div className="ig-post-actions">
            <div className="ig-post-actions-left">
              <button
                aria-label={post.isLiked ? "Unlike" : "Like"}
                className="ig-action-btn"
                onClick={handleLike}
                type="button"
              >
                {post.isLiked ? <HeartFilledIcon size={24} /> : <HeartOutlineIcon size={24} title="Like" />}
              </button>
              <button aria-label="Comment" className="ig-action-btn" type="button">
                <CommentIcon size={24} />
              </button>
              <button
                aria-label="Share"
                className="ig-action-btn"
                onClick={() => (viewerId ? setShareOpen(true) : handleShare())}
                type="button"
              >
                <ShareIcon size={24} />
              </button>
            </div>
            <button
              aria-label={post.isSaved ? "Remove" : "Save"}
              className="ig-action-btn"
              onClick={handleSave}
              type="button"
            >
              {post.isSaved ? <BookmarkFilledIcon size={24} /> : <BookmarkOutlineIcon size={24} />}
            </button>
          </div>
          <div className="ig-post-likes">
            {post.likesCount === 1 ? "1 like" : `${formatCount(post.likesCount)} likes`}
            {copied && (
              <span
                style={{
                  marginLeft: 10,
                  fontSize: 12,
                  fontWeight: 400,
                  color: "rgb(var(--ig-secondary-text))",
                }}
              >
                Link copied
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "rgb(var(--ig-secondary-text))" }}>
            {formatRelativeTime(post.createdAt)}
          </div>
        </div>

        {viewerId ? (
          <form className="ig-comment-form" onSubmit={handleSubmitComment}>
            <EmojiIcon size={24} />
            <textarea
              className="ig-comment-textarea"
              id={`comment-input-${post.id}`}
              name="comment"
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitComment(e);
                }
              }}
              placeholder="Add a comment…"
              rows={1}
              value={commentText}
            />
            <button
              className="ig-comment-post-btn"
              disabled={!commentText.trim() || postingComment}
              type="submit"
            >
              Post
            </button>
          </form>
        ) : (
          <div className="ig-comment-form">
            <Link
              href="/accounts/login/"
              style={{ color: "rgb(var(--ig-colors-button-primary-link-text))", fontWeight: 600 }}
            >
              Log in
            </Link>
            <span style={{ color: "rgb(var(--ig-secondary-text))" }}>to like or comment.</span>
          </div>
        )}
      </div>
    </article>
  );

  const shareModal = shareOpen ? (
    <ShareToDmModal
      onClose={() => setShareOpen(false)}
      postId={post.id}
      postUrl={
        typeof window !== "undefined"
          ? `${window.location.origin}/p/${post.id}/`
          : `/p/${post.id}/`
      }
    />
  ) : null;

  if (!isModal) {
    return (
      <div
        style={{
          width: "100%",
          padding: "24px 20px",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {content}
        {shareModal}
      </div>
    );
  }

  return (
    <div
      className="ig-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="presentation"
    >
      <button
        aria-label="Close"
        className="ig-modal-close-corner"
        onClick={onClose}
        type="button"
      >
        <CloseIcon size={18} strokeWidth={3} />
      </button>
      {content}
      {shareModal}
    </div>
  );
}
