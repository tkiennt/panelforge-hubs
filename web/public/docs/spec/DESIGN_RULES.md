# 🎨 PANELFORGE UI/UX DESIGN SYSTEM & REFACTOR RULES (`DESIGN_RULES.md`)

> **Purpose:** This document serves as the mandatory, single source of truth ("UI Constitution") for all AI Agents and Developers when building or refactoring interfaces in `panelforge-fe`. Every screen across `src/app/`, `src/shared/`, and `src/roles/*` must strictly follow these rules to guarantee visual consistency, clean hierarchy, accessibility, and seamless navigation.

---

## 1. CORE PRINCIPLES & COLOR TOKENS ("WARM EDITORIAL STUDIO")

PanelForge uses a tactile **Manga Paper & Ink / Warm Stone** foundation paired with **Tangerine Orange** accents and deterministic semantic colors to evoke a professional editorial and manga studio workspace. Avoid mixing cold blue-grays (`gray-*` / `slate-*`) with warm `stone-*` tokens on the same screen.

### 1.1. Core Principles
1. **Paper & Ink Foundation**: The background is rooted in tactile manga paper (`#FAF9F5`, `#FAF8F5`) and rich ink borders (`#171717`, `#E7E7E7`, `stone-200`). Warm and studio-grade editorial aesthetics over cold flat designs.
2. **Deterministic Color Semantics**: 
   - One color marker = exactly one meaning across the entire system.
   - Orange always = primary CTA / active highlight.
   - Violet always = AI assistance / provenance.
   - Never invert or mix semantic meanings.
3. **Canvas is a Workspace, Not Marketing**: Prioritize information clarity, clean surfaces, and structured boundaries over wasteful empty space.
4. **AI-Generated Elements Must Be Clear**: Every AI-generated or AI-suggested asset must feature visual provenance (border accent, purple badge, or sparkles icon).

### 1.2. Surfaces & Backgrounds
- **App Background (Main Canvas / Page background):** `bg-[#FAF9F5]` or `bg-stone-50`
- **Card / Panel Surface (Primary containers, workbenches):** `bg-white`
- **Muted Surface (Empty states, secondary backgrounds, progress tracks):** `bg-stone-100` (`#F5F5F4` / `#F4F1EA`)
- **Canvas Dark Surface (Artist / Letterer / Review viewport):** `bg-stone-900` or `bg-neutral-900`
- **Elevation Levels (Paper-over-Paper):**
  - **Level 0 (Canvas Base):** `bg-[#FAF9F5]`
  - **Level 1 (Cards, Workspaces, Sections):** `bg-white border border-stone-200/80 rounded-xl shadow-xs`
  - **Level 2 (Toolbars, Sticky Headers):** `bg-white/90 backdrop-blur-md border-b border-stone-200 shadow-xs`
  - **Level 3 (Modals, Drawers, Overlays):** `bg-white border border-stone-200 rounded-2xl shadow-xl backdrop-blur-sm`
  - **Active Selection Highlight:** `bg-orange-50 text-orange-700 border-l-4 border-orange-500`

### 1.3. Standard Borders
- **Default Card Border:** `border border-stone-200/80` (or `border-[#E7E7E7]`)
- **Subtle Divider:** `border-stone-100`
- **Interactive Hover / Focus Border:** `hover:border-orange-300` or `focus:border-orange-500`

### 1.4. Typography Colors
- **Primary Text (Headings, core content):** `text-stone-900` (`#171717`)
- **Secondary Text (Subtitles, descriptions, field labels):** `text-stone-600` (`#555555`)
- **Muted / Helper Text (Captions, timestamps, hints):** `text-stone-500` *(NEVER use `text-stone-300` or lighter for readable text on light backgrounds due to poor contrast)*

### 1.5. Semantic & Domain Status Colors ("Artisan Ink Pigments")
All statuses for `AssignmentStatus`, `StageProgress`, `ChapterStatus`, `ChangeRequest`, and `ConsistencyFinding` must use these exact semantic mappings:
- **Brand / Creator Primary CTA (Mực Cam Studio):**
  - Utility Class: `.btn-cta-primary`
  - Inline Tokens: `bg-[#EA580C] hover:bg-[#C2410C] text-white shadow-soft-sm rounded-full`
  - Soft Tint / Active Tab: `bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100`
- **AI Action / Consistency / Series Bible Lore (Mực Tím Trí Tuệ):**
  - Utility Class: `.btn-cta-ai`
  - Inline Tokens: `bg-violet-600 hover:bg-violet-700 text-white shadow-soft-sm rounded-full`
  - Soft Badge / AI Pill: `bg-violet-50 text-violet-800 border border-violet-200`
  - AI Suggestion Border: `border-l-2 border-violet-500`
- **Approved / Verified / Resolved / Completed / Published (Mực Ngọc Hoàn Tất):**
  - Utility Class: `.btn-cta-success`
  - Inline Tokens: `bg-emerald-600 hover:bg-emerald-700 text-white shadow-soft-sm rounded-full`
  - Badge: `bg-emerald-50 text-emerald-800 border border-emerald-200`
  - Artwork Annotation Bounding Box (`Resolved/Verified`): Green `#10B981` (`border-emerald-500 bg-emerald-500/15`)
- **InReview / Warning / Submitted / Approaching Deadline (≤ 2 days) (Mực Hổ Phách):**
  - Utility Class: `.btn-cta-warning`
  - Inline Tokens: `bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 rounded-full`
  - Badge: `bg-amber-50 text-amber-800 border border-amber-200`
