# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

MUI-based rewrite of the PMS frontend. The original project, `../pms-frontend`, is a Tailwind CSS implementation of the same app against the same Django backend — it is kept around **only as a reference** (already-solved API integration logic, auth flow, feature list) and is not otherwise part of this build. Do not import from it; port logic over by hand, adapted to MUI.

The backend (Django + DRF) lives at `../internal-project-management-system`. It is unchanged by this rewrite — only the frontend UI library changed (Tailwind → MUI).

## Working style with the user (required)

The user is learning React/MUI hands-on and wants to type the code themselves, not have files written for them. When building a feature:

1. Break the feature into an ordered list of small parts (e.g. for a login page: API client → auth API calls → auth context → form UI → routing).
2. Go part by part. For each part, give **one** code snippet in the chat response (a code block, not a file write) plus an explanation of what it does and why it's written that way.
3. Do not use Write/Edit to create or modify feature source files on the user's behalf unless they explicitly ask you to write/apply it for them instead. Config/meta files (this CLAUDE.md, package.json deps, theme tokens already agreed on) are fine to edit directly.
4. Wait for the user to add the code and confirm before moving to the next part, unless they ask to move faster.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — preview a production build locally
- `npm run lint` — oxlint

No test runner is configured yet.

## Backend API contract (authoritative — read before wiring any API call)

Full Swagger docs at `http://localhost:8000/api/docs/` (ReDoc: `/api/redoc/`, raw OpenAPI: `/api/schema/`). Everything below is what Swagger's schema does *not* show you: the envelope, auth flow, and permission rules.

**Envelope** — every response (success or error) is wrapped:
```json
{ "success": true|false, "data": ..., "message": "", "errors": null }
```
- Success object: payload in `data`.
- Success list: `data.results` (plus `data.count/next/previous` for pagination).
- Validation error (400): `message` is always the generic string `"Validation error"` — the real text is in `errors`, whose shape depends on *where* the backend raised it, not on which endpoint you're calling:
  - Raised inside a serializer's `validate()` (e.g. OTP/reset-password flows) → DRF wraps it as `{ non_field_errors: ["message"] }`, same dict shape as per-field errors (`{ field: ["message"] }`).
  - Raised directly in view/mixin code with a plain string (e.g. `TaskStatusViewSet.perform_destroy_validation` blocking delete-while-in-use) → DRF does **not** wrap it into a dict, `errors` is a bare array: `["message"]`.
  - The backend's convention is to always `raise ValidationError("some string")` (never construct the dict by hand) — so don't "fix" a bare-array response by pushing a dict-shaped raise into view code; read whichever shape that call site actually produces (`err.errors?.[0]` for arrays, `err.errors?.field?.[0]` / `err.errors?.non_field_errors?.[0]` for dicts).
