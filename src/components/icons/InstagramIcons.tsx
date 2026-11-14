import React from "react";

interface IconProps {
  size?: number;
  className?: string;
  title?: string;
}

export function InstagramWordmark({
  width = 103,
  height = 26,
  className,
}: {
  width?: number;
  height?: number;
  className?: string;
}) {
  return (
    <svg
      aria-label="Instagram"
      className={className}
      fill="currentColor"
      height={height}
      role="img"
      viewBox="0 0 600 150"
      width={width}
    >
      <title>Instagram</title>
      <polygon points="0 106.31 15.08 106.31 15.08 8.46 0 11.82 0 106.31" />
      <path d="M116.77,35.06h0c-5.3,19.69-12.18,38.75-20.69,56.21-1.6,3.2-2.88,4.33-4.65,4.33-1.6,0-2.73-.96-2.73-3.36v-28.03c0-17.78-9.14-29.95-26.14-29.95-8.83,0-16.2,4.16-20.21,11.69v-10.25h-14.28v70.62h14.28v-40.84c0-11.05,7.06-19.37,16.84-19.37,9.13,0,15.23,6.57,15.23,19.22v27.23c0,10.09,5.61,15.05,15.72,15.06,8.34,0,13.47-3.53,17.48-11.69,6.74-13.94,12.83-29.63,17.32-45.33,8.18,14.73,21.97,21.94,21.97,33.47,0,5.93-4.01,11.86-13.63,11.86-5.3,0-10.11-2.4-13.31-5.13l-5.77,11.53c4.01,3.04,11.55,5.6,19.09,5.6,17.32,0,27.43-10.73,27.43-24.19,0-19.06-23.42-29.47-28.23-48.68h-15.72Z" />
      <path d="M201.46,92.08c-2.72,1.76-5.12,2.56-7.85,2.56h0c-4.97-.01-7.7-3.05-7.7-8.34v-37.79h16.52v-12.81h-16.52V14.72l-14.28,3.04v17.94h-14.59v12.81h14.59v40.2c0,10.88,7.22,18.58,19.89,18.58,6.73,0,11.55-1.92,15.55-4.48h0s0,0,0,0h0s0,0,0,0l-5.6-10.71Z" />
      <path d="M575.46,34.23c-9.95,0-17.98,4.32-21.82,12.01-3.85-7.52-11.22-12.01-21.33-12.01-8.18,0-15.07,3.69-18.6,10.26v-8.81h-14.28v70.63h14.28v-44.51c0-8.97,6.41-15.7,15.23-15.7,8.02,0,13.63,5.44,13.63,16.01v44.2h14.28v-44.52c0-8.97,6.1-15.7,15.08-15.7,8.02,0,13.79,5.44,13.79,16.01v44.2h14.28v-45.49c0-15.86-8.82-26.58-24.54-26.58Z" />
      <path d="M263.52,43.37c-5.93-6.09-14.12-9.29-23.26-9.29-19.09,0-33.2,16.01-33.2,36.83s14.12,36.99,33.2,36.99c9.46,0,17.49-3.85,23.26-10.09v8.49h14.28V35.69h-14.28v7.69ZM242.35,95.42c-11.71,0-21.17-9.61-21.17-24.5s9.62-24.34,21.17-24.34,21.17,9.45,21.17,24.34-9.46,24.5-21.17,24.5Z" />
      <path d="M472.66,43.37h-.01c-5.93-6.09-14.12-9.29-23.26-9.29-19.09,0-33.2,16.01-33.2,36.83,0,6.39,1.32,12.32,3.68,17.47-4.5,4.85-9.42,7.04-14.74,7.04-8.19,0-13.47-4.97-13.47-15.05s5.61-21.95,18.12-32.36l-6.41-12.33h-36.72v12.81h25.98c-8.98,9.93-14.76,22.42-14.76,33.79,0,16.5,10.91,25.63,25.82,25.63,8.6,0,16.92-3.83,22.41-10.14,5.88,6.33,14,10.14,23.3,10.14,9.3,0,17.49-3.85,23.26-10.09v8.49h14.28V35.69h-14.28v7.69ZM451.49,95.42c-11.71,0-21.17-9.61-21.17-24.5s9.62-24.34,21.17-24.34c11.55,0,21.17,9.45,21.17,24.34s-9.46,24.5-21.17,24.5Z" />
      <path d="M344.18,43.36c-5.93-6.09-13.96-9.29-22.93-9.29-18.92,0-33.52,15.53-33.52,36.99,0,19.06,12.04,33.79,28.23,36.36-7.38,4.32-10.75,8.98-10.75,16.02,0,10.09,8.34,18.1,23.26,18.1,19.72,0,29.99-13.46,29.99-30.91V35.67h-14.28v7.69ZM344.18,112.08c0,11.69-6.9,17.13-14.92,17.13-7.22,0-10.59-4.17-10.59-8.49s2.73-9.77,14.76-15.21c4.17-1.92,7.87-4.49,10.75-7.69v14.26ZM323.02,95.42c-11.7,0-21.17-9.61-21.17-24.5,0-14.89,9.62-24.34,21.17-24.34,11.55,0,21.17,9.45,21.17,24.34s-9.46,24.5-21.17,24.5Z" />
    </svg>
  );
}

