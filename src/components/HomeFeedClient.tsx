"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AuthUser } from "@/lib/auth";
import { StoryGroupDTO } from "@/lib/phase2-queries";
import { CommentDTO, PostDTO, UserSummary } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { CreatePostModal } from "./CreatePostModal";
import { CreatePostIcon } from "./icons/InstagramIcons";
import { PostCard } from "./PostCard";
import { PostDetailView } from "./PostDetailView";
import { StoriesBar } from "./StoriesBar";

interface HomeFeedClientProps {
  currentUser: AuthUser;
  initialPosts: PostDTO[];
  initialSuggested: UserSummary[];
  initialStories: StoryGroupDTO[];
}

export function HomeFeedClient({
  currentUser,
  initialPosts,
  initialSuggested,
  initialStories,
}: HomeFeedClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<PostDTO[]>(initialPosts);
  const [suggested, setSuggested] = useState<UserSummary[]>(initialSuggested);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<{
    post: PostDTO;
    comments: CommentDTO[];
  } | null>(null);

  useEffect(() => {
    function onPostCreated(e: Event) {
      const custom = e as CustomEvent<PostDTO>;
      if (custom.detail) {
        setPosts((prev) => {
          if (prev.some((p) => p.id === custom.detail.id)) return prev;
          return [custom.detail, ...prev];
        });
      }
    }
    window.addEventListener("ig:post-created", onPostCreated);
    return () => window.removeEventListener("ig:post-created", onPostCreated);
  }, []);

  async function handleOpenDetail(postId: string) {
    const res = await fetch(`/api/posts/${postId}`);
    if (!res.ok) return;
    const data = await res.json();
    setActiveDetail(data);
  }

  async function handleFollowSuggested(target: UserSummary) {
    const res = await fetch(`/api/users/${encodeURIComponent(target.username)}/follow`, {
      method: "POST",
    });
    if (!res.ok) return;
    const data = await res.json();
    setSuggested((prev) =>
      prev.map((u) =>
        u.id === target.id ? { ...u, isFollowing: data.isFollowing } : u
      )
    );
    // Refresh feed when following a new user so their posts appear immediately
    const feedRes = await fetch("/api/feed");
    if (feedRes.ok) {
      const feedData = await feedRes.json();
      setPosts(feedData.posts || []);
    }
  }

  async function handleSwitchAccount() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/accounts/login/");
    router.refresh();
  }

  return (
    <div className="ig-feed-layout">
      <div className="ig-feed-column">
        <StoriesBar currentUser={currentUser} initialGroups={initialStories} />

        {posts.length === 0 ? (
          <div className="ig-empty-card">
            <CreatePostIcon size={40} />
            <h2 className="ig-empty-title">Welcome to Instagram</h2>
            <p className="ig-empty-subtitle">
              Your feed only shows real posts from you and people you follow. Share
              your first photo or follow other accounts to get started.
            </p>
            <button
              className="ig-btn-primary"
              onClick={() => setCreateOpen(true)}
              type="button"
            >
              Create first post
            </button>
          </div>
        ) : (
          <div className="ig-post-stream">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                onDelete={(deletedId) =>
                  setPosts((prev) => prev.filter((p) => p.id !== deletedId))
                }
                onOpenDetail={handleOpenDetail}
                onUpdate={(updated) =>
                  setPosts((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p))
                  )
                }
                post={post}
                viewerId={currentUser.id}
              />
            ))}
          </div>
        )}
      </div>

      <aside className="ig-right-sidebar">
        <div className="ig-sidebar-user-row">
          <Link className="ig-sidebar-user-left" href={`/${currentUser.username}/`}>
            <Avatar
              avatarUrl={currentUser.avatarUrl}
              size={44}
              username={currentUser.username}
            />
            <div style={{ minWidth: 0 }}>
              <div className="ig-sidebar-username">{currentUser.username}</div>
              {currentUser.fullName && (
                <div className="ig-sidebar-fullname">{currentUser.fullName}</div>
              )}
            </div>
          </Link>
          <button
            className="ig-sidebar-action-link"
            onClick={handleSwitchAccount}
            type="button"
          >
            Switch
          </button>
        </div>

        <div className="ig-sidebar-section-header">
          <span className="ig-sidebar-section-title">Suggested for you</span>
        </div>

        {suggested.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "rgb(var(--ig-secondary-text))",
              padding: "0 4px",
              margin: 0,
            }}
          >
            No other accounts yet. Create another account to follow and interact
            across profiles.
          </p>
        ) : (
          <div className="ig-sidebar-list">
            {suggested.map((u) => (
              <div className="ig-sidebar-user-row" key={u.id}>
                <Link className="ig-sidebar-user-left" href={`/${u.username}/`}>
                  <Avatar
                    avatarUrl={u.avatarUrl}
                    size={44}
                    username={u.username}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div className="ig-sidebar-username">{u.username}</div>
                    <div className="ig-sidebar-fullname">
                      {u.fullName || "Suggested for you"}
                    </div>
                  </div>
                </Link>
                <button
                  className="ig-sidebar-action-link"
                  onClick={() => handleFollowSuggested(u)}
                  style={{
                    color: u.isFollowing
                      ? "rgb(var(--ig-secondary-text))"
                      : "rgb(var(--ig-colors-button-primary-link-text))",
                  }}
                  type="button"
                >
                  {u.isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            ))}
          </div>
        )}

        <footer className="ig-sidebar-footer">
          <div>About · Help · Privacy · Terms</div>
          <div style={{ marginTop: 12 }}>© {new Date().getFullYear()} INSTAGRAM CLONE</div>
        </footer>
      </aside>

      {createOpen && (
        <CreatePostModal
          currentUser={currentUser}
          onClose={() => setCreateOpen(false)}
          onCreated={(newPost) => {
            setCreateOpen(false);
            setPosts((prev) => [newPost, ...prev]);
          }}
        />
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
              prev.map((p) => (p.id === updated.id ? updated : p))
            )
          }
          viewerId={currentUser.id}
        />
      )}
    </div>
  );
}
