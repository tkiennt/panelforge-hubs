# PanelForge Hub 🚀

> **Serverless Visual Architecture Documentation & Multi-Repo Task Management**  
> Visualizes CF1–CF5 Core Flows, State Machines, Version Diffs, and Multi-Repo Tasks across Backend (.NET 9), Frontend (React 19), and Mobile (Flutter).

---

## 🌟 Key Features

1. **Interactive State Diagram & Core Flow Viewer:**
   - Real-time rendering of Mermaid `stateDiagram-v2` and `flowchart` diagrams.
   - **Version Diff Mode:** Side-by-side comparison of architecture revisions (v2.0 vs v2.5) with automated transition change detection (Added, Removed, Modified), architectural rationale, and Mermaid syntax diff.
   - Zoom (40% - 250%), Pan, Reset, Fullscreen mode, SVG export, and one-click Mermaid code copy.
   - Pre-loaded with CF1–CF5 and 5 core state machines: `AssignmentStatus`, `StageProgress`, `Submission`, `ChapterStatus`, and `SeriesBibleRevision`.

2. **Multi-Repo Task & Sub-task Board:**
   - Kanban board (To Do, In Progress, Review & Gate, Done) and Grouped List view organized by Core Flow (CF1–CF5).
   - Each task breaks down into `[BE]`, `[FE]`, and `[MOBILE]` sub-tasks with status indicators, assignees, and completion timestamps.
   - Direct, clickable GitHub commit links pointing to the exact repository (`PanelForge_FA26SE251`, `panelforge-fe`, and `panelforge-mobile`).
   - Interactive subtask status cycle toggles with state persistence.

3. **AI Agent Sync Timeline:**
   - Real-time chronological timeline tracking all codebase mutations by AI Agents and developers.
   - Filter by Repository (`BE`, `FE`, `MOBILE`), Actor (`AI Agent`, `Developer`), or text query.
   - Shows affected modules and files for each commit.

4. **Zero-Backend Serverless Architecture:**
   - Deploys for free to GitHub Pages or Vercel.
   - Optional Firebase Firestore real-time synchronization with automatic fallback to bundled `./public/data/hub-state.json` and browser localStorage.

---

## 🛠️ Quick Start

### 1. Run Development Server
```bash
cd panelforge-hub
npm install
npm run dev
```

### 2. Build for Production
```bash
npm run build
```

---

## 🤖 AI Agent Synchronization

Whenever code changes or tasks are completed in any of the 3 repositories, run the sync helper from workspace root:

```bash
# Auto-detect latest commits across BE, FE, and Mobile
node scripts/sync-hub.mjs

# Or update a specific sub-task status
node scripts/sync-hub.mjs --repo BE --subtask TASK-CF2-02-BE --status Done --notes "Verified Freeze Script migration"
```

Skill documentation available at `.agent/skills/sync-hub/SKILL.md`.

---

## 🚀 GitHub Pages Deployment

The automated workflow is preconfigured in `.github/workflows/deploy-hub.yml`. Any push to `main` will build and deploy `panelforge-hub` to GitHub Pages automatically.

