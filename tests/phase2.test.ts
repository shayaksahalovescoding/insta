import { after, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "insta-phase2-test-"));
process.env.INSTA_DB_PATH = path.join(tempDir, "test.db");
process.env.INSTA_UPLOAD_DIR = path.join(tempDir, "uploads");

import { closeDb, getDb } from "../src/lib/db";
import { registerUser } from "../src/lib/users";
import {
  createComment,
  createPost,
  toggleFollow,
  toggleLike,
} from "../src/lib/queries";
import {
  createStory,
  deleteStory,
  getExploreGridPosts,
  getStoryTrayGroups,
  getUnreadNotificationsCount,
  listNotifications,
  markNotificationsRead,
  markStoryViewed,
  searchUsersAndPosts,
  toggleStoryLike,
} from "../src/lib/phase2-queries";
import { readStoredMedia, saveUploadedImage } from "../src/lib/storage";

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

describe("Phase 2 stories, explore/search, and notifications", () => {
  beforeEach(() => {
    resetState();
  });

  after(() => {
    closeDb();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("handles 24h stories, views, likes, and deletion", async () => {
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

    toggleFollow("bob", alice.id);

    const fileA = new File([Uint8Array.from([1, 2, 3])], "storyA.png", { type: "image/png" });
    const fileB = new File([Uint8Array.from([4, 5, 6])], "storyB.png", { type: "image/png" });
    const savedA = await saveUploadedImage("stories_sa", fileA);
    const savedB = await saveUploadedImage("stories_sb", fileB);

    const sA = createStory({
      id: "sa",
      userId: alice.id,
      relativePath: savedA.relativePath,
      mimeType: savedA.mimeType,
      caption: "Alice story",
    });
    const sB = createStory({
      id: "sb",
      userId: bob.id,
      relativePath: savedB.relativePath,
      mimeType: savedB.mimeType,
      caption: "Bob story",
    });

    let tray = getStoryTrayGroups(alice.id);
    assert.equal(tray.length, 2);
    assert.equal(tray[0].userId, alice.id);
    assert.equal(tray[1].userId, bob.id);
    assert.equal(tray[1].hasUnseen, true);

    markStoryViewed(sB.id, alice.id);
    assert.deepEqual(toggleStoryLike(sB.id, alice.id), { isLiked: true });

    tray = getStoryTrayGroups(alice.id);
    assert.equal(tray[1].hasUnseen, false);
    assert.equal(tray[1].stories[0].isLiked, true);

    // Expired stories do not appear
    const futureMs = Date.now() + 25 * 60 * 60 * 1000;
    assert.equal(getStoryTrayGroups(alice.id, futureMs).length, 0);

    // Delete story cleans up media
    assert.equal(deleteStory(sA.id, bob.id), false);
    assert.equal(deleteStory(sA.id, alice.id), true);
    assert.equal(readStoredMedia(savedA.relativePath.split("/")), null);
  });

  it("queries real explore grid and search results", async () => {
    const alice = registerUser({
      email: "a@example.com",
      fullName: "Alice Photographer",
      username: "alice.lens",
      password: "password1",
    });
    const bob = registerUser({
      email: "b@example.com",
      fullName: "Bob Builder",
      username: "bob",
      password: "password1",
    });

    const img = new File([Uint8Array.from([9, 8, 7])], "sunset.jpg", { type: "image/jpeg" });
    const saved = await saveUploadedImage("posts_e1", img);
    createPost({
      id: "e1",
      userId: alice.id,
      caption: "Golden hour sunset",
      location: "California",
      aspectRatio: "1:1",
      mediaFiles: [{ relativePath: saved.relativePath, mimeType: saved.mimeType }],
    });

    assert.equal(getExploreGridPosts().length, 1);

    const userSearch = searchUsersAndPosts("lens", bob.id);
    assert.equal(userSearch.users.length, 1);
    assert.equal(userSearch.users[0].username, "alice.lens");

    const postSearch = searchUsersAndPosts("California", bob.id);
    assert.equal(postSearch.posts.length, 1);
    assert.equal(postSearch.posts[0].id, "e1");
  });

  it("emits, filters, cleans up, and marks real notifications read", async () => {
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

    const img = new File([Uint8Array.from([1, 1, 1])], "p.png", { type: "image/png" });
    const saved = await saveUploadedImage("posts_n1", img);
    createPost({
      id: "n1",
      userId: alice.id,
      caption: "My post",
      location: "",
      aspectRatio: "1:1",
      mediaFiles: [{ relativePath: saved.relativePath, mimeType: saved.mimeType }],
    });

    // Self-like/comment must not notify self
    toggleLike("n1", alice.id);
    createComment("n1", alice.id, "Self note");
    assert.equal(getUnreadNotificationsCount(alice.id), 0);

    // Bob follows, likes, and comments
    toggleFollow("alice", bob.id);
    toggleLike("n1", bob.id);
    createComment("n1", bob.id, "Awesome shot!");

    assert.equal(getUnreadNotificationsCount(alice.id), 3);
    assert.equal(listNotifications(alice.id, "all").length, 3);
    assert.equal(listNotifications(alice.id, "likes").length, 1);
    assert.equal(listNotifications(alice.id, "comments").length, 1);
    assert.equal(listNotifications(alice.id, "follows").length, 1);

    // Unlike removes the like notification
    toggleLike("n1", bob.id);
    assert.equal(listNotifications(alice.id, "likes").length, 0);

    markNotificationsRead(alice.id);
    assert.equal(getUnreadNotificationsCount(alice.id), 0);
  });
});
