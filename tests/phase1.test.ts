import { after, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "insta-test-"));
process.env.INSTA_DB_PATH = path.join(tempDir, "test.db");
process.env.INSTA_UPLOAD_DIR = path.join(tempDir, "uploads");

import { closeDb, getDb } from "../src/lib/db";
import {
  createSessionForUser,
  deleteSessionByToken,
  getUserBySessionToken,
} from "../src/lib/auth";
import {
  authenticateUser,
  ConflictError,
  registerUser,
  UnauthorizedError,
  updateUserProfile,
  ValidationError,
} from "../src/lib/users";
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  getHomeFeed,
  getPostDetail,
  getProfileGridPosts,
  getProfileSummary,
  getSavedGridPosts,
  getSuggestedUsers,
  listFollowers,
  removeFollower,
  toggleFollow,
  toggleLike,
  toggleSave,
} from "../src/lib/queries";
import {
  readStoredMedia,
  saveUploadedImage,
  validateImageUpload,
} from "../src/lib/storage";
import { formatCount, formatRelativeTime } from "../src/lib/time";

function resetState() {
  closeDb();
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${process.env.INSTA_DB_PATH}${suffix}`;
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }
  if (fs.existsSync(process.env.INSTA_UPLOAD_DIR!)) {
    fs.rmSync(process.env.INSTA_UPLOAD_DIR!, { recursive: true, force: true });
  }
  getDb();
}

describe("Phase 1 core backend & storage", () => {
  beforeEach(() => {
    resetState();
  });

  after(() => {
    closeDb();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("registers, authenticates, manages sessions, and rejects invalid/duplicate inputs", () => {
    assert.throws(
      () =>
        registerUser({
          email: "bad-email",
          fullName: "Test",
          username: "valid_user",
          password: "password123",
        }),
      ValidationError
    );

    const alice = registerUser({
      email: "alice@example.com",
      fullName: "Alice Example",
      username: "alice.dev",
      password: "secret123",
    });
    assert.equal(alice.username, "alice.dev");
    assert.equal(alice.themePreference, "dark");

    assert.throws(
      () =>
        registerUser({
          email: "alice@example.com",
          fullName: "Other",
          username: "other",
          password: "secret123",
        }),
      ConflictError
    );

    const loggedIn = authenticateUser("alice.dev", "secret123");
    assert.equal(loggedIn.id, alice.id);

    assert.throws(
      () => authenticateUser("alice.dev", "wrongpass"),
      UnauthorizedError
    );

    const session = createSessionForUser(alice.id);
    const resolved = getUserBySessionToken(session.token);
    assert.equal(resolved?.id, alice.id);

    const updated = updateUserProfile(alice.id, {
      bio: "Building real apps",
      themePreference: "light",
    });
    assert.equal(updated.bio, "Building real apps");
    assert.equal(updated.themePreference, "light");

    deleteSessionByToken(session.token);
    assert.equal(getUserBySessionToken(session.token), null);
  });

  it("enforces upload validation and prevents path traversal when reading media", async () => {
    assert.ok(validateImageUpload({ type: "application/pdf", size: 100 }));
    assert.ok(validateImageUpload({ type: "image/png", size: 0 }));
    assert.equal(validateImageUpload({ type: "image/png", size: 1024 }), null);

    const fakePng = new File([Uint8Array.from([137, 80, 78, 71])], "pic.png", {
      type: "image/png",
    });
    const saved = await saveUploadedImage("posts_abc", fakePng);
    assert.match(saved.mediaUrl, /^\/api\/media\/posts_abc\/.+\.png$/);

    const loaded = readStoredMedia(saved.relativePath.split("/"));
    assert.ok(loaded);
    assert.equal(loaded.mimeType, "image/png");
    assert.equal(readStoredMedia(["..", "..", "test.db"]), null);
  });

  it("handles posts, feed scoping, likes, saves, comments, follows, and deletion", async () => {
    const alice = registerUser({
      email: "a@example.com",
      fullName: "Alice",
      username: "alice",
      password: "password1",
    });
    const bob = registerUser({
      email: "b@example.com",
      fullName: "Bob",
      username: "bob",
      password: "password1",
    });

    // Initially empty feed and 1 suggested user
    assert.equal(getHomeFeed(alice.id).length, 0);
    assert.equal(getSuggestedUsers(alice.id).length, 1);

    const img1 = new File([Uint8Array.from([1, 2, 3, 4])], "1.jpg", {
      type: "image/jpeg",
    });
    const img2 = new File([Uint8Array.from([5, 6, 7, 8])], "2.jpg", {
      type: "image/jpeg",
    });
    const saved1 = await saveUploadedImage("posts_p1", img1);
    const saved2 = await saveUploadedImage("posts_p1", img2);

    const bobPost = createPost({
      id: "p1",
      userId: bob.id,
      caption: "Hello from Bob",
      location: "NYC",
      aspectRatio: "1:1",
      mediaFiles: [
        { relativePath: saved1.relativePath, mimeType: saved1.mimeType },
        { relativePath: saved2.relativePath, mimeType: saved2.mimeType },
      ],
    });
    assert.equal(bobPost.media.length, 2);

    // Alice does not follow Bob yet -> feed is empty
    assert.equal(getHomeFeed(alice.id).length, 0);

    // Alice follows Bob -> Bob's post appears in Alice's feed
    const followRes = toggleFollow("bob", alice.id);
    assert.deepEqual(followRes, { isFollowing: true, followersCount: 1 });
    assert.equal(getHomeFeed(alice.id).length, 1);

    // Like & Save
    assert.deepEqual(toggleLike("p1", alice.id), { isLiked: true, likesCount: 1 });
    assert.deepEqual(toggleSave("p1", alice.id), { isSaved: true });
    assert.equal(getSavedGridPosts(alice.id).length, 1);

    // Comment
    const comment = createComment("p1", alice.id, "Nice photo!");
    assert.ok(comment);
    const detail = getPostDetail("p1", alice.id);
    assert.equal(detail?.comments.length, 1);
    assert.equal(detail?.post.likesCount, 1);
    assert.equal(detail?.post.isLiked, true);
    assert.equal(detail?.post.isSaved, true);

    // Bob can delete comment on Bob's post; non-owner cannot
    assert.equal(deleteComment(comment.id, bob.id), true);

    // Profile stats
    const bobProfile = getProfileSummary("bob", alice.id);
    assert.equal(bobProfile?.postsCount, 1);
    assert.equal(bobProfile?.followersCount, 1);
    assert.equal(bobProfile?.isFollowing, true);
    assert.equal(getProfileGridPosts(bob.id).length, 1);

    // Remove follower
    assert.equal(listFollowers("bob", bob.id)?.length, 1);
    assert.equal(removeFollower(bob.id, alice.id), true);
    assert.equal(listFollowers("bob", bob.id)?.length, 0);

    // Delete post removes DB record and files
    assert.equal(deletePost("p1", alice.id), false);
    assert.equal(deletePost("p1", bob.id), true);
    assert.equal(readStoredMedia(saved1.relativePath.split("/")), null);
  });

  it("formats relative times and counts cleanly", () => {
    const now = 1_700_000_000_000;
    assert.equal(formatRelativeTime(now - 20_000, now), "now");
    assert.equal(formatRelativeTime(now - 5 * 60_000, now), "5m");
    assert.equal(formatRelativeTime(now - 3 * 3600_000, now), "3h");
    assert.equal(formatRelativeTime(now - 2 * 86400_000, now), "2d");
    assert.equal(formatCount(89), "89");
    assert.equal(formatCount(12400), "12.4K");
  });
});
