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

---

## 5. ROLE-AWARE UI & NAVIGATION FLOW RULES

### 5.1. Dynamic Role Copywriting (Never Hardcode Producer Copy for Other Roles)
Shared screens (such as the Studio Overview / Series Selection screen) must inspect the user's active `WorkspaceRole` and render appropriate descriptions and primary CTA labels:
- **PRODUCER:** "Producer Desk: Manage series, production pipelines, assignments, and studio quotas." → Primary Series CTA: "Manage Series" (Quản Lý Bộ Truyện)
- **EDITOR:** "Editor Desk: Quality control, stage gate reviews, version comparison, and consistency checks." → Primary Series CTA: "Manage Chapters (Review)" (Quản Lý Chương (Duyệt))
- **WRITER:** "Writer Desk: Author structured scripts, story arcs, chapter outlines, and Series Bible links." → Primary Series CTA: "Open Script Workspace" (Soạn Thảo Kịch Bản)
- **ARTIST:** "Artist Desk: Design page layouts, frame templates, panel artwork, and canvas layers." → Primary Series CTA: "Open Artist Desk" (Vào Bàn Vẽ)
- **LETTERER:** "Letterer Desk: Place dialogue balloons, SFX, and synchronize script lines." → Primary Series CTA: "Open Lettering Workspace" (Vào Bàn Chèn Chữ)

### 5.2. Strict 4-Step Hierarchical Navigation Flow
- **Step 1:** `/workspaces` (Select Studio Workspace) ➔ **Step 2:** `/workspace/:wId` (Studio Overview & Series Selection) ➔ **Step 3:** Select Chapter / Task inside Series ➔ **Step 4:** Role-Specific Workbench.
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