- **Blocking Error / Rejected / ReworkRequired / Danger / Delete (Mực Đỏ Chặn / Sửa Lại):**
  - Utility Class: `.btn-cta-danger`
  - Inline Tokens: `border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-full` (hoặc `bg-rose-600 hover:bg-rose-700 text-white` khi xác nhận xóa vĩnh viễn)
  - Badge: `bg-rose-50 text-rose-800 border border-rose-200`
  - Artwork Annotation Bounding Box (`Open`): Red `#EF4444` (`border-red-500 bg-red-500/15`)
- **InProgress / Info / Active Stage (Mực Lam Tiến Độ):**
  - Inline Tokens: `bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100 rounded-full`
  - Badge: `bg-blue-50 text-blue-800 border border-blue-200`
- **Neutral / Secondary Action (Mực Tro Yên Tĩnh):**
  - Utility Class: `.btn-cta-secondary`
  - Inline Tokens: `bg-white hover:bg-[#F5F5F4] text-[#292524] border border-[#E7E5E4] rounded-full shadow-soft-sm`
  - Badge/Track: `bg-stone-100 text-stone-600 border border-stone-200`

---

### 1.6. Admin Portal Tokens (`/admin` only)

The admin area uses its own `--color-admin-*` tokens so production-role screens are unaffected: page `admin-bg` #F3F0E9, cards `admin-card` #FCFBF8, fields/modals `admin-field` #FFFFFF, border `admin-line` #D8D2C5, accent `admin-accent` #F97316 / hover #EA580C, text `admin-ink` #44403C, headings and text on orange `admin-ink-strong` #292524, secondary text `admin-muted` #716B65 (#78716C is only 4.2:1 on the page background). No black surfaces or buttons. Primitives live in `src/roles/admin/views/components/AdminUi.tsx`.

### 1.7. Token Layers

`--studio-*` is the single source of truth for shared UI. Tailwind `@theme` entries and Lucian `--ux-*` tokens may only alias a `--studio-*` token; they must not introduce independent colors, radii, shadows, stacking values, or durations. Role-scoped tokens such as `--color-admin-*` remain limited to their documented role boundary.

| Category | Shared component tokens |
| :--- | :--- |
| Surfaces | `--studio-surface-0: var(--studio-paper)`, `--studio-surface-1: var(--studio-paper-card)`, `--studio-surface-2: var(--studio-paper-pure)`, `--studio-surface-3: var(--studio-paper-pure)` |
| Ink | `--studio-ink`, `--studio-ink-muted`, `--studio-ink-subtle`, `--studio-ink-faint` |
| Structure | `--studio-line`, `--studio-line-soft`, `--studio-line-strong` |
| Accent | `--studio-accent`, `--studio-accent-hover`, `--studio-accent-soft`, `--studio-accent-border`, `--studio-accent-ink: #fff` |
| Header accents | `--studio-head-wash`, `--studio-head-line`, `--studio-kraft`, `--studio-kraft-ink`, `--studio-sienna` (quy ước dùng ở §4.8) |
| Status | `--studio-status-success`, `--studio-status-success-soft`, `--studio-status-success-line`; the same three-part set for `warning`, `danger`, and `info`; neutral uses the surface, ink, and line tokens above |
| Focus | `--studio-focus-ring`, with a `2px` outline and `2px` offset |
| Radius | `--studio-radius-sm` (`6px`), `--studio-radius-md` (`12px`), `--studio-radius-lg` (`16px`) |
| Shadow | `--studio-shadow-1: 0 4px 20px -2px rgb(28 27 27 / 4%)`, `--studio-shadow-2: 0 12px 32px -4px rgb(28 27 27 / 6%)`, `--studio-shadow-3: 0 24px 54px -12px rgb(28 27 27 / 8%)` |
| Stack | `--studio-z-sticky: 30`, `--studio-z-dropdown: 40`, `--studio-z-drawer: 50`, `--studio-z-modal: 60`, `--studio-z-toast: 70`, `--studio-z-tooltip: 80` |
| Motion | `--studio-motion-fast: 100ms`, `--studio-motion-base: 150ms`, `--studio-motion-overlay: 200ms`, `--studio-ease-standard: cubic-bezier(0.2, 0.8, 0.2, 1)` |

Lucian ports map by meaning: `--ux-page` to `--studio-surface-0`; `--ux-surface`, `--ux-surface-2`, and `--ux-surface-3` to the matching studio surface; `--ux-ink`, `--ux-ink-2`, and `--ux-ink-3` to ink, muted, and subtle; `--ux-line` and `--ux-line-2` to line and line-strong; each `--ux-accent*` to its matching studio accent; `--ux-mint`, `--ux-warn`, `--ux-danger`, and `--ux-info` to success, warning, danger, and info; `--ux-shadow` and `--ux-shadow-strong` to shadow 1 and 3; and `--ux-ease` and `--ux-spring` to the standard ease. Legacy `--ux-glass`, `--ux-glass-line`, and `--ux-grad` alias surface 2, line, and accent respectively until Lucian consumers stop using them. Lucian tokens do not own a separate `prefers-color-scheme` branch; they inherit the active studio theme. Alias declarations belong in the token layer only.

## 2. TYPOGRAPHY & ICONOGRAPHY HIERARCHY

**⛔ STRICT PROHIBITION:** Never use micro font sizes such as `text-[9px]`, `text-[10px]`, or `text-[11px]` for readable UI text. The minimum allowed font size across the entire application is `text-xs` (`12px`).