export function InstagramGlyphIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Instagram"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Instagram</title>
      <path d="M12 2.982c2.937 0 3.285.011 4.445.064a6.087 6.087 0 0 1 2.042.379 3.408 3.408 0 0 1 1.265.823 3.408 3.408 0 0 1 .823 1.265 6.087 6.087 0 0 1 .379 2.042c.053 1.16.064 1.508.064 4.445s-.011 3.285-.064 4.445a6.087 6.087 0 0 1-.379 2.042 3.643 3.643 0 0 1-2.088 2.088 6.087 6.087 0 0 1-2.042.379c-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064a6.087 6.087 0 0 1-2.043-.379 3.408 3.408 0 0 1-1.264-.823 3.408 3.408 0 0 1-.823-1.265 6.087 6.087 0 0 1-.379-2.042c-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445a6.087 6.087 0 0 1 .379-2.042 3.408 3.408 0 0 1 .823-1.265 3.408 3.408 0 0 1 1.265-.823 6.087 6.087 0 0 1 2.042-.379c1.16-.053 1.508-.064 4.445-.064M12 1c-2.987 0-3.362.013-4.535.066a8.074 8.074 0 0 0-2.67.511 5.392 5.392 0 0 0-1.949 1.27 5.392 5.392 0 0 0-1.269 1.948 8.074 8.074 0 0 0-.51 2.67C1.012 8.638 1 9.013 1 12s.013 3.362.066 4.535a8.074 8.074 0 0 0 .511 2.67 5.392 5.392 0 0 0 1.27 1.949 5.392 5.392 0 0 0 1.948 1.269 8.074 8.074 0 0 0 2.67.51C8.638 22.988 9.013 23 12 23s3.362-.013 4.535-.066a8.074 8.074 0 0 0 2.67-.511 5.625 5.625 0 0 0 3.218-3.218 8.074 8.074 0 0 0 .51-2.67C22.988 15.362 23 14.987 23 12s-.013-3.362-.066-4.535a8.074 8.074 0 0 0-.511-2.67 5.392 5.392 0 0 0-1.27-1.949 5.392 5.392 0 0 0-1.948-1.269 8.074 8.074 0 0 0-2.67-.51C15.362 1.012 14.987 1 12 1Zm0 5.351A5.649 5.649 0 1 0 17.649 12 5.649 5.649 0 0 0 12 6.351Zm0 9.316A3.667 3.667 0 1 1 15.667 12 3.667 3.667 0 0 1 12 15.667Zm5.872-10.859a1.32 1.32 0 1 0 1.32 1.32 1.32 1.32 0 0 0-1.32-1.32Z" />
    </svg>
  );
}

export function HomeIcon({
  size = 24,
  active = true,
  className,
}: IconProps & { active?: boolean }) {
  return (
    <svg
      aria-label="Home"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Home</title>
      {active ? (
        <path d="m21.762 8.786-7-6.68a3.994 3.994 0 0 0-5.524 0l-7 6.681A4.017 4.017 0 0 0 1 11.68V19c0 2.206 1.794 4 4 4h3.005a1 1 0 0 0 1-1v-7.003a2.997 2.997 0 0 1 5.994 0V22a1 1 0 0 0 1 1H19c2.206 0 4-1.794 4-4v-7.32a4.02 4.02 0 0 0-1.238-2.894Z" />
      ) : (
        <path
          d="M9.005 16.545a2.997 2.997 0 0 1 2.997-2.997A2.997 2.997 0 0 1 15 16.545V22h7V11.543L12 2 2 11.543V22h7.005Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      )}
    </svg>
  );
}

export function SearchIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Search"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Search</title>
      <path
        d="M19 10.5A8.5 8.5 0 1 1 10.5 2a8.5 8.5 0 0 1 8.5 8.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <line
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        x1="16.511"
        x2="22"
        y1="16.511"
        y2="22"
      />
    </svg>
  );
}

