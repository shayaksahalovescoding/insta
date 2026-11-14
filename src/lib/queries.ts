import crypto from "node:crypto";
import { getDb } from "./db";
import { deleteStoredMediaByRelativePath } from "./storage";

export interface UserSummary {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  isFollowing: boolean;
}

export interface ProfileSummary {
  id: string;
  username: string;
  fullName: string;
  bio: string;
  avatarUrl: string | null;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  isOwnProfile: boolean;
  isFollowing: boolean;
}

export interface MediaItemDTO {
  id: string;
  url: string;
  mimeType: string;
  orderIndex: number;
}

export interface CommentDTO {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  content: string;
  createdAt: number;
}

export interface PostDTO {
  id: string;
  caption: string;
  location: string;
  aspectRatio: string;
  createdAt: number;
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  media: MediaItemDTO[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

export interface ProfileGridPostDTO {
  id: string;
  coverUrl: string;
  mediaCount: number;
  likesCount: number;
  commentsCount: number;
  createdAt: number;
}

function hydratePosts(postIds: string[], viewerId: string | null): PostDTO[] {
  if (!postIds.length) return [];
  const db = getDb();
  const placeholders = postIds.map(() => "?").join(",");

  const postRows = db
    .prepare(
      `SELECT
        p.id,
        p.caption,
        p.location,
        p.aspect_ratio,
        p.created_at,
        u.id AS author_id,
        u.username AS author_username,
        u.full_name AS author_full_name,
        u.avatar_url AS author_avatar_url,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        CASE WHEN ? IS NOT NULL AND EXISTS (
          SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?
        ) THEN 1 ELSE 0 END AS is_liked,
        CASE WHEN ? IS NOT NULL AND EXISTS (
          SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?
        ) THEN 1 ELSE 0 END AS is_saved
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.id IN (${placeholders})`
    )
    .all(viewerId, viewerId, viewerId, viewerId, ...postIds) as Array<{
      id: string;
      caption: string;
      location: string;
      aspect_ratio: string;
      created_at: number;
      author_id: string;
      author_username: string;
      author_full_name: string;
      author_avatar_url: string | null;
      likes_count: number;
      comments_count: number;
      is_liked: number;
      is_saved: number;
    }>;

  const mediaRows = db
    .prepare(
      `SELECT id, post_id, file_path, mime_type, order_index
       FROM post_media
       WHERE post_id IN (${placeholders})
       ORDER BY order_index ASC`
    )
    .all(...postIds) as Array<{
      id: string;
      post_id: string;
      file_path: string;
      mime_type: string;
      order_index: number;
    }>;

  const mediaByPost = new Map<string, MediaItemDTO[]>();
  for (const m of mediaRows) {
    const list = mediaByPost.get(m.post_id) ?? [];
    list.push({
      id: m.id,
      url: `/api/media/${m.file_path}`,
      mimeType: m.mime_type,
      orderIndex: m.order_index,
    });
    mediaByPost.set(m.post_id, list);
  }

  const byId = new Map<string, PostDTO>();
  for (const row of postRows) {
    byId.set(row.id, {
      id: row.id,
      caption: row.caption,
      location: row.location,
      aspectRatio: row.aspect_ratio,
      createdAt: row.created_at,
      author: {
        id: row.author_id,
        username: row.author_username,
        fullName: row.author_full_name,
        avatarUrl: row.author_avatar_url,
      },
      media: mediaByPost.get(row.id) ?? [],
      likesCount: Number(row.likes_count),
      commentsCount: Number(row.comments_count),
      isLiked: row.is_liked === 1,
      isSaved: row.is_saved === 1,
    });
  }

  return postIds.map((id) => byId.get(id)).filter((p): p is PostDTO => Boolean(p));
}

export function getHomeFeed(viewerId: string, limit = 20, offset = 0): PostDTO[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT p.id
       FROM posts p
       WHERE p.user_id = ?
          OR EXISTS (
            SELECT 1 FROM follows f
            WHERE f.follower_id = ? AND f.following_id = p.user_id
          )
       ORDER BY p.created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(viewerId, viewerId, limit, offset) as Array<{ id: string }>;

  return hydratePosts(
    rows.map((r) => r.id),
    viewerId
  );
}

export function getSuggestedUsers(viewerId: string, limit = 5): UserSummary[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT u.id, u.username, u.full_name, u.avatar_url
       FROM users u
       WHERE u.id <> ?
         AND NOT EXISTS (
           SELECT 1 FROM follows f
           WHERE f.follower_id = ? AND f.following_id = u.id
         )
       ORDER BY u.created_at DESC
       LIMIT ?`
    )
    .all(viewerId, viewerId, limit) as Array<{
      id: string;
      username: string;
      full_name: string;
      avatar_url: string | null;
    }>;

  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
    isFollowing: false,
  }));
}

export function createPost(params: {
  id: string;
  userId: string;
  caption: string;
  location: string;
  aspectRatio: string;
  mediaFiles: Array<{ relativePath: string; mimeType: string }>;
}): PostDTO {
  const db = getDb();
  const now = Date.now();
  const allowedRatios = new Set(["1:1", "4:5", "16:9", "original"]);
  const aspectRatio = allowedRatios.has(params.aspectRatio) ? params.aspectRatio : "1:1";

  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO posts (id, user_id, caption, location, aspect_ratio, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(params.id, params.userId, params.caption.trim(), params.location.trim(), aspectRatio, now);

    const insertMedia = db.prepare(
      `INSERT INTO post_media (id, post_id, file_path, mime_type, order_index)
       VALUES (?, ?, ?, ?, ?)`
    );
    params.mediaFiles.forEach((m, index) => {
      insertMedia.run(crypto.randomUUID(), params.id, m.relativePath, m.mimeType, index);
    });
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  const [created] = hydratePosts([params.id], params.userId);
  if (!created) {
    throw new Error("Failed to load created post.");
  }
  return created;
}

export function getPostDetail(
  postId: string,
  viewerId: string | null
): { post: PostDTO; comments: CommentDTO[] } | null {
  const [post] = hydratePosts([postId], viewerId);
  if (!post) return null;
  const comments = listComments(postId);
  return { post, comments };
}

export function deletePost(postId: string, actorUserId: string): boolean {
  const db = getDb();
  const existing = db
    .prepare("SELECT id, user_id FROM posts WHERE id = ?")
    .get(postId) as { id: string; user_id: string } | undefined;
  if (!existing || existing.user_id !== actorUserId) {
    return false;
  }

  const mediaRows = db
    .prepare("SELECT file_path FROM post_media WHERE post_id = ?")
    .all(postId) as Array<{ file_path: string }>;

  db.prepare("DELETE FROM posts WHERE id = ?").run(postId);
  for (const m of mediaRows) {
    deleteStoredMediaByRelativePath(m.file_path);
  }
  return true;
}

export function toggleLike(
  postId: string,
  userId: string
): { isLiked: boolean; likesCount: number } | null {
  const db = getDb();
  const postExists = db.prepare("SELECT 1 FROM posts WHERE id = ?").get(postId);
  if (!postExists) return null;

  const existing = db
    .prepare("SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?")
    .get(userId, postId);

  if (existing) {
    db.prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?").run(userId, postId);
  } else {
    db.prepare("INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)").run(
      userId,
      postId,
      Date.now()
    );
  }

  const countRow = db
    .prepare("SELECT COUNT(*) AS cnt FROM likes WHERE post_id = ?")
    .get(postId) as { cnt: number };

  return {
    isLiked: !existing,
    likesCount: Number(countRow.cnt),
  };
}

export function toggleSave(postId: string, userId: string): { isSaved: boolean } | null {
  const db = getDb();
  const postExists = db.prepare("SELECT 1 FROM posts WHERE id = ?").get(postId);
  if (!postExists) return null;

  const existing = db
    .prepare("SELECT 1 FROM saved_posts WHERE user_id = ? AND post_id = ?")
    .get(userId, postId);

  if (existing) {
    db.prepare("DELETE FROM saved_posts WHERE user_id = ? AND post_id = ?").run(userId, postId);
  } else {
    db.prepare("INSERT INTO saved_posts (user_id, post_id, created_at) VALUES (?, ?, ?)").run(
      userId,
      postId,
      Date.now()
    );
  }

  return { isSaved: !existing };
}

export function listComments(postId: string): CommentDTO[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
        c.id,
        c.post_id,
        c.user_id,
        u.username,
        u.avatar_url,
        c.content,
        c.created_at
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC`
    )
    .all(postId) as Array<{
      id: string;
      post_id: string;
      user_id: string;
      username: string;
      avatar_url: string | null;
      content: string;
      created_at: number;
    }>;

  return rows.map((r) => ({
    id: r.id,
    postId: r.post_id,
    userId: r.user_id,
    username: r.username,
    avatarUrl: r.avatar_url,
    content: r.content,
    createdAt: r.created_at,
  }));
}

export function createComment(postId: string, userId: string, content: string): CommentDTO | null {
  const db = getDb();
  const postExists = db.prepare("SELECT 1 FROM posts WHERE id = ?").get(postId);
  if (!postExists) return null;

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Comment cannot be empty.");
  }

  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    "INSERT INTO comments (id, post_id, user_id, content, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(id, postId, userId, trimmed, now);