### 2.1. Font Families (Standardized Studio Stack)
- **Body / Interface:** `font-sans` (`Plus Jakarta Sans`, system-ui, sans-serif) — High clarity, modern geometric grotesque, perfect at 12px–14px.
- **Headings / Studio Brand:** `font-serif` (`Playfair Display`, Georgia, serif) with `lining-nums`
- **Manga Studio Headings / Shonen Titles:** `font-studio` (`Be Vietnam Pro`, sans-serif, weights 700/900) — Bold, impactful, 100% Vietnamese diacritic support.
- **Manga Lettering & Speech Balloons:** `font-comic` (`Patrick Hand SC`, `Patrick Hand`, cursive) — Authentic manga pencil/ink lettering, 100% Vietnamese diacritic support.
- **Manuscript Notes & Handwritten Annotations:** `font-handwriting` (`Patrick Hand`, cursive) — Tactile manuscript memo notes.
- **Data / Codes / Panel IDs / Metrics / Timestamps:** `font-mono` (`JetBrains Mono`, monospace)

### 2.2. Typography Hierarchy Table
| Level | Target Element | Standard Tailwind Classes |
| :--- | :--- | :--- |
| **Page Title (H1)** | Main screen header (Studio Name, Series Title) | `text-2xl font-serif font-bold text-stone-900 tracking-tight` |
| **Section Title (H2)** | Major section headers (Series List, Pipeline, Bible) | `text-lg font-bold text-stone-900` |
| **Card Title (H3)** | Series Card title, Chapter title, Modal title | `text-base font-bold text-stone-900` (or `text-xl font-serif font-bold` for Series Cards) |
| **Card Metric / KPI** | Key numeric metrics (Storage GB, Sessions, %) | `text-lg font-mono font-bold text-stone-900` |
| **Body Text** | Script lines, review comments, descriptions | `text-sm text-stone-700 leading-relaxed` |
| **Label / Table Header** | Input labels, column headers, KPI card titles | `text-sm font-semibold text-stone-800` |
| **Helper / Subtext** | Card footnotes, timestamps, secondary metadata | `text-xs text-stone-500 leading-normal` |
| **Badge / Pill** | Status tags, genre (`GENERAL`), `Chưa cấp quota` | `text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap` |

### 2.3. Iconography Guidelines
- **Icon Family:** **Lucide Icons** exclusively. Do not mix with FontAwesome or other icon libraries.
- **Sizes:**
  - `w-3.5 h-3.5` inside inline text, badges, and small status pills.
  - `w-4 h-4` inside navigation bars, standard buttons, and input attachments.
  - `w-8 h-8` or larger only for empty state illustrations.
- **Semantic Icons:** `Sparkles` = AI, `ShieldCheck` = provenance/audit, `Lock` = locked dependency, `Clock` = deadline, `CheckCircle2` = completed/verified, `AlertTriangle` = warning/error.

---

## 3. LAYOUT, SPACING & CONTAINER RULES

### 3.1. No Double Container Boxing
- **Incorrect:** Wrapping a grid of cards inside a heavy white outer container (`bg-white border rounded-2xl p-6`) and then rendering bordered white cards inside it. This wastes horizontal space and creates visual clutter.
- **Correct:** Place the `Section Header` directly on the page background (`bg-[#FAF9F5]`) and render the card grid (`grid gap-6`) directly underneath.

