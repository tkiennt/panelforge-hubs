#!/usr/bin/env node
// scripts/install-hooks.mjs
// Cài hook git cho 3 repo code nằm cạnh panelforge-hub (cùng thư mục cha):
//   - commit-msg: chép từ .agents/hooks/commit-msg (Conventional Commits)
//   - post-commit: chạy scripts/sync-hub.mjs; không bao giờ chặn commit
// Chạy lại mỗi khi đổi vị trí thư mục: npm --prefix panelforge-hub run hooks:install
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HUB_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORKSPACE_ROOT = path.resolve(HUB_ROOT, '..');
const SYNC_SCRIPT = path.join(HUB_ROOT, 'scripts', 'sync-hub.mjs').replace(/\\/g, '/');
const COMMIT_MSG_SOURCE = path.join(HUB_ROOT, '.agents', 'hooks', 'commit-msg');

const REPOS = ['PanelForge_FA26SE251', 'panelforge-fe', 'panelforge-mobile'];

// Worktree dùng chung hooks với repo gốc, nên hỏi git thay vì ghép cứng `.git/hooks`.
function resolveHooksDir(repoDir) {
  const out = execFileSync('git', ['rev-parse', '--path-format=absolute', '--git-path', 'hooks'], {
    cwd: repoDir,
    encoding: 'utf8',
  });
  return out.trim();
}

const postCommitHook = (repoName) => `#!/bin/sh
# PanelForge: ghi commit vừa tạo vào panelforge-hub (web/public/data/hub-state.json).
# Sinh bởi panelforge-hub/scripts/install-hooks.mjs. Lỗi ở đây không chặn commit.
SYNC="${SYNC_SCRIPT}"
if [ ! -f "$SYNC" ]; then
  echo "[PanelForge] Bỏ qua sync-hub: không thấy $SYNC. Cài lại hook: npm --prefix panelforge-hub run hooks:install" >&2
  exit 0
fi
node "$SYNC" "${repoName}" >/dev/null 2>&1 || echo "[PanelForge] sync-hub lỗi; chạy tay: npm --prefix panelforge-hub run sync" >&2
exit 0
`;

const commitMsgHook = fs.readFileSync(COMMIT_MSG_SOURCE, 'utf8');
let failed = 0;

for (const repoName of REPOS) {
  const repoDir = path.join(WORKSPACE_ROOT, repoName);
  if (!fs.existsSync(path.join(repoDir, '.git'))) {
    console.warn(`⚠️  Bỏ qua ${repoName}: không thấy repo tại ${repoDir}`);
    failed++;
    continue;
  }

  let hooksDir = resolveHooksDir(repoDir);
  // Husky (FE) trỏ core.hooksPath vào `.husky/_`, thư mục shim do `npm install` sinh lại.
  // Hook thật phải nằm ở `.husky/<tên>`; chứa đường dẫn tuyệt đối theo máy nên chỉ exclude, không commit.
  const isHusky = path.basename(hooksDir) === '_' && path.basename(path.dirname(hooksDir)) === '.husky';
  if (isHusky) {
    hooksDir = path.dirname(hooksDir);
    const excludeFile = path.join(repoDir, '.git', 'info', 'exclude');
    const excluded = fs.existsSync(excludeFile) ? fs.readFileSync(excludeFile, 'utf8') : '';
    const missing = ['/.husky/post-commit', '/.husky/commit-msg'].filter((p) => !excluded.split(/\r?\n/).includes(p));
    if (missing.length) {
      fs.mkdirSync(path.dirname(excludeFile), { recursive: true });
      fs.appendFileSync(excludeFile, `${excluded.endsWith('\n') || !excluded ? '' : '\n'}${missing.join('\n')}\n`);
    }
  }
  fs.mkdirSync(hooksDir, { recursive: true });
  fs.writeFileSync(path.join(hooksDir, 'post-commit'), postCommitHook(repoName), { mode: 0o755 });
  fs.writeFileSync(path.join(hooksDir, 'commit-msg'), commitMsgHook, { mode: 0o755 });
  console.log(`🔗 ${repoName}: đã cài post-commit + commit-msg vào ${hooksDir}${isHusky ? ' (husky)' : ''}`);
}

if (failed) process.exitCode = 1;