export function ReelsIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Reels"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Reels</title>
      <path d="M22.935 7.468c-.063-1.36-.307-2.142-.512-2.67a5.341 5.341 0 0 0-1.27-1.95 5.345 5.345 0 0 0-1.95-1.27c-.53-.206-1.311-.45-2.672-.513C15.333 1.012 14.976 1 12 1s-3.333.012-4.532.065c-1.36.063-2.142.307-2.67.512-.77.298-1.371.69-1.95 1.27a5.36 5.36 0 0 0-1.27 1.95c-.206.53-.45 1.311-.513 2.672C1.012 8.667 1 9.024 1 12s.012 3.333.065 4.532c.063 1.36.307 2.142.512 2.67.297.77.69 1.372 1.27 1.95.58.581 1.181.974 1.95 1.27.53.206 1.311.45 2.672.513C8.667 22.988 9.024 23 12 23s3.333-.012 4.532-.065c1.36-.063 2.142-.307 2.67-.512a5.33 5.33 0 0 0 1.95-1.27 5.356 5.356 0 0 0 1.27-1.95c.206-.53.45-1.311.513-2.672.053-1.198.065-1.555.065-4.531s-.012-3.333-.065-4.532Zm-1.998 8.972c-.05 1.07-.228 1.652-.38 2.04-.197.51-.434.874-.82 1.258a3.362 3.362 0 0 1-1.258.82c-.387.151-.97.33-2.038.379-1.162.052-1.51.063-4.441.063s-3.28-.01-4.44-.063c-1.07-.05-1.652-.228-2.04-.38a3.354 3.354 0 0 1-1.258-.82 3.362 3.362 0 0 1-.82-1.258c-.151-.387-.33-.97-.379-2.038C3.011 15.28 3 14.931 3 12s.01-3.28.063-4.44c.05-1.07.228-1.652.38-2.04.197-.51.434-.875.82-1.26a3.372 3.372 0 0 1 1.258-.819c.387-.15.97-.329 2.038-.378C8.72 3.011 9.069 3 12 3s3.28.01 4.44.063c1.07.05 1.652.228 2.04.38.51.197.874.433 1.258.82.385.382.622.747.82 1.258.151.387.33.97.379 2.038C20.989 8.72 21 9.069 21 12s-.01 3.28-.063 4.44Zm-4.584-6.828-5.25-3a2.725 2.725 0 0 0-2.745.01A2.722 2.722 0 0 0 6.988 9v6c0 .992.512 1.88 1.37 2.379.432.25.906.376 1.38.376.468 0 .937-.123 1.365-.367l5.25-3c.868-.496 1.385-1.389 1.385-2.388s-.517-1.892-1.385-2.388Zm-.993 3.04-5.25 3a.74.74 0 0 1-.748-.003.74.74 0 0 1-.374-.649V9a.74.74 0 0 1 .374-.65.737.737 0 0 1 .748-.002l5.25 3c.341.196.378.521.378.652s-.037.456-.378.651Z" />
    </svg>
  );
}

export function MessagesIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Messages"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Messages</title>
      <path
        d="M13.973 20.046 21.77 6.928C22.8 5.195 21.55 3 19.535 3H4.466C2.138 3 .984 5.825 2.646 7.456l4.842 4.752 1.723 7.121c.548 2.266 3.571 2.721 4.762.717Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <line
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        x1="7.488"
        x2="15.515"
        y1="12.208"
        y2="7.641"
      />
    </svg>
  );
}

