<!-- Brief giao việc cho agy. Repo: panelforge-fe, nhánh feature/admin-b2b (đã có OPS-01 FE bb0c4ef). Lệnh: panelforge-hub/scripts/agy/Start-AgyTask.ps1 -Id ops-04 -Worktree <panelforge-fe> -TaskFile <file này> -Base feature/admin-b2b -Deny 'src/app/*','package.json' -->

OPS-04 (FE): show the studio quota bar to the Producer.
Plan: panelforge-hub/docs/note/plans/10_PLATFORM_OPS_PLAN.md OPS-04. Spec: BR-22. UI rules: panelforge-hub/docs/spec/DESIGN_RULES.md.

Context: src/shared/views/studio-overview/StudioGovernanceBar.tsx is already written (AI tokens, AI images, storage) and is imported in src/shared/views/StudioOverviewView.tsx (line ~38) but never rendered.

## Do
1. Read StudioGovernanceBar.tsx and its props. Render it once in StudioOverviewView for the studio governance view (the Producer / owner view, not the writer/artist/letterer/editor series picker that starts near line ~796). Put it near the top of the overview, under the page header, before the KPI/content sections.
2. Feed it with data the view already has or already fetches (activeWorkspace.storageQuotaBytes / usedStorageBytes, the AI config/usage query the view or its hooks already use). Do not add a new endpoint. If a prop needs data that is not loaded yet, use the existing service in src/services (workspace.service.ts getWorkspaceUsage or aiConfig service) through the existing TanStack Query hooks in src/hooks/queries; do not call axios in the component.
3. quota 0 = unlimited: show the "unlimited" text the bar already supports, never a 0% / NaN bar.
4. Every visible string through i18n, keys in BOTH src/locales/vi and src/locales/en.
5. Test: add or extend a Vitest test (src/shared/views/studio-overview/ or next to StudioOverviewView) that renders the overview for a Producer and asserts the bar is shown, and that a non-Producer series role does not see it.

## Verify (must pass before commit)
npm run typecheck; npm run i18n:check; npx eslint <changed files>; npx vitest run <the test files you touched> (only those, not the full suite).

## Commit
One commit on feature/admin-b2b: `feat(producer): show studio quota bar on studio overview`, body mentions OPS-04 / BR-22. Then `git push origin feature/admin-b2b`.

## Do NOT
Do not edit src/app/*, package.json, any sidebar/theme file. No new dependencies. No gradients, no text below text-xs, Lucide icons only, no slate/gray colours.