  const row = db
    .prepare(
      `SELECT c.id, c.post_id, c.user_id, u.username, u.avatar_url, c.content, c.created_at
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = ?`
    )
    .get(id) as {
    id: string;
    post_id: string;
    user_id: string;
    username: string;
    avatar_url: string | null;
    content: string;
    created_at: number;
  };

  return {
    id: row.id,
    postId: row.post_id,
    userId: row.user_id,
    username: row.username,
    avatarUrl: row.avatar_url,
    content: row.content,
    createdAt: row.created_at,
  };
}

export function deleteComment(commentId: string, actorUserId: string): boolean {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT c.id, c.user_id AS comment_owner, p.user_id AS post_owner
       FROM comments c
       JOIN posts p ON p.id = c.post_id
       WHERE c.id = ?`
    )
    .get(commentId) as
    | { id: string; comment_owner: string; post_owner: string }
    | undefined;

  if (!row) return false;
  if (row.comment_owner !== actorUserId && row.post_owner !== actorUserId) {
    return false;
  }
  db.prepare("DELETE FROM comments WHERE id = ?").run(commentId);
  return true;
}

export function getProfileSummary(
  username: string,
  viewerId: string | null
): ProfileSummary | null {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
        u.id,
        u.username,
        u.full_name,
        u.bio,
        u.avatar_url,
        (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id) AS posts_count,
        (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) AS followers_count,
        (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id) AS following_count,
        CASE WHEN ? IS NOT NULL AND EXISTS (
          SELECT 1 FROM follows f2 WHERE f2.follower_id = ? AND f2.following_id = u.id
        ) THEN 1 ELSE 0 END AS is_following
      FROM users u
      WHERE u.username = ?`
    )
    .get(viewerId, viewerId, username) as
    | {
        id: string;
        username: string;
        full_name: string;
        bio: string;
        avatar_url: string | null;
        posts_count: number;
        followers_count: number;
        following_count: number;
        is_following: number;
      }
    | undefined;

  if (!row) return null;

  return {
    id: row.id,
    username: row.username,
    fullName: row.full_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    postsCount: Number(row.posts_count),
    followersCount: Number(row.followers_count),
    followingCount: Number(row.following_count),
    isOwnProfile: viewerId === row.id,
    isFollowing: row.is_following === 1,
  };
}

