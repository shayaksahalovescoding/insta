import crypto from "node:crypto";
import { getDb } from "./db";
import { ProfileGridPostDTO } from "./queries";
import { deleteStoredMediaByRelativePath } from "./storage";

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

export interface StoryItemDTO {
  id: string;
  mediaUrl: string;
  mimeType: string;
  caption: string;
  createdAt: number;
  expiresAt: number;
  isViewed: boolean;
  isLiked: boolean;
  viewsCount: number;
}

export interface StoryGroupDTO {
  userId: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  hasUnseen: boolean;
  isOwn: boolean;
  stories: StoryItemDTO[];
}

export interface SearchUserResultDTO {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  followersCount: number;
  isFollowing: boolean;
}

export interface NotificationDTO {
  id: string;
  type: "like" | "comment" | "follow";
  createdAt: number;
  isRead: boolean;
  commentText: string;
  actor: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    isFollowing: boolean;
  };
  post: {
    id: string;
    coverUrl: string | null;
  } | null;
}

export function createStory(params: {
  id: string;
  userId: string;
  relativePath: string;
  mimeType: string;
  caption: string;
}): StoryItemDTO {
  const db = getDb();
  const now = Date.now();
  const expiresAt = now + STORY_TTL_MS;
  db.prepare(
    `INSERT INTO stories (id, user_id, media_path, mime_type, caption, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(params.id, params.userId, params.relativePath, params.mimeType, params.caption.trim(), now, expiresAt);

  return {
    id: params.id,
    mediaUrl: `/api/media/${params.relativePath}`,
    mimeType: params.mimeType,
    caption: params.caption.trim(),
    createdAt: now,
    expiresAt,
    isViewed: false,
    isLiked: false,
    viewsCount: 0,
  };
}

export function getStoryTrayGroups(viewerId: string, nowMs: number = Date.now()): StoryGroupDTO[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
        s.id,
        s.user_id,
        s.media_path,
        s.mime_type,
        s.caption,
        s.created_at,
        s.expires_at,
        u.username,
        u.full_name,
        u.avatar_url,
        CASE WHEN EXISTS (
          SELECT 1 FROM story_views sv WHERE sv.story_id = s.id AND sv.viewer_id = ?
        ) THEN 1 ELSE 0 END AS is_viewed,
        CASE WHEN EXISTS (
          SELECT 1 FROM story_likes sl WHERE sl.story_id = s.id AND sl.user_id = ?
        ) THEN 1 ELSE 0 END AS is_liked,
        (SELECT COUNT(*) FROM story_views sv2 WHERE sv2.story_id = s.id) AS views_count
      FROM stories s
      JOIN users u ON u.id = s.user_id
      WHERE s.expires_at > ?
        AND (
          s.user_id = ?
          OR EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_id = ? AND f.following_id = s.user_id
          )
        )
      ORDER BY s.created_at ASC`
    )
    .all(viewerId, viewerId, nowMs, viewerId, viewerId) as Array<{
      id: string;
      user_id: string;
      media_path: string;
      mime_type: string;
      caption: string;
      created_at: number;
      expires_at: number;
      username: string;
      full_name: string;
      avatar_url: string | null;
      is_viewed: number;
      is_liked: number;
      views_count: number;
    }>;

  const grouped = new Map<string, StoryGroupDTO>();
  for (const r of rows) {
    let group = grouped.get(r.user_id);
    if (!group) {
      group = {
        userId: r.user_id,
        username: r.username,
        fullName: r.full_name,
        avatarUrl: r.avatar_url,
        hasUnseen: false,
        isOwn: r.user_id === viewerId,
        stories: [],
      };
      grouped.set(r.user_id, group);
    }
    const isViewed = r.is_viewed === 1;
    if (!isViewed) group.hasUnseen = true;
    group.stories.push({
      id: r.id,
      mediaUrl: `/api/media/${r.media_path}`,
      mimeType: r.mime_type,
      caption: r.caption,
      createdAt: r.created_at,
      expiresAt: r.expires_at,
      isViewed,
      isLiked: r.is_liked === 1,
      viewsCount: Number(r.views_count),
    });
  }

  return Array.from(grouped.values()).sort((a, b) => {
    if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1;
    if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
    const latestA = a.stories[a.stories.length - 1]?.createdAt ?? 0;
    const latestB = b.stories[b.stories.length - 1]?.createdAt ?? 0;
    return latestB - latestA;
  });
}

