# Instagram Web Clone

A full-stack Instagram Web clone built from scratch using live DOM/CSS reverse engineering of `instagram.com`, with **zero hardcoded or mock data**. Every user, post, reel, story, comment, notification, search result, and direct message is stored in SQLite and served from real uploaded files.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, React 19)
- **Styling:** Custom exact-token CSS (`__fb-dark-mode` & `__fb-light-mode`) matching Instagram Web desktop (`1280px+`) and mobile (`390px`) layouts
- **Database:** Built-in `node:sqlite` (`DatabaseSync`) persisted at `data/insta.db` (configurable via `INSTA_DB_PATH`)
- **Media Storage:** Local disk storage in `storage/uploads/` (configurable via `INSTA_UPLOAD_DIR`) with HTTP `Range` (`206 Partial Content`) byte-range streaming for video playback and scrubbing
- **Authentication:** `scrypt` password hashing + HTTP-only SHA-256 session tokens (`ig_session`)

---

## Features

### Phase 1 — Core Social Graph, Feed & Profiles
- **Authentication:** Sign up (`/accounts/emailsignup/`), log in (`/accounts/login/`), persistent 30-day sessions, logout
- **Navigation Shell:** Collapsible/expanded desktop left rail, mobile top header + bottom tab bar, persistent dark/light theme switcher (`__fb-dark-mode` / `__fb-light-mode`)
- **Posts & Carousels:** Unified Create Post modal supporting multi-file image/video uploads, aspect ratios (`1:1`, `4:5`, `16:9`, `Original`), captions, and locations
- **Engagement:** Likes, saves/bookmarks, threaded post detail modal/page (`/p/[id]/`), comments & comment deletion, post deletion
- **Profiles & Social Graph:** Profile pages (`/[username]/`), Posts / Saved / Tagged tabs, Follow/Unfollow, Followers/Following/Remove-follower modals, Edit Profile + avatar upload (`/accounts/edit/`)

### Phase 2 — Stories, Search & Explore, Notifications
- **Stories:** 24-hour expiring photo stories, Stories tray gradient rings around avatars with unseen/seen tracking, full-screen Story Viewer (`437×778`) with progress bars, pause/play, story likes, view counts, and deletion
- **Search & Explore (`/explore/`):** Live debounced search across accounts (`username`, `full_name`) and posts (`caption`, `location`), plus a responsive `3:4` discovery grid (4 columns desktop / 3 columns mobile)
- **Notifications:** DB-backed real notifications for `like`, `comment`, and `follow` events in both a desktop slide-out drawer (`460px`) and mobile page (`/notifications/`), with filter tabs (`All`, `Comments`, `Likes`, `Follows`) and unread indicator badge

### Phase 3 — Reels & Direct Messaging
- **Reels (`/reels/` & `/reels/[id]/`):** Vertical `scroll-snap-type: y mandatory` feed for uploaded MP4/WebM/MOV videos (`9:16` desktop card / full-bleed mobile viewport), center play/pause indicator, mute toggle, Prev/Next navigation arrows, Follow/Like/Comments sheet/Save/More actions, and video badges across Home, Profile, and Explore grids
- **Direct Messaging (`/direct/inbox/` & `/direct/t/[id]/`):** Split-pane desktop UI & single-pane mobile switching, New Message modal with real user search, text messages, image/video attachments, sharing posts & reels directly into chats, emoji reactions, unsend, mute toggle, conversation info drawer, read receipts (`Seen`), and unread DM badge

---

## Prerequisites

- **Node.js 22.5+** (developed and tested on **Node.js v24**) — required for built-in `node:sqlite`

---

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and create accounts at `/accounts/emailsignup/` to begin posting, messaging, and uploading stories/reels.

3. **Production build & start**
   ```bash
   npm run build
   npm run start
   ```

> **Production HTTPS note:** `ig_session` cookies are marked `Secure` when `NODE_ENV=production` (`src/lib/auth.ts`). When serving the production build over a non-`localhost` host, place it behind an HTTPS terminator (such as Cloudflare Tunnel or Caddy) so browsers store session cookies properly.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `INSTA_DB_PATH` | `data/insta.db` | Path to the SQLite database file |
| `INSTA_UPLOAD_DIR` | `storage/uploads` | Directory where uploaded media files are stored |
| `PORT` | `3000` | Port used by Next.js server |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run Next.js development server with Turbopack |
| `npm run build` | Build production bundle |
| `npm run start` | Start production server |
| `npm run typecheck` | Run TypeScript compiler check (`tsc --noEmit`) |
| `npm test` | Run backend/integration test suites (`tests/*.test.ts`) |

---

## Project Structure

```text
├── docs/superpowers/specs/      # Phase 1, 2, and 3 design specifications
├── src/
│   ├── app/                     # Next.js App Router pages & REST API routes
│   │   ├── api/                 # Auth, posts, media streaming, stories, search, notifications, reels, direct
│   │   ├── accounts/            # Login, signup, edit profile pages
│   │   ├── direct/              # DM inbox & conversation thread pages
│   │   ├── explore/             # Search & Explore page
│   │   ├── notifications/       # Mobile notifications page
│   │   ├── p/[id]/              # Standalone post detail page
│   │   ├── reels/               # Reels feed & per-reel routes
│   │   └── [username]/          # Dynamic user profile route
│   ├── components/              # Client UI components & exact reverse-engineered SVG icons
│   └── lib/                     # SQLite schema/migrations, auth, disk storage, and query modules
└── tests/                       # Isolated unit & integration tests (phase1, phase2, phase3)
```

---

## Verification

Run the automated test suite and static checks:

```bash
npm test
npm run typecheck
npm run build
```