### 3.2. Equal Height Grid Cards & Balanced Whitespace
- Every card grid (such as the 4 Quota/Usage cards or the 3-column Series grid) must enforce equal card heights:
  - Grid Container: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch` (or `lg:grid-cols-3 gap-6` for Series cards).
  - Individual Card: `flex flex-col justify-between h-full bg-white rounded-xl border border-stone-200/80 p-5 shadow-xs hover:shadow-md transition-all`.
- Keep top headers, middle metrics/progress bars, and bottom helper text aligned across all cards in a row. Avoid cramming long paragraphs into a single KPI card.

### 3.3. Progress Bar Guard Rule
- Every progress bar (Storage Quota, AI Token Quota, Stage Progress) must safely guard against zero division:
  ```ts
  const safePercent = total > 0 ? Math.min(100, Math.max(0, (used / total) * 100)) : 0;
  ```
  When `safePercent === 0` (e.g., `0.0 / 0.0 GB`), the inner fill bar MUST have `style={{ width: '0%' }}` so only the gray track (`bg-stone-100`) is visible. Never render a 100% full orange/red bar when usage is 0%.

### 3.4. Standard 3-Pane Studio Workbench Layout
Applies to `ScriptEditorView`, `ArtistDeskView`, `LetteringWorkspace`, and `ReviewView`:
- **Viewport Container:** `h-[calc(100vh-4rem)] flex overflow-hidden bg-stone-50`.
- **Left Pane (Structure Tree / Scene List / Tool Palette):** `w-64` or `w-72` `shrink-0 border-r border-stone-200 bg-white flex flex-col overflow-y-auto`.
- **Center Pane (Main Canvas / Script Editor / Diff Viewport):** `flex-1 relative overflow-auto flex flex-col`. Floating canvas toolbars (Zoom, Pan, Mode Switcher) must use `backdrop-blur-md bg-white/90 border border-stone-200 shadow-sm rounded-lg px-3 py-1.5`.
- **Right Pane (Inspector / Properties / Bible Reference / Consistency Findings / Change Requests):** `w-80` or `w-96` `shrink-0 border-l border-stone-200 bg-white flex flex-col overflow-y-auto`.

---

## 4. SHARED COMPONENT PATTERNS

- **Standard Card:** Header with title and badge, body section, footer with action buttons.
- **Empty States:** Border dashed `border-2 border-dashed border-stone-300 rounded-xl p-8 flex flex-col items-center justify-center text-center`, warm orange icon container (`bg-orange-50 text-orange-600 p-3 rounded-xl`), `font-serif` title, and clear action CTA.
- **Loading States:** Skeleton pulse with `bg-stone-200/70 rounded-md animate-pulse`, matching the target surface geometry. Avoid full-screen blocking spinners except for page transitions.
- **Tooltips:** `bg-stone-900 text-white text-xs rounded-md px-2 py-1 shadow-md`.

All shared primitives below live in `src/shared/ui/`, consume only the token contract in section 1.7, accept a `className` escape hatch for layout only, and forward native HTML attributes and refs where applicable.

> **Implementation status (2026-11-15):** the shared UI foundation merged in FE `f4d7773`. UI-2 shared and producer migration batches merged in `77f6bd2` and `552a35b`; writer, artist, remaining roles, Series Bible, and sidebars are pending.

### 4.1. Modal (Centered Dialog)

| Contract | Required behavior |
| :--- | :--- |
| Sizes | `sm: 400px`, `md: 560px` (default), `lg: 720px`, `xl: 960px`, `full: calc(100vw - 32px)`; every size is capped at `calc(100vw - 32px)` and the dialog at `calc(100dvh - 32px)` |
| Slots | `title`, optional `description`, scrollable `body`, `footer`; footer actions align right and the primary action is last in DOM and visual order |
| Chrome | Level 3 surface; close button in the top-right with an accessible label |
| Dismissal | `Escape` and backdrop click close by default; neither closes when `dismissible={false}`; closing must be idempotent |
| Focus | Trap focus while open, focus the first meaningful control (or dialog container), and restore focus to the opener on close |
| Semantics | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` for title, and `aria-describedby` only when description exists |
| Page state | Lock body scroll while open without shifting page width; portal to the shared overlay root |
| Motion | Backdrop fade plus dialog fade/scale in and out in `200ms`; `prefers-reduced-motion: reduce` renders the final state without transform or delayed dismissal |

- Only one standard modal may be open. A `ConfirmDialog` may appear above it at `calc(var(--studio-z-modal) + 1)`; no third overlay may stack.
- The modal surface uses `--studio-z-modal`; dropdowns or tooltips inside it remain within the modal stacking context.

### 4.2. Drawer (Side Panel)

| Contract | Required behavior |
| :--- | :--- |
| Placement | `right` by default or `left` |
| Width | `sm: 360px`, `md: 420px` (default), `lg: 560px`; cap at `100vw` |
| Slots | `header` (title and close control), scrollable `body`, optional `footer` |
| Behavior | Uses the modal focus trap, focus restoration, body scroll lock, `Escape`, `dismissible`, ARIA, backdrop, portal, and reduced-motion rules |
| Motion | Backdrop fade and horizontal panel slide in/out in `200ms` |

- Use `--studio-z-drawer`. A drawer does not open on top of a modal.
- On mobile, navigation uses this primitive with `placement="left"`; it must not maintain a separate overlay implementation.

### 4.3. ConfirmDialog

| Variant | Contract |
| :--- | :--- |
| `default` | Neutral confirmation; cancel receives initial focus |
| `danger` | Destructive confirmation with danger icon/text treatment; cancel receives initial focus |
| `type-to-confirm` | Requires exact, case-sensitive equality with the supplied `confirmationText`; submit stays disabled until matched and the required text remains visible beside the field |

- `ConfirmContext` exposes `confirm(options): Promise<boolean>` through `useConfirm()`. It resolves `true` once on confirm and `false` once on cancel, `Escape`, or permitted backdrop dismissal.
- Options include `variant`, `title`, `description`, `confirmLabel`, `cancelLabel`, `confirmationText`, and `dismissible`. All visible labels and accessible names come from i18n keys or explicit caller-provided localized strings; primitives contain no production-language defaults.
- Confirm uses the Modal contract and is the only overlay allowed above an existing modal.

### 4.4. Alert (Inline)

| Contract | Required behavior |
| :--- | :--- |
| Tones | `info`, `success`, `warning`, `danger`, `neutral` |
| Slots | Required icon and body; optional `title`, action, and dismiss control |
| Semantics | Danger/warning use `role="alert"`; other tones use `role="status"` only for content announced after page load, otherwise no live role |

- Every tone combines icon, text, and semantic color; color is never the sole signal.
- The optional action is a real button or link with a specific label. Dismiss has an accessible localized label and does not remove externally controlled alerts without calling `onDismiss`.

### 4.5. Toast

| Contract | Required behavior |
| :--- | :--- |
| Placement | Bottom-right stack, maximum three visible, newest on top |
| Tones | Same five tones as Alert; each uses an icon, text, and semantic `border-left: 4px` |
| Lifetime | `5000ms` by default; pause on pointer hover and keyboard focus; danger is sticky until explicitly closed |
| Action | Optional real button; close control is always available |
| Announcement | `aria-live="polite"` for neutral/info/success/warning and `aria-live="assertive"` for danger; each toast is atomic |

