"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  CommentDTO,
  PostDTO,
  ProfileGridPostDTO,
  ProfileSummary,
} from "@/lib/queries";
import { formatCount } from "@/lib/time";
import { Avatar } from "./Avatar";
import { FollowModal } from "./FollowModal";
import {
  BookmarkOutlineIcon,
  CarouselIndicatorIcon,
  CommentIcon,
  HeartFilledIcon,
  PostsGridTabIcon,
  TaggedTabIcon,
} from "./icons/InstagramIcons";
import { PostDetailView } from "./PostDetailView";

interface ProfileClientProps {
  initialProfile: ProfileSummary;
  initialPosts: ProfileGridPostDTO[];
  initialSavedPosts: ProfileGridPostDTO[];
  initialTab?: "posts" | "saved" | "tagged";
  viewerId: string | null;
}

export function ProfileClient({
  initialProfile,
  initialPosts,
  initialSavedPosts,
  initialTab = "posts",
  viewerId,
}: ProfileClientProps) {
  const [profile, setProfile] = useState<ProfileSummary>(initialProfile);
  const [posts, setPosts] = useState<ProfileGridPostDTO[]>(initialPosts);
  const [savedPosts, setSavedPosts] = useState<ProfileGridPostDTO[]>(initialSavedPosts);
  const [activeTab, setActiveTab] = useState<"posts" | "saved" | "tagged">(
    initialTab === "saved" && initialProfile.isOwnProfile ? "saved" : "posts"
  );
  const [followModalMode, setFollowModalMode] = useState<
    "followers" | "following" | null
  >(null);
  const [activeDetail, setActiveDetail] = useState<{
    post: PostDTO;
    comments: CommentDTO[];
  } | null>(null);

  useEffect(() => {
    function onPostCreated(e: Event) {
      const custom = e as CustomEvent<PostDTO>;
      const created = custom.detail;
      if (created && created.author.id === profile.id && created.media[0]) {
        const gridItem: ProfileGridPostDTO = {
          id: created.id,
          coverUrl: created.media[0].url,
          mediaCount: created.media.length,
          likesCount: created.likesCount,
          commentsCount: created.commentsCount,
          createdAt: created.createdAt,
        };
        setPosts((prev) =>
          prev.some((p) => p.id === gridItem.id) ? prev : [gridItem, ...prev]
        );
        setProfile((prev) => ({ ...prev, postsCount: prev.postsCount + 1 }));
      }
    }
    window.addEventListener("ig:post-created", onPostCreated);
    return () => window.removeEventListener("ig:post-created", onPostCreated);
  }, [profile.id]);

  async function handleToggleFollow() {
    if (!viewerId) return;
    const res = await fetch(
      `/api/users/${encodeURIComponent(profile.username)}/follow`,
      { method: "POST" }
    );
    if (!res.ok) return;
    const data = await res.json();
    setProfile((prev) => ({
      ...prev,
      isFollowing: data.isFollowing,
      followersCount: data.followersCount,
    }));
  }

  async function handleOpenPost(postId: string) {
    const res = await fetch(`/api/posts/${postId}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveDetail(data);
  }

  const displayedGrid =
    activeTab === "posts" ? posts : activeTab === "saved" ? savedPosts : [];

  return (
    <div className="ig-profile-container">
      <header className="ig-profile-header">
        <div className="ig-profile-top-row">
          <Avatar
            avatarUrl={profile.avatarUrl}
            className="ig-profile-avatar-lg"
            size={150}
            username={profile.username}
          />

          <div className="ig-profile-meta">
            <div className="ig-profile-username-row">
              <h2 className="ig-profile-username">{profile.username}</h2>
            </div>

            <div className="ig-profile-stats">
              <span>
                <span className="ig-profile-stat-num">{profile.postsCount}</span>{" "}
                {profile.postsCount === 1 ? "post" : "posts"}
              </span>
              <button
                onClick={() => setFollowModalMode("followers")}
                type="button"
              >
                <span className="ig-profile-stat-num">
                  {profile.followersCount}
                </span>{" "}
                {profile.followersCount === 1 ? "follower" : "followers"}
              </button>
              <button
                onClick={() => setFollowModalMode("following")}
                type="button"
              >
                <span className="ig-profile-stat-num">
                  {profile.followingCount}
                </span>{" "}
                following
              </button>
            </div>

            {profile.fullName && (
              <div style={{ fontWeight: 600 }}>{profile.fullName}</div>
            )}
            {profile.bio && (
              <div style={{ whiteSpace: "pre-wrap" }}>{profile.bio}</div>
            )}
          </div>
        </div>

        <div className="ig-profile-actions-row">
          {profile.isOwnProfile ? (
            <>
              <Link className="ig-profile-btn" href="/accounts/edit/">
                Edit profile
              </Link>
              <button
                className="ig-profile-btn"
                onClick={() => setActiveTab("saved")}
                type="button"
              >
                Saved posts
              </button>
            </>
          ) : viewerId ? (
            <>
              <button
                className={`ig-profile-btn ${profile.isFollowing ? "" : "is-primary"}`}
                onClick={handleToggleFollow}
                type="button"
              >
                {profile.isFollowing ? "Following" : "Follow"}
              </button>
              <Link className="ig-profile-btn" href="/direct/inbox/">
                Message
              </Link>
            </>
          ) : (
            <Link className="ig-profile-btn is-primary" href="/accounts/login/">
              Log in to follow
            </Link>
          )}
        </div>
      </header>

      <div className="ig-profile-tabs" role="tablist">
        <button
          aria-label="Posts"
          aria-selected={activeTab === "posts"}
          className={`ig-profile-tab ${activeTab === "posts" ? "is-active" : ""}`}
          onClick={() => setActiveTab("posts")}
          role="tab"
          type="button"
        >
          <PostsGridTabIcon size={24} />
        </button>

        {profile.isOwnProfile && (
          <button
            aria-label="Saved"
            aria-selected={activeTab === "saved"}
            className={`ig-profile-tab ${activeTab === "saved" ? "is-active" : ""}`}
            onClick={() => setActiveTab("saved")}
            role="tab"
            type="button"
          >
            <BookmarkOutlineIcon size={24} />
          </button>
        )}

        <button
          aria-label="Tagged"
          aria-selected={activeTab === "tagged"}
          className={`ig-profile-tab ${activeTab === "tagged" ? "is-active" : ""}`}
          onClick={() => setActiveTab("tagged")}
          role="tab"
          type="button"
        >
          <TaggedTabIcon size={24} />
        </button>
      </div>

      {displayedGrid.length === 0 ? (
        <div style={{ padding: "64px 20px", textAlign: "center" }}>
          <h3 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 8px" }}>
            {activeTab === "saved"
              ? "No saved posts yet"
              : activeTab === "tagged"
                ? "No tagged photos"
                : "No posts yet"}
          </h3>
          <p style={{ color: "rgb(var(--ig-secondary-text))", margin: 0 }}>
            {activeTab === "saved"
              ? "Save photos from your feed to view them privately here."
              : activeTab === "tagged"
                ? "Photos people tag this account in will appear here."
                : "When photos are shared, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="ig-profile-grid">
          {displayedGrid.map((tile) => (
            <button
              className="ig-profile-tile"
              key={tile.id}
              onClick={() => handleOpenPost(tile.id)}
              type="button"
            >
              <img alt="Post thumbnail" src={tile.coverUrl} />
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

      {followModalMode && (
        <FollowModal
          isOwnProfile={profile.isOwnProfile}
          mode={followModalMode}
          onClose={() => setFollowModalMode(null)}
          onCountsChanged={(dFollowers = 0, dFollowing = 0) => {
            setProfile((prev) => ({
              ...prev,
              followersCount: Math.max(0, prev.followersCount + dFollowers),
              followingCount: Math.max(0, prev.followingCount + dFollowing),
            }));
          }}
          username={profile.username}
          viewerId={viewerId}
        />
      )}

      {activeDetail && (
        <PostDetailView
          initialComments={activeDetail.comments}
          initialPost={activeDetail.post}
          isModal
          onClose={() => setActiveDetail(null)}
          onPostDeleted={(deletedId) => {
            setPosts((prev) => prev.filter((p) => p.id !== deletedId));
            setSavedPosts((prev) => prev.filter((p) => p.id !== deletedId));
            setProfile((prev) => ({
              ...prev,
              postsCount: Math.max(0, prev.postsCount - 1),
            }));
          }}
          onPostMutated={(updated) => {
            const patch = (list: ProfileGridPostDTO[]) =>
              list.map((t) =>
                t.id === updated.id
                  ? {
                      ...t,
                      likesCount: updated.likesCount,
                      commentsCount: updated.commentsCount,
                    }
                  : t
              );
            setPosts(patch);
            if (!updated.isSaved) {
              setSavedPosts((prev) => prev.filter((p) => p.id !== updated.id));
            } else {
              setSavedPosts(patch);
            }
          }}
          viewerId={viewerId}
        />
      )}
    </div>
  );
}
