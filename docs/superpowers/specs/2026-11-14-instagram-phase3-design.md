# Instagram Web Clone — Phase 3 Design Spec (Reels & Direct Messaging)

**Date:** 2026-11-14  
**Phase Scope:** Phase 3 — Real Video Uploads & Reels Feed (`/reels/`, `/reels/[id]/`), Real Direct Messaging Inbox & Threads (`/direct/inbox/`, `/direct/t/[id]/`), New Message Modal, Emoji Reactions, Media Attachments, Share-Post/Reel-to-DM, and Unread DM Badge.  
**Reference:** Live inspection of `https://www.instagram.com/reels/` and `https://www.instagram.com/direct/inbox/` at desktop (`1280x900`) and mobile (`390x844`).

---

## 1. Architecture & Real Data Guarantees

All data is backed by SQLite (`data/insta.db` via `node:sqlite`) and disk uploads (`storage/uploads/`). Zero fake reels, zero mock chats, zero placeholder messages.

- **Reels** are unified with the existing `posts` + `post_media` schema whenever a post contains video media (`video/mp4`, `video/webm`, `video/quicktime`). Instagram Web uses a single unified `Create new post` uploader for both photos and videos, so uploaded videos immediately appear on the Home Feed, author Profile grid (with video badge), Explore grid, and the `/reels/` snap feed.
- **Media Streaming:** `/api/media/[...path]` implements HTTP `Range` requests (`206 Partial Content`, `Accept-Ranges: bytes`, `Content-Range`, `Content-Length`) so HTML5 `<video>` playback, looping, and scrubbing work reliably across desktop and mobile browsers.
- **Direct Messaging** uses normalized SQLite tables (`dm_threads`, `dm_participants`, `dm_messages`, `dm_reactions`) supporting 1:1 threads, live user search, text messages, uploaded photo/video attachments, shared post/reel cards, emoji reactions, unsend (delete own message), read receipts (`last_read_at` / `"Seen"`), mute toggle, and unread count badges on the navigation shell.

---

## 2. Database Schema Extensions (`src/lib/db.ts`)

1. **`dm_threads`**: `id`, `created_at`, `updated_at`
2. **`dm_participants`**: `(thread_id, user_id)` PK, `last_read_at`, `muted`, `joined_at`
3. **`dm_messages`**: `id`, `thread_id`, `sender_id`, `body`, `media_path`, `media_mime`, `shared_post_id` (nullable FK to `posts.id` `ON DELETE SET NULL`), `created_at`
4. **`dm_reactions`**: `(message_id, user_id)` PK, `emoji`, `created_at`

Indexes on `dm_participants(user_id, thread_id)`, `dm_messages(thread_id, created_at ASC)`, and `dm_threads(updated_at DESC)`.

---

## 3. Exact Live-Measured Visual Tokens

### Reels (`/reels/` & `/reels/[id]/`)
- **Viewport Snap Container:** `scroll-snap-type: y mandatory`, `overflow-y: auto`; each reel slot `scroll-snap-align: start; scroll-snap-stop: always`.
- **Desktop Video Card:** `9:16` aspect ratio (`height: min(868px, calc(100dvh - 32px))`), `border: 1px solid rgba(255, 255, 255, 0.12)`, `border-radius: 6px`, top & bottom gradient scrim (`rgba(0,0,0,0.35)` -> transparent -> `rgba(0,0,0,0.35)`).
- **Video Controls Overlay:** centered `72px × 72px` (`rgba(0,0,0,0.5)`) play indicator when paused; bottom-right `28px × 28px` (`rgba(48,48,48,0.4)`, `border-radius: 16px`) mute/unmute button.
- **Bottom-Left Author Metadata:** `32x32` avatar, `14px` semibold username, `32px`-tall outlined `Follow` button (`border: 1px solid rgba(255,255,255,0.5)`, `border-radius: 8px`), expandable caption, `12px` music-note audio attribution row.
- **Right Vertical Action Column (Desktop `width: 60px`, `margin-left: 12px`; Mobile overlaid bottom-right):** Like + count, Comment + count (slides open live Comments sheet), Share (opens Share-to-DM modal / Copy Link), Save, More `...` menu, and `24x24` `border-radius: 4px` author cover.
- **Desktop Prev/Next Floating Arrows:** `44px × 44px` circular buttons (`rgb(33, 35, 40)`) on the far right.
- **Mobile (`<= 767px`):** Full-bleed viewport card (`border-radius: 0`, `object-fit: cover`) with overlaid actions and bottom metadata clearing the `49px` bottom nav.

### Direct Messaging (`/direct/inbox/` & `/direct/t/[id]/`)
- **Desktop Split Pane:** Left thread list `400px` wide (`border-right: 1px solid rgb(var(--ig-separator))`) + Right conversation workspace (`flex: 1`).
- **Left Pane:** `74px` header (`username` + New Message `24x24` button), `34px`-high pill search bar (`border-radius: 1000px`, `rgb(var(--ig-secondary-background))`), `"Messages"` `16px` bold header row, `72px`-tall thread rows (`56x56` avatar, `14px` name, `12px` preview + timestamp, active row `rgb(var(--ig-secondary-background))`, unread blue dot `rgb(var(--ig-primary-button))`).
- **Empty State:** `96x96` Direct circle icon, `"Your messages"` (`20px` bold), `"Send message"` primary button (`height: 32px`, `border-radius: 8px`, `rgb(var(--ig-primary-button))`).
- **Conversation Header:** `77px` desktop / `61px` mobile (`border-bottom: 1px solid rgb(var(--ig-separator))`), `44x44` (`32x32` mobile) avatar, display name + subtitle, `(i)` Conversation Information drawer button.
- **Message Bubbles:** `border-radius: 18px`, `max-width: min(564px, 75%)`, `padding: 8px 12px`, `font-size: 15px`, `line-height: 18px`; incoming `rgb(var(--ig-secondary-background))` with `28x28` avatar; outgoing `rgb(var(--ig-primary-button))` `#fff`; hover reaction bar + reaction pill badges + `"Seen"` status.
- **Composer Pill:** `height: 46px`, `border: 1px solid rgb(var(--ig-elevated-separator))`, `border-radius: 22px`, `padding: 0 11px`; emoji picker, `"Message..."` input, media upload button, quick heart button when empty / `52px × 34px` (`border-radius: 20px`) blue paper-plane `Send` button when text is entered.
- **New Message Modal:** `560px × 585px` (`border-radius: 24px`), `"New message"` header, `"To:"` live user search, `60px` rows (`44x44` avatar + `24x24` selector circle), `44px` `"Chat"` button (`border-radius: 12px`).
- **Mobile (`<= 767px`):** Full-height single-pane switching (`/direct/inbox/` thread list with back-to-home button <-> `/direct/t/[id]/` chat screen with back-to-inbox button; global mobile header & bottom tab bar hidden on `/direct/*`).