- `ToastContext` exposes `toast.success(...)`, `toast.warning(...)`, `toast.danger(...)`, `toast.info(...)`, and `toast.neutral(...)`; generic `toast(...)` requires an explicit tone. Do not infer tone from message text.
- Adding a fourth toast removes the oldest visible toast. Reduced motion removes stack transforms and exit delays, not the timeout itself.

### 4.6. Sidebar

| Primitive | Contract |
| :--- | :--- |
| `SidebarSection` | Optional localized section label plus a list of items; the label is visually hidden in collapsed mode |
| `SidebarItem` | Icon, localized label, optional badge, and `default`, `hover`, `active`, `disabled`, and visible `focus` states; renders a link for navigation and a button only for actions |
| Dimensions | Expanded width `248px`; collapsed rail width `64px` |

- `AppShellSidebar` and the collapsible rail compose these primitives rather than maintaining separate item behavior.
- Active state is derived from the current route and exposed with `aria-current="page"`; callers do not maintain a competing visual-only active flag.
- Collapsed items expose their label in a keyboard- and pointer-triggered tooltip. Badges retain an accessible name when their visual label is hidden.
- Navigation is reachable in DOM order with `Tab`. Within a composite menu, `ArrowUp`/`ArrowDown`, `Home`, and `End` move focus; `Enter`/`Space` activates buttons and `Enter` activates links. Disabled items are not actionable.
- Below the desktop breakpoint, render the same sections/items inside the shared left Drawer; do not render a second navigation model.

### 4.7. Migration Rules

- Do not add ad-hoc `fixed inset-0` overlays. New dialogs, confirmations, and side panels use the shared primitives in `src/shared/ui/`.
- All new dialogs use `Modal`, `Drawer`, or `ConfirmDialog`; feature code owns content, not focus, scroll-lock, portal, or dismissal mechanics.
- Preserve every existing `data-testid` exactly during migration. Shared primitives accept test IDs needed by current tests.
- Migrate one product area at a time in later tasks. This contract does not authorize a broad component rewrite.

### 4.8. Header & Card Header Accents ("Mực Cam & Giấy Kraft")

> **Vấn đề (rà soát 2026-11-27):** các màn nhiều thẻ trắng nằm cạnh nhau, header trang và header thẻ không có điểm nhấn nên khó quét mắt. Mỗi màn tự chế một kiểu: header thẻ lúc `bg-stone-50`, lúc `bg-[#FCFBF8]`, lúc không có; tiêu đề lúc `text-stone-900`, lúc `#1C1917`, lúc `#44403C`; header bảng `bg-stone-50/70`. Quy ước này thay thế toàn bộ các biến thể đó.

**Ý tưởng màu:** giữ thân thẻ trắng; đưa điểm nhấn vào *đầu* mỗi khối bằng họ màu cùng nhiệt độ với cam `#F97316` — kem giấy, giấy kraft, nâu sienna — thay vì thêm màu mới. Cam đặc chỉ xuất hiện ở các nét mảnh (thanh mực) và CTA.

#### 4.8.1. Bảng màu nhấn (token mới trong `studio-tokens.css`, alias Tailwind trong `@theme`)

| Token | Light | Dark | Tailwind | Dùng cho | Tương phản |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--studio-head-wash` | `#FBF5EC` kem giấy | `#1F1A15` | `bg-head-wash` | Dải header thẻ, header bảng, header modal/drawer | nền |
| `--studio-head-line` | `#EFE3D1` | `rgba(251,146,60,0.18)` | `border-head-line` | Viền dưới dải header | trang trí |
| `--studio-kraft` | `#F6E7D3` giấy kraft | `rgba(251,146,60,0.14)` | `bg-kraft` | Chip đếm số, nhãn phân nhóm | nền |
| `--studio-kraft-ink` | `#5B4636` | `#E9D5BC` | `text-kraft-ink` | Chữ trên kraft, chữ header bảng | 7.3:1 |
| `--studio-sienna` | `#9A3412` | `#FDBA74` | `text-sienna` | Eyebrow (nhãn nhỏ trên tiêu đề), nhãn nhấn | 6.7:1 trên wash |
| `--studio-accent-soft` (có sẵn) | `#FFF2E6` | có sẵn | `bg-accent-soft` | Ô icon (icon tile) | nền |
| `--studio-accent-dark` (có sẵn) | `#C2410C` | có sẵn | `text-accent-dark` | Icon trong ô icon | 4.9:1 |
| `--studio-accent` (có sẵn) | `#F97316` | có sẵn | `bg-accent` | Thanh mực 3px, dải đầu thẻ nổi bật | trang trí |

- Không dùng `amber-*` để trang trí: hổ phách đã mang nghĩa Cảnh báo/Chờ duyệt (§1.5).
- Không gradient, không tô đặc cam cả dải header.

#### 4.8.2. Bốn cấp header

