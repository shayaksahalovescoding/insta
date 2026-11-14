"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { DmUserDTO } from "@/lib/phase3-queries";
import { Avatar } from "./Avatar";
import { CloseIcon, SearchIcon } from "./icons/InstagramIcons";

interface ShareToDmModalProps {
  postId: string;
  postUrl: string;
  onClose: () => void;
}

export function ShareToDmModal({ postId, postUrl, onClose }: ShareToDmModalProps) {
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [users, setUsers] = useState<DmUserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingToId, setSendingToId] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/direct/users?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          setUsers(data.users || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  async function handleSendToUser(user: DmUserDTO) {
    if (sendingToId) return;
    setSendingToId(user.id);
    try {
      const threadRes = await fetch("/api/direct/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: user.id }),
      });
      if (!threadRes.ok) {
        setSendingToId(null);
        return;
      }
      const { threadId } = await threadRes.json();
      const msgRes = await fetch(`/api/direct/threads/${threadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sharedPostId: postId,
          body: note.trim(),
        }),
      });
      if (msgRes.ok) {
        setSentMap((prev) => ({ ...prev, [user.id]: threadId }));
      }
    } finally {
      setSendingToId(null);
    }
  }

  function handleCopyLink() {
    navigator.clipboard?.writeText(postUrl).catch(() => {});
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div
      className="ig-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div aria-modal="true" className="ig-dm-new-modal" role="dialog">
        <div className="ig-dm-new-header">
          <span style={{ width: 24 }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Share</h2>
          <button aria-label="Close" onClick={onClose} type="button">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="ig-dm-to-row">
          <SearchIcon size={16} />
          <input
            aria-label="Search user to share with"
            id="share-dm-search"
            name="shareSearch"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people..."
            style={{
              flex: 1,
              border: 0,
              outline: "none",
              background: "transparent",
              color: "rgb(var(--ig-primary-text))",
              fontSize: 14,
            }}
            type="text"
            value={query}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "rgb(var(--ig-secondary-text))" }}>
              Loading accounts...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "rgb(var(--ig-secondary-text))" }}>
              No matching accounts found.
            </div>
          ) : (
            users.map((u) => {
              const sentThreadId = sentMap[u.id];
              return (
                <div className="ig-dm-user-option" key={u.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <Avatar avatarUrl={u.avatarUrl} size={44} username={u.username} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{u.username}</div>
                      {u.fullName && (
                        <div style={{ fontSize: 12, color: "rgb(var(--ig-secondary-text))" }}>
                          {u.fullName}
                        </div>
                      )}
                    </div>
                  </div>
                  {sentThreadId ? (
                    <Link
                      className="ig-btn-secondary"
                      href={`/direct/t/${sentThreadId}/`}
                      onClick={onClose}
                    >
                      View chat
                    </Link>
                  ) : (
                    <button
                      className="ig-btn-primary"
                      disabled={sendingToId === u.id}
                      onClick={() => handleSendToUser(u)}
                      type="button"
                    >
                      {sendingToId === u.id ? "Sending..." : "Send"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            padding: 16,
            borderTop: "1px solid rgb(var(--ig-elevated-separator))",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <input
            aria-label="Write a message"
            id="share-dm-note"
            name="shareNote"
            onChange={(e) => setNote(e.target.value)}
            placeholder="Write a message (optional)..."
            style={{
              width: "100%",
              border: "1px solid rgb(var(--ig-separator))",
              borderRadius: 10,
              padding: "8px 12px",
              background: "transparent",
              color: "rgb(var(--ig-primary-text))",
              fontSize: 14,
              outline: "none",
            }}
            type="text"
            value={note}
          />
          <button
            className="ig-btn-secondary"
            onClick={handleCopyLink}
            style={{ width: "100%", height: 38 }}
            type="button"
          >
            {copied ? "Link copied" : "Copy link"}
          </button>
        </div>
      </div>
    </div>
  );
}