export function markStoryViewed(storyId: string, viewerId: string): boolean {
  const db = getDb();
  const exists = db.prepare("SELECT 1 FROM stories WHERE id = ?").get(storyId);
  if (!exists) return false;
  db.prepare(
    `INSERT OR IGNORE INTO story_views (story_id, viewer_id, viewed_at)
     VALUES (?, ?, ?)`
  ).run(storyId, viewerId, Date.now());
  return true;
}

export function toggleStoryLike(storyId: string, userId: string): { isLiked: boolean } | null {
  const db = getDb();
  const exists = db.prepare("SELECT 1 FROM stories WHERE id = ?").get(storyId);
  if (!exists) return null;
  const liked = db
    .prepare("SELECT 1 FROM story_likes WHERE story_id = ? AND user_id = ?")
    .get(storyId, userId);
  if (liked) {
    db.prepare("DELETE FROM story_likes WHERE story_id = ? AND user_id = ?").run(storyId, userId);
  } else {
    db.prepare("INSERT INTO story_likes (story_id, user_id, created_at) VALUES (?, ?, ?)").run(
      storyId,
      userId,
      Date.now()
    );
  }
  return { isLiked: !liked };
}

export function deleteStory(storyId: string, actorUserId: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT id, user_id, media_path FROM stories WHERE id = ?")
    .get(storyId) as { id: string; user_id: string; media_path: string } | undefined;
  if (!row || row.user_id !== actorUserId) return false;
  db.prepare("DELETE FROM stories WHERE id = ?").run(storyId);
  deleteStoredMediaByRelativePath(row.media_path);
  return true;
}

export function getExploreGridPosts(limit = 36, offset = 0): ProfileGridPostDTO[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
        p.id,
        p.created_at,
        (SELECT pm.file_path FROM post_media pm WHERE pm.post_id = p.id ORDER BY pm.order_index ASC LIMIT 1) AS cover_path,
        (SELECT COUNT(*) FROM post_media pm WHERE pm.post_id = p.id) AS media_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count
      FROM posts p
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as Array<{
      id: string;
      created_at: number;
      cover_path: string | null;
      media_count: number;
      likes_count: number;
      comments_count: number;
    }>;

  return rows
    .filter((r) => Boolean(r.cover_path))
    .map((r) => ({
      id: r.id,
      coverUrl: `/api/media/${r.cover_path}`,
      mediaCount: Number(r.media_count),
      likesCount: Number(r.likes_count),
      commentsCount: Number(r.comments_count),
      createdAt: r.created_at,
    }));
}