| Cấp | Primitive | Công thức |
| :--- | :--- | :--- |
| **Header trang** | `PageHeader` | Nằm trên nền giấy, không bọc thẻ. Trái: ô icon 40px (`bg-accent-soft text-accent-dark rounded-xl`), eyebrow `text-xs font-semibold uppercase tracking-wider text-sienna`, H1 `text-2xl font-serif font-bold text-stone-900`, mô tả `text-sm text-stone-600`. Phải: nút hành động. Đáy: `border-b border-head-line` kèm **thanh mực** cam 48×3px nằm đè lên viền ở mép trái — dấu nhận diện của mọi header trang. |
| **Header thanh công cụ dính** (bàn làm việc) | `PageHeader variant="toolbar"` | `bg-white/95 border-b border-stone-200` + vạch cam 2px ở mép trên (`shadow-[inset_0_2px_0_var(--studio-accent)]`). Không thanh mực ở đáy. |
| **Header mục** (trên nền giấy) | `SectionHeader` | Eyebrow sienna (tuỳ chọn) + H2 `text-lg font-bold text-stone-900` + chip đếm `bg-kraft text-kraft-ink text-xs font-semibold rounded-full px-2` + hành động bên phải. Không viền trái (viền trái cam là trạng thái *đang chọn*, §1.2). |
| **Header thẻ** | `CardHeader` trong `Card` | Dải `bg-head-wash border-b border-head-line px-4 py-3`. Trái: ô icon 28px (`bg-accent-soft text-accent-dark rounded-lg`, icon `w-4`), tiêu đề `text-sm font-bold text-stone-900` (`text-base font-serif` cho thẻ chính), phụ đề `text-xs text-stone-600`. Phải: badge trạng thái, nút phụ. Thân thẻ giữ `bg-white`. |

#### 4.8.3. Tông theo ngữ nghĩa (`tone`)

`Card`/`CardHeader` nhận `tone`: `brand` (mặc định) · `ai` · `success` · `warning` · `danger` · `info` · `neutral`. Tông **chỉ đổi màu ô icon** (theo bảng §1.5: violet/emerald/amber/rose/blue/stone); dải `head-wash` giữ nguyên cho mọi tông để cả màn hài hoà. Ngoại lệ: `tone="ai"` được dùng `bg-violet-50/60 border-violet-100` cho dải header để giữ quy tắc "AI phải nhận ra được" (§1.1).

#### 4.8.4. Thẻ nổi bật & ngân sách cam

- `Card featured`: thêm dải đầu 3px `border-t-[3px] border-t-accent`. Tối đa **1 thẻ nổi bật mỗi khung nhìn** (vd: thẻ "Việc của tôi", thẻ chương đang làm).
- Thẻ đại diện một trạng thái (bản nộp bị trả về, finding chặn) dùng dải đầu theo màu trạng thái thay cho cam.
- Ngân sách cam đặc trên một khung nhìn: 1 CTA chính + 1 thẻ nổi bật + thanh mực của header trang. Ô icon, eyebrow, chip kraft là "cam mềm", không tính vào ngân sách.

#### 4.8.5. Bảng, modal, drawer, khối lồng

- **Header bảng:** `bg-head-wash text-kraft-ink text-xs font-semibold uppercase tracking-wide border-b border-head-line` (thay `bg-stone-50`).
- **Header Modal/Drawer:** dùng cùng dải `head-wash` như header thẻ; primitive `Modal`/`Drawer` áp sẵn, màn hình không tự viết lại.
- **Khối lồng trong thẻ trắng:** không đặt thẻ trắng có viền trong thẻ trắng. Khối con dùng `bg-head-wash` hoặc `bg-[#FAF9F5]` + `border-stone-200/80` (§3.1).
- **Tiêu đề:** chỉ `text-stone-900`; bỏ các mã màu rời `#1C1917`, `#44403C` (ngoại lệ: khu `/admin` theo §1.6).

#### 4.8.6. Cấm

- ❌ `bg-stone-50`, `bg-[#FCFBF8]`, `bg-gray-*` cho dải header thẻ.
- ❌ Tô cam đặc cả header, gradient cam, chữ cam nhạt (`text-orange-400/500`) làm chữ đọc.
- ❌ Thêm thẻ nổi bật thứ hai trong cùng khung nhìn; dùng `amber` hay `violet` chỉ để trang trí.
- ❌ Màn hình tự dựng header thẻ bằng `div` khi `CardHeader` đáp ứng được.

### 4.9. Bản đồ UI dùng chung (một mẫu = một primitive)

> **Mục tiêu:** sửa giao diện một chỗ, mọi màn đổi theo. Màn hình chỉ *ghép* primitive; class màu, viền, bo góc, cỡ chữ của mẫu chỉ được viết trong primitive.
>
> **Hiện trạng (quét 2026-11-27, 228 file `.tsx`):** badge trạng thái tự viết ở 66 file, nút cam tự viết ở 92 file (chỉ 4 file dùng `.btn-cta-*`), khung trống `border-dashed` ở 57 file, ô tìm kiếm ở 29 file, tab ở 11 file, skeleton ở 17 file. Bảng màu trạng thái tự định nghĩa ở 11 chỗ (`renderStatusBadge`, `getStatusBadge`, `STATUS_STYLE`, `statusTone`…). Có ba nơi chứa UI chung: `src/shared/ui/` (đang dùng), `src/shared/components/ui/` (`Badge`, `Button`, `Card`, `Input`… **không file nào import**), `src/shared/components/lucian/` (một phần trùng `ConfirmDialog`, `Alert`). Ba màn chọn chương của Writer/Artist/Letterer (862 + 713 + 537 dòng) gần như chép nhau.

**Nơi duy nhất:** `src/shared/ui/` (primitive) và `src/shared/lib/statusTone.ts` (ánh xạ trạng thái nghiệp vụ → tông + khoá i18n). Không tạo thêm thư mục UI chung khác.