export function getProfileGridPosts(userId: string): ProfileGridPostDTO[] {
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
      WHERE p.user_id = ?
      ORDER BY p.created_at DESC`
    )
    .all(userId) as Array<{
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

export function getSavedGridPosts(userId: string): ProfileGridPostDTO[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
        p.id,
        sp.created_at,
        (SELECT pm.file_path FROM post_media pm WHERE pm.post_id = p.id ORDER BY pm.order_index ASC LIMIT 1) AS cover_path,
        (SELECT COUNT(*) FROM post_media pm WHERE pm.post_id = p.id) AS media_count,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count
      FROM saved_posts sp
      JOIN posts p ON p.id = sp.post_id
      WHERE sp.user_id = ?
      ORDER BY sp.created_at DESC`
    )
    .all(userId) as Array<{
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

export function toggleFollow(
  targetUsername: string,
  followerId: string
): { isFollowing: boolean; followersCount: number } | null {
  const db = getDb();
  const target = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(targetUsername) as { id: string } | undefined;
  if (!target || target.id === followerId) return null;

  const existing = db
    .prepare("SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?")
    .get(followerId, target.id);

  if (existing) {
    db.prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?").run(
      followerId,
      target.id
    );
  } else {
    db.prepare(
      "INSERT INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)"
    ).run(followerId, target.id, Date.now());
  }

  const countRow = db
    .prepare("SELECT COUNT(*) AS cnt FROM follows WHERE following_id = ?")
    .get(target.id) as { cnt: number };

  return {
    isFollowing: !existing,
    followersCount: Number(countRow.cnt),
  };
}

export function listFollowers(username: string, viewerId: string | null): UserSummary[] | null {
  const db = getDb();
  const target = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username) as { id: string } | undefined;
  if (!target) return null;

  const rows = db
    .prepare(
      `SELECT
        u.id,
        u.username,
        u.full_name,
        u.avatar_url,
        CASE WHEN ? IS NOT NULL AND EXISTS (
          SELECT 1 FROM follows f2 WHERE f2.follower_id = ? AND f2.following_id = u.id
        ) THEN 1 ELSE 0 END AS is_following
      FROM follows f
      JOIN users u ON u.id = f.follower_id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC`
    )
    .all(viewerId, viewerId, target.id) as Array<{
      id: string;
      username: string;
      full_name: string;
      avatar_url: string | null;
      is_following: number;
    }>;

  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
    isFollowing: r.is_following === 1,
  }));
}

export function listFollowing(username: string, viewerId: string | null): UserSummary[] | null {
  const db = getDb();
  const target = db
    .prepare("SELECT id FROM users WHERE username = ?")
    .get(username) as { id: string } | undefined;
  if (!target) return null;

  const rows = db
    .prepare(
      `SELECT
        u.id,
        u.username,
        u.full_name,
        u.avatar_url,
        CASE WHEN ? IS NOT NULL AND EXISTS (
          SELECT 1 FROM follows f2 WHERE f2.follower_id = ? AND f2.following_id = u.id
        ) THEN 1 ELSE 0 END AS is_following
      FROM follows f
      JOIN users u ON u.id = f.following_id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC`
    )
    .all(viewerId, viewerId, target.id) as Array<{
      id: string;
      username: string;
      full_name: string;
      avatar_url: string | null;
      is_following: number;
    }>;

  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
    isFollowing: r.is_following === 1,
  }));
}

export function removeFollower(ownerUserId: string, followerUserId: string): boolean {
  const db = getDb();
  const result = db
    .prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?")
    .run(followerUserId, ownerUserId);
  return result.changes > 0;
}
