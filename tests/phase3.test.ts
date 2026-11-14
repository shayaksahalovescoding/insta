import { after, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "insta-phase3-test-"));
process.env.INSTA_DB_PATH = path.join(tempDir, "test.db");
process.env.INSTA_UPLOAD_DIR = path.join(tempDir, "uploads");

import { closeDb, getDb } from "../src/lib/db";
import { registerUser } from "../src/lib/users";
import {
  createPost,
  toggleFollow,
  toggleLike,
  toggleSave,
} from "../src/lib/queries";
import {
  deleteDmMessage,
  getDmThreadDetail,
  getOrCreateDirectThread,
  getReelsFeed,
  getUnreadDmThreadsCount,
  listDmThreads,
  markDmThreadRead,
  searchUsersForDm,
  sendDmMessage,
  toggleDmReaction,
  toggleDmThreadMute,
} from "../src/lib/phase3-queries";
import { readStoredMedia, saveUploadedMedia } from "../src/lib/storage";

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

describe("Phase 3 reels video feed and direct messaging", () => {
  beforeEach(() => {
    resetState();
  });

  after(() => {
    closeDb();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("validates and stores video media and builds the Reels feed without fake entries", async () => {
    const alice = registerUser({
      email: "alice@example.com",
      fullName: "Alice",
      username: "alice",
      password: "password123",
    });
    const bob = registerUser({
      email: "bob@example.com",
      fullName: "Bob",
      username: "bob",
      password: "password123",
    });

    assert.equal(getReelsFeed(bob.id).length, 0);

    // Image-only post should NOT show up in Reels
    createPost({
      id: "photo_only",
      userId: alice.id,
      caption: "Static photo",
      location: "",
      aspectRatio: "1:1",
      mediaFiles: [{ relativePath: "posts_photo/1.png", mimeType: "image/png" }],
    });

    const videoFile = new File([Buffer.from("00000018ftypmp4200000000mp42isom")], "clip.mp4", {
      type: "video/mp4",
    });
    const saved = await saveUploadedMedia("posts_reel_1", videoFile);
    assert.equal(saved.mimeType, "video/mp4");
    const stored = readStoredMedia(saved.relativePath.split("/"));
    assert.ok(stored);
    assert.equal(stored.mimeType, "video/mp4");

    createPost({
      id: "reel_1",
      userId: alice.id,
      caption: "First real reel",
      location: "",
      aspectRatio: "original",
      mediaFiles: [{ relativePath: saved.relativePath, mimeType: saved.mimeType }],
    });

    createPost({
      id: "reel_2",
      userId: bob.id,
      caption: "Second reel",
      location: "",
      aspectRatio: "original",
      mediaFiles: [{ relativePath: "posts_reel_2/clip2.webm", mimeType: "video/webm" }],
    });

    toggleFollow("alice", bob.id);
    toggleLike("reel_1", bob.id);
    toggleSave("reel_1", bob.id);

    const feedDefault = getReelsFeed(bob.id);
    assert.equal(feedDefault.length, 2);
    assert.ok(feedDefault.every((r) => r.mimeType.startsWith("video/")));

    const prioritized = getReelsFeed(bob.id, "reel_1");
    assert.equal(prioritized[0].id, "reel_1");
    assert.equal(prioritized[0].author.isFollowing, true);
    assert.equal(prioritized[0].isLiked, true);
    assert.equal(prioritized[0].isSaved, true);
    assert.equal(prioritized[0].likesCount, 1);
  });

  it("handles 1:1 DM thread creation, messaging, media/post sharing, reactions, unread badges, and authorization", async () => {
    const alice = registerUser({
      email: "alice@example.com",
      fullName: "Alice Wonder",
      username: "alice",
      password: "password123",
    });
    const bob = registerUser({
      email: "bob@example.com",
      fullName: "Bob Builder",
      username: "bob",
      password: "password123",
    });
    const charlie = registerUser({
      email: "charlie@example.com",
      fullName: "Charlie Chaplin",
      username: "charlie",
      password: "password123",
    });

    const foundUsers = searchUsersForDm(alice.id, "bob");
    assert.equal(foundUsers.length, 1);
    assert.equal(foundUsers[0].username, "bob");

    // 1:1 thread deduplication in both directions
    const t1 = getOrCreateDirectThread(alice.id, bob.id);
    const t2 = getOrCreateDirectThread(bob.id, alice.id);
    assert.ok(t1);
    assert.equal(t1, t2);
    assert.equal(getOrCreateDirectThread(alice.id, alice.id), null);

    // Create a post to share in DM
    createPost({
      id: "shared_p1",
      userId: alice.id,
      caption: "Share me in DM",
      location: "",
      aspectRatio: "1:1",
      mediaFiles: [{ relativePath: "posts_shared/cover.jpg", mimeType: "image/jpeg" }],
    });

    // Alice sends text + shared post
    const msg1 = sendDmMessage({
      threadId: t1,
      senderId: alice.id,
      body: "Hey Bob!",
    });
    assert.ok(msg1);
    const msg2 = sendDmMessage({
      threadId: t1,
      senderId: alice.id,
      body: "Check this out",
      sharedPostId: "shared_p1",
    });
    assert.ok(msg2);
    assert.equal(msg2.sharedPost?.id, "shared_p1");

    // Bob should see 1 unread thread with unreadCount = 2
    assert.equal(getUnreadDmThreadsCount(bob.id), 1);
    assert.equal(getUnreadDmThreadsCount(alice.id), 0);
    const bobInbox = listDmThreads(bob.id);
    assert.equal(bobInbox.length, 1);
    assert.equal(bobInbox[0].isUnread, true);
    assert.equal(bobInbox[0].unreadCount, 2);

    // Non-participant Charlie cannot read or send into t1
    assert.equal(getDmThreadDetail(t1, charlie.id), null);
    assert.equal(
      sendDmMessage({ threadId: t1, senderId: charlie.id, body: "Sneak" }),
      null
    );

    // Bob opens & reads thread -> unread count clears, Alice sees updated otherLastReadAt
    assert.equal(markDmThreadRead(t1, bob.id), true);
    assert.equal(getUnreadDmThreadsCount(bob.id), 0);
    const aliceViewAfterRead = getDmThreadDetail(t1, alice.id);
    assert.ok(aliceViewAfterRead);
    assert.ok(aliceViewAfterRead.otherLastReadAt >= msg2.createdAt);

    // Bob reacts to msg1, then toggles off
    const added = toggleDmReaction(msg1.id, bob.id, "❤️");
    assert.ok(added);
    assert.equal(added.length, 1);
    assert.equal(added[0].emoji, "❤️");
    const removed = toggleDmReaction(msg1.id, bob.id, "❤️");
    assert.equal(removed?.length, 0);

    // Mute toggle
    const muted = toggleDmThreadMute(t1, bob.id);
    assert.equal(muted?.isMuted, true);

    // Only sender can unsend/delete a message
    assert.equal(deleteDmMessage(msg1.id, bob.id), false);
    assert.equal(deleteDmMessage(msg1.id, alice.id), true);

    const finalDetail = getDmThreadDetail(t1, alice.id);
    assert.equal(finalDetail?.messages.length, 1);
    assert.equal(finalDetail?.messages[0].id, msg2.id);
  });
});
