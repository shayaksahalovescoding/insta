"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { AuthUser } from "@/lib/auth";
import { PostDTO } from "@/lib/queries";
import { Avatar } from "./Avatar";
import { CreatePostModal } from "./CreatePostModal";
import {
  BookmarkOutlineIcon,
  CreatePostIcon,
  HamburgerMenuIcon,
  HeartOutlineIcon,
  HomeIcon,
  InstagramGlyphIcon,
  InstagramWordmark,
  MessagesIcon,
  ReelsIcon,
  SearchIcon,
  SettingsGearIcon,
  ThemeMoonIcon,
} from "./icons/InstagramIcons";

interface AppShellProps {
  currentUser: AuthUser | null;
  children: React.ReactNode;
}

export function AppShell({ currentUser, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(
    currentUser?.themePreference ?? "dark"
  );

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("__fb-dark-mode", "__fb-light-mode");
    html.classList.add(theme === "light" ? "__fb-light-mode" : "__fb-dark-mode");
  }, [theme]);

  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  async function handleToggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    setMoreOpen(false);
    if (currentUser) {
      await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themePreference: nextTheme }),
      }).catch(() => {});
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMoreOpen(false);
    router.push("/accounts/login/");
    router.refresh();
  }

  function handlePostCreated(post: PostDTO) {
    setCreateOpen(false);
    window.dispatchEvent(new CustomEvent("ig:post-created", { detail: post }));
    router.refresh();
  }

  if (!currentUser) {
    return <>{children}</>;
  }

  const profileHref = `/${currentUser.username}/`;

  return (
    <div className="ig-shell">
      {/* Mobile Top Header */}
      <header className="ig-mobile-header">
        <Link href="/">
          <InstagramWordmark height={26} width={103} />
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            aria-label="Switch appearance"
            onClick={handleToggleTheme}
            type="button"
          >
            <ThemeMoonIcon size={22} />
          </button>
          <Link aria-label="Notifications" href="/notifications/">
            <HeartOutlineIcon size={24} title="Notifications" />
          </Link>
        </div>
      </header>

      {/* Desktop Left Rail */}
      <div className="ig-rail-wrapper">
        <aside className="ig-rail">
          <div className="ig-rail-top">
            <Link className="ig-rail-logo" href="/">
              <span className="ig-rail-icon">
                <InstagramGlyphIcon size={24} />
              </span>
            </Link>

            <nav className="ig-rail-nav" aria-label="Primary navigation">
              <Link
                className={`ig-rail-item ${pathname === "/" ? "is-active" : ""}`}
                href="/"
              >
                <span className="ig-rail-icon">
                  <HomeIcon active={pathname === "/"} size={24} />
                </span>
                <span className="ig-rail-label">Home</span>
              </Link>

              <Link
                className={`ig-rail-item ${pathname.startsWith("/reels") ? "is-active" : ""}`}
                href="/reels/"
              >
                <span className="ig-rail-icon">
                  <ReelsIcon size={24} />
                </span>
                <span className="ig-rail-label">Reels</span>
              </Link>

              <Link
                className={`ig-rail-item ${pathname.startsWith("/direct") ? "is-active" : ""}`}
                href="/direct/inbox/"
              >
                <span className="ig-rail-icon">
                  <MessagesIcon size={24} />
                </span>
                <span className="ig-rail-label">Messages</span>
              </Link>

              <Link
                className={`ig-rail-item ${pathname.startsWith("/explore") ? "is-active" : ""}`}
                href="/explore/"
              >
                <span className="ig-rail-icon">
                  <SearchIcon size={24} />
                </span>
                <span className="ig-rail-label">Search</span>
              </Link>

              <Link
                className={`ig-rail-item ${pathname.startsWith("/notifications") ? "is-active" : ""}`}
                href="/notifications/"
              >
                <span className="ig-rail-icon">
                  <HeartOutlineIcon size={24} title="Notifications" />
                </span>
                <span className="ig-rail-label">Notifications</span>
              </Link>

              <button
                className="ig-rail-item"
                onClick={() => setCreateOpen(true)}
                type="button"
              >
                <span className="ig-rail-icon">
                  <CreatePostIcon size={24} />
                </span>
                <span className="ig-rail-label">Create</span>
              </button>

              <Link
                className={`ig-rail-item ${pathname === profileHref || pathname === `/${currentUser.username}` ? "is-active" : ""}`}
                href={profileHref}
              >
                <span
                  className={`ig-rail-icon ${pathname.startsWith(profileHref) ? "ig-rail-avatar-ring" : ""}`}
                >
                  <Avatar
                    avatarUrl={currentUser.avatarUrl}
                    className="ig-rail-avatar"
                    size={24}
                    username={currentUser.username}
                  />
                </span>
                <span className="ig-rail-label">Profile</span>
              </Link>
            </nav>
          </div>

          <div>
            <button
              className="ig-rail-item"
              onClick={() => setMoreOpen((o) => !o)}
              type="button"
            >
              <span className="ig-rail-icon">
                <HamburgerMenuIcon size={24} />
              </span>
              <span className="ig-rail-label">More</span>
            </button>
          </div>
        </aside>

        {moreOpen && (
          <>
            <div
              onClick={() => setMoreOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 55 }}
            />
            <div className="ig-more-popover" role="menu">
              <Link className="ig-more-item" href="/accounts/edit/" role="menuitem">
                <SettingsGearIcon size={18} />
                <span>Settings</span>
              </Link>
              <Link
                className="ig-more-item"
                href={`/${currentUser.username}/?tab=saved`}
                role="menuitem"
              >
                <BookmarkOutlineIcon size={18} />
                <span>Saved</span>
              </Link>
              <button
                className="ig-more-item"
                onClick={handleToggleTheme}
                role="menuitem"
                type="button"
              >
                <ThemeMoonIcon size={18} />
                <span>
                  Switch appearance ({theme === "dark" ? "Light" : "Dark"})
                </span>
              </button>
              <div className="ig-more-separator" />
              <button
                className="ig-more-item"
                onClick={handleLogout}
                role="menuitem"
                type="button"
              >
                <span>Log out</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <main className="ig-main">{children}</main>

      {/* Mobile Bottom Tab Bar */}
      <nav aria-label="Mobile navigation" className="ig-mobile-bottom-nav">
        <Link className="ig-mobile-tab" href="/">
          <HomeIcon active={pathname === "/"} size={24} />
        </Link>
        <Link className="ig-mobile-tab" href="/explore/">
          <SearchIcon size={24} />
        </Link>
        <Link className="ig-mobile-tab" href="/reels/">
          <ReelsIcon size={24} />
        </Link>
        <button
          aria-label="New post"
          className="ig-mobile-tab"
          onClick={() => setCreateOpen(true)}
          type="button"
        >
          <CreatePostIcon size={24} />
        </button>
        <Link className="ig-mobile-tab" href="/direct/inbox/">
          <MessagesIcon size={24} />
        </Link>
        <Link className="ig-mobile-tab" href={profileHref}>
          <Avatar
            avatarUrl={currentUser.avatarUrl}
            className="ig-rail-avatar"
            size={24}
            username={currentUser.username}
          />
        </Link>
      </nav>

      {createOpen && (
        <CreatePostModal
          currentUser={currentUser}
          onClose={() => setCreateOpen(false)}
          onCreated={handlePostCreated}
        />
      )}
    </div>
  );
}
