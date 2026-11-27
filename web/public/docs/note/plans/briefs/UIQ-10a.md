<!-- Brief giao việc cho agent (agy/Codex/Claude). Nhánh nền: {work-branch} của FE (đã có UIQ-09, FE fe499e03). Lệnh: panelforge-hub/scripts/agy/Start-AgyTask.ps1 -Id uiq-10a -Worktree <worktree FE> -TaskFile <file này> -Deny <file sidebar đang có người sửa>, 'package.json'. Worktree dùng junction node_modules thì gỡ junction (cmd /c rmdir) trước khi git worktree remove. -->

UIQ-10a (FE): one primitive per UI pattern in src/shared/ui, so a style change in one place updates every screen.
Spec - read FIRST: panelforge-hub/docs/spec/DESIGN_RULES.md sections 1.5, 2.2, 2.3, 3.3, 4 (incl. 4.8 and 4.9). Plan: panelforge-hub/docs/note/plans/08_UI_QUALITY_PLAN.md UIQ-10.
Prerequisite: UIQ-09 primitives (src/shared/ui/Surface.tsx: PageHeader, SectionHeader, Card, CardHeader, CardBody) and header tokens are already on this branch. Reuse them; do not duplicate.

## Build (src/shared/ui/, export from index.ts; same style as existing primitives: forwardRef, native attrs passthrough, data-testid passthrough, className for layout only, no production-language default strings - labels come from props)
1. Button.tsx: Button { variant: primary | secondary | ai | success | warning | danger | ghost (default secondary); size: sm | md; loading?; leadingIcon?; trailingIcon? } - visuals from DESIGN_RULES 1.5 (move the .btn-cta-* look inside; keep the .btn-cta-* CSS classes working for now). active:scale-[0.98] only on primary. Min height 36px (md), 32px (sm). IconButton { 'aria-label' required by the type, variant ghost|secondary, size }.
2. Badge.tsx: Badge { tone: brand|ai|success|warning|danger|info|neutral; icon? } = text-xs font-medium px-2.5 py-0.5 rounded-full + tone colours from 1.5. StatusBadge { kind, status } reads src/shared/lib/statusTone.ts.
3. src/shared/lib/statusTone.ts: typed map per domain enum -> { tone, icon (lucide name), labelKey (i18n key) }. Cover the enums used by the current status badge code: AssignmentStatus, ChapterStatus, StageProgress status, ChangeRequest status, ConsistencyFinding severity, BibleReviewStatus, asset/artwork review status, audit action kinds (see renderStatusBadge/getStatusBadge in ArtistChapterSelectionView, LettererChapterSelectionView, writer ChapterSelectionView, ChapterAssignmentsModal; STATUS_STYLE in AssignmentWorkCard and TaskGridBoard; statusTone in ArtistBibleOverview; getAuditStatusBadgeClass in shared/utils/auditLogUtils.ts; ArtworkPanel getStatusBadges; SeriesCardItem statusBadgeColor). Take enum values from src/types / services DTOs, never invent. Reuse their existing i18n keys; add missing ones to BOTH vi and en.
   Do NOT migrate those call sites in this task (that is UIQ-10b) - only build the map so it matches what they show today.
4. Field.tsx: Field { label, hint?, error?, required?, children } wiring id / aria-describedby / aria-invalid; Input, Textarea, Select (native select), SearchInput (lucide Search icon, type=search, clear button with aria-label prop). Error = rose text + border, never colour alone.
5. Tabs.tsx: Tabs { items: {id,label,icon?,count?}[], value, onChange } with role=tablist/tab, aria-selected, aria-controls, roving tabindex, ArrowLeft/Right/Home/End. Active = orange underline (border-b-2 border-accent text-stone-900), inactive text-stone-600.
6. EmptyState.tsx (DESIGN_RULES 4: dashed border, orange-50 icon tile, serif title, one action), Skeleton.tsx (bg-stone-200/70 animate-pulse rounded-md; width/height props).
7. ProgressBar.tsx { value, max, tone?, label (aria) } with the zero-division guard from 3.3 and role=progressbar aria-valuenow/min/max. Metric.tsx { label, value, hint? } (value text-lg font-mono font-bold). Avatar.tsx { src?, name, size sm|md|lg } - initials fallback, lazy img with width/height. CountChip.tsx (bg-kraft text-kraft-ink, 4.8); if SectionHeader already renders a count chip, make it use CountChip.
8. Tests for every primitive in src/shared/ui/ui.test.tsx (variants, a11y attributes, keyboard for Tabs, ProgressBar 0/0 => width 0%). One-line entry per primitive in src/shared/README.md.

## Clean up duplicates
- Delete src/shared/components/ui/ entirely (nothing imports it - verify with grep first; if something does, migrate that import to src/shared/ui).
- Replace the 3 Lucian duplicates and delete those Lucian files + their tests + index exports:
  TypeToConfirmModal (ProducerChapterManagementView, ScriptEditorView) -> useConfirm() with variant 'type-to-confirm';
  LucianInlineAlert (WorkspaceListView) -> Alert;
  EmptyFolderState (SeriesBibleView) -> EmptyState.
  LucianConfirmModal: delete if unused. Keep every other Lucian component.
  Keep behaviour, copy and every data-testid.

## Do NOT
- Do not migrate screens beyond the 4 call sites above (UIQ-10b/c come later).
- Do not edit: src/app/AppShell.tsx, src/app/AppShellSidebar.tsx, src/app/FocusWorkspaceLayout*.tsx, src/app/sidebarTheme.ts, src/app/useSidebarTheme.ts, src/shared/ui/Sidebar.tsx, src/styles/modules/sidebar-theme.css, package.json. No new dependencies. No gradients, no text below text-xs, Lucide icons only.

## Checks
npx tsc --noEmit ; npx eslint <changed files> ; npx vitest related --run <changed files> ; npm run i18n:check (locales changed).
COMMIT_MSG (split into 3-4 commits): feat(ui): add button, badge and status tone primitives ; feat(ui): add form field, tabs and feedback primitives ; refactor(ui): remove unused shared ui kit and lucian duplicates

Known pre-existing failures on the base branch - ignore, do not fix: tsc errors about 'variantLabel' in ArtistDeskView.tsx and ScriptRightBiblePanel.tsx; 2 failing tests in src/app/AppShell.test.tsx.