| Nhóm | Primitive (`src/shared/ui/`) | Thay cho | Ghi chú hợp đồng |
| :--- | :--- | :--- | :--- |
| Bề mặt & header | `PageHeader`, `SectionHeader`, `Card`, `CardHeader`, `CardBody` | header/thẻ tự dựng | §4.8 |
| Hành động | `Button` (`primary` · `secondary` · `ai` · `success` · `warning` · `danger` · `ghost`; `sm` · `md`; `loading`), `IconButton` (bắt buộc `aria-label`) | `bg-orange-600`/`bg-[#EA580C]` rời, `.btn-cta-*` | `.btn-cta-*` trở thành chi tiết bên trong `Button` |
| Trạng thái | `Badge` (`tone` như §1.5, icon tuỳ chọn), `StatusBadge` (`kind` + `status`, đọc `statusTone.ts`) | 11 hàm/bảng màu trạng thái riêng | Một trạng thái nghiệp vụ có đúng một màu và một nhãn trên toàn hệ thống |
| Nhập liệu | `Field` (nhãn, gợi ý, lỗi, `aria-describedby`), `Input`, `Textarea`, `Select`, `SearchInput` | input/select tự style | Lỗi hiển thị bằng chữ + màu rose |
| Điều hướng trong trang | `Tabs` (`role="tablist"`, phím mũi tên, `aria-selected`) | 11 bộ tab tự viết | |
| Trống & đang tải | `EmptyState` (§4), `Skeleton` | `border-dashed` rời, `animate-pulse` rời; `lucian/EmptyFolderState` | |
| Dữ liệu | `ProgressBar` (chặn chia cho 0, §3.3), `Metric` (nhãn + số `font-mono`), `Avatar` (ảnh hoặc chữ cái đầu), `CountChip` (kraft, §4.8) | thanh tiến độ, thẻ KPI, avatar tự dựng | |
| Overlay | `Modal`, `Drawer`, `ConfirmDialog`, `Alert`, `Toast` (đã có) | `lucian/LucianConfirmModal`, `lucian/TypeToConfirmModal`, `lucian/LucianInlineAlert`, `fixed inset-0` tự dựng | |

**Cụm tính năng dùng chung** (`src/shared/features/`): màn chọn chương của Writer/Artist/Letterer gộp thành `chapter-selection/` nhận cấu hình theo vai trò (nhãn CTA §5.1, cột trạng thái, đích điều hướng); ba file trong `src/roles/*` chỉ còn khai báo cấu hình.

**Quy tắc:**
1. Có primitive thì dùng primitive; thiếu biến thể thì thêm biến thể vào primitive, không vá class ở màn.
2. `className` truyền vào primitive chỉ dùng cho bố cục (margin, width, grid), không đổi màu/viền/cỡ chữ.
3. Trạng thái nghiệp vụ mới (enum BE mới) phải được thêm vào `statusTone.ts` cùng lượt với khoá i18n vi/en.
4. Mỗi primitive có test trong `src/shared/ui/ui.test.tsx` và một dòng trong `src/shared/README.md`.
5. Thư mục `src/shared/components/ui/` bị xoá; `src/shared/components/lucian/` chỉ giữ thành phần chưa có bản tương đương (minimap, ruler, layer order…).

---

## 5. ROLE-AWARE UI & NAVIGATION FLOW RULES

### 5.1. Dynamic Role Copywriting (Spec D10 Role Hierarchy)
Shared screens (such as the Studio Overview / Series Selection screen) must inspect the user's role hierarchy (cấp Studio là `WorkspaceRole` Producer/Member; cấp Series là `series.currentUserRole` thuộc `series_members` gồm Producer, Editor, Writer, Artist, Letterer) and render appropriate descriptions and primary CTA labels:
- **PRODUCER:** "Producer Desk: Manage series, production pipelines, assignments, and studio quotas." → Primary Series CTA: "Manage Series" (Quản Lý Bộ Truyện)
- **EDITOR:** "Editor Desk: Quality control, stage gate reviews, version comparison, and consistency checks." → Primary Series CTA: "Manage Chapters (Review)" (Quản Lý Chương (Duyệt))
- **WRITER:** "Writer Desk: Author structured scripts, story arcs, chapter outlines, and Series Bible links." → Primary Series CTA: "Open Script Workspace" (Soạn Thảo Kịch Bản)
- **ARTIST:** "Artist Desk: Design page layouts, frame templates, panel artwork, and canvas layers." → Primary Series CTA: "Open Artist Desk" (Vào Bàn Vẽ)
- **LETTERER:** "Letterer Desk: Place dialogue balloons, SFX, and synchronize script lines." → Primary Series CTA: "Open Lettering Workspace" (Vào Bàn Chèn Chữ)

### 5.2. Strict Hierarchical Navigation Flow & Cross-Studio Hub (Spec §5.3 & UIQ-11)
- **Step 0 (Cross-Studio):** `/my-work` (My Work Hub) hoặc dải My Work Bar ngay tại `/workspaces` gọi `GET /api/me/work` gom toàn bộ đầu việc của cá nhân xuyên suốt mọi Studio.
- **Step 1:** `/workspaces` (Select Studio Workspace). Brandmark Studio Home trong thanh điều hướng luôn liên kết về `/workspaces`.
- **Step 2:** `/workspaces/:wId` (Studio Overview & Series Selection). StudioSwitcher loại bỏ truncate chống cắt dropdown.
- **Step 3:** `/workspaces/:wId/series/:sId` (Series Workspace). Với Producer, mặc định mở tab `chapters`; modal tạo chương mới mở được ngay cả khi danh sách đang rỗng (`chapters = 0`).
- **Step 4:** Role-Specific Workbench / Reader:
  - Bàn làm việc chuyên môn (`ScriptEditorView`, `ArtistDeskView` — tự động kích hoạt `InProgress` khi mở, `ReviewView`).
  - Chế độ đọc duyệt liên tục (`/workspaces/:wId/series/:sId/read` — Series Continuous Reader) cho phép duyệt trang liền mạch và ghim nhận xét theo tọa độ `{pinX, pinY}` chuyển sang Rework.