- Other errors (401/403/404/409/500): `message` is the toast text (comes from DRF's `{"detail": "..."}` shape), `errors` is `null`.
- 204 No Content is **not** wrapped — empty body.

**Auth (JWT via header, not cookies)**
- `Authorization: Bearer <access>` on every authed request.
- Access token: 120 min. Refresh token: 7 days, and **rotates on every refresh** (old refresh is blacklisted) — always persist the new `refresh` returned from `/api/auth/token/refresh/`.
- Login is by **`username`**, not email.
- `GET /api/auth/me/` — **note:** the upstream/Swagger contract nests this one level (`data.user`), but the user has patched the local backend (`../internal-project-management-system`) so `/api/auth/me/` returns the user object flat, directly in `data`. In this repo, `getme()` resolves straight to the user object — do **not** destructure `{ user }` from it, and do not "fix" this back to the nested form.
- Standard flow: login → store `access`+`refresh` → attach Bearer → on 401, call refresh → on refresh failure, log out.

**Register + OTP (custom addition, not in the original Swagger contract — confirmed from `internal-project-management-system/apps/authentication/api/{serializers,urls}.py` on 2026-07-06):**
- Flow: `POST /api/auth/register/` → account created with `is_active=False`, a 6-digit OTP is emailed → `POST /api/auth/verify-otp/` with the right code → `is_active=True` → only then can `/api/auth/login/` succeed (simplejwt rejects inactive users on its own).
- `POST /api/auth/register/` — body `{username, email, first_name, last_name, password, password_confirm}` (unchanged from before). Response `data` is `null`; success is only the message. Does **not** log the user in.
- `POST /api/auth/verify-otp/` — body `{email, otp}`. OTP is 6 digits, expires in 5 min, max 5 wrong attempts then locked (must resend). Error message is a single generic string for every failure case (wrong code/expired/locked) — DRF raises it as a non-field error, so surfaces in the envelope as `errors: { non_field_errors: ["..."] }`, not tied to a specific input.
- `POST /api/auth/resend-otp/` — body `{email}`. 60s cooldown since the last OTP for that email. **Not fully generic**: it does distinguish "cooldown" vs "email not found or already active" in its error message (accepted/known tradeoff on the backend side) — don't read too much into that difference in the UI, just show the message.
- `POST /api/auth/forgot-password/` — body `{email}`. Always responds the same regardless of whether the email exists/is active/is on cooldown (deliberately generic to avoid user enumeration) — don't try to distinguish cases here even if tempted.
- `POST /api/auth/reset-password/` — body `{email, otp, new_password}`. Same generic-error-message pattern as verify-otp. Does not auto-login after success.
- There is no "change password while logged in" OTP flow — that's a separate `old_password`/`new_password` endpoint if/when it exists, unrelated to this OTP system.

**Permissions** — two role layers:
- `user.role` (`admin`/`member`): system-wide, rarely used in UI.
- `ProjectMember.role` (`admin`/`member`): per-project, drives almost all UI gating. Project creator is auto-admin of that project.

| Action | Allowed |
|---|---|
| Create project | any authed user |
| Edit/delete project | only `created_by` |
| Add/remove member | project admin |
| Create/edit/delete task | project admin |
| View task | any project member |
| Create comment | any member |
| Edit comment | only the author |
| Delete comment | author or project admin |
| Upload attachment on a **task** | project admin or the task's assignee |
| Upload attachment on a **comment** | only the comment's author |
| Delete attachment | uploader or project admin |

`assigned_to` on a task is just a property — an assignee cannot edit the task itself, only comment/attach. Hide edit-task controls unless the user is a project admin.

**Domain model notes**
- Task `status` is a **per-project FK** to `TaskStatus`, not a fixed enum — fetch valid options from `/api/tasks/statuses/?project=<id>`, and read returns it nested as `{id, name, category, position, project}` (`category` ∈ `todo|in_progress|done` drives kanban columns). `priority` ∈ `low|medium|high`.
- Tasks nest infinitely via `parent` (subtasks): create by POSTing a task with `parent` set; read returns `parent` (id) + one level of nested `subtasks`; move/detach with `PATCH {parent}`.
- New project auto-seeds three `TaskStatus` rows: To Do / Doing / Done. A `TaskStatus` in use by a task cannot be deleted.
- Comments support one level of reply via `parent` (replying to a reply is rejected, 400). List endpoint returns replies **both** as top-level items and nested under their parent's `replies` — filter `parent == null` when rendering the comment tree to avoid duplicates.
- Attachments: task-scoped (`/api/tasks/{task_id}/attachments/`) or comment-scoped (`/api/tasks/{task_id}/comments/{comment_id}/attachments/`), multipart field `file`, extensions `pdf,doc,docx,xls,xlsx,png,jpg,jpeg,gif,txt,zip`, max 10MB. Each attachment belongs to exactly one of task/comment.
- Soft delete throughout (project/task/comment/attachment): deleted records are hidden from normal list/detail; `POST /{id}/restore/` and `DELETE /{id}/hard-delete/` exist, gated by the same permissions as normal delete.
- List endpoints: `?page=` (page size fixed server-side at 9, from `PAGE_SIZE` in `config/settings/base.py` — **`?page_size=` is currently a no-op**, the backend never set `page_size_query_param` on a custom pagination class, so passing it does nothing), `?search=` (project: name/description; task: title/description), `?ordering=` (task: `deadline`, `-created_at`, `priority`, etc.).

**Fixed bug (was: 2026-07-08, resolved 2026-07-08)**: `ProjectDetailPage`'s Kanban/List view used to only show the first 9 tasks of a project, since `listTasks(id)` hit `/tasks/?project=<id>` with no `page` and anything past page 1 silently vanished from the board. Fixed by adding `listAllTasks(projectId)` in `src/api/tasks.js` (fetches page 1, follows `.next` until null, concats results) and swapping it in at both call sites in `ProjectDetailPage.jsx` (initial load + `reloadTasks`). This is option (a) from the original note — N sequential requests for N pages, fine at current scale but won't hold up for a project with hundreds of tasks; if that becomes real, revisit with a backend-side fix (opt-out pagination or a dedicated "all tasks for board" endpoint) instead of pushing page count higher on the frontend loop. The same page-9-hides-the-rest issue and the same `listAll*` loop pattern was applied proactively to comments/attachments too (`listAllComments`, `listAllTaskAttachments`, `listAllCommentAttachments`) when those were first built, so they never had this bug.

## Theme

`src/theme/theme.js` holds the MUI theme. Only the brand color is customized — the app must keep the KIAI brand orange as its accent (`primary.main: '#f27a18'`, light `#f79a52`, dark `#d96a12`, from `pms-frontend/src/index.css`'s `--color-brand-*` scale). Everything else (border radius, shadows, button/component shape, `mode: 'light'`) intentionally stays MUI default rather than hand-matching the old Tailwind look — don't add custom `styleOverrides` beyond what's already there unless asked.

Priority (`low|medium|high`) and status-category (`todo|in_progress|done`) badges in the old project used plain Tailwind semantic colors (emerald/amber/red/blue) — these map directly to MUI's default `success`/`warning`/`error`/`info`, no custom hex needed.

## Structure

- `src/api/` — one file per resource (auth, projects, tasks, comments, attachments), each unwrapping the envelope described above.
- `src/auth/` — auth context/provider, token storage, refresh handling.
- `src/routes/` — routing guards (e.g. `ProtectedRoute`).
- `src/pages/` — one component per route.
- `src/components/` — shared UI built on MUI primitives.
- `src/theme/` — MUI theme definition.

## Build roadmap

Update the checkboxes below as each part is finished. Order matters — later stages build on earlier ones.

**Giai đoạn 1 — Nền tảng**
- [x] Auth flow: API client (`src/api/client.js`, envelope unwrap + Bearer interceptor), Auth API (`login/refreshToken/getMe/logout`), `AuthContext` (user/loading/login/logout), Login page (MUI form + field error mapping), Routing (`BrowserRouter`, `ProtectedRoute`, redirect to `/` after login).
- [x] Silent refresh-on-401: axios response interceptor (`src/api/client.js`) dedupes concurrent 401s via a shared `refreshPromise`, calls `/auth/token/refresh/` with a bare axios instance, retries the original request, and calls `notifyUnauthorized()` (defined in `AuthContext.jsx`) to force logout if refresh itself fails.
- [x] Register page: form (`RegisterPage.jsx`) → `register()` → OTP-entry step (`verify-otp`, with resend + cooldown) → on success, redirect to `/login`. Requires local dev to have Redis + a Celery worker running (`uv run celery -A config worker -l info --pool=solo` in the backend repo) for OTP emails to actually print anywhere (they print to the Celery worker's console, not Django's).
- [x] App Shell: `Sidebar` (MUI `Drawer` permanent, 6 nav items, active state via `selected`) + `Topbar` (fixed `AppBar`, greeting, avatar menu with logout) under `src/components/layout/`, wired via `AppLayout.jsx` using nested routes + `<Outlet/>` in `App.jsx` (`ProtectedRoute` wraps `AppLayout`, not each page individually — new pages just add a child `<Route>`).
- [x] Forgot/reset password: `ForgotPasswordPage.jsx` (two-step: email → OTP+new password, with resend/cooldown), `forgotPassword`/`resetPassword` in `src/api/auth.js`, route `/forgot-password` in `App.jsx`, linked from `LoginPage.jsx`.

**Giai đoạn 2 — Lõi nghiệp vụ (bám backend nhất)**
- [x] Projects list: grid of cards (name/description/`created_by`/`created_at`), debounced `?search=`, modal to create a project. Also has pagination wired to backend's `PageNumberPagination`. Edit/delete added later via `ProjectFormDialog` (shared create+edit) + a "..." menu on `ProjectCard`, shown only when `project.created_by_email` matches the logged-in user's email (list serializer has no `created_by` id, only the email, so ownership check is done on email).
- [x] Project detail — Kanban: columns rendered one per real `TaskStatus` (sorted by `position`, horizontally scrollable, not hardcoded to 3 categories), task cards (priority/deadline/subtask count/assignee), drag-and-drop status change (optimistic PATCH), Kanban/List view toggle, progress bar. Columns auto-match height to the tallest column. "+ Thêm cột" button present but disabled (needs TaskStatus CRUD below).
- [x] TaskStatus CRUD (manage columns, project admin only; block delete of a status in use — surface the backend's error message). API (`src/api/taskStatuses.js`) + `TaskStatusFormDialog` + `KanbanColumn`'s "..." menu + "+ Thêm cột" button, all wired in `ProjectDetailPage.jsx`.
- [x] Task CRUD: create/edit/delete task via `TaskFormDialog` (title/description/status/priority/assigned_to/deadline), admin-only, wired to Kanban's "+" (create) and card click (edit/delete).
- [x] Task detail — new route `/projects/:projectId/tasks/:taskId` (`TaskDetailPage.jsx`, card click navigates here for any member, not just admin — editing is a separate "Sửa" button, admin-only, reusing `TaskFormDialog`). Subtasks (list + create via `TaskFormDialog` with `parentId`, click navigates to the subtask's own detail page). Comments + one-level replies (`components/tasks/CommentSection.jsx`, self-fetching, collapsible replies). Attachments both task-scoped and comment-scoped (`components/tasks/TaskAttachmentSection.jsx` / `CommentAttachmentSection.jsx`). Required 2 backend fixes to actually view uploaded files: `MEDIA_URL` needed a leading slash and `config/urls.py` needed `static()` wired for dev, plus `AttachmentSerializer.create()` now uses `request.build_absolute_uri()` so `file_url` is a real absolute URL (was previously relative, broken across the frontend/backend origin split).
- [x] Project members: view (`MembersPanel`) + add (`AddMemberDialog`, searches users via `/api/auth/users/search/`, a new backend endpoint added for this) + remove (admin only, can't remove self), wired in `ProjectDetailPage.jsx`.

**Giai đoạn 3 — Bổ trợ**
- [ ] Dashboard: project cards + Task Status Overview donut (computed client-side from task list) + Upcoming Tasks (from `deadline`).
- [x] Settings > Profile: `SettingsPage.jsx` at `/settings`, reads `user` straight from `AuthContext` (no extra fetch). Backend added `PATCH /api/auth/me/` (`UserMeView` is now `RetrieveUpdateAPIView`) but its `UpdateUserSerializer` only accepts `first_name`/`last_name` — username and email stay `disabled` TextFields, not editable. `updateMe()` in `src/api/auth.js` calls the PATCH; since the response only contains the two changed fields (not the full user), `AuthContext` gained an `updateUser(patch)` function that merges the patch into the existing `user` state rather than replacing it, so Sidebar's name display stays in sync after save.
- [ ] Settings > Team & Permissions: member list + role (`admin`/`member` only, no Viewer).
- [ ] Theme toggle (light/dark), persisted to `localStorage`, switching the MUI theme's `palette.mode`.

**Giai đoạn 4 — Chờ backend (không code, chỉ note lại)**
- Team chat, Files browser, Account management (2FA/devices/delete), Notifications/All Updates, invite-by-email, "Task Done over time" chart — no backend support yet.
