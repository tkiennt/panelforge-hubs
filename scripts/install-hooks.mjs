#!/usr/bin/env node
// scripts/install-hooks.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.resolve(__dirname, '..');
const GITHUB_ROOT = fs.existsSync(path.resolve(WORKSPACE_ROOT, '../../Github'))
  ? path.resolve(WORKSPACE_ROOT, '../../Github')
  : WORKSPACE_ROOT;

const REPOS = [
  'PanelForge_FA26SE251',
  'panelforge-fe',
  'panelforge-mobile',
];

for (const repoName of REPOS) {
  let gitHooksDir = path.join(WORKSPACE_ROOT, repoName, '.git', 'hooks');
  if (!fs.existsSync(gitHooksDir)) {
    gitHooksDir = path.join(GITHUB_ROOT, repoName, '.git', 'hooks');
  }

  if (!fs.existsSync(gitHooksDir)) {
    console.warn(`⚠️  Bỏ qua ${repoName}: Không tìm thấy thư mục .git/hooks`);
    continue;
  }

  const postCommitPath = path.join(gitHooksDir, 'post-commit');
  const hookContent = `#!/bin/sh
# Tự động đồng bộ Commit & Task lên PanelForge Hub + Firebase Firestore
node "${path.join(__dirname, 'sync-hub.mjs').replace(/\\/g, '/')}" "${repoName}"
`;

  fs.writeFileSync(postCommitPath, hookContent, { encoding: 'utf8', mode: 0o755 });
  console.log(`🔗 Đã cài đặt tự động post-commit hook cho: ${repoName}`);
}