export function HeartOutlineIcon({
  size = 24,
  title = "Notifications",
  className,
}: IconProps) {
  return (
    <svg
      aria-label={title}
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>{title}</title>
      <path d="M16.792 3.904A4.989 4.989 0 0 1 21.5 9.122c0 3.072-2.652 4.959-5.197 7.222-2.512 2.243-3.865 3.469-4.303 3.752-.477-.309-2.143-1.823-4.303-3.752C5.141 14.072 2.5 12.167 2.5 9.122a4.989 4.989 0 0 1 4.708-5.218 4.21 4.21 0 0 1 3.675 1.941c.84 1.175.98 1.763 1.12 1.763s.278-.588 1.11-1.766a4.17 4.17 0 0 1 3.679-1.938m0-2a6.04 6.04 0 0 0-4.797 2.127 6.052 6.052 0 0 0-4.787-2.127A6.985 6.985 0 0 0 .5 9.122c0 3.61 2.55 5.827 5.015 7.97.283.246.569.494.853.747l1.027.918a44.998 44.998 0 0 0 3.518 3.018 2 2 0 0 0 2.174 0 45.263 45.263 0 0 0 3.626-3.115l.922-.824c.293-.26.59-.519.885-.774 2.334-2.025 4.98-4.32 4.98-7.94a6.985 6.985 0 0 0-6.708-7.218Z" />
    </svg>
  );
}

export function HeartFilledIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Unlike"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 48 48"
      width={size}
      style={{ color: "rgb(255, 48, 64)" }}
    >
      <title>Unlike</title>
      <path d="M34.6 3.1c-4.5 0-7.9 1.8-10.6 5.6-2.7-3.7-6.1-5.5-10.6-5.5C6 3.1 0 9.6 0 17.6c0 7.3 5.4 12 10.6 16.5.6.5 1.3 1.1 1.9 1.7l2.3 2c4.4 3.9 6.6 5.9 7.6 6.5.5.3 1.1.5 1.6.5s1.1-.2 1.6-.5c1-.6 2.8-2.2 7.8-6.8l2-1.8c.7-.6 1.3-1.2 2-1.7C42.7 29.6 48 25 48 17.6c0-8-6-14.5-13.4-14.5z" />
    </svg>
  );
}

export function CreatePostIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="New post"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>New post</title>
      <path d="M21 11h-8V3a1 1 0 1 0-2 0v8H3a1 1 0 1 0 0 2h8v8a1 1 0 1 0 2 0v-8h8a1 1 0 1 0 0-2Z" />
    </svg>
  );
}

export function HamburgerMenuIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Settings"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Settings</title>
      <line
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        x1="3"
        x2="21"
        y1="4"
        y2="4"
      />
      <line
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        x1="3"
        x2="21"
        y1="12"
        y2="12"
      />
      <line
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        x1="3"
        x2="21"
        y1="20"
        y2="20"
      />
    </svg>
  );
}

export function MoreOptionsIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="More options"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>More options</title>
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="6" cy="12" r="1.5" />
      <circle cx="18" cy="12" r="1.5" />
    </svg>
  );
}

export function CommentIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Comment"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Comment</title>
      <path
        d="M20.656 17.008a9.993 9.993 0 1 0-3.59 3.615L22 22Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ShareIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Share"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Share</title>
      <path
        d="M13.973 20.046 21.77 6.928C22.8 5.195 21.55 3 19.535 3H4.466C2.138 3 .984 5.825 2.646 7.456l4.842 4.752 1.723 7.121c.548 2.266 3.571 2.721 4.762.717Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <line
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        x1="7.488"
        x2="15.515"
        y1="12.208"
        y2="7.641"
      />
    </svg>
  );
}

export function BookmarkOutlineIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Save"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Save</title>
      <polygon
        fill="none"
        points="20 21 12 13.44 4 21 4 3 20 3 20 21"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function BookmarkFilledIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Remove"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Remove</title>
      <path d="M20 22a.999.999 0 0 1-.687-.273L12 14.815l-7.313 6.912A1 1 0 0 1 3 21V3a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1Z" />
    </svg>
  );
}

export function CloseIcon({ size = 24, strokeWidth = 2, className }: IconProps & { strokeWidth?: number }) {
  return (
    <svg
      aria-label="Close"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Close</title>
      <line
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        x1="21"
        x2="3"
        y1="3"
        y2="21"
      />
      <line
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        x1="21"
        x2="3"
        y1="21"
        y2="3"
      />
    </svg>
  );
}

export function CreateMediaPlaceholderIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-label="Icon to represent media such as images or videos"
      className={className}
      fill="currentColor"
      height="77"
      role="img"
      viewBox="0 0 97.6 77.3"
      width="96"
    >
      <title>Icon to represent media such as images or videos</title>
      <path
        d="M16.3 24h.3c2.8-.2 4.9-2.6 4.8-5.4-.2-2.8-2.6-4.9-5.4-4.8s-4.9 2.6-4.8 5.4c.1 2.7 2.4 4.8 5.1 4.8zm-2.4-7.2c.5-.6 1.3-1 2.1-1h.2c1.7 0 3.1 1.4 3.1 3.1 0 1.7-1.4 3.1-3.1 3.1-1.7 0-3.1-1.4-3.1-3.1 0-.8.3-1.5.8-2.1z"
        fill="currentColor"
      />
      <path
        d="M84.7 18.4 58 16.9l-.2-3c-.3-5.7-5.2-10.1-11-9.8L12.9 6c-5.7.3-10.1 5.3-9.8 11L5 51v.8c.7 5.2 5.1 9.1 10.3 9.1h.6l21.7-1.2v.6c-.3 5.7 4 10.7 9.8 11l34 2h.6c5.5 0 10.1-4.3 10.4-9.8l2-34c.4-5.8-4-10.7-9.7-11.1zM7.2 10.8C8.7 9.1 10.8 8.1 13 8l34-1.9c4.6-.3 8.6 3.3 8.9 7.9l.2 2.8-5.3-.3c-5.7-.3-10.7 4-11 9.8l-.6 9.5-9.5 10.7c-.2.3-.6.4-1 .5-.4 0-.7-.1-1-.4l-7.8-7c-1.4-1.3-3.5-1.1-4.8.3L7 49 5.2 17c-.2-2.3.6-4.5 2-6.2zm8.7 48c-4.3.2-8.1-2.8-8.8-7.1l9.4-10.5c.2-.3.6-.4 1-.5.4 0 .7.1 1 .4l7.8 7c.7.6 1.6.9 2.5.9.9 0 1.7-.5 2.3-1.1l7.8-8.8-1.1 18.6-21.9 1.1zm76.5-29.5-2 34c-.3 4.6-4.3 8.2-8.9 7.9l-34-2c-4.6-.3-8.2-4.3-7.9-8.9l2-34c.3-4.4 3.9-7.9 8.4-7.9h.5l34 2c4.7.3 8.2 4.3 7.9 8.9z"
        fill="currentColor"
      />
      <path
        d="M78.2 41.6 61.3 30.5c-2.1-1.4-4.9-.8-6.2 1.3-.4.7-.7 1.4-.7 2.2l-1.2 20.1c-.1 2.5 1.7 4.6 4.2 4.8h.3c.7 0 1.4-.2 2-.5l18-9c2.2-1.1 3.1-3.8 2-6-.4-.7-.9-1.3-1.5-1.8zm-1.4 6-18 9c-.4.2-.8.3-1.3.3-.4 0-.9-.2-1.2-.4-.7-.5-1.2-1.3-1.1-2.2l1.2-20.1c.1-.9.6-1.7 1.4-2.1.8-.4 1.7-.3 2.5.1L77 43.3c1.2.8 1.5 2.3.7 3.4-.2.4-.5.7-.9.9z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SettingsGearIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      aria-label="Settings"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Settings</title>
      <circle
        cx="12"
        cy="12"
        fill="none"
        r="8.635"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M14.232 3.656a1.269 1.269 0 0 1-.796-.66L12.93 2h-1.86l-.505.996a1.269 1.269 0 0 1-.796.66m-.001 16.688a1.269 1.269 0 0 1 .796.66l.505.996h1.862l.505-.996a1.269 1.269 0 0 1 .796-.66M3.656 9.768a1.269 1.269 0 0 1-.66.796L2 11.07v1.862l.996.505a1.269 1.269 0 0 1 .66.796m16.688-.001a1.269 1.269 0 0 1 .66-.796L22 12.93v-1.86l-.996-.505a1.269 1.269 0 0 1-.66-.796M7.678 4.522a1.269 1.269 0 0 1-1.03.096l-1.06-.348L4.27 5.587l.348 1.062a1.269 1.269 0 0 1-.096 1.03m11.8 11.799a1.269 1.269 0 0 1 1.03-.096l1.06.348 1.318-1.317-.348-1.062a1.269 1.269 0 0 1 .096-1.03m-14.956.001a1.269 1.269 0 0 1 .096 1.03l-.348 1.06 1.317 1.318 1.062-.348a1.269 1.269 0 0 1 1.03.096m11.799-11.8a1.269 1.269 0 0 1-.096-1.03l.348-1.06-1.317-1.318-1.062.348a1.269 1.269 0 0 1-1.03-.096"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

