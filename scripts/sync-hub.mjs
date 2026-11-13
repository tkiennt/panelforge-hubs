#!/usr/bin/env node
// scripts/sync-hub.mjs
// Static Markdown & JSON synchronization engine for PanelForge Hub (Zero-Firebase)
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HUB_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = fs.existsSync(path.resolve(HUB_ROOT, '../PanelForge_FA26SE251'))
  ? path.resolve(HUB_ROOT, '..')
  : HUB_ROOT;

const HUB_JSON_PATH = path.join(HUB_ROOT, 'web/public/data/hub-state.json');
const AUDIT_LOGS_MD_PATH = path.join(HUB_ROOT, 'docs/tracking/AUDIT_LOGS.md');
const PUBLIC_DOCS_PATH = path.join(HUB_ROOT, 'web/public/docs');

function getRepoFolder(repoName) {
  const candidates = [
    path.join(WORKSPACE_ROOT, repoName),
    path.resolve(HUB_ROOT, '..', repoName),
    path.join(HUB_ROOT, repoName),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(WORKSPACE_ROOT, repoName);
}

// Cấu hình ánh xạ thư mục sang Platform & GitHub URL
const REPO_MAP = {
  PanelForge_FA26SE251: {
    platform: 'BE',
    folder: getRepoFolder('PanelForge_FA26SE251'),
    url: 'https://github.com/DontPassAway/PanelForge_FA26SE251',
  },
  'panelforge-fe': {
    platform: 'FE',
    folder: getRepoFolder('panelforge-fe'),
    url: 'https://github.com/tkiennt/panelforge-fe',
  },
  'panelforge-mobile': {
    platform: 'MOBILE',
    folder: getRepoFolder('panelforge-mobile'),
    url: 'https://github.com/tranbaoming/panelforge-mobile',
  },
};

// Hàm chạy lệnh Git an toàn trong từng repo
function runGit(cwd, args) {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

// Đồng bộ copy toàn bộ docs/ sang web/public/docs/ để web tĩnh đọc trực tiếp
function syncDocsToPublic() {
  const docsDir = path.join(HUB_ROOT, 'docs');
  if (!fs.existsSync(docsDir)) return;
  // Xoá bản sao cũ trước khi chép để tài liệu đã xoá ở docs/ không còn sót trong web
  fs.rmSync(PUBLIC_DOCS_PATH, { recursive: true, force: true });
  fs.cpSync(docsDir, PUBLIC_DOCS_PATH, { recursive: true, force: true });
}

async function main() {
  console.log('🔄 [PF-Hub] Bắt đầu quét commit & cập nhật Markdown Hub (Static Zero-Firebase)...');

  // Đảm bảo thư mục public/data tồn tại
  const dataDir = path.dirname(HUB_JSON_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Đọc state hiện tại từ hub-state.json
  let hubState = {
    lastSyncedAt: new Date().toISOString(),
    diagrams: [],
    tasks: [],
    syncLogs: [],
  };

  if (fs.existsSync(HUB_JSON_PATH)) {
    try {
      hubState = JSON.parse(fs.readFileSync(HUB_JSON_PATH, 'utf8'));
    } catch (e) {
      console.warn('⚠️ [PF-Hub] hub-state.json bị lỗi định dạng, khởi tạo dữ liệu mới.');
    }
  }

  const existingCommitHashes = new Set(
    (hubState.syncLogs || []).map((l) => l.commitHash)
  );

  let hasChanges = false;
  const newAuditEntries = [];

  for (const [repoName, repo] of Object.entries(REPO_MAP)) {
    if (!fs.existsSync(repo.folder)) {
      continue;
    }

    const logOutput = runGit(repo.folder, 'log -n 50 --format="%H|%an|%cI|%s"');
    if (!logOutput) continue;

    const commitLines = logOutput.split('\n').filter(Boolean);

    for (const line of commitLines) {
      const parts = line.split('|');
      if (parts.length < 4) continue;
      const [commitHash, author, timestamp, ...msgParts] = parts;
      const subject = msgParts.join('|');

      if (existingCommitHashes.has(commitHash)) {
        continue;
      }

      existingCommitHashes.add(commitHash);
      const commitUrl = `${repo.url}/commit/${commitHash}`;

      // Quét file thay đổi trong commit
      const changedFilesRaw = runGit(
        repo.folder,
        `diff-tree --no-commit-id --name-only -r ${commitHash}`
      );
      const changedFiles = changedFilesRaw ? changedFilesRaw.split('\n').filter(Boolean) : [];

      const affectedTaskIds = [];
      const affectedDiagramIds = [];

      // 1. Quét Tag SubTask / Task: [SUB-CF4-BE-01] hoặc [WIP:SUB-CF4-BE-01]
      for (const task of hubState.tasks || []) {
        for (const sub of task.subTasks || []) {
          const isSubMentioned = subject.includes(`[${sub.id}]`);
          const isSubWip = subject.includes(`[WIP:${sub.id}]`);

          if (isSubWip) {
            sub.status = 'InProgress';
            sub.completedBy = author;
            sub.commitHash = commitHash;
            sub.commitUrl = commitUrl;
            affectedTaskIds.push(sub.id);
            hasChanges = true;
          } else if (isSubMentioned) {
            sub.status = 'Done';
            sub.completedBy = author;
            sub.commitHash = commitHash;
            sub.commitUrl = commitUrl;
            sub.completedAt = timestamp;
            affectedTaskIds.push(sub.id);
            hasChanges = true;
          }
        }

        // Tự động tính lại trạng thái Task cha
        if (task.subTasks && task.subTasks.length > 0) {
          const allDone = task.subTasks.every((s) => s.status === 'Done');
          const anyActive = task.subTasks.some(
            (s) => s.status === 'InProgress' || s.status === 'Done' || s.status === 'InReview'
          );
          if (allDone) {
            task.status = 'Done';
          } else if (anyActive && task.status === 'Todo') {
            task.status = 'InProgress';
          }
        }
      }

      // 2. Ghi nhận log đồng bộ
      const syncEntry = {
        id: `sync-${repo.platform}-${commitHash}`,
        timestamp,
        repo: repo.platform,
        author,
        commitHash,
        commitUrl,
        message: subject,
        affectedTaskIds,
        affectedDiagramIds,
      };

      hubState.syncLogs = hubState.syncLogs || [];
      hubState.syncLogs.unshift(syncEntry);
      newAuditEntries.push(syncEntry);
      hasChanges = true;

      console.log(
        `✅ [PF-Hub] Đã bắt commit [${repo.platform}] ${commitHash.slice(0, 7)} bởi ${author}: "${subject}"`
      );
    }
  }

  // Giới hạn tối đa 150 commit gần nhất trong hubState
  hubState.syncLogs = (hubState.syncLogs || []).slice(0, 150);

  if (hasChanges) {
    hubState.lastSyncedAt = new Date().toISOString();
    fs.writeFileSync(HUB_JSON_PATH, JSON.stringify(hubState, null, 2), 'utf8');
    console.log(`💾 [PF-Hub] Đã lưu cập nhật vào ${HUB_JSON_PATH}`);
  } else {
    console.log('ℹ️  [PF-Hub] Không phát hiện commit mới từ các repository.');
  }

  // Đồng bộ toàn bộ Markdown sang web/public/docs để web tĩnh đọc trực tiếp
  syncDocsToPublic();
  console.log('📄 [PF-Hub] Đã đồng bộ toàn bộ tài liệu Markdown vào web/public/docs/.');
}

main().catch((err) => {
  console.error('❌ [PF-Hub] Lỗi:', err);
  process.exit(1);
});
