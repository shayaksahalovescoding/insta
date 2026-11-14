"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DmMessageDTO,
  DmThreadDetailDTO,
  DmThreadSummaryDTO,
} from "@/lib/phase3-queries";
import { formatRelativeTime } from "@/lib/time";
import { Avatar } from "./Avatar";
import { NewMessageModal } from "./NewMessageModal";
import {
  AddMediaIcon,
  BackArrowIcon,
  CloseIcon,
  ConversationInfoIcon,
  DirectCircleIcon,
  EmojiIcon,
  HeartOutlineIcon,
  NewMessageIcon,
  SearchIcon,
  SendPlaneIcon,
} from "./icons/InstagramIcons";

interface DirectClientProps {
  currentUser: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  initialThreads: DmThreadSummaryDTO[];
  initialActiveThread: DmThreadDetailDTO | null;
}

const QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "🙏", "👍"];
const COMPOSER_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥", "🙌", "👏", "✨"];

function formatDividerTime(ts: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(ts);
}

function summarizeThreadLastMessage(
  thread: DmThreadSummaryDTO,
  currentUserId: string
): string {
  const last = thread.lastMessage;
  if (!last) return "Say hello";
  const prefix = last.senderId === currentUserId ? "You: " : "";
  if (last.body) return `${prefix}${last.body}`;
  if (last.sharedPostId) {
    return last.senderId === currentUserId ? "You shared a post" : "Shared a post";
  }
  if (last.mediaMime?.startsWith("video/")) {
    return last.senderId === currentUserId ? "You sent a video" : "Sent a video";
  }
  if (last.mediaMime) {
    return last.senderId === currentUserId ? "You sent a photo" : "Sent a photo";
  }
  return "New message";
}

