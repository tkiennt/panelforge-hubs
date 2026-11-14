# Standing rules for agy tasks (appended to every task by Start-AgyTask.ps1)

Work only inside the current worktree, on its current branch. Never push. Never merge.

## No backward compatibility (project rule)
- Build to the current spec only. Data will be seeded later, so do NOT preserve old data or old contracts.
- No data-migration/backfill SQL, no `[Obsolete]` shims, no keeping old endpoints/fields "for the FE": delete them and update callers/tests.
- No hash/format compatibility with old versions. Migrations only describe the new schema (still generated with `dotnet ef migrations add`).

## Git and line endings
- Never override git config: no `-c core.autocrlf=...`, no `GIT_CONFIG_GLOBAL`, no `git config` writes.
  If git cannot read the global config, still use plain `git add` / `git commit`; the repo `.gitattributes` normalizes line endings.
- Keep each edited file's existing line endings. Do not rewrite a whole file just to change a few lines.
- Never run a formatter (prettier, dotnet format) over the whole repo. Format only files you changed:
  `npx prettier --write <your files>`.
- Commit with Conventional Commits `<type>(<scope>): <description>` (lowercase, imperative, no period).

## Tests: run only what your change touches
- Backend: `dotnet build -v q` to compile, then only related tests:
  `dotnet test test/PanelForge.UnitTests --no-build -v q --filter "FullyQualifiedName~ClassA|FullyQualifiedName~ClassB"`.
  Run the full suite at most ONCE, at the very end, and only with `-v q`.
- Run `dotnet ef migrations has-pending-model-changes --project src/PanelForge.Infrastructure --startup-project src/PanelForge.API`
  only if you changed entities, EF configurations or migrations. Create migrations only with `dotnet ef migrations add`.
- Frontend: `npx tsc --noEmit`, `npx eslint <changed files>`, `npx vitest related --run <changed files>`.
  Run `npm run i18n:check` only if you changed `src/locales`. Never run Playwright / e2e tests.
- Do not paste long command output back into your reasoning; read only the summary lines (`| tail -n 20`).

## Be terse (saves tokens)
- No plan essays, no restating the task, no progress narration between tool calls.
- Read files in targeted ranges; do not re-read files you already read.

## Final answer: max 8 lines, no headings, no tables
DONE|BLOCKED: <reason if blocked>
Commits: <hash subject>; ...
Changed: <file>, <file>, ... (short)
Skipped: <item - why> (or "none")
Tests: <the one summary line>
A separate verify script re-checks everything after you finish, so do not repeat test runs to "be sure".
