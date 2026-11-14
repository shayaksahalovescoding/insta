import React from "react";

interface AvatarProps {
  username: string;
  avatarUrl: string | null;
  size: number;
  className?: string;
}

export function Avatar({ username, avatarUrl, size, className = "" }: AvatarProps) {
  if (avatarUrl) {
    return (
      <img
        alt={`${username}'s profile picture`}
        className={`ig-avatar-img ${className}`.trim()}
        height={size}
        src={avatarUrl}
        style={{ width: size, height: size }}
        width={size}
      />
    );
  }

  const initial = (username.trim()[0] || "?").toUpperCase();
  const fontSize = Math.max(11, Math.round(size * 0.42));

  return (
    <span
      aria-label={`${username}'s profile picture`}
      className={`ig-avatar-fallback ${className}`.trim()}
      style={{ width: size, height: size, fontSize }}
    >
      {initial}
    </span>
  );
}
