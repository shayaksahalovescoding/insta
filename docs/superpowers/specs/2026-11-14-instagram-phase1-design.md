# Instagram Web Clone — Phase 1 Reverse-Engineering & Design Spec

**Date:** 2026-11-14  
**Target Platform:** Instagram Web (`https://www.instagram.com/`) — Desktop + Mobile Web  
**Stack:** Next.js (App Router, TypeScript) + Custom Exact-Token CSS + SQLite (`node:sqlite`) + Local Disk Media Storage  
**Strict Data Policy:** Zero hardcoded/mock/fake data in application code. All users, sessions, posts, media files, likes, saves, comments, and follows originate from real user actions persisted in SQLite and `storage/uploads/`. Empty database states render honest empty UIs.

---

## 1. Directly Observed Reverse-Engineering Reference (`instagram.com`)

All visual tokens, dimensions, breakpoints, typography, and SVG icons below were directly measured via Chrome DevTools on live `https://www.instagram.com/` (dark mode `.__fb-dark-mode`, plus light mode stylesheet rules `.__fb-light-mode` extracted from Instagram's CSS bundles).

### 1.1 Global Design Tokens
- **Font Family (`body`):** `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`
- **Base Typography (`body`):** `14px` font-size, `18px` line-height.
- **Dark Mode (`html.__fb-dark-mode`, default when OS prefers dark or toggled via `Switch appearance`):**
  - `--ig-primary-background`: `12, 16, 20` (`#0c1014`)
  - `--ig-secondary-background`: `37, 41, 46` (`#25292e`)
  - `--ig-elevated-background`: `33, 35, 40` (`#212328`)
  - `--ig-secondary-elevated-background`: `43, 48, 54` (`#2b3036`)
  - `--ig-highlight-background`: `38, 38, 38`
  - `--ig-menu-background-color`: `38, 43, 49`
  - `--ig-dropdown-background`: `37, 41, 46`
  - `--ig-primary-text`: `245, 245, 245` / `248, 249, 249`
  - `--ig-secondary-text`: `168, 168, 168` / `162, 170, 180`
  - `--ig-tertiary-text`: `115, 115, 115`
  - `--ig-colors-link-text`: `112, 141, 255` (`#708dff`)
  - `--ig-colors-button-primary-link-text`: `133, 161, 255`
  - `--ig-primary-icon`: `245, 245, 245` / `248, 249, 249`
  - `--ig-secondary-icon`: `142, 142, 142`
  - `--ig-separator`: `38, 38, 38` / `43, 48, 54`
  - `--ig-elevated-separator`: `54, 54, 54`
  - `--ig-stroke`: `54, 54, 54` / `85, 85, 85`
  - `--ig-tablist-border`: `43, 48, 54`
  - `--ig-tab-underline-active`: `248, 249, 249`
  - `--ig-primary-button`: `74, 93, 249` (`#4a5df9`)
  - `--ig-primary-button-hover`: `65, 80, 247` (`#4150f7`)
  - `--ig-colors-button-primary-background--disabled`: `24, 32, 139`
  - `--ig-colors-button-secondary-background`: `37, 41, 46`
  - `--ig-colors-button-secondary-background--hover`: `54, 60, 68`
  - `--ig-badge`: `255, 48, 64`
  - `--ig-error-or-destructive`: `237, 73, 86`
  - `--ig-success`: `88, 195, 34`
  - `--ig-hover-overlay`: `255, 255, 255, .1`
- **Light Mode (`html.__fb-light-mode`):**
  - `--ig-primary-background`: `255, 255, 255`
  - `--ig-secondary-background`: `243, 245, 247`
  - `--ig-elevated-background`: `255, 255, 255`
  - `--ig-highlight-background`: `243, 245, 247`
  - `--ig-primary-text`: `12, 16, 20`
  - `--ig-secondary-text`: `106, 113, 122`
  - `--ig-colors-link-text`: `65, 80, 247`
  - `--ig-primary-icon`: `12, 16, 20`
  - `--ig-separator`: `219, 223, 228`
  - `--ig-stroke`: `219, 219, 219`
  - `--ig-tablist-border`: `219, 223, 228`
  - `--ig-tab-underline-active`: `12, 16, 20`
  - `--ig-colors-button-primary-background--disabled`: `184, 205, 255`
  - `--ig-colors-button-secondary-background`: `240, 242, 245`
  - `--ig-colors-button-secondary-background--hover`: `231, 234, 238`
  - `--ig-hover-overlay`: `12, 16, 20, .05`

### 1.2 Measured Layout & Component Geometry
1. **Responsive Navigation Shell:**
   - **Desktop (`>= 768px`):** Fixed left rail `72px` wide (`padding: 24px 12px`, `z-index: 10`), expanding on hover (`>= 1137px`) as a `238px`-wide `position: absolute` overlay (`background: rgb(var(--ig-primary-background))`), items `48px` hit-target (`56px` outer slot, `padding: 12px`, `margin: 4px 0`, `border-radius: 8px`, `24x24` icon, `16px` label, `font-weight: 700` active / `400` inactive, hover `rgba(var(--ig-hover-overlay))`).
   - **Mobile (`<= 767px`):** Top bar (`45px` high, Instagram wordmark `103x26` `viewBox="0 0 600 150"` + Notifications icon) and fixed bottom tab bar (`50px` high, `background: rgb(var(--ig-primary-background))`, `48x48` hit targets for Home, Search/Explore, Reels, Create, Messages, Profile).
   - **More Popover (`Settings` button at bottom of rail):** `266px` wide, `padding: 8px 0`, `border-radius: 20px`, `background: rgba(43, 48, 54, 0.5)` with backdrop blur / `box-shadow: 0 8px 48px 0 rgba(0,0,0,0.18)`, `50px`-tall items (`18x18` SVG + `14px` text), `6px` separator, `Switch appearance`, `Saved`, `Settings` (`/accounts/edit/`), `Log out`.
2. **Home Feed (`/`):**
   - `<main>` centered flex row (`margin-left: 72px` on desktop).
   - Feed column wrapper: `max-width: 630px`, `margin-top: 16px`, inner post stream `470px` wide.
   - Right Sidebar (visible `>= 1137px`): `width: 319px`, `margin-top: 36px`, `margin-left: 64px` gap from feed column. Contains current user card (`44x44` avatar, username, full name, `Switch` action), `Suggested for you` (real DB users not yet followed, up to 5), and footer (`12px`, `rgb(var(--ig-secondary-text))`).
   - Post Card (`470px` wide):
     - Header: `32px` tall (`32x32` avatar, `14px` weight-600 username in `rgb(var(--ig-colors-link-text))`, `14px` relative timestamp in secondary text, `24x24` `More options` 3-dot icon).
     - Media frame: `width: 100%`, `border-radius: 6px`, `border: 1px solid rgb(var(--ig-separator))`, overflow hidden. Supports single image/video and multi-image carousel (`30x30` prev/next chevron controls, `6px` indicator dots with active dot `rgb(74, 93, 249)`).
     - Action bar (`40px` tall): `24x24` Like (outline / filled `#ff3040`), Comment, Share, Save (outline / filled primary icon) with inline counts, followed by likes summary (`14px`), caption (`14px` bold username + text with `more` truncation), and comment count button opening Post Detail (`/p/[id]/`).
3. **Post Detail Modal & Page (`/p/[id]/`):**
   - Intercepted modal on desktop (`max-width: 1297px`, `height: min(852px, calc(100vh - 48px))`, `border-radius: 16px`, backdrop `rgba(12, 16, 20, 0.7)`) and standalone route `/p/[id]/` for direct links/refresh.
   - Left media pane: flex-grow square/aspect container on `rgb(0, 0, 0)` with carousel prev/next + white `6px` dots.
   - Right details pane: `445px` wide (`min-width: 405px`, `max-width: 500px`), `60px` header (`padding: 14px 16px`), scrollable comment list `<ul>` (`padding: 16px`, caption first + comments), `55px` action bar (`border-top: 1px solid rgb(var(--ig-separator))`), and `40px+` comment composer (`Emoji` icon + `<textarea placeholder="Add a comment…">` + `Post` button).
4. **Create Post Modal:**
   - Dialog `681x724` (responsive on mobile), `border-radius: 24px`, `background: rgb(var(--ig-elevated-background))`.
   - Header `43px` (`background: rgb(var(--ig-primary-background))`, `"Create new post"` `16px` weight-600, Back/Next/Share controls).
   - Step 1 (Select): `96x77` media SVG, `"Drag photos and videos here"`, `"Select from computer"` primary `#4a5df9` button (`border-radius: 8px`, `padding: 7px 16px`, `height: 32px`), supports multi-file selection (up to 10 images) & drag-and-drop.
   - Step 2 (Crop/Preview): Aspect ratio selector (`Original`, `1:1`, `4:5`, `16:9`) & carousel thumbnail strip/reorder.
   - Step 3 (Details): Split preview + right panel with user row, caption `<textarea>` (max 2,200 chars), location input, and `"Share"` submit calling `POST /api/posts`.
5. **Profile (`/[username]/`) & Edit Profile (`/accounts/edit/`):**
   - Profile container (`max-width: 1054px`, `padding: 30px 20px 0`), centered `<header>` (`max-width: 680px`, `margin: 0 auto 16px`):
     - Avatar: `150x150` desktop / `77x77` mobile (`border-radius: 50%`).
     - Username `<h2>`: `24px` weight-700, `30px` line-height.
     - Stats: `posts`, `followers`, `following` (`14px`, clickable Followers/Following modals).
     - Name + Bio (`14px`, `18px` line-height).
     - Action buttons (`height: 44px`, `border-radius: 12px`, `background: rgb(var(--ig-secondary-background))`, `font-weight: 600`): `Edit profile` & `View saved` for own profile; `Follow` (`#4a5df9`) / `Following` (`#25292e`) for others.
   - Tab bar (`height: 45px`, `border-bottom: 1px solid rgb(var(--ig-tablist-border))`): `Posts`, `Saved` (owner only), `Tagged` (`64x44` icon tabs, `2px solid rgb(var(--ig-tab-underline-active))` active indicator).
   - Grid: **4 columns** desktop / **3 columns** mobile (`aspect-ratio: 3 / 4`, `gap: 1px`), hover overlay `rgba(0, 0, 0, 0.7)` showing heart + comment counts (`16px` bold white).
   - Followers / Following Modal: `560px` wide (max `calc(100vw - 32px)`), `max-height: 788px`, `border-radius: 24px`, `background: rgb(var(--ig-elevated-background))`, `57px` header, `400x32` pill search (`border-radius: 25px`), `44x44` avatar rows with `Remove` / `Follow` / `Following` actions.
   - Edit Profile (`/accounts/edit/`): Left settings sidebar + `610px` form column with `88px`-tall avatar card (`border-radius: 20px`, `56x56` avatar, `Change photo` `#4a5df9` button), Full Name, Username, Bio (`border-radius: 12px`), Gender select, `Submit` button (`height: 44px`, `border-radius: 12px`).
6. **Auth Pages (`/accounts/login/`, `/accounts/emailsignup/`):**
   - Exact Instagram dark/light styling matching the observed login modal tokens: `38px`-tall inputs (`border: 1px solid rgb(var(--ig-stroke))`, `border-radius: 3px`, `background: rgb(var(--ig-secondary-background))`, floating `12px` label), `#4a5df9` `32px`-tall `border-radius: 8px` primary button (`opacity`/disabled `#18208b`), Instagram wordmark SVG (`viewBox="0 0 600 150"`).

---

## 2. Backend, Database Schema & Media Storage

### 2.1 SQLite Schema (`data/insta.db` via `node:sqlite`)
- `users`: `id TEXT PK`, `username TEXT UNIQUE NOT NULL`, `email TEXT UNIQUE NOT NULL`, `password_hash TEXT NOT NULL`, `full_name TEXT NOT NULL DEFAULT ''`, `bio TEXT NOT NULL DEFAULT ''`, `gender TEXT NOT NULL DEFAULT 'Prefer not to say'`, `avatar_url TEXT`, `theme_preference TEXT NOT NULL DEFAULT 'dark'`, `created_at INTEGER NOT NULL`
- `sessions`: `id TEXT PK`, `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `token_hash TEXT UNIQUE NOT NULL`, `expires_at INTEGER NOT NULL`, `created_at INTEGER NOT NULL`
- `posts`: `id TEXT PK`, `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `caption TEXT NOT NULL DEFAULT ''`, `location TEXT NOT NULL DEFAULT ''`, `aspect_ratio TEXT NOT NULL DEFAULT '1:1'`, `created_at INTEGER NOT NULL`
- `post_media`: `id TEXT PK`, `post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE`, `file_path TEXT NOT NULL`, `mime_type TEXT NOT NULL`, `width INTEGER`, `height INTEGER`, `order_index INTEGER NOT NULL`
- `likes`: `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE`, `created_at INTEGER NOT NULL`, `PRIMARY KEY (user_id, post_id)`
- `saved_posts`: `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE`, `created_at INTEGER NOT NULL`, `PRIMARY KEY (user_id, post_id)`
- `comments`: `id TEXT PK`, `post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE`, `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE`, `content TEXT NOT NULL`, `created_at INTEGER NOT NULL`
- `follows`: `follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `created_at INTEGER NOT NULL`, `PRIMARY KEY (follower_id, following_id)`

### 2.2 Media Storage
- Uploads saved to `storage/uploads/<postOrAvatarId>/<uuid>.<ext>` (only validated `image/jpeg`, `image/png`, `image/webp`, `image/gif`; max 10 MB per file; max 10 files per post).
- Served via `GET /api/media/[...path]` with path-traversal protection (`path.resolve` containment check), `Content-Type`, and `Cache-Control`.

### 2.3 Auth & API Routes
- Password hashing with Node built-in `crypto.scryptSync` + per-user salt + `crypto.timingSafeEqual`.
- HTTP-only `SameSite=Lax` session cookie (`ig_session`).
- Route Handlers:
  - `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
  - `GET /api/feed` (posts from followed users + own posts, paginated, with real counts & viewer `liked`/`saved` flags; returns empty array if none)
  - `POST /api/posts`, `GET /api/posts/[id]`, `DELETE /api/posts/[id]`
  - `POST /api/posts/[id]/like` (toggle), `POST /api/posts/[id]/save` (toggle)
  - `GET /api/posts/[id]/comments`, `POST /api/posts/[id]/comments`, `DELETE /api/comments/[id]`
  - `GET /api/users/[username]`, `PATCH /api/users/me`, `POST /api/users/me/avatar`
  - `POST /api/users/[username]/follow` (toggle), `GET /api/users/[username]/followers`, `GET /api/users/[username]/following`, `DELETE /api/users/me/followers/[followerId]`
  - `GET /api/users/suggested` (real DB users not yet followed by viewer)
  - `GET /api/media/[...path]`

---

## 3. Phase 1 Scope Boundaries (Deferred to Phase 2 & 3)
- **Phase 1 (Current):** Exact Auth (`/accounts/login/`, `/accounts/emailsignup/`), Navigation Shell + Theme Toggle (`Switch appearance`) + `More` popover, Home Feed + Right Sidebar + Post Card + Carousel + Likes + Saves + Post Detail Modal/Page + Comments + Create Post Modal + Profile (`Posts` & `Saved` tabs) + Edit Profile + Follow/Unfollow + Followers/Following Modals.
- **Phase 2 (Next):** Stories tray + Story viewer/upload, Explore grid (`/explore/`), Search drawer (live user/post search), Notifications drawer (real likes/comments/follows activity).
- **Phase 3 (Final):** Direct Messaging (`/direct/inbox/`), Reels (`/reels/` + video upload/player).

*Note on Phase 1 Rail Items:* Phase 1 renders the full authentic Instagram left rail layout. Items implemented in Phase 1 (`Home`, `Create`, `Profile`, `More`/`Settings`, `Switch appearance`, `Saved`, `Log out`) are fully live; Phase 2/3 destinations (`Search`, `Explore`, `Reels`, `Messages`, `Notifications`) route cleanly to honest "Coming in Phase 2/3" views or stay cleanly linked without fake data.

---

## 4. Verification Plan
1. **Unit & API Integration Tests (Node test runner `node --test`):**
   - Auth signup/login/logout/session validation, duplicate username/email rejection.
   - Post creation (multipart upload validation, carousel ordering, deletion ownership).
   - Likes, saves, comments, follows, follower removal, and feed/profile query correctness against an isolated SQLite DB.
2. **Production Build & Typecheck:**
   - `npx tsc --noEmit` and `npm run build` pass cleanly.
3. **Live Browser Verification (Playwright / Chrome):**
   - Start real Next.js server with clean DB (verify honest empty states on `/` before any posts exist).
   - Sign up two real accounts in browser, upload real avatar & carousel post images, like, save, comment, follow/unfollow, edit profile, switch dark/light appearance, and verify desktop (`1440x900`), collapsed rail (`1100x800`), and mobile (`390x844`) layouts.
