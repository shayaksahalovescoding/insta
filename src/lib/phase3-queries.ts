import crypto from "node:crypto";
import { getDb } from "./db";
import { deleteStoredMediaByRelativePath } from "./storage";

export interface ReelItemDTO {
  id: string;
  caption: string;
  location: string;
  aspectRatio: string;
  createdAt: number;
  videoUrl: string;
  mimeType: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
    isFollowing: boolean;
  };
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isSaved: boolean;
}

export interface DmUserDTO {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface DmReactionDTO {
  userId: string;
  username: string;
  emoji: string;
}

export interface DmSharedPostDTO {
  id: string;
  caption: string;
  coverUrl: string;
  coverMimeType: string;
  authorUsername: string;
  authorAvatarUrl: string | null;
}

export interface DmMessageDTO {
  id: string;
  threadId: string;
  senderId: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
  body: string;
  mediaUrl: string | null;
  mediaMime: string | null;
  sharedPost: DmSharedPostDTO | null;
  reactions: DmReactionDTO[];
  createdAt: number;
  isMine: boolean;
}

export interface DmThreadSummaryDTO {
  id: string;
  otherUser: DmUserDTO;
  lastMessage: {
    id: string;
    senderId: string;
    body: string;
    mediaMime: string | null;
    sharedPostId: string | null;
    createdAt: number;
  } | null;
  unreadCount: number;
  isUnread: boolean;
  isMuted: boolean;
  updatedAt: number;
}

export interface DmThreadDetailDTO {
  id: string;
  otherUser: DmUserDTO;
  isMuted: boolean;
  otherLastReadAt: number;
  messages: DmMessageDTO[];
}

export function getReelsFeed(
  viewerId: string,
  initialPostId?: string,
  limit = 30
): ReelItemDTO[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
        p.id,
        p.caption,
        p.location,
        p.aspect_ratio,
        p.created_at,
        pm.file_path AS video_path,
        pm.mime_type AS mime_type,
        u.id AS author_id,
        u.username AS author_username,
        u.full_name AS author_full_name,
        u.avatar_url AS author_avatar_url,
        CASE WHEN EXISTS (
          SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = u.id
        ) THEN 1 ELSE 0 END AS is_following,
        (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes_count,
        (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comments_count,
        CASE WHEN EXISTS (
          SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?
        ) THEN 1 ELSE 0 END AS is_liked,
        CASE WHEN EXISTS (
          SELECT 1 FROM saved_posts sp WHERE sp.post_id = p.id AND sp.user_id = ?
        ) THEN 1 ELSE 0 END AS is_saved
      FROM posts p
      JOIN users u ON u.id = p.user_id
      JOIN post_media pm ON pm.id = (
        SELECT pm2.id
        FROM post_media pm2
        WHERE pm2.post_id = p.id AND pm2.mime_type LIKE 'video/%'
        ORDER BY pm2.order_index ASC
        LIMIT 1
      )
      ORDER BY
        CASE WHEN ? IS NOT NULL AND p.id = ? THEN 0 ELSE 1 END,
        p.created_at DESC
      LIMIT ?`
    )
    .all(
      viewerId,
      viewerId,
      viewerId,
      initialPostId ?? null,
      initialPostId ?? null,
      limit
    ) as Array<{
    id: string;
    caption: string;
    location: string;
    aspect_ratio: string;
    created_at: number;
    video_path: string;
    mime_type: string;
    author_id: string;
    author_username: string;
    author_full_name: string;
    author_avatar_url: string | null;
    is_following: number;
    likes_count: number;
    comments_count: number;
    is_liked: number;
    is_saved: number;
  }>;

  return rows.map((r) => ({
    id: r.id,
    caption: r.caption,
    location: r.location,
    aspectRatio: r.aspect_ratio,
    createdAt: r.created_at,
    videoUrl: `/api/media/${r.video_path}`,
    mimeType: r.mime_type,
    author: {
      id: r.author_id,
      username: r.author_username,
      fullName: r.author_full_name,
      avatarUrl: r.author_avatar_url,
      isFollowing: r.is_following === 1,
    },
    likesCount: Number(r.likes_count),
    commentsCount: Number(r.comments_count),
    isLiked: r.is_liked === 1,
    isSaved: r.is_saved === 1,
  }));
}

export function searchUsersForDm(viewerId: string, query: string = ""): DmUserDTO[] {
  const db = getDb();
  const trimmed = query.trim();
  const rows = trimmed
    ? (db
        .prepare(
          `SELECT id, username, full_name, avatar_url
           FROM users
           WHERE id <> ? AND (username LIKE ? OR full_name LIKE ?)
           ORDER BY
             CASE WHEN LOWER(username) = LOWER(?) THEN 0
                  WHEN LOWER(username) LIKE LOWER(?) THEN 1
                  ELSE 2 END,
             username ASC
           LIMIT 25`
        )
        .all(viewerId, `%${trimmed}%`, `%${trimmed}%`, trimmed, `${trimmed}%`) as Array<{
        id: string;
        username: string;
        full_name: string;
        avatar_url: string | null;
      }>)
    : (db
        .prepare(
          `SELECT u.id, u.username, u.full_name, u.avatar_url
           FROM users u
           WHERE u.id <> ?
           ORDER BY
             CASE WHEN EXISTS (
               SELECT 1 FROM follows f WHERE f.follower_id = ? AND f.following_id = u.id
             ) THEN 0 ELSE 1 END,
             u.created_at DESC
           LIMIT 25`
        )
        .all(viewerId, viewerId) as Array<{
        id: string;
        username: string;
        full_name: string;
        avatar_url: string | null;
      }>);

  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
  }));
}

export function getOrCreateDirectThread(
  currentUserId: string,
  targetUserId: string
): string | null {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return null;
  }
  const db = getDb();
  const targetExists = db
    .prepare("SELECT id FROM users WHERE id = ?")
    .get(targetUserId) as { id: string } | undefined;
  if (!targetExists) return null;

  const existing = db
    .prepare(
      `SELECT p1.thread_id
       FROM dm_participants p1
       JOIN dm_participants p2 ON p1.thread_id = p2.thread_id
       WHERE p1.user_id = ? AND p2.user_id = ?
         AND (SELECT COUNT(*) FROM dm_participants px WHERE px.thread_id = p1.thread_id) = 2
       LIMIT 1`
    )
    .get(currentUserId, targetUserId) as { thread_id: string } | undefined;

  if (existing) {
    return existing.thread_id;
  }

  const threadId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const now = Date.now();
  db.exec("BEGIN");
  try {
    db.prepare("INSERT INTO dm_threads (id, created_at, updated_at) VALUES (?, ?, ?)").run(
      threadId,
      now,
      now
    );
    db.prepare(
      `INSERT INTO dm_participants (thread_id, user_id, last_read_at, muted, joined_at)
       VALUES (?, ?, ?, 0, ?)`
    ).run(threadId, currentUserId, now, now);
    db.prepare(
      `INSERT INTO dm_participants (thread_id, user_id, last_read_at, muted, joined_at)
       VALUES (?, ?, 0, 0, ?)`
    ).run(threadId, targetUserId, now);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  return threadId;
}

export function getUnreadDmThreadsCount(userId: string): number {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT COUNT(*) AS cnt
       FROM dm_participants me
       WHERE me.user_id = ?
         AND EXISTS (
           SELECT 1
           FROM dm_messages m
           WHERE m.thread_id = me.thread_id
             AND m.sender_id <> ?
             AND m.created_at > me.last_read_at
         )`
    )
    .get(userId, userId) as { cnt: number };
  return Number(row.cnt);
}

export function listDmThreads(
  userId: string,
  searchQuery: string = ""
): DmThreadSummaryDTO[] {
  const db = getDb();
  const trimmed = searchQuery.trim().toLowerCase();

  const rows = db
    .prepare(
      `SELECT
        t.id AS thread_id,
        t.updated_at,
        me.last_read_at AS my_last_read_at,
        me.muted AS my_muted,
        u.id AS other_id,
        u.username AS other_username,
        u.full_name AS other_full_name,
        u.avatar_url AS other_avatar_url,
        (SELECT COUNT(*) FROM dm_messages m_un
         WHERE m_un.thread_id = t.id
           AND m_un.sender_id <> ?
           AND m_un.created_at > me.last_read_at) AS unread_count
      FROM dm_participants me
      JOIN dm_threads t ON t.id = me.thread_id
      JOIN dm_participants other_p ON other_p.thread_id = t.id AND other_p.user_id <> ?
      JOIN users u ON u.id = other_p.user_id
      WHERE me.user_id = ?
      ORDER BY t.updated_at DESC`
    )
    .all(userId, userId, userId) as Array<{
    thread_id: string;
    updated_at: number;
    my_last_read_at: number;
    my_muted: number;
    other_id: string;
    other_username: string;
    other_full_name: string;
    other_avatar_url: string | null;
    unread_count: number;
  }>;

  const filteredRows = trimmed
    ? rows.filter(
        (r) =>
          r.other_username.toLowerCase().includes(trimmed) ||
          r.other_full_name.toLowerCase().includes(trimmed)
      )
    : rows;

  const lastMessageStmt = db.prepare(
    `SELECT id, sender_id, body, media_mime, shared_post_id, created_at
     FROM dm_messages
     WHERE thread_id = ?
     ORDER BY created_at DESC
     LIMIT 1`
  );

  return filteredRows.map((r) => {
    const last = lastMessageStmt.get(r.thread_id) as
      | {
          id: string;
          sender_id: string;
          body: string;
          media_mime: string | null;
          shared_post_id: string | null;
          created_at: number;
        }
      | undefined;

    const unreadCount = Number(r.unread_count);
    return {
      id: r.thread_id,
      otherUser: {
        id: r.other_id,
        username: r.other_username,
        fullName: r.other_full_name,
        avatarUrl: r.other_avatar_url,
      },
      lastMessage: last
        ? {
            id: last.id,
            senderId: last.sender_id,
            body: last.body,
            mediaMime: last.media_mime,
            sharedPostId: last.shared_post_id,
            createdAt: last.created_at,
          }
        : null,
      unreadCount,
      isUnread: unreadCount > 0,
      isMuted: r.my_muted === 1,
      updatedAt: r.updated_at,
    };
  });
}

export function markDmThreadRead(threadId: string, viewerId: string): boolean {
  const db = getDb();
  const result = db
    .prepare(
      "UPDATE dm_participants SET last_read_at = ? WHERE thread_id = ? AND user_id = ?"
    )
    .run(Date.now(), threadId, viewerId);
  return result.changes > 0;
}

export function toggleDmThreadMute(
  threadId: string,
  viewerId: string
): { isMuted: boolean } | null {
  const db = getDb();
  const row = db
    .prepare("SELECT muted FROM dm_participants WHERE thread_id = ? AND user_id = ?")
    .get(threadId, viewerId) as { muted: number } | undefined;
  if (!row) return null;
  const nextMuted = row.muted === 1 ? 0 : 1;
  db.prepare(
    "UPDATE dm_participants SET muted = ? WHERE thread_id = ? AND user_id = ?"
  ).run(nextMuted, threadId, viewerId);
  return { isMuted: nextMuted === 1 };
}

export function getDmThreadDetail(
  threadId: string,
  viewerId: string
): DmThreadDetailDTO | null {
  const db = getDb();
  const header = db
    .prepare(
      `SELECT
        me.muted AS my_muted,
        other_p.last_read_at AS other_last_read_at,
        u.id AS other_id,
        u.username AS other_username,
        u.full_name AS other_full_name,
        u.avatar_url AS other_avatar_url
      FROM dm_participants me
      JOIN dm_participants other_p ON other_p.thread_id = me.thread_id AND other_p.user_id <> ?
      JOIN users u ON u.id = other_p.user_id
      WHERE me.thread_id = ? AND me.user_id = ?`
    )
    .get(viewerId, threadId, viewerId) as
    | {
        my_muted: number;
        other_last_read_at: number;
        other_id: string;
        other_username: string;
        other_full_name: string;
        other_avatar_url: string | null;
      }
    | undefined;

  if (!header) return null;

  const messageRows = db
    .prepare(
      `SELECT
        m.id,
        m.thread_id,
        m.sender_id,
        m.body,
        m.media_path,
        m.media_mime,
        m.shared_post_id,
        m.created_at,
        su.username AS sender_username,
        su.avatar_url AS sender_avatar_url
      FROM dm_messages m
      JOIN users su ON su.id = m.sender_id
      WHERE m.thread_id = ?
      ORDER BY m.created_at ASC`
    )
    .all(threadId) as Array<{
    id: string;
    thread_id: string;
    sender_id: string;
    body: string;
    media_path: string | null;
    media_mime: string | null;
    shared_post_id: string | null;
    created_at: number;
    sender_username: string;
    sender_avatar_url: string | null;
  }>;

  const reactionsByMessage = new Map<string, DmReactionDTO[]>();
  const sharedPostsById = new Map<string, DmSharedPostDTO>();

  if (messageRows.length > 0) {
    const msgIds = messageRows.map((m) => m.id);
    const msgPlaceholders = msgIds.map(() => "?").join(",");
    const reactionRows = db
      .prepare(
        `SELECT r.message_id, r.user_id, r.emoji, u.username
         FROM dm_reactions r
         JOIN users u ON u.id = r.user_id
         WHERE r.message_id IN (${msgPlaceholders})
         ORDER BY r.created_at ASC`
      )
      .all(...msgIds) as Array<{
      message_id: string;
      user_id: string;
      emoji: string;
      username: string;
    }>;

    for (const rr of reactionRows) {
      const list = reactionsByMessage.get(rr.message_id) ?? [];
      list.push({ userId: rr.user_id, username: rr.username, emoji: rr.emoji });
      reactionsByMessage.set(rr.message_id, list);
    }

    const sharedPostIds = Array.from(
      new Set(
        messageRows
          .map((m) => m.shared_post_id)
          .filter((id): id is string => Boolean(id))
      )
    );
    if (sharedPostIds.length > 0) {
      const postPlaceholders = sharedPostIds.map(() => "?").join(",");
      const spRows = db
        .prepare(
          `SELECT
            p.id,
            p.caption,
            u.username AS author_username,
            u.avatar_url AS author_avatar_url,
            (SELECT pm.file_path FROM post_media pm WHERE pm.post_id = p.id ORDER BY pm.order_index ASC LIMIT 1) AS cover_path,
            (SELECT pm.mime_type FROM post_media pm WHERE pm.post_id = p.id ORDER BY pm.order_index ASC LIMIT 1) AS cover_mime
          FROM posts p
          JOIN users u ON u.id = p.user_id
          WHERE p.id IN (${postPlaceholders})`
        )
        .all(...sharedPostIds) as Array<{
        id: string;
        caption: string;
        author_username: string;
        author_avatar_url: string | null;
        cover_path: string | null;
        cover_mime: string | null;
      }>;

      for (const sp of spRows) {
        if (!sp.cover_path) continue;
        sharedPostsById.set(sp.id, {
          id: sp.id,
          caption: sp.caption,
          coverUrl: `/api/media/${sp.cover_path}`,
          coverMimeType: sp.cover_mime || "image/jpeg",
          authorUsername: sp.author_username,
          authorAvatarUrl: sp.author_avatar_url,
        });
      }
    }
  }

  return {
    id: threadId,
    otherUser: {
      id: header.other_id,
      username: header.other_username,
      fullName: header.other_full_name,
      avatarUrl: header.other_avatar_url,
    },
    isMuted: header.my_muted === 1,
    otherLastReadAt: Number(header.other_last_read_at),
    messages: messageRows.map((m) => ({
      id: m.id,
      threadId: m.thread_id,
      senderId: m.sender_id,
      senderUsername: m.sender_username,
      senderAvatarUrl: m.sender_avatar_url,
      body: m.body,
      mediaUrl: m.media_path ? `/api/media/${m.media_path}` : null,
      mediaMime: m.media_mime,
      sharedPost: m.shared_post_id ? sharedPostsById.get(m.shared_post_id) ?? null : null,
      reactions: reactionsByMessage.get(m.id) ?? [],
      createdAt: m.created_at,
      isMine: m.sender_id === viewerId,
    })),
  };
}

export function sendDmMessage(params: {
  threadId: string;
  senderId: string;
  body?: string;
  mediaPath?: string | null;
  mediaMime?: string | null;
  sharedPostId?: string | null;
}): DmMessageDTO | null {
  const db = getDb();
  const isParticipant = db
    .prepare("SELECT 1 FROM dm_participants WHERE thread_id = ? AND user_id = ?")
    .get(params.threadId, params.senderId);
  if (!isParticipant) return null;

  const trimmedBody = (params.body ?? "").trim();
  const hasMedia = Boolean(params.mediaPath);
  const sharedPostId = params.sharedPostId ? params.sharedPostId.trim() : null;
  if (!trimmedBody && !hasMedia && !sharedPostId) {
    throw new Error("Message cannot be empty.");
  }

  if (sharedPostId) {
    const postExists = db
      .prepare("SELECT 1 FROM posts WHERE id = ?")
      .get(sharedPostId);
    if (!postExists) {
      throw new Error("Shared post not found.");
    }
  }

  const msgId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const now = Date.now();

  db.exec("BEGIN");
  try {
    db.prepare(
      `INSERT INTO dm_messages (id, thread_id, sender_id, body, media_path, media_mime, shared_post_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      msgId,
      params.threadId,
      params.senderId,
      trimmedBody,
      params.mediaPath ?? null,
      params.mediaMime ?? null,
      sharedPostId,
      now
    );

    db.prepare("UPDATE dm_threads SET updated_at = ? WHERE id = ?").run(
      now,
      params.threadId
    );
    db.prepare(
      "UPDATE dm_participants SET last_read_at = ? WHERE thread_id = ? AND user_id = ?"
    ).run(now, params.threadId, params.senderId);
    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }

  const detail = getDmThreadDetail(params.threadId, params.senderId);
  return detail?.messages.find((m) => m.id === msgId) ?? null;
}

export function toggleDmReaction(
  messageId: string,
  userId: string,
  emoji: string
): DmReactionDTO[] | null {
  const trimmedEmoji = emoji.trim();
  if (!trimmedEmoji || trimmedEmoji.length > 16) return null;

  const db = getDb();
  const msg = db
    .prepare(
      `SELECT m.id, m.thread_id
       FROM dm_messages m
       JOIN dm_participants dp ON dp.thread_id = m.thread_id AND dp.user_id = ?
       WHERE m.id = ?`
    )
    .get(userId, messageId) as { id: string; thread_id: string } | undefined;
  if (!msg) return null;

  const existing = db
    .prepare("SELECT emoji FROM dm_reactions WHERE message_id = ? AND user_id = ?")
    .get(messageId, userId) as { emoji: string } | undefined;

  if (existing && existing.emoji === trimmedEmoji) {
    db.prepare("DELETE FROM dm_reactions WHERE message_id = ? AND user_id = ?").run(
      messageId,
      userId
    );
  } else {
    db.prepare(
      `INSERT INTO dm_reactions (message_id, user_id, emoji, created_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(message_id, user_id) DO UPDATE SET emoji = excluded.emoji, created_at = excluded.created_at`
    ).run(messageId, userId, trimmedEmoji, Date.now());
  }

  const rows = db
    .prepare(
      `SELECT r.user_id, r.emoji, u.username
       FROM dm_reactions r
       JOIN users u ON u.id = r.user_id
       WHERE r.message_id = ?
       ORDER BY r.created_at ASC`
    )
    .all(messageId) as Array<{ user_id: string; emoji: string; username: string }>;

  return rows.map((r) => ({
    userId: r.user_id,
    username: r.username,
    emoji: r.emoji,
  }));
}

export function deleteDmMessage(messageId: string, userId: string): boolean {
  const db = getDb();
  const row = db
    .prepare("SELECT id, sender_id, media_path FROM dm_messages WHERE id = ?")
    .get(messageId) as
    | { id: string; sender_id: string; media_path: string | null }
    | undefined;
  if (!row || row.sender_id !== userId) return false;

  db.prepare("DELETE FROM dm_messages WHERE id = ?").run(messageId);
  if (row.media_path) {
    deleteStoredMediaByRelativePath(row.media_path);
  }
  return true;
}