export function DirectClient({
  currentUser,
  initialThreads,
  initialActiveThread,
}: DirectClientProps) {
  const router = useRouter();
  const [threads, setThreads] = useState<DmThreadSummaryDTO[]>(initialThreads);
  const [activeThread, setActiveThread] = useState<DmThreadDetailDTO | null>(
    initialActiveThread
  );
  const [threadSearch, setThreadSearch] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [composerEmojiOpen, setComposerEmojiOpen] = useState(false);
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastMsgCountRef = useRef<number>(initialActiveThread?.messages.length ?? 0);

  useEffect(() => {
    setActiveThread(initialActiveThread);
    setInfoOpen(false);
    setReactionTargetId(null);
    lastMsgCountRef.current = initialActiveThread?.messages.length ?? 0;
  }, [initialActiveThread]);

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  useEffect(() => {
    const unread = threads.filter((t) => t.isUnread).length;
    window.dispatchEvent(new CustomEvent("ig:dm-unread", { detail: { count: unread } }));
  }, [threads]);

  useEffect(() => {
    if (!activeThread) return;
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [activeThread?.id]);

  useEffect(() => {
    const count = activeThread?.messages.length ?? 0;
    if (count > lastMsgCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    lastMsgCountRef.current = count;
  }, [activeThread?.messages.length]);

  const activeThreadId = activeThread?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    async function refreshLive() {
      if (document.visibilityState !== "visible") return;
      try {
        const threadsRes = await fetch(
          `/api/direct/threads?q=${encodeURIComponent(threadSearch.trim())}`
        );
        if (threadsRes.ok && !cancelled) {
          const tData = await threadsRes.json();
          setThreads(tData.threads || []);
          window.dispatchEvent(
            new CustomEvent("ig:dm-unread", {
              detail: { count: Number(tData.unreadThreadsCount || 0) },
            })
          );
        }

        if (activeThreadId) {
          const detailRes = await fetch(
            `/api/direct/threads/${activeThreadId}?markRead=1`
          );
          if (detailRes.ok && !cancelled) {
            const dData = await detailRes.json();
            if (dData.thread) {
              setActiveThread(dData.thread);
            }
          }
        }
      } catch {
        // ignore transient polling failure
      }
    }

    const interval = window.setInterval(refreshLive, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [activeThreadId, threadSearch]);

  const filteredThreads = useMemo(() => {
    const q = threadSearch.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.otherUser.username.toLowerCase().includes(q) ||
        t.otherUser.fullName.toLowerCase().includes(q)
    );
  }, [threads, threadSearch]);

  async function refreshThreadsNow() {
    const res = await fetch("/api/direct/threads");
    if (!res.ok) return;
    const data = await res.json();
    setThreads(data.threads || []);
    window.dispatchEvent(
      new CustomEvent("ig:dm-unread", {
        detail: { count: Number(data.unreadThreadsCount || 0) },
      })
    );
  }

  async function handleSendText(textToSend?: string) {
    if (!activeThread || sending) return;
    const body = (textToSend ?? messageInput).trim();
    if (!body) return;

    setSending(true);
    setSendError(null);
    if (textToSend === undefined) {
      setMessageInput("");
    }
    setComposerEmojiOpen(false);

    try {
      const res = await fetch(`/api/direct/threads/${activeThread.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "Could not send message.");
        if (textToSend === undefined) setMessageInput(body);
        return;
      }
      const created: DmMessageDTO = data.message;
      setActiveThread((prev) =>
        prev ? { ...prev, messages: [...prev.messages, created] } : prev
      );
      await refreshThreadsNow();
    } finally {
      setSending(false);
    }
  }

  async function handleSendMedia(file: File | undefined) {
    if (!file || !activeThread || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (messageInput.trim()) {
        fd.append("body", messageInput.trim());
        setMessageInput("");
      }
      const res = await fetch(`/api/direct/threads/${activeThread.id}/messages`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "Could not upload media.");
        return;
      }
      const created: DmMessageDTO = data.message;
      setActiveThread((prev) =>
        prev ? { ...prev, messages: [...prev.messages, created] } : prev
      );
      await refreshThreadsNow();
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleToggleReaction(messageId: string, emoji: string) {
    setReactionTargetId(null);
    const res = await fetch(`/api/direct/messages/${messageId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setActiveThread((prev) =>
      prev
        ? {
            ...prev,
            messages: prev.messages.map((m) =>
              m.id === messageId ? { ...m, reactions: data.reactions || [] } : m
            ),
          }
        : prev
    );
  }

  async function handleDeleteMessage(messageId: string) {
    const res = await fetch(`/api/direct/messages/${messageId}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setActiveThread((prev) =>
      prev
        ? { ...prev, messages: prev.messages.filter((m) => m.id !== messageId) }
        : prev
    );
    await refreshThreadsNow();
  }

  async function handleToggleMute() {
    if (!activeThread) return;
    const res = await fetch(`/api/direct/threads/${activeThread.id}`, {
      method: "PATCH",
    });
    if (!res.ok) return;
    const data = await res.json();
    setActiveThread((prev) => (prev ? { ...prev, isMuted: Boolean(data.isMuted) } : prev));
    await refreshThreadsNow();
  }

  const lastMessage =
    activeThread && activeThread.messages.length > 0
      ? activeThread.messages[activeThread.messages.length - 1]
      : null;

  return (
    <div className="ig-dm-shell">
      {/* Left Thread List */}
      <aside
        aria-label="Thread list"
        className={`ig-dm-sidebar ${activeThread ? "is-hidden-mobile" : ""}`}
      >
        <div className="ig-dm-sidebar-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              aria-label="Back to home"
              className="ig-dm-mobile-only"
              href="/"
            >
              <BackArrowIcon size={24} />
            </Link>
            <span className="ig-dm-username-title">{currentUser.username}</span>
          </div>
          <button
            aria-label="New message"
            onClick={() => setNewModalOpen(true)}
            type="button"
          >
            <NewMessageIcon size={24} />
          </button>
        </div>

        <div className="ig-dm-search-wrap">
          <div className="ig-dm-search-box">
            <span
              style={{
                position: "absolute",
                left: 14,
                color: "rgb(var(--ig-secondary-icon))",
                display: "flex",
                pointerEvents: "none",
              }}
            >
              <SearchIcon size={16} />
            </span>
            <input
              aria-label="Search conversations"
              className="ig-dm-search-input"
              id="dm-thread-search"
              name="threadSearch"
              onChange={(e) => setThreadSearch(e.target.value)}
              placeholder="Search"
              type="text"
              value={threadSearch}
            />
          </div>
        </div>

        <div className="ig-dm-section-row">
          <h1 className="ig-dm-section-title">Messages</h1>
        </div>

        <div className="ig-dm-thread-list">
          {filteredThreads.length === 0 ? (
            <div
              style={{
                padding: "32px 24px",
                textAlign: "center",
                color: "rgb(var(--ig-secondary-text))",
              }}
            >
              {threads.length === 0
                ? "No conversations yet. Start a chat above."
                : "No matching conversations."}
            </div>
          ) : (
            filteredThreads.map((t) => {
              const isActive = activeThread?.id === t.id;
              return (
                <Link
                  aria-pressed={isActive}
                  className={`ig-dm-thread-row ${isActive ? "is-active" : ""}`}
                  href={`/direct/t/${t.id}/`}
                  key={t.id}
                >
                  <Avatar
                    avatarUrl={t.otherUser.avatarUrl}
                    size={56}
                    username={t.otherUser.username}
                  />
                  <div className="ig-dm-thread-meta">
                    <div
                      className={`ig-dm-thread-name ${t.isUnread ? "is-unread" : ""}`}
                    >
                      {t.otherUser.fullName || t.otherUser.username}
                    </div>
                    <div
                      className={`ig-dm-thread-preview ${t.isUnread ? "is-unread" : ""}`}
                    >
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {summarizeThreadLastMessage(t, currentUser.id)}
                      </span>
                      {t.lastMessage && (
                        <>
                          <span>·</span>
                          <span style={{ flexShrink: 0 }}>
                            {formatRelativeTime(t.lastMessage.createdAt)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {t.isUnread && <span className="ig-dm-unread-dot" />}
                </Link>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Conversation Pane */}
      <section
        className={`ig-dm-pane ${!activeThread ? "is-hidden-mobile" : ""}`}
      >
        {!activeThread ? (
          <div className="ig-dm-empty-pane">
            <DirectCircleIcon size={96} />
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "4px 0 0" }}>
              Your messages
            </h2>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                color: "rgb(var(--ig-secondary-text))",
              }}
            >
              Send private photos, reels, and messages to another account.
            </p>
            <button
              className="ig-btn-primary"
              onClick={() => setNewModalOpen(true)}
              style={{ marginTop: 8 }}
              type="button"
            >
              Send message
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
              <header className="ig-dm-chat-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <Link
                    aria-label="Back"
                    className="ig-dm-mobile-only"
                    href="/direct/inbox/"
                  >
                    <BackArrowIcon size={24} />
                  </Link>
                  <Link
                    href={`/${activeThread.otherUser.username}/`}
                    style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}
                  >
                    <Avatar
                      avatarUrl={activeThread.otherUser.avatarUrl}
                      size={44}
                      username={activeThread.otherUser.username}
                    />
                    <div style={{ minWidth: 0 }}>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 16,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {activeThread.otherUser.fullName ||
                          activeThread.otherUser.username}
                      </h2>
                      <div
                        style={{
                          fontSize: 12,
                          color: "rgb(var(--ig-secondary-text))",
                        }}
                      >
                        {activeThread.otherUser.username}
                        {activeThread.isMuted ? " · Muted" : ""}
                      </div>
                    </div>
                  </Link>
                </div>

                <button
                  aria-label="Conversation information"
                  onClick={() => setInfoOpen((o) => !o)}
                  style={{
                    width: 40,
                    height: 40,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  type="button"
                >
                  <ConversationInfoIcon size={24} />
                </button>
              </header>

              <div className="ig-dm-messages-scroll">
                {activeThread.messages.length === 0 ? (
                  <div
                    style={{
                      margin: "auto",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Avatar
                      avatarUrl={activeThread.otherUser.avatarUrl}
                      size={76}
                      username={activeThread.otherUser.username}
                    />
                    <div style={{ fontWeight: 700, fontSize: 18 }}>
                      {activeThread.otherUser.fullName ||
                        activeThread.otherUser.username}
                    </div>
                    <div style={{ color: "rgb(var(--ig-secondary-text))" }}>
                      @{activeThread.otherUser.username}
                    </div>
                    <Link
                      className="ig-btn-secondary"
                      href={`/${activeThread.otherUser.username}/`}
                      style={{ marginTop: 4 }}
                    >
                      View profile
                    </Link>
                  </div>
                ) : (
                  activeThread.messages.map((msg, idx) => {
                    const prev = idx > 0 ? activeThread.messages[idx - 1] : null;
                    const showDivider =
                      !prev || msg.createdAt - prev.createdAt > 15 * 60 * 1000;
                    const isVideoAttachment =
                      msg.mediaMime?.startsWith("video/") ?? false;
                    const isSharedVideo =
                      msg.sharedPost?.coverMimeType.startsWith("video/") ?? false;

                    return (
                      <React.Fragment key={msg.id}>
                        {showDivider && (
                          <div className="ig-dm-timestamp-divider">
                            {formatDividerTime(msg.createdAt)}
                          </div>
                        )}

                        <div
                          className={`ig-dm-msg-row ${msg.isMine ? "is-mine" : ""}`}
                        >
                          {!msg.isMine && (
                            <Avatar
                              avatarUrl={activeThread.otherUser.avatarUrl}
                              size={28}
                              username={activeThread.otherUser.username}
                            />
                          )}

                          {msg.isMine && (
                            <div
                              className={`ig-dm-msg-hover-tools ${reactionTargetId === msg.id ? "is-open" : ""}`}
                            >
                              <button
                                aria-label="Unsend message"
                                onClick={() => handleDeleteMessage(msg.id)}
                                style={{
                                  fontSize: 11,
                                  color: "rgb(var(--ig-secondary-text))",
                                  padding: "2px 6px",
                                }}
                                type="button"
                              >
                                Unsend
                              </button>
                              <button
                                aria-label="React to message"
                                onClick={() =>
                                  setReactionTargetId((cur) =>
                                    cur === msg.id ? null : msg.id
                                  )
                                }
                                style={{ color: "rgb(var(--ig-secondary-text))" }}
                                type="button"
                              >
                                <EmojiIcon size={16} />
                              </button>
                            </div>
                          )}

                          <div className="ig-dm-msg-stack">
                            {msg.sharedPost && (
                              <Link
                                className="ig-dm-shared-card"
                                href={
                                  isSharedVideo
                                    ? `/reels/${msg.sharedPost.id}/`
                                    : `/p/${msg.sharedPost.id}/`
                                }
                              >
                                <div
                                  style={{
                                    padding: "8px 10px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    fontWeight: 600,
                                    fontSize: 13,
                                  }}
                                >
                                  <Avatar
                                    avatarUrl={msg.sharedPost.authorAvatarUrl}
                                    size={24}
                                    username={msg.sharedPost.authorUsername}
                                  />
                                  <span>{msg.sharedPost.authorUsername}</span>
                                </div>
                                {isSharedVideo ? (
                                  <video
                                    muted
                                    playsInline
                                    preload="metadata"
                                    src={msg.sharedPost.coverUrl}
                                    style={{
                                      width: "100%",
                                      aspectRatio: "4 / 5",
                                      objectFit: "cover",
                                      display: "block",
                                      backgroundColor: "#000",
                                    }}
                                  />
                                ) : (
                                  <img
                                    alt={msg.sharedPost.caption || "Shared post"}
                                    src={msg.sharedPost.coverUrl}
                                    style={{
                                      width: "100%",
                                      aspectRatio: "1 / 1",
                                      objectFit: "cover",
                                      display: "block",
                                    }}
                                  />
                                )}
                                {msg.sharedPost.caption && (
                                  <div
                                    style={{
                                      padding: "8px 10px",
                                      fontSize: 12,
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {msg.sharedPost.caption}
                                  </div>
                                )}
                              </Link>
                            )}

                            {msg.mediaUrl && (
                              <div className="ig-dm-media-attachment">
                                {isVideoAttachment ? (
                                  <video
                                    controls
                                    playsInline
                                    preload="metadata"
                                    src={msg.mediaUrl}
                                  />
                                ) : (
                                  <img alt="Message attachment" src={msg.mediaUrl} />
                                )}
                              </div>
                            )}

                            {msg.body && (
                              <div
                                className={`ig-dm-bubble ${msg.isMine ? "is-mine" : "is-theirs"}`}
                                style={{
                                  marginTop:
                                    msg.sharedPost || msg.mediaUrl ? 4 : 0,
                                }}
                              >
                                {msg.body}
                              </div>
                            )}

                            {msg.reactions.length > 0 && (
                              <div className="ig-dm-reactions-pill">
                                {msg.reactions.map((r) => (
                                  <span key={`${r.userId}-${r.emoji}`} title={r.username}>
                                    {r.emoji}
                                  </span>
                                ))}
                              </div>
                            )}

                            {reactionTargetId === msg.id && (
                              <div
                                style={{
                                  display: "flex",
                                  gap: 6,
                                  padding: "6px 10px",
                                  borderRadius: 999,
                                  backgroundColor:
                                    "rgb(var(--ig-elevated-background))",
                                  border:
                                    "1px solid rgb(var(--ig-elevated-separator))",
                                  marginTop: 4,
                                  zIndex: 5,
                                }}
                              >
                                {QUICK_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() =>
                                      handleToggleReaction(msg.id, emoji)
                                    }
                                    style={{ fontSize: 18, lineHeight: "22px" }}
                                    type="button"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {!msg.isMine && (
                            <div
                              className={`ig-dm-msg-hover-tools ${reactionTargetId === msg.id ? "is-open" : ""}`}
                            >
                              <button
                                aria-label="React to message"
                                onClick={() =>
                                  setReactionTargetId((cur) =>
                                    cur === msg.id ? null : msg.id
                                  )
                                }
                                style={{ color: "rgb(var(--ig-secondary-text))" }}
                                type="button"
                              >
                                <EmojiIcon size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </React.Fragment>
                    );
                  })
                )}

                {lastMessage?.isMine &&
                  activeThread.otherLastReadAt >= lastMessage.createdAt && (
                    <div
                      style={{
                        textAlign: "right",
                        fontSize: 12,
                        color: "rgb(var(--ig-secondary-text))",
                        marginTop: 2,
                      }}
                    >
                      Seen
                    </div>
                  )}

                <div ref={messagesEndRef} />
              </div>

              {sendError && (
                <div
                  style={{
                    padding: "0 20px 6px",
                    fontSize: 12,
                    color: "rgb(var(--ig-error-or-destructive))",
                  }}
                >
                  {sendError}
                </div>
              )}

              <div className="ig-dm-composer-wrap">
                {composerEmojiOpen && (
                  <div
                    style={{
                      position: "absolute",
                      left: 20,
                      bottom: 72,
                      display: "flex",
                      gap: 8,
                      padding: "8px 12px",
                      borderRadius: 16,
                      backgroundColor: "rgb(var(--ig-elevated-background))",
                      border: "1px solid rgb(var(--ig-elevated-separator))",
                      boxShadow: "var(--ig-strong-shadow)",
                      zIndex: 10,
                    }}
                  >
                    {COMPOSER_EMOJIS.map((em) => (
                      <button
                        key={em}
                        onClick={() => {
                          setMessageInput((v) => `${v}${em}`);
                          setComposerEmojiOpen(false);
                        }}
                        style={{ fontSize: 20 }}
                        type="button"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                )}

                <form
                  className="ig-dm-composer-pill"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendText();
                  }}
                >
                  <button
                    aria-label="Choose an emoji"
                    onClick={() => setComposerEmojiOpen((o) => !o)}
                    style={{
                      width: 32,
                      height: 32,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    type="button"
                  >
                    <EmojiIcon size={24} />
                  </button>

                  <input
                    aria-label="Message"
                    className="ig-dm-composer-input"
                    disabled={sending}
                    id="dm-message-input"
                    name="message"
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Message..."
                    type="text"
                    value={messageInput}
                  />

                  <input
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    hidden
                    id="dm-media-input"
                    name="dmMedia"
                    onChange={(e) => handleSendMedia(e.target.files?.[0])}
                    ref={fileInputRef}
                    type="file"
                  />

                  {messageInput.trim() ? (
                    <button
                      aria-label="Send"
                      className="ig-dm-send-pill-btn"
                      disabled={sending}
                      type="submit"
                    >
                      <SendPlaneIcon size={18} />
                    </button>
                  ) : (
                    <>
                      <button
                        aria-label="Add photo or video"
                        disabled={sending}
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          width: 36,
                          height: 36,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        type="button"
                      >
                        <AddMediaIcon size={24} />
                      </button>
                      <button
                        aria-label="Send heart"
                        disabled={sending}
                        onClick={() => handleSendText("❤️")}
                        style={{
                          width: 36,
                          height: 36,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        type="button"
                      >
                        <HeartOutlineIcon size={24} title="Like" />
                      </button>
                    </>
                  )}
                </form>
              </div>
            </div>

            {infoOpen && (
              <aside className="ig-dm-info-drawer">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                    Details
                  </h3>
                  <button
                    aria-label="Close details"
                    onClick={() => setInfoOpen(false)}
                    type="button"
                  >
                    <CloseIcon size={18} />
                  </button>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    borderBottom: "1px solid rgb(var(--ig-separator))",
                  }}
                >
                  <span>Mute messages</span>
                  <button
                    className="ig-btn-secondary"
                    onClick={handleToggleMute}
                    type="button"
                  >
                    {activeThread.isMuted ? "Unmute" : "Mute"}
                  </button>
                </div>

                <div style={{ fontWeight: 600, fontSize: 14 }}>Members</div>
                <Link
                  href={`/${activeThread.otherUser.username}/`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "8px 0",
                  }}
                >
                  <Avatar
                    avatarUrl={activeThread.otherUser.avatarUrl}
                    size={44}
                    username={activeThread.otherUser.username}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {activeThread.otherUser.username}
                    </div>
                    {activeThread.otherUser.fullName && (
                      <div
                        style={{
                          fontSize: 13,
                          color: "rgb(var(--ig-secondary-text))",
                        }}
                      >
                        {activeThread.otherUser.fullName}
                      </div>
                    )}
                  </div>
                </Link>
              </aside>
            )}
          </div>
        )}
      </section>

      {newModalOpen && (
        <NewMessageModal
          onClose={() => setNewModalOpen(false)}
          onThreadOpened={(threadId) => {
            setNewModalOpen(false);
            router.push(`/direct/t/${threadId}/`);
          }}
        />
      )}
    </div>
  );
}