export function ThemeMoonIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      aria-label="Theme icon"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Theme icon</title>
      <path d="M11.502,22.99805A11.4313,11.4313,0,0,1,.49512,14.83691a.99889.99889,0,0,1,.251-.998,1.01148,1.01148,0,0,1,.99707-.249,9.43041,9.43041,0,0,0,2.75879.40821A9.5082,9.5082,0,0,0,13.5957,1.74023a1.00039,1.00039,0,0,1,1.24707-1.248A11.501,11.501,0,0,1,11.502,22.99805ZM3.08984,15.91211A9.49991,9.49991,0,0,0,21.002,11.498,9.57875,9.57875,0,0,0,15.916,3.08594,11.5083,11.5083,0,0,1,3.08984,15.91211Z" />
    </svg>
  );
}

export function PostsGridTabIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Posts"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Posts</title>
      <rect height="6" rx="1" ry="1" width="4.667" x="3" y="1" />
      <rect height="6" rx="1" ry="1" width="4.667" x="16.333" y="1" />
      <rect height="6" rx="1" ry="1" width="4.667" x="9.667" y="1" />
      <rect height="6" rx="1" ry="1" width="4.667" x="3" y="9" />
      <rect height="6" rx="1" ry="1" width="4.667" x="16.333" y="9" />
      <rect height="6" rx="1" ry="1" width="4.667" x="9.667" y="9" />
      <rect height="6" rx="1" ry="1" width="4.667" x="3" y="17" />
      <rect height="6" rx="1" ry="1" width="4.667" x="16.333" y="17" />
      <rect height="6" rx="1" ry="1" width="4.667" x="9.667" y="17" />
    </svg>
  );
}

export function TaggedTabIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Tagged"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Tagged</title>
      <path d="M21 7.48a2 2 0 0 0-2-2h-3.046a2.002 2.002 0 0 1-1.506-.683l-1.695-1.939a1 1 0 0 0-1.506 0L9.552 4.797c-.38.434-.93.682-1.506.682H5a2 2 0 0 0-2 2V19l.01.206A2 2 0 0 0 5 21h14a2 2 0 0 0 2-2V7.48ZM23 19a4 4 0 0 1-4 4H5a4 4 0 0 1-3.995-3.794L1 19V7.48a4 4 0 0 1 4-4h3.046l1.696-1.94a3 3 0 0 1 4.516 0l1.696 1.94H19a4 4 0 0 1 4 4V19Z" />
      <path d="M14.5 10.419a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Zm2 0a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM12 16.003c3.511 0 6.555 1.99 8.13 4.906a1 1 0 0 1-1.76.95c-1.248-2.31-3.64-3.857-6.37-3.857S6.878 19.55 5.63 21.86a1 1 0 0 1-1.76-.951c1.575-2.915 4.618-4.906 8.13-4.906Z" />
    </svg>
  );
}

export function EmojiIcon({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-label="Emoji"
      className={className}
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 24 24"
      width={size}
    >
      <title>Emoji</title>
      <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z" />
    </svg>
  );
}

export function CarouselIndicatorIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      aria-label="Carousel"
      fill="currentColor"
      height={size}
      role="img"
      viewBox="0 0 48 48"
      width={size}
    >
      <title>Carousel</title>
      <path d="M34.8 29.7V11c0-2.9-2.3-5.2-5.2-5.2H11c-2.9 0-5.2 2.3-5.2 5.2v18.7c0 2.9 2.3 5.2 5.2 5.2h18.7c2.8-.1 5.1-2.4 5.1-5.2zM39.2 15v16.1c0 4.5-3.7 8.2-8.2 8.2H14.9c-.6 0-.9.7-.5 1.1 1 1.1 2.4 1.8 4.1 1.8h13.4c5.7 0 10.3-4.6 10.3-10.3V18.5c0-1.6-.7-3.1-1.8-4.1-.5-.4-1.2 0-1.2.6z" />
    </svg>
  );
}

export function ChevronIcon({
  direction = "right",
  size = 16,
}: {
  direction?: "left" | "right" | "down";
  size?: number;
}) {
  const rotation =
    direction === "left" ? "rotate(-90deg)" : direction === "down" ? "rotate(180deg)" : "rotate(90deg)";
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      style={{ transform: rotation }}
    >
      <path d="M21 17.502a.997.997 0 0 1-.707-.293L12 8.913l-8.293 8.296a1 1 0 1 1-1.414-1.414l9-9.004a1.03 1.03 0 0 1 1.414 0l9 9.004A1 1 0 0 1 21 17.502Z" />
    </svg>
  );
}