- **Header Breadcrumbs** must accurately reflect the hierarchy (`Workspaces` / `<Studio Name>` / `<Series Name>` / `<Chapter Name>`) and clicking any segment must navigate directly to that level.
- **Sidebar Selectors** (Studio switcher & Series dropdown) must stay 100% synchronized with `activeWorkspaceId` and `activeSeriesId`.

---

## 6. ACCESSIBILITY & MOTION (WCAG AA)

- **Color is never the sole indicator:** All badges and status markers must include text labels or icons in addition to color.
- **Contrast Ratios:** Minimum 4.5:1 for body and label text against light backgrounds.
- **Transitions:** `transition-all duration-150` for micro-interactions (buttons, hovers); `duration-200` to `300` for drawers and modals.
- **Scale on Click:** `active:scale-[0.98]` on primary CTA buttons.
- **Landing scroll reveal:** one shared observer in `LandingPageView` handles `.animate-on-scroll` and `[data-reveal]` (adds `.is-visible` once, never replays). Hero → intro uses `data-reveal='ink'` (orange ink guide 600ms, paper edge lift −12px / −5px mobile, intro copy stagger); the three value cards use `data-reveal='frame'` (ink frame trace, 90ms stagger on desktop). Hidden states apply only under `.js-observer-ready` + `prefers-reduced-motion: no-preference`; no observer, reduced motion and print show the final state.

---

## 7. TECHNICAL CONSTRAINTS & QUALITY GATES
- **Preserve 100% of `data-testid` Attributes & API Contracts:** Never delete or rename existing `data-testid` attributes required by unit and integration tests.
- **Enforce ESLint Role Boundaries:** Files inside `src/roles/<role>/` may only import from their own role folder or `src/shared/`. Cross-role imports are strictly forbidden.
- **Mandatory Verification After Every Change Batch:** Always run `npm run quality` (`tsc --noEmit`, `eslint --max-warnings 0`, `vitest run`) and `npm run build` with 0 errors and 0 warnings.

---

## 8. ANTI-SLOP CONSTITUTION (ZERO GENERIC AI ARTIFACTS)

PanelForge must look and feel like an authentic, high-end editorial manga workstation—crafted by dedicated UI/UX designers, not an auto-generated AI template.

1. **Strictly Forbidden Visual Tropes (AI Slop Checklist):**
   - ❌ **No Purple/Violet Default Bias:** Never use violet/purple unless explicitly representing AI features (`PanelForge.AI`, Series Bible Lore, Consistency Checking).
   - ❌ **No Generic Glow Orbs / Neon Gradients:** Zero background blur blobs, zero animated glowing borders. Surfaces must rely on crisp borders (`border-stone-200/80`) and clean paper elevation.
   - ❌ **No Gratuitous Sparkle Icons:** Do not sprinkle `Sparkles` or `Wand` icons on standard buttons, headers, or empty states.
   - ❌ **No Fake Dashboard Analytics:** Never invent arbitrary "+12.4% vs last week" percentage pills or fake sparklines on screens that lack real telemetry metrics.
   - ❌ **No Vast Empty Center Cards:** Never drop a lonely card in the center of a wide desktop view. PanelForge interfaces must feel like high-productivity workbenches with balanced information density.
2. **Copywriting Integrity:**
   - ❌ Banned buzzwords: *"Delve"*, *"Tapestry"*, *"Revolutionize"*, *"Seamless"*, *"Elevate"*, *"Powerhouse"*, *"Unleash"*.
   - ✅ Use concrete manga publishing terminology: "Chapter Script", "Frame Template", "Lettering Canvas", "Stage Gate Review", "Character Bible".
3. **Skill Verification:**
   - Always run the Purpose Test (`@skill:antislop` & `@skill:antislop-ui`): If a visual technique cannot state its exact usability or hierarchy purpose, remove it.


---

## 9. CONCISE UX MICROCOPY & ZERO-FLUFF UI (`@skill:ux-microcopy`)

Apply the strict copywriting ceilings from `@skill:ux-microcopy`:
1. **Buttons / CTAs:** Max 2–3 words ($\le 18$ chars), `[Action Verb] + [Noun]` (e.g. *"Lưu kịch bản"*, *"Tải ảnh"*, *"Khóa chuẩn"* — never *"Xác nhận lưu thay đổi"*).
2. **Zero Filler Words:** Remove all polite fluff: *"Vui lòng"*, *"Xin hãy"*, *"Bạn có thể"*, *"Click here"*.
3. **Labels & Placeholders:** Labels max 1–3 words. Placeholders show format examples only (`vd: Chương 1`), never repeat the label.
4. **Empty States:** 1 short title (2–4 words) + 1 action button. Never multi-line tutorial text.
5. **No Internal Jargon:** Hide rule codes (`BR-11`, `SCR-12`) from user-facing UI.
6. **Progressive Disclosure:** Move explanatory hints into hover `<Tooltip>` with a `?` icon.
