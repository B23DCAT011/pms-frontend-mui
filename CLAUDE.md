# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

MUI-based rewrite of the PMS frontend. The original project, `../pms-frontend`, is a Tailwind CSS implementation of the same app against the same Django backend — it is kept around **only as a reference** (already-solved API integration logic, auth flow, feature list) and is not otherwise part of this build. Do not import from it; port logic over by hand, adapted to MUI.

The backend (Django + DRF) lives at `../internal-project-management-system`. It is unchanged by this rewrite — only the frontend UI library changed (Tailwind → MUI).

## Working style with the user (required)

**Changed 2026-07-20**: the user now writes the backend themselves and wants Claude to write the frontend directly — no longer typing it by hand. When building a feature:

1. Break the feature into an ordered list of small parts (e.g. for a login page: API client → auth API calls → auth context → form UI → routing).
2. Go part by part, using Write/Edit to apply the code directly to the feature source files.
3. After each part, stop and report briefly what changed so the user can review/test it before moving to the next part — don't chain multiple parts into one response unless asked to move faster.
4. This repo's `CLAUDE.md` roadmap ("Build roadmap" below) is the source of truth for what's done and what's next — update its checkboxes as parts land.

(Previously, up to 2026-07-20, the user typed all frontend code by hand from snippets Claude provided — that mode is over for this repo. It still applies to the backend, see that repo's own working notes.)

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
- [x] Dashboard: `DashboardPage.jsx` at `/` — `StatTiles` (project/task/overdue counts), `RecentProjectsList`, `TaskStatusDonut` (computed client-side from `listAllMyTasks()`, grouped by `status.category`), `UpcomingTasksList` (overdue vs upcoming, sorted by `deadline`), "Chỉ task của tôi" switch filters everything by `assigned_to.id`.
- [x] Settings > Profile: `SettingsPage.jsx` at `/settings`, reads `user` straight from `AuthContext` (no extra fetch). Backend added `PATCH /api/auth/me/` (`UserMeView` is now `RetrieveUpdateAPIView`) but its `UpdateUserSerializer` only accepts `first_name`/`last_name` — username and email stay `disabled` TextFields, not editable. `updateMe()` in `src/api/auth.js` calls the PATCH; since the response only contains the two changed fields (not the full user), `AuthContext` gained an `updateUser(patch)` function that merges the patch into the existing `user` state rather than replacing it, so Sidebar's name display stays in sync after save.
- [x] Invite-by-email: `InvitationsPage.jsx` at `/invitations` (accept/decline, expiry chip) + `src/api/invitations.js` + `Topbar.jsx` notification bell (badge count, dropdown preview, "Xem tất cả"). Moved here from Giai đoạn 4 below — backend shipped this (`feat/project-invitation-accept`) after that note was written.
- [ ] Settings > Team & Permissions: member list + role (`admin`/`member` only, no Viewer). Note: backend has no "change an existing member's role" endpoint (only add/remove) — check with backend before starting, this may need a new endpoint first.
- [ ] Theme toggle (light/dark), persisted to `localStorage`, switching the MUI theme's `palette.mode`. Superseded by Giai đoạn 5 #2 below (the button already in `Topbar.jsx` is currently dead).

**Giai đoạn 4 — Chờ backend (không code, chỉ note lại)**
- Team chat, Files browser, Account management (2FA/devices/delete), general Notifications/All Updates feed, "Task Done over time" chart — no backend support yet.

**Giai đoạn 5 — Dọn dẹp & hoàn thiện (chốt 2026-07-20, làm từ trên xuống, mỗi gạch đầu dòng là 1 lần thay đổi nhỏ, xong 1 cái mới sang cái sau)**
1. [x] Dọn `Sidebar.jsx`: bỏ 3 mục chết **"Team" (`/team`), "Files" (`/files`), "All Updates" (`/updates`)** (và import icon không còn dùng `GroupIcon`/`InsertDriveFileIcon`/`NotificationsIcon`) — thay vào đó thêm mục **"My Tasks"** (`TaskAltIcon`) trỏ `/my-tasks`. Đưa lại các mục cũ khi Giai đoạn 4 thực sự có backend cho từng cái.
2. [x] **"My Tasks" — không gian làm việc cá nhân** (chốt hình dạng 2026-07-20, thay cho ý tưởng "filter UI trong ProjectDetailPage" cũ). Code xong 2026-07-20, **build+lint sạch nhưng CHƯA kiểm tra trực tiếp trên browser** (không có tool trình duyệt trong phiên code lúc đó) — cần tự chạy `npm run dev` (kèm backend + Redis/Celery nếu muốn test full) và click thử `/my-tasks` trước khi coi là xong hẳn.
   - `src/pages/MyTasksPage.jsx` (route `/my-tasks`, nav "My Tasks" trong `Sidebar.jsx` từ #1) + component `src/components/tasks/MyTaskRow.jsx`.
   - Nguồn dữ liệu: `listAllMyAssignedTasks(user.id, params)` (`src/api/tasks.js`) gọi `GET /api/tasks/?assigned_to=<user.id>` **không truyền `project`** — `TaskViewSet.get_queryset()` (backend, `apps/tasks/api/views.py:30-39`) đã tự lọc theo `project__memberships__user=request.user`, nên ra đúng toàn bộ task assign cho user hiện tại xuyên suốt mọi project, không cần loop từng project. **Quyết định 2026-07-20**: fetch-all (loop `next` tới hết), KHÔNG phân trang "xem thêm" ở trang này (đổi từ load-more ban đầu) — đã cân nhắc infinite-scroll làm UX tốt hơn ở quy mô lớn, nhưng nhóm task theo urgency lại không hợp infinite-scroll khi server sort theo `created_at`/`ordering` khác field nhóm (mỗi nhóm sẽ lấp đầy không theo thứ tự dự đoán được khi cuộn thêm) — chấp nhận fetch-all vì quy mô dự án nhỏ, revisit nếu 1 user có hàng trăm+ task assign.
   - Badge tên project: `listAllMyProjects()` (`src/api/projects.js`, follow hết `next` giống `listAllMyTasks()`) fetch 1 lần lúc mount, build map `id -> name` — cần vì `TaskReadSerializer.project` chỉ trả PK, không có tên.
   - Filter/search/ordering — hấp thụ lại phần "task search/filter/ordering" của kế hoạch cũ (đặt ở đây hợp lý hơn ProjectDetailPage vì lọc xuyên-project mới thực sự cần bộ lọc mạnh): ô search (title/description, debounce 400ms), filter priority, filter `status__category` (`todo`/`in_progress`/`done` — dùng `category` vì mỗi project có `TaskStatus` tên khác nhau), `ordering` hiện chỉ có `-created_at`/`created_at` (bỏ ordering theo priority: `Task.priority` là `CharField` choices `low/medium/high`, backend `?ordering=priority` sort theo alphabet chứ không theo mức độ nghiêm trọng — dễ gây hiểu lầm nên không đưa lên UI).
   - Trình bày: nhóm task theo mức khẩn cấp (Quá hạn / Hôm nay / Sắp tới / Không deadline) tính thuần theo `deadline` so với hôm nay, **không loại task đã "Hoàn thành" khỏi nhóm Quá hạn** (khác cách Dashboard làm) để task không "biến mất" khỏi mọi nhóm — task đã xong nhưng từng trễ hạn vẫn hiện, tự phân biệt bằng chip trạng thái màu xanh. Mỗi dòng (`MyTaskRow`) có border-left màu theo urgency/category + badge project + chip trạng thái + chip priority + ngày deadline.
   - Tương tác: chỉ xem, click vào 1 task điều hướng sang `/projects/:projectId/tasks/:taskId` (trang detail có sẵn) để xem/sửa/comment — trang My Tasks không có edit/drag-drop tại chỗ.
3. [x] **"Lịch sử comment của tôi"** — vào qua tab trong Settings (chốt 2026-07-20, đổi từ ý định route/nav riêng ban đầu). **Cả 2 phía đã xong**:
   - FE: `SettingsPage.jsx` có `Tabs` ("Hồ sơ" / "Lịch sử bình luận" / "Thùng rác"), tab 2 render `src/components/settings/CommentHistorySection.jsx`. Đã tách nội dung Profile cũ ra `src/components/settings/ProfileSection.jsx`. `listMyComments(page)` (`src/api/comments.js`) gọi `/tasks/comments/mine/?page=N` — dùng MUI `Pagination` kiểu số trang thường (giống `ProjectsPage`), **không phải load-more**, vì endpoint này dùng `PageNumberPagination` mặc định (`PAGE_SIZE=9`), khác `CursorPagination` của comment-trong-1-task. Mỗi dòng hiện badge `project_name` + `task_title` + nội dung (line-clamp 2 dòng) + thời gian, click điều hướng `/projects/{project_id}/tasks/{task}`.
   - Backend (nhánh `feat/my-comment-history`, đã merge `develop`): `MyCommentListView` đổi sang serializer riêng `MyCommentSerializer` (kế thừa `TaskCommentSerializer`, thêm field `task`/`task_title`/`project_id`/`project_name`) + `select_related` thêm `"task", "task__project"` trong `get_queryset()`.
   - Chưa tự test UI thật trên browser (chỉ build/lint sạch) — cần chạy `npm run dev` kiểm tra tay.
4. [x] Dark mode toggle — làm thật (chốt 2026-07-20). `theme.js` đổi từ 1 object tĩnh sang hàm `getTheme(mode)`. `theme/ThemeModeContext.jsx` (mới, pattern giống `AuthContext.jsx`): `ThemeModeProvider` giữ state `mode` (khởi tạo từ `localStorage.getItem('themeMode')`, mặc định `'light'`), bọc sẵn MUI `ThemeProvider` + `CssBaseline` bên trong nó luôn (không còn đặt ở `main.jsx`), hook `useThemeMode()` trả `{mode, toggleMode}`. `main.jsx` đổi `<ThemeProvider theme={theme}>` thành `<ThemeModeProvider>`. `Topbar.jsx` nút dark mode giờ có `onClick={toggleMode}`, đổi icon `DarkModeOutlinedIcon`/`LightModeOutlinedIcon` theo `mode` hiện tại.
5. [~] Trash/restore UI (chốt hướng 2026-07-20 — Hướng A, sửa backend cùng làm). **Backend xong** (nhánh `feat/trash-restore`, commit `8208432`): thêm action `GET .../trash/` cho cả 5 resource (Project/Task/Comment/TaskAttachment/CommentAttachment), mỗi cái lọc theo đúng quyền restore hiện có của resource đó, test qua `APIClient` script tay (không lưu thành test tự động) PASS cả 5. **FE: đã xong Project + Task** (global, không cần biết trước task/comment nào) — tab "Thùng rác" thứ 3 trong `SettingsPage.jsx`, gồm `components/settings/TrashSection.jsx` (wrapper) + `ProjectTrashList.jsx` + `TaskTrashList.jsx`, mỗi cái có nút "Khôi phục" (`restoreProject`/`restoreTask`) và "Xoá vĩnh viễn" (`hardDeleteProject`/`hardDeleteTask`, có `window.confirm` vì dialog xác nhận riêng (#6) chưa làm).
   - **Comment + Attachment trash: HOÃN LẠI có chủ đích (2026-07-20)** — 2 endpoint backend đã có sẵn (`GET /tasks/{task_pk}/comments/trash/`, `GET /tasks/{task_pk}/attachments/trash/`, `GET /tasks/{task_pk}/comments/{comment_pk}/attachments/trash/`), nhưng chưa làm UI vì: (1) scope theo 1 task/1 comment cụ thể (không global như Project/Task), hợp đặt trong `TaskDetailPage` hơn Settings; (2) **Attachment sắp nối sang R2** (Cloudflare object storage, thay cho local `FileSystemStorage` dev hiện tại — hạ tầng `django-storages`/`STORAGES["default"]` qua env `USE_S3` đã có sẵn ở backend, chỉ chưa bật) — đợi xong đợt R2 rồi làm UI attachment 1 lần, tránh phải sửa lại cách hiển thị file (`file_url`) hai lần.
6. [x] Thay `window.confirm()` bằng MUI `Dialog` confirm dùng chung + `Snackbar` báo kết quả thành công/thất bại (chốt + code xong 2026-07-20):
   - `src/confirm/ConfirmContext.jsx` (mới): `ConfirmProvider` + hook `useConfirm()` — API kiểu Promise, dùng thay `window.confirm()` gần như 1-1: `const ok = await confirm("Xoá X?"); if (!ok) return;`. Render 1 `Dialog` dùng chung duy nhất (không phải tạo `Dialog` riêng mỗi nơi gọi).
   - `src/notifications/NotificationContext.jsx` (mới): `NotificationProvider` + hook `useNotification()` trả `{notify, notifySuccess, notifyError}` — render 1 `Snackbar` dùng chung.
   - Cả 2 wire vào `main.jsx` (bọc quanh `AuthProvider`/`App`, cạnh `ThemeModeProvider`).
   - Thay hết 9 chỗ gọi `window.confirm()` (`ProjectsPage`, `ProjectDetailPage` x2, `TaskFormDialog`, `TaskAttachmentSection`, `CommentAttachmentSection`, `CommentSection`, `ProjectTrashList`, `TaskTrashList`) bằng `await confirm(...)`; bỏ hết state `actionError`/`statusError`/`memberError`/`deleteError`/`dragError` chỉ dùng để hiện `<Alert>` sau 1 hành động xoá/restore — thay bằng `notifySuccess`/`notifyError`. **Có chủ đích giữ nguyên** các `<Alert>` gắn với validate input (vd lỗi tạo/sửa comment, lỗi loading danh sách chặn cả trang) — Snackbar chỉ thay cho phần "báo kết quả 1 hành động rời rạc", không thay toàn bộ `Alert` trong app.
7. [x] Trang 404 trong-app (chốt + code xong 2026-07-20) — `src/pages/NotFoundPage.jsx` (mới, style giống `LoginPage`/`RegisterPage`: `Paper` giữa màn hình, không có Sidebar/Topbar vì route `*` nằm ngoài `ProtectedRoute`/`AppLayout` trong `App.jsx`, hiện cho cả user chưa đăng nhập lẫn đã đăng nhập gõ sai URL). `App.jsx` đổi route `*` từ `<Navigate to="/" replace />` sang `<NotFoundPage />`.
8. [x] Đổi mật khẩu khi đã đăng nhập + thêm field profile (chốt + xong cả 2 phía 2026-07-20, nhánh backend `feat/user-profile-fields` commit `c5069c0`):
   - Backend: `User` model thêm `date_of_birth`/`phone_number`/`organization` (migration `0004_user_date_of_birth_user_organization_and_more`) + đưa vào `UserSerializer`/`UpdateUserSerializer`. `CustomTokenObtainPairSerializer` đổi sang dùng lại `UserSerializer(self.user).data` thay vì tự build dict tay (tránh quên đồng bộ field lần sau). Endpoint mới `POST /api/auth/change-password/` (`ChangePasswordView`, `GenericAPIView` trần + `ChangePasswordSerializer` — serializer chỉ validate `old_password` đúng không (`self.context["request"].user.check_password()`) + `new_password` đủ mạnh (`validate_password`), việc gọi `set_password()`/`save()` nằm ở view theo đúng rule 7). Test tay qua `APIClient` (chưa/không lưu tự động): chưa đăng nhập 401, sai old_password 400, new_password yếu 400, đúng hết 200 + verify DB đổi thật — PASS cả 5 case.
   - FE: `ProfileSection.jsx` thêm 3 field (ngày sinh dùng `type="date"`, SDT, đơn vị) vào form + dirty-check, gửi qua `updateMe()` sẵn có (không cần API mới). `ChangePasswordSection.jsx` (mới) — form riêng (`old_password`/`new_password`/nhập lại), lỗi field hiện inline (`fieldErrors`, giống `RegisterPage`), kết quả thành công dùng `notifySuccess()` (Snackbar chung từ việc #6) chứ không phải `Alert` riêng. `api/auth.js` thêm `changePassword(old_password, new_password)`.
   - **Tab riêng "Quản lý tài khoản"** (đổi 2026-07-20, không nằm chung tab "Hồ sơ" như bản đầu) — `SettingsPage.jsx` có 4 tab: Hồ sơ / **Quản lý tài khoản** (`ChangePasswordSection` + `ChangeEmailSection`) / Lịch sử bình luận / Thùng rác.
   - **Đổi email — XONG cả 2 phía (2026-07-20), nhánh backend `feat/change-email` commit `688cb23`**. Khác đổi mật khẩu, cần OTP xác minh **email mới** (không phải để xác minh danh tính — JWT+password đã lo việc đó — mà để chắc user thực sự sở hữu email mới, tránh bị lợi dụng đổi email rồi tự trigger forgot-password chiếm tài khoản).
     - Backend: `Purpose.CHANGE_EMAIL` thêm vào `otp_store.py`; `send_otp_email(user_id, purpose, recipient_email=None)` thêm tham số optional để gửi OTP tới **email mới** thay vì `user.email` cũ (2 purpose cũ không truyền, giữ nguyên hành vi). 2 endpoint mới: `POST /change-email/` (`ChangeEmailRequestView` — validate email chưa ai dùng, tạo OTP + **lưu `pending_email` vào cache riêng** khác cache OTP, cooldown 60s giống resend-otp) và `POST /verify-email-change/` (`VerifyEmailChangeView` — chỉ nhận `otp`, **không nhận `new_email` từ client** để tránh lỗ hổng "có OTP hợp lệ nhưng đổi sang email khác" — tự lấy `pending_email` từ cache server-side; khoá sau 5 lần sai giống register; check trùng email LẦN 2 ngay trước khi lưu để chặn race-condition trong 5 phút chờ OTP; trả về `UserSerializer(request.user).data` để FE cập nhật `AuthContext` ngay không cần gọi `/me/`). Test tay qua `APIClient` (chưa lưu tự động): 401/cooldown/email trùng/OTP sai/khoá-5-lần/race-condition-trùng-email/thành công — PASS hết. 2 bug thật gặp khi code: (1) quên `status=400` ở nhánh cooldown lúc đầu (`Response()` mặc định 200); (2) sau đó dùng `Response(status=400)` tay lại sai shape envelope (`message` bị đè thành "Validation error" chung chung) — sửa đúng bằng `raise ValidationError(...)` theo đúng convention có sẵn trong file (`ResendOTPView` dòng 88).
     - FE: `ChangeEmailSection.jsx` (mới) — 2 bước y hệt pattern `RegisterPage`/`ForgotPasswordPage` (nhập email mới → bước OTP, có resend+cooldown). `api/auth.js` thêm `requestChangeEmail(new_email)`/`verifyChangeEmail(otp)`. Chú ý khi đọc lỗi: bước 1 lỗi có thể ở dạng dict (`errors.new_email`, do raise trong serializer) HOẶC bare array (`errors[0]`, do raise cooldown trực tiếp ở view) — phải check cả 2; bước 2 luôn là bare array (mọi lỗi đều raise thẳng ở view).
9. [ ] (Bonus, không bắt buộc) Component test (Vitest + Testing Library) cho vài luồng chính (login, task CRUD, comment).
