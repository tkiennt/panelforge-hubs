# agy task runner

Run an Antigravity CLI (agy) task headless in a worktree, then auto-verify and write a short report.

```powershell
.\Start-AgyTask.ps1 -Id bib-17 -Worktree D:\...\panelforge-agent-bib-1a\PanelForge_FA26SE251 -TaskFile D:\...\.agy-runs\tasks\bib-17.md
```

| File | Purpose |
|---|---|
| `agy-rules.md` | Standing rules appended to every task: scoped tests only, no CRLF churn, no repo-wide format, 8-line final answer |
| `Start-AgyTask.ps1` | Runs `agy -p` (stream-json), prints compact progress, then verifies and writes `<RunsRoot>\<Id>\report.md` + `done.json` |
| `Invoke-AgyVerify.ps1` | Scoped checks vs base branch: commits, EOL churn, denied paths, build + related tests only, EF check only on model change; FE: tsc, eslint/vitest on changed files, i18n only on locale change, never e2e |

Options: `-Deny 'glob','glob'` (paths owned by others), `-FullTests` (whole BE suite once, e.g. before merge), `-SkipVerify`, `-Model`.

Waiting for a run (other agent / script): poll for `<RunsRoot>\<Id>\done.json`; `verdict` is `OK`, `VERIFY_FAILED` or `AGY_FAILED`.

## Codex (OpenAI) as a second engine

```powershell
.\Start-CodexTask.ps1 -Id bib-01 -Worktree D:\...\PanelForge_FA26SE251 -TaskFile D:\...\.agy-runs\tasks\bib-01.md [-Model gpt-5.6-sol] [-Effort low|medium|high]
```
Same rules (`agy-rules.md`), same `Invoke-AgyVerify.ps1`, same `report.md` / `done.json` (`engine: codex`, verdict `OK | VERIFY_FAILED | AGENT_FAILED`).
Runs `codex exec -s workspace-write` (network on) with the task piped on stdin; tokens in the log are redacted.
Setup: `codex login` (ChatGPT); for graphify run `codex mcp login graphify` once. Use the official OpenAI endpoint - do not route `model_providers.OpenAI` through a third-party `base_url` (it forwards your ChatGPT token).

Note: agy's sandbox cannot read `~/.gitconfig`, so `core.autocrlf` is ignored there. Each code repo needs a root `.gitattributes` with `* text=auto` to stop CRLF commits.
