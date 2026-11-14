"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { NotificationDTO } from "@/lib/phase2-queries";
import { formatRelativeTime } from "@/lib/time";
import { Avatar } from "./Avatar";
import { CloseIcon, HeartOutlineIcon } from "./icons/InstagramIcons";

interface NotificationsPanelProps {
  isDrawer?: boolean;
  onClose?: () => void;
  onMarkedRead?: () => void;
}

type FilterKey = "all" | "comments" | "likes" | "follows";

export function NotificationsPanel({
  isDrawer = false,
  onClose,
  onMarkedRead,
}: NotificationsPanelProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [items, setItems] = useState<NotificationDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/notifications?filter=${filter}`)
      .then((res) => (res.ok ? res.json() : { notifications: [] }))
      .then((data) => {
        if (!cancelled) {
          setItems(data.notifications || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    fetch("/api/notifications/read", { method: "POST" })
      .then(() => {
        onMarkedRead?.();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [filter]);

  async function handleToggleFollow(actorId: string, actorUsername: string) {
    const res = await fetch(`/api/users/${encodeURIComponent(actorUsername)}/follow`, {
      method: "POST",
    });
    if (!res.ok) return;
    const data = await res.json();
    setItems((prev) =>
      prev.map((n) =>
        n.actor.id === actorId
          ? { ...n, actor: { ...n.actor, isFollowing: data.isFollowing } }
          : n
      )
    );
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const today = items.filter((n) => now - n.createdAt < dayMs);
  const thisWeek = items.filter(
    (n) => now - n.createdAt >= dayMs && now - n.createdAt < 7 * dayMs
  );
  const earlier = items.filter((n) => now - n.createdAt >= 7 * dayMs);

  const sections: Array<{ title: string; list: NotificationDTO[] }> = [
    { title: "Today", list: today },
    { title: "This week", list: thisWeek },
    { title: "Earlier", list: earlier },
  ].filter((s) => s.list.length > 0);

  const containerClass = isDrawer ? "ig-notifications-drawer" : "ig-notifications-page";

  return (
    <div className={containerClass} role={isDrawer ? "dialog" : undefined}>
      <div className="ig-notif-header">
        <h2 className="ig-notif-title">Notifications</h2>
        {isDrawer && onClose && (
          <button aria-label="Close" onClick={onClose} type="button">
            <CloseIcon size={16} />
          </button>
        )}
      </div>

      <div className="ig-notif-filters">
        {(
          [
            { key: "all", label: "All" },
            { key: "comments", label: "Comments" },
            { key: "likes", label: "Likes" },
            { key: "follows", label: "Follows" },
          ] as const
        ).map((tab) => (
          <button
            className={`ig-notif-filter-pill ${filter === tab.key ? "is-active" : ""}`}
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: 24, textAlign: "center", color: "rgb(var(--ig-secondary-text))" }}>
          Loading...
        </div>
      ) : sections.length === 0 ? (
        <div
          style={{
            padding: "48px 20px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <HeartOutlineIcon size={36} title="Activity" />
          <div style={{ fontWeight: 600 }}>Activity On Your Posts</div>
          <div style={{ color: "rgb(var(--ig-secondary-text))", maxWidth: 280 }}>
            When someone likes or comments on one of your posts or follows you, you&apos;ll see it here.
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sections.map((section) => (
            <div key={section.title}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  lineHeight: "20px",
                  padding: "0 12px 8px",
                }}
              >
                {section.title}
              </div>

              {section.list.map((n) => (
                <div className="ig-notif-row" key={n.id}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      minWidth: 0,
                      flex: 1,
                    }}
                  >
                    <Link href={`/${n.actor.username}/`} onClick={onClose}>
                      <Avatar
                        avatarUrl={n.actor.avatarUrl}
                        size={44}
                        username={n.actor.username}
                      />
                    </Link>

                    <div style={{ minWidth: 0, fontSize: 14, lineHeight: "18px" }}>
                      <Link
                        href={`/${n.actor.username}/`}
                        onClick={onClose}
                        style={{ fontWeight: 600, marginRight: 5 }}
                      >
                        {n.actor.username}
                      </Link>
                      <span>
                        {n.type === "like"
                          ? "liked your photo."
                          : n.type === "follow"
                            ? "started following you."
                            : `commented: ${n.commentText}`}
                      </span>{" "}
                      <span style={{ color: "rgb(var(--ig-secondary-text))" }}>
                        {formatRelativeTime(n.createdAt)}
                      </span>
                    </div>
                  </div>

                  {n.type === "follow" ? (
                    <button
                      className={n.actor.isFollowing ? "ig-btn-secondary" : "ig-btn-primary"}
                      onClick={() =>
                        handleToggleFollow(n.actor.id, n.actor.username)
                      }
                      type="button"
                    >
                      {n.actor.isFollowing ? "Following" : "Follow"}
                    </button>
                  ) : n.post?.coverUrl ? (
                    <Link href={`/p/${n.post.id}/`} onClick={onClose}>
                      <img
                        alt="Post thumbnail"
                        className="ig-notif-thumb"
                        src={n.post.coverUrl}
                      />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