export function searchUsersAndPosts(
  query: string,
  viewerId: string | null
): { users: SearchUserResultDTO[]; posts: ProfileGridPostDTO[] } {
  const trimmed = query.trim();
  if (!trimmed) return { users: [], posts: [] };

  const db = getDb();
  const likeTerm = `%${trimmed}%`;

  const userRows = db
    .prepare(
      `SELECT
        u.id,
        u.username,
        u.full_name,
        u.avatar_url,
        (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) AS followers_count,
        CASE WHEN ? IS NOT NULL AND EXISTS (
          SELECT 1 FROM follows f2 WHERE f2.follower_id = ? AND f2.following_id = u.id
        ) THEN 1 ELSE 0 END AS is_following
      FROM users u
      WHERE u.username LIKE ? OR u.full_name LIKE ?
      ORDER BY
        CASE WHEN LOWER(u.username) = LOWER(?) THEN 0
             WHEN LOWER(u.username) LIKE LOWER(?) THEN 1
             ELSE 2 END,
        followers_count DESC
      LIMIT 20`
    )
    .all(viewerId, viewerId, likeTerm, likeTerm, trimmed, `${trimmed}%`) as Array<{
      id: string;
      username: string;
      full_name: string;
      avatar_url: string | null;
      followers_count: number;
      is_following: number;
    }>;

  const postRows = db
    .prepare(
      `SELECT
        p.id,
        p.created_at,
        (SELECT pm.file_path FROM post_media pm WHERE pm.post_id = p.id ORDER BY pm.order_index ASC LIMIT 1) AS cover_path,
        (SELECT COUNT(*) FROM post_media pm WHERE pm.post_id = p.id) AS media_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count
      FROM posts p
      WHERE p.caption LIKE ? OR p.location LIKE ?
      ORDER BY p.created_at DESC
      LIMIT 24`
    )
    .all(likeTerm, likeTerm) as Array<{
      id: string;
      created_at: number;
      cover_path: string | null;
      media_count: number;
      likes_count: number;
      comments_count: number;
    }>;

  return {
    users: userRows.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.full_name,
      avatarUrl: u.avatar_url,
      followersCount: Number(u.followers_count),
      isFollowing: u.is_following === 1,
    })),
    posts: postRows
      .filter((r) => Boolean(r.cover_path))
      .map((r) => ({
        id: r.id,
        coverUrl: `/api/media/${r.cover_path}`,
        mediaCount: Number(r.media_count),
        likesCount: Number(r.likes_count),
        commentsCount: Number(r.comments_count),
        createdAt: r.created_at,
      })),
  };
}

export function listNotifications(
  recipientId: string,
  filter: "all" | "comments" | "likes" | "follows" = "all"
): NotificationDTO[] {
  const db = getDb();
  const typeClause =
    filter === "comments"
      ? "AND n.type = 'comment'"
      : filter === "likes"
        ? "AND n.type = 'like'"
        : filter === "follows"
          ? "AND n.type = 'follow'"
          : "";

  const rows = db
    .prepare(
      `SELECT
        n.id,
        n.type,
        n.created_at,
        n.is_read,
        n.comment_text,
        n.post_id,
        u.id AS actor_id,
        u.username AS actor_username,
        u.full_name AS actor_full_name,
        u.avatar_url AS actor_avatar_url,
        CASE WHEN EXISTS (
          SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = u.id
        ) THEN 1 ELSE 0 END AS actor_is_following,
        (SELECT pm.file_path FROM post_media pm WHERE pm.post_id = n.post_id ORDER BY pm.order_index ASC LIMIT 1) AS post_cover_path
      FROM notifications n
      JOIN users u ON u.id = n.actor_id
      WHERE n.recipient_id = ? ${typeClause}
      ORDER BY n.created_at DESC
      LIMIT 60`
    )
    .all(recipientId, recipientId) as Array<{
      id: string;
      type: "like" | "comment" | "follow";
      created_at: number;
      is_read: number;
      comment_text: string;
      post_id: string | null;
      actor_id: string;
      actor_username: string;
      actor_full_name: string;
      actor_avatar_url: string | null;
      actor_is_following: number;
      post_cover_path: string | null;
    }>;

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    createdAt: r.created_at,
    isRead: r.is_read === 1,
    commentText: r.comment_text,
    actor: {
      id: r.actor_id,
      username: r.actor_username,
      fullName: r.actor_full_name,
      avatarUrl: r.actor_avatar_url,
      isFollowing: r.actor_is_following === 1,
    },
    post: r.post_id
      ? {
          id: r.post_id,
          coverUrl: r.post_cover_path ? `/api/media/${r.post_cover_path}` : null,
        }
      : null,
  }));
}

export function getUnreadNotificationsCount(recipientId: string): number {
  const db = getDb();
  const row = db
    .prepare("SELECT COUNT(*) AS cnt FROM notifications WHERE recipient_id = ? AND is_read = 0")
    .get(recipientId) as { cnt: number };
  return Number(row.cnt);
}

export function markNotificationsRead(recipientId: string): void {
  const db = getDb();
  db.prepare("UPDATE notifications SET is_read = 1 WHERE recipient_id = ? AND is_read = 0").run(
    recipientId
  );
}
