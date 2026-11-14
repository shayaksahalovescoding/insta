"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { UserSummary } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { CloseIcon, SearchIcon } from "./icons/InstagramIcons";

interface FollowModalProps {
  username: string;
  mode: "followers" | "following";
  isOwnProfile: boolean;
  viewerId: string | null;
  onClose: () => void;
  onCountsChanged: (deltaFollowers?: number, deltaFollowing?: number) => void;
}

export function FollowModal({
  username,
  mode,
  isOwnProfile,
  viewerId,
  onClose,
  onCountsChanged,
}: FollowModalProps) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/users/${encodeURIComponent(username)}/${mode}`)
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        if (!cancelled) {
          setUsers(data.users || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username, mode]);

  async function handleToggleFollow(target: UserSummary) {
    if (!viewerId) return;
    const res = await fetch(`/api/users/${encodeURIComponent(target.username)}/follow`, {
      method: "POST",
    });
    if (!res.ok) return;
    const data = await res.json();
    setUsers((prev) =>
      prev.map((u) =>
        u.id === target.id ? { ...u, isFollowing: data.isFollowing } : u
      )
    );
    if (isOwnProfile && mode === "following") {
      onCountsChanged(0, data.isFollowing ? 1 : -1);
    }
  }

  async function handleRemoveFollower(target: UserSummary) {
    const res = await fetch(`/api/users/me/followers/${target.id}`, {
      method: "DELETE",
    });
    if (!res.ok) return;
    setUsers((prev) => prev.filter((u) => u.id !== target.id));
    onCountsChanged(-1, 0);
  }

  const filtered = users.filter((u) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q)
    );
  });

  return (
    <div
      className="ig-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div aria-modal="true" className="ig-follow-modal" role="dialog">
        <div className="ig-follow-modal-header">
          <span style={{ width: 24 }} />
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
            {mode === "followers" ? "Followers" : "Following"}
          </h2>
          <button aria-label="Close" onClick={onClose} type="button">
            <CloseIcon size={24} />
          </button>
        </div>

        <div className="ig-follow-search-wrap">
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgb(var(--ig-secondary-icon))",
                display: "flex",
              }}
            >
              <SearchIcon size={16} />
            </span>
            <input
              className="ig-follow-search"
              id="follow-modal-search"
              name="search"
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              type="text"
              value={query}
            />
          </div>
        </div>

        <div className="ig-follow-list">
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "rgb(var(--ig-secondary-text))" }}>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "rgb(var(--ig-secondary-text))" }}>
              {mode === "followers" ? "No followers yet." : "Not following anyone yet."}
            </div>
          ) : (
            filtered.map((u) => (
              <div className="ig-follow-row" key={u.id}>
                <Link
                  href={`/${u.username}/`}
                  onClick={onClose}
                  style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}
                >
                  <Avatar avatarUrl={u.avatarUrl} size={44} username={u.username} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "rgb(var(--ig-primary-text))",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {u.username}
                    </div>
                    {u.fullName && (
                      <div
                        style={{
                          color: "rgb(var(--ig-secondary-text))",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {u.fullName}
                      </div>
                    )}
                  </div>
                </Link>

                {isOwnProfile && mode === "followers" ? (
                  <button
                    className="ig-btn-secondary"
                    onClick={() => handleRemoveFollower(u)}
                    type="button"
                  >
                    Remove
                  </button>
                ) : viewerId && viewerId !== u.id ? (
                  <button
                    className={u.isFollowing ? "ig-btn-secondary" : "ig-btn-primary"}
                    onClick={() => handleToggleFollow(u)}
                    type="button"
                  >
                    {u.isFollowing ? "Following" : "Follow"}
                  </button>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
