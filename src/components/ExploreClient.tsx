"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { SearchUserResultDTO } from "@/lib/phase2-queries";
import { CommentDTO, PostDTO, ProfileGridPostDTO } from "@/lib/queries";
import { formatCount } from "@/lib/time";
import { Avatar } from "./Avatar";
import {
  BackArrowIcon,
  CarouselIndicatorIcon,
  CloseIcon,
  CommentIcon,
  HeartFilledIcon,
  SearchIcon,
} from "./icons/InstagramIcons";
import { PostDetailView } from "./PostDetailView";

interface ExploreClientProps {
  initialPosts: ProfileGridPostDTO[];
  viewerId: string;
}

export function ExploreClient({ initialPosts, viewerId }: ExploreClientProps) {
  const [posts, setPosts] = useState<ProfileGridPostDTO[]>(initialPosts);
  const [query, setQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matchedUsers, setMatchedUsers] = useState<SearchUserResultDTO[]>([]);
  const [matchedPosts, setMatchedPosts] = useState<ProfileGridPostDTO[]>([]);
  const [activeDetail, setActiveDetail] = useState<{
    post: PostDTO;
    comments: CommentDTO[];
  } | null>(null);

  const isSearchMode = query.trim().length > 0;

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setMatchedUsers([]);
      setMatchedPosts([]);
      setSearching(false);
      return;
    }

    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (!cancelled) {
          setMatchedUsers(data.users || []);
          setMatchedPosts(data.posts || []);
          setSearching(false);
        }
      } catch {
        if (!cancelled) setSearching(false);
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  async function handleOpenPost(postId: string) {
    const res = await fetch(`/api/posts/${postId}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveDetail(data);
  }

  async function handleToggleFollowUser(user: SearchUserResultDTO) {
    const res = await fetch(`/api/users/${encodeURIComponent(user.username)}/follow`, {
      method: "POST",
    });
    if (!res.ok) return;
    const data = await res.json();
    setMatchedUsers((prev) =>
      prev.map((u) =>
        u.id === user.id
          ? {
              ...u,
              isFollowing: data.isFollowing,
              followersCount: data.followersCount,
            }
          : u
      )
    );
  }

  return (
    <div className="ig-explore-container">
      <div className="ig-explore-search-wrap">
        <span
          style={{
            position: "absolute",
            left: 16,
            top: "50%",
            transform: "translateY(-50%)",
            color: "rgb(var(--ig-secondary-icon))",
            display: "flex",
          }}
        >
          {searchFocused || isSearchMode ? (
            <button
              aria-label="Back"
              onClick={() => {
                setQuery("");
                setSearchFocused(false);
              }}
              type="button"
            >
              <BackArrowIcon size={18} />
            </button>
          ) : (
            <SearchIcon size={16} />
          )}
        </span>

        <input
          aria-label="Search"
          className="ig-explore-search-input"
          id="explore-search-input"
          name="search"
          onBlur={() => setSearchFocused(false)}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          placeholder="Search"
          type="text"
          value={query}
        />

        {isSearchMode && (
          <button
            aria-label="Clear the search box"
            onClick={() => setQuery("")}
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: "rgb(var(--ig-secondary-icon))",
              color: "rgb(var(--ig-primary-background))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            type="button"
          >
            <CloseIcon size={11} strokeWidth={3} />
          </button>
        )}
      </div>

      {isSearchMode ? (
        <div className="ig-search-results">
          {searching ? (
            <div style={{ padding: 24, textAlign: "center", color: "rgb(var(--ig-secondary-text))" }}>
              Searching...
            </div>
          ) : matchedUsers.length === 0 && matchedPosts.length === 0 ? (
            <div style={{ padding: 36, textAlign: "center", color: "rgb(var(--ig-secondary-text))" }}>
              No results found for &ldquo;{query.trim()}&rdquo;.
            </div>
          ) : (
            <>
              {matchedUsers.map((u) => (
                <div className="ig-search-user-row" key={u.id}>
                  <Link
                    href={`/${u.username}/`}
                    style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}
                  >
                    <Avatar avatarUrl={u.avatarUrl} size={44} username={u.username} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{u.username}</div>
                      <div style={{ color: "rgb(var(--ig-secondary-text))" }}>
                        {u.fullName ? `${u.fullName} · ` : ""}
                        {u.followersCount} {u.followersCount === 1 ? "follower" : "followers"}
                      </div>
                    </div>
                  </Link>
                  {u.id !== viewerId && (
                    <button
                      className={u.isFollowing ? "ig-btn-secondary" : "ig-btn-primary"}
                      onClick={() => handleToggleFollowUser(u)}
                      type="button"
                    >
                      {u.isFollowing ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              ))}

              {matchedPosts.length > 0 && (
                <div style={{ width: "100%", marginTop: 20 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "rgb(var(--ig-secondary-text))",
                      marginBottom: 10,
                      padding: "0 12px",
                    }}
                  >
                    Matching posts
                  </div>
                  <div className="ig-profile-grid">
                    {matchedPosts.map((tile) => (
                      <button
                        className="ig-profile-tile"
                        key={tile.id}
                        onClick={() => handleOpenPost(tile.id)}
                        type="button"
                      >
                        <img alt="Explore post" src={tile.coverUrl} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : posts.length === 0 ? (
        <div className="ig-empty-card">
          <SearchIcon size={36} />
          <h2 className="ig-empty-title">Explore is empty</h2>
          <p className="ig-empty-subtitle">
            Real photos posted by accounts will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="ig-profile-grid" style={{ width: "100%" }}>
          {posts.map((tile) => (
            <button
              className="ig-profile-tile"
              key={tile.id}
              onClick={() => handleOpenPost(tile.id)}
              type="button"
            >
              <img alt="Explore media" src={tile.coverUrl} />
              {tile.mediaCount > 1 && (
                <span className="ig-profile-tile-carousel">
                  <CarouselIndicatorIcon size={18} />
                </span>
              )}
              <div className="ig-profile-tile-hover">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <HeartFilledIcon size={18} />
                  {formatCount(tile.likesCount)}
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <CommentIcon size={18} />
                  {formatCount(tile.commentsCount)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {activeDetail && (
        <PostDetailView
          initialComments={activeDetail.comments}
          initialPost={activeDetail.post}
          isModal
          onClose={() => setActiveDetail(null)}
          onPostDeleted={(deletedId) =>
            setPosts((prev) => prev.filter((p) => p.id !== deletedId))
          }
          onPostMutated={(updated) =>
            setPosts((prev) =>
              prev.map((t) =>
                t.id === updated.id
                  ? {
                      ...t,
                      likesCount: updated.likesCount,
                      commentsCount: updated.commentsCount,
                    }
                  : t
              )
            )
          }
          viewerId={viewerId}
        />
      )}
    </div>
  );
}
