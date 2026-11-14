"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useRef, useState } from "react";
import { AuthUser } from "@/lib/auth";
import { Avatar } from "./Avatar";

interface EditProfileClientProps {
  currentUser: AuthUser;
}

export function EditProfileClient({ currentUser }: EditProfileClientProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentUser.avatarUrl);
  const [username, setUsername] = useState(currentUser.username);
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [bio, setBio] = useState(currentUser.bio);
  const [gender, setGender] = useState(currentUser.gender || "Prefer not to say");
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    username !== currentUser.username ||
    fullName !== currentUser.fullName ||
    bio !== currentUser.bio ||
    gender !== currentUser.gender;

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    setStatusMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/users/me/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update profile photo.");
      } else {
        setAvatarUrl(data.avatarUrl);
        setStatusMessage("Profile photo updated.");
        router.refresh();
      }
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isDirty || saving) return;
    setSaving(true);
    setError(null);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, fullName, bio, gender }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save changes.");
      } else {
        setStatusMessage("Profile saved.");
        router.refresh();
      }
    } catch {
      setError("Network error while saving profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ig-settings-layout">
      <aside className="ig-settings-sidebar">
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 12px 16px" }}>
          Settings
        </h3>
        <Link className="ig-settings-nav-item is-active" href="/accounts/edit/">
          Edit profile
        </Link>
        <Link
          className="ig-settings-nav-item"
          href={`/${currentUser.username}/`}
          style={{ color: "rgb(var(--ig-secondary-text))" }}
        >
          Back to profile
        </Link>
      </aside>

      <section className="ig-settings-form-pane">
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Edit profile</h2>

        <div className="ig-edit-avatar-card">
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Avatar
              avatarUrl={avatarUrl}
              size={56}
              username={username || currentUser.username}
            />
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{username}</div>
              {fullName && (
                <div style={{ color: "rgb(var(--ig-secondary-text))" }}>
                  {fullName}
                </div>
              )}
            </div>
          </div>

          <div>
            <input
              ref={fileRef}
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              id="edit-avatar-file"
              name="file"
              onChange={handleAvatarChange}
              type="file"
            />
            <button
              className="ig-btn-primary"
              disabled={uploadingPhoto}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              {uploadingPhoto ? "Uploading..." : "Change photo"}
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 20 }}
        >
          <div>
            <label
              htmlFor="edit-fullname"
              style={{ display: "block", fontSize: 16, fontWeight: 700, marginBottom: 8 }}
            >
              Name
            </label>
            <input
              className="ig-edit-field-box"
              id="edit-fullname"
              maxLength={60}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Name"
              type="text"
              value={fullName}
            />
          </div>

          <div>
            <label
              htmlFor="edit-username"
              style={{ display: "block", fontSize: 16, fontWeight: 700, marginBottom: 8 }}
            >
              Username
            </label>
            <input
              className="ig-edit-field-box"
              id="edit-username"
              maxLength={30}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              type="text"
              value={username}
            />
          </div>

          <div>
            <label
              htmlFor="edit-bio"
              style={{ display: "block", fontSize: 16, fontWeight: 700, marginBottom: 8 }}
            >
              Bio
            </label>
            <textarea
              className="ig-edit-field-box"
              id="edit-bio"
              maxLength={150}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Bio"
              rows={3}
              style={{ resize: "vertical" }}
              value={bio}
            />
            <div
              style={{
                fontSize: 12,
                color: "rgb(var(--ig-secondary-text))",
                textAlign: "right",
                marginTop: 4,
              }}
            >
              {bio.length} / 150
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-gender"
              style={{ display: "block", fontSize: 16, fontWeight: 700, marginBottom: 8 }}
            >
              Gender
            </label>
            <select
              className="ig-edit-field-box"
              id="edit-gender"
              onChange={(e) => setGender(e.target.value)}
              style={{ backgroundColor: "rgb(var(--ig-primary-background))" }}
              value={gender}
            >
              <option value="Prefer not to say">Prefer not to say</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          {error && (
            <div style={{ color: "rgb(var(--ig-error-or-destructive))" }}>{error}</div>
          )}
          {statusMessage && (
            <div style={{ color: "rgb(var(--ig-success))" }}>{statusMessage}</div>
          )}

          <button
            className="ig-btn-primary"
            disabled={!isDirty || saving}
            style={{ height: 44, borderRadius: 12 }}
            type="submit"
          >
            {saving ? "Saving..." : "Submit"}
          </button>
        </form>
      </section>
    </div>
  );
}
