# Instagram Web Clone — Phase 2 Reverse-Engineering & Design Spec

**Date:** 2026-11-14  
**Scope:** Stories (24h real uploads + tray + viewer), Search & Explore (`/explore/`), Notifications (real activity drawer + `/notifications/` page)  
**Strict Data Policy:** Zero mock/fake data. Stories, search results, explore grid, and notifications read strictly from SQLite and real uploaded files.

---

## 1. Directly Observed Phase 2 Measurements (`instagram.com`)

1. **Stories Tray (`/`):** `630x124` scrollable container (`padding: 8px 9px`, `14px` horizontal gap, `90x108` item slots), `74x74` avatar inside `89x89` gradient ring (`#ffc800` → `#ff9f00` → `#ff2c43` → `#df00aa` → `#d300c5` for unseen; `--ig-stroke` gray for seen), `12px` username label.
2. **Story Viewer:** Full-screen `rgb(26, 26, 26)` backdrop, centered `437x778` (`9:16`) card (`background: #000`, `border-radius: 8px`), `2px` progress bars (`gap: 2px`, track `rgba(255,255,255,0.35)`, fill `#fff`), `32x32` header avatar + username + timestamp + Pause/Play + Close `X`, bottom pill reply/like/share controls (reply persists or links cleanly; like toggles real DB story like), `Previous`/`Next` `40x40` circular arrows.
3. **Search & Explore (`/explore/`):** Top `590px × 40px` (`36px` mobile) pill search input (`border-radius: 25px`, `background: rgb(var(--ig-secondary-background))`), live query replaces grid in-place with `60px` user rows (`44x44` avatar, `14px` bold username + subtitle) and matching posts; default view renders 4-column desktop / 3-column mobile `3:4` grid (`gap: 1px`, carousel badge) of real posts.
4. **Notifications:** Desktop slide-out drawer (`460px` wide, `border-right: 1px solid rgb(var(--ig-separator))`, `background: rgb(var(--ig-primary-background))`, `"Notifications"` `24px` bold, filter pills `All`, `Comments`, `Likes`, `Follows` at `height: 33px`, `border-radius: 20px`), plus mobile/direct `/notifications/` page. Rows (`60px` tall) render `44x44` actor avatar, bold username + action + relative timestamp, and `44x44` (`border-radius: 8px`) post thumbnail or `Follow`/`Following` button.

---

## 2. Database & API Additions (`node:sqlite`)

- `stories`: `id TEXT PK`, `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `media_path TEXT NOT NULL`, `mime_type TEXT NOT NULL`, `caption TEXT NOT NULL DEFAULT ''`, `created_at INTEGER NOT NULL`, `expires_at INTEGER NOT NULL`
- `story_views`: `story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE`, `viewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `viewed_at INTEGER NOT NULL`, `PRIMARY KEY (story_id, viewer_id)`
- `story_likes`: `story_id TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE`, `user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `created_at INTEGER NOT NULL`, `PRIMARY KEY (story_id, user_id)`
- `notifications`: `id TEXT PK`, `recipient_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `actor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE`, `type TEXT NOT NULL` (`'like' | 'comment' | 'follow'`), `post_id TEXT REFERENCES posts(id) ON DELETE CASCADE`, `comment_text TEXT NOT NULL DEFAULT ''`, `is_read INTEGER NOT NULL DEFAULT 0`, `created_at INTEGER NOT NULL`

### API Endpoints
- `GET /api/stories`, `POST /api/stories`, `DELETE /api/stories/[id]`, `POST /api/stories/[id]/view`, `POST /api/stories/[id]/like`
- `GET /api/explore` (real posts ordered by recency/engagement) & `GET /api/search?q=...` (real users & posts matching query)
- `GET /api/notifications?filter=all|comments|likes|follows`, `POST /api/notifications/read` (marks notifications read)
- Mutations (`toggleLike`, `createComment`, `toggleFollow`) automatically emit real `notifications` rows when `actor_id !== recipient_id` (and delete `like`/`follow` notifications cleanly when unliked/unfollowed).
