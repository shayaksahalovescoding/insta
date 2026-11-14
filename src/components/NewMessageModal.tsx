"use client";

import React, { useEffect, useState } from "react";
import { DmUserDTO } from "@/lib/phase3-queries";
import { Avatar } from "./Avatar";
import { CloseIcon } from "./icons/InstagramIcons";

interface NewMessageModalProps {
  onClose: () => void;
  onThreadOpened: (threadId: string) => void;
}

export function NewMessageModal({
  onClose,
  onThreadOpened,
}: NewMessageModalProps) {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<DmUserDTO[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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
    }, 140);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  async function handleStartChat() {
    if (!selectedUserId || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/direct/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: selectedUserId }),
      });
      if (!res.ok) {
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      onThreadOpened(data.threadId);
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="ig-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
      role="presentation"
    >
      <div aria-modal="true" className="ig-dm-new-modal" role="dialog">
        <div className="ig-dm-new-header">
          <span style={{ width: 24 }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>New message</h2>
          <button aria-label="Close" disabled={submitting} onClick={onClose} type="button">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="ig-dm-to-row">
          <span style={{ fontSize: 16, fontWeight: 600 }}>To:</span>
          <input
            aria-label="Search recipient"
            autoFocus
            id="dm-new-recipient-search"
            name="recipientSearch"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            style={{
              flex: 1,
              height: 38,
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

        <div style={{ flex: 1, overflowY: "auto", paddingTop: 8 }}>
          {!query.trim() && (
            <div
              style={{
                padding: "8px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: "rgb(var(--ig-primary-text))",
              }}
            >
              Suggested
            </div>
          )}

          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "rgb(var(--ig-secondary-text))" }}>
              Loading accounts...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "rgb(var(--ig-secondary-text))" }}>
              No account found.
            </div>
          ) : (
            users.map((u) => {
              const selected = selectedUserId === u.id;
              return (
                <button
                  aria-selected={selected}
                  className="ig-dm-user-option"
                  key={u.id}
                  onClick={() => setSelectedUserId(selected ? null : u.id)}
                  role="option"
                  type="button"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <Avatar avatarUrl={u.avatarUrl} size={44} username={u.username} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{u.username}</div>
                      {u.fullName && (
                        <div style={{ fontSize: 14, color: "rgb(var(--ig-secondary-text))" }}>
                          {u.fullName}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`ig-dm-radio-circle ${selected ? "is-selected" : ""}`}>
                    {selected ? "✓" : ""}
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div style={{ padding: "16px 24px 20px" }}>
          <button
            className="ig-dm-chat-submit"
            disabled={!selectedUserId || submitting}
            onClick={handleStartChat}
            type="button"
          >
            {submitting ? "Opening chat..." : "Chat"}
          </button>
        </div>
      </div>
    </div>
  );
}
