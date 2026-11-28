<!-- Brief giao việc cho agy. Repo: panelforge-fe, nhánh feature/admin-b2b. Chạy SAU OPS-04 (cùng nhánh). Lệnh: Start-AgyTask.ps1 -Id ops-05 -Worktree <panelforge-fe> -TaskFile <file này> -Base feature/admin-b2b -Deny 'src/shared/views/StudioOverviewView.tsx','package.json' -->

OPS-05 (FE): platform Admin must not enter Studio production screens (BR-07).
Plan: panelforge-hub/docs/note/plans/10_PLATFORM_OPS_PLAN.md OPS-05. Spec: BR-07 (Admin does not write, draw, letter, translate or approve Gates).

Context: the backend already returns 403 to Admin on every [RequireWorkspaceRole] endpoint (BE commit 4f8e39c). The frontend still lets Admin into every studio route:
- src/app/workspaceRoleGuard.ts isRoleAllowed(): "System administrator has access to all workspace features" returns true for ADMIN/ADMINISTRATOR (also via currentRole).
- src/app/RequireWorkspaceRole.tsx uses it; routes in src/app/routes.tsx.

## Do
1. isRoleAllowed: ADMIN/ADMINISTRATOR is allowed ONLY when the route's allowedRoles explicitly contains ADMIN or ADMINISTRATOR. Remove the two blanket "admin may access everything" branches. Keep ADMIN == ADMINISTRATOR equivalence.
2. RequireWorkspaceRole: when an Admin is refused, redirect to the admin home route that already exists in routes.tsx (find the admin dashboard path, e.g. /admin) instead of the generic forbidden screen, so Admin is not stuck.
3. Check routes.tsx: every route meant for Admin (admin dashboard, audit log, users, AI config, workspaces list, etc.) must list ADMINISTRATOR in its allowed roles, so step 1 does not lock Admin out of its own screens. Write the list of admin routes you found in the commit body.
4. Update src/app/RequireWorkspaceRole.test.tsx: Admin is refused on a production route (e.g. a writer/artist/producer route) and redirected; Admin still opens an admin route; Producer behaviour unchanged.

## Verify (must pass before commit)
npm run typecheck; npm run i18n:check; npx eslint <changed files>; npx vitest run src/app/RequireWorkspaceRole.test.tsx plus any test file you touched.

## Commit
One commit on feature/admin-b2b: `fix(ui): stop platform admin from opening studio production routes`, body mentions OPS-05 / BR-07 and lists admin routes. Then `git push origin feature/admin-b2b`.

## Do NOT
Do not change backend calls, services or admin views. Do not edit package.json or sidebar/theme files. No new dependencies.
