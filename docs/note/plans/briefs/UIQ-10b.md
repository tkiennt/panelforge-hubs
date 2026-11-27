<!-- Brief giao việc cho agent (agy/Codex/Claude). Điều kiện chạy: commit "feat(ui): add button, badge and status tone primitives" của UIQ-10a đã có trên nhánh nền. Có thể chạy song song phần còn lại của 10a nếu tách worktree từ commit đó. Lệnh: panelforge-hub/scripts/agy/Start-AgyTask.ps1 -Id uiq-10b -Worktree <worktree FE> -TaskFile <file này> -Deny 'src/app/*','src/shared/ui/*','src/shared/components/*','src/styles/*','package.json' -->

UIQ-10b (FE): replace hand-written status colour maps with the shared StatusBadge, so one business status has exactly one colour and one label everywhere.
Spec - read FIRST: panelforge-hub/docs/spec/DESIGN_RULES.md sections 1.5 and 4.9. Plan: panelforge-hub/docs/note/plans/08_UI_QUALITY_PLAN.md UIQ-10b.
This branch already contains src/shared/ui/Badge.tsx (Badge, StatusBadge) and src/shared/lib/statusTone.ts from UIQ-10a. Read them first and use them as they are.
Another agent may be working in parallel on src/shared/ui/* (fields, tabs, feedback primitives) and on the Lucian clean-up in ProducerChapterManagementView, ScriptEditorView, WorkspaceListView, SeriesBibleView. Do NOT edit those files or anything under src/shared/ui/ or src/shared/components/.
If statusTone.ts is missing a status value or a domain you need, add it to statusTone.ts (with vi + en i18n keys) - that is the only shared file you may extend; keep existing entries unchanged.

## Call sites to migrate (replace the local function/map + its JSX with <StatusBadge kind=... status=... /> or <Badge tone=...>)
- src/roles/artist/views/ArtistChapterSelectionView.tsx renderStatusBadge
- src/roles/letterer/views/LettererChapterSelectionView.tsx getStatusBadge
- src/roles/writer/components/script/chapter-selection/ChapterSelectionView.tsx getStatusBadge
- src/roles/producer/modals/ChapterAssignmentsModal.tsx renderStatusBadge
- src/shared/features/collaboration/AssignmentWorkCard.tsx STATUS_STYLE
- src/shared/features/pipeline-board/TaskGridBoard.tsx STATUS_STYLE
- src/shared/features/series-bible/ArtistBibleOverview.tsx statusTone
- src/shared/utils/auditLogUtils.ts getAuditStatusBadgeClass + its user src/shared/modals/AuditLogModal.tsx
- src/shared/features/collaboration/ArtworkPanel.tsx getStatusBadges
- src/shared/modals/PreviewLinksModal.tsx statusClass
- src/shared/views/studio-overview/SeriesCardItem.tsx statusBadgeColor
Rules:
- Same meaning and wording as today unless today's colour contradicts DESIGN_RULES 1.5 (e.g. violet used for a non-AI status, indigo, slate/gray) - then follow 1.5 and list each such change in the final answer.
- Delete the local maps/functions after migration; no dead code.
- Keep every data-testid (pass data-testid through StatusBadge/Badge props). Keep behaviour.
- Update tests only where class names or text they assert changed.

Do NOT edit: src/app/*, src/shared/ui/*, src/shared/components/*, src/styles/*, package.json, and the four Lucian files listed above.
Known pre-existing failures - ignore: tsc 'variantLabel' errors in ArtistDeskView.tsx and ScriptRightBiblePanel.tsx; 2 failing tests in src/app/AppShell.test.tsx.
Checks: npx tsc --noEmit ; npx eslint <changed files> ; npx vitest related --run <changed files> ; npm run i18n:check if locales changed.
COMMIT_MSG (2-3 commits by area): refactor(ui): use status badge in chapter selection views ; refactor(producer): use status badge in assignments and task grid ; refactor(ui): use status badge in audit, preview and bible views
