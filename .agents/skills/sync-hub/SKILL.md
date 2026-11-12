---
name: sync-hub
description: Automated synchronization workflow for PanelForge Hub. Run whenever an AI Agent or developer modifies business logic, state diagrams, or completes tasks in Backend, Frontend, or Mobile repositories.
---

# PanelForge Hub Synchronization Skill (`sync-hub`)

This skill coordinates automatic synchronization between the 3 repositories (`PanelForge_FA26SE251`, `panelforge-fe`, and `panelforge-mobile`) and the visual architecture portal `panelforge-hub/`.

---

## 1. MANDATORY AGENT RULE & COMMIT CONVENTION

Whenever you (or any AI sub-agent) complete code changes, modify business logic, change state transitions, or work on any task across the 3 repositories, append the corresponding Task or Sub-task tag to your Conventional Commit message:

### A. Sub-task In Progress (`InProgress`)
Add `[WIP:SUB-ID]` to mark the sub-task as in-progress on the web board:
```bash
git commit -m "feat(fe): add timeline slider UI [WIP:SUB-CF4-FE-01]"
```

### B. Sub-task Completed (`Done`)
Add `[SUB-ID]` or `[TASK-ID]` to automatically mark the sub-task as Done, record author, completion timestamp, and link directly to the GitHub commit:
```bash
git commit -m "feat(be): add ChapterSnapshot entity & SHA-256 manifest [SUB-CF4-BE-01]"
```

### C. State Diagram & Architecture Updates
When altering business logic or state flow, update or add the `.mermaid` diagram file (e.g. in `docs/flows/<diagramId>.mermaid`).
The sync engine will automatically:
1. Detect changes in the `.mermaid` file.
2. Increment `currentVersion` by +1.
3. Append a new `DiagramRevision` with commit hash and author.
4. Render the Side-by-Side Version Diff on the Web Viewer.

---

## 2. AUTOMATIC POST-COMMIT HOOK

Git hooks are installed in all 3 repositories:
- `PanelForge_FA26SE251/.git/hooks/post-commit`
- `panelforge-fe/.git/hooks/post-commit`
- `panelforge-mobile/.git/hooks/post-commit`

Every `git commit` in any repository automatically executes:
```bash
node scripts/sync-hub.mjs <repoName>
```

If you ever clone the repository to a fresh machine or worktree, run:
```bash
node scripts/install-hooks.mjs
```

---

## 3. MANUAL SYNC EXECUTION

You can also run the sync engine manually at any time from workspace root:
```bash
# Auto-scan all 3 repositories for new commits
node scripts/sync-hub.mjs

# Scan a specific repository
node scripts/sync-hub.mjs PanelForge_FA26SE251
node scripts/sync-hub.mjs panelforge-fe
node scripts/sync-hub.mjs panelforge-mobile
```

---

## 4. DUAL-SYNC ARCHITECTURE

- **Local Persistence:** Immediately writes the updated state to `panelforge-hub/public/data/hub-state.json`.
- **Firebase Firestore Realtime:** If `VITE_FIREBASE_PROJECT_ID` (or `FIREBASE_PROJECT_ID`) and `VITE_FIREBASE_API_KEY` are configured in `.env` or `panelforge-hub/.env`, the script pushes directly to Firestore document `panelforge_hub/workspace_state` via REST API without requiring any heavy service account credentials or secrets.
