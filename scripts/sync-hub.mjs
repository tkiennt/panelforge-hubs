#!/usr/bin/env node
// scripts/sync-hub.mjs
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

const candidateHubPaths = [
  path.join(HUB_ROOT, 'web/public/data/hub-state.json'),
  path.join(HUB_ROOT, 'public/data/hub-state.json'),
  path.join(WORKSPACE_ROOT, 'panelforge-hub/web/public/data/hub-state.json'),
  path.join(WORKSPACE_ROOT, 'panelforge-hub/public/data/hub-state.json'),
];
const HUB_JSON_PATH = candidateHubPaths.find(p => fs.existsSync(p)) || candidateHubPaths[0];

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

// Đọc file .env ở thư mục gốc hoặc panelforge-hub/.env (không cần cài dotenv)
function loadEnv() {
  const envPaths = [
    path.join(WORKSPACE_ROOT, '.env'),
    path.join(WORKSPACE_ROOT, 'panelforge-hub/.env'),
  ];
  const envVars = { ...process.env };

  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const lines = fs.readFileSync(p, 'utf8').split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let val = (match[2] || '').trim();
          val = val.replace(/^['"]|['"]$/g, '');
          envVars[key] = val;
        }
      }
    }
  }
  return envVars;
}

// Chuyển đổi Object JS sang định dạng Firestore REST API Value
function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val)
      ? { integerValue: String(val) }
      : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Đẩy thẳng lên Firebase Firestore qua REST API (Không cần cài đặt thư viện nặng)
async function pushToFirestoreRest(state, env) {
  const projectId = env.VITE_FIREBASE_PROJECT_ID || env.FIREBASE_PROJECT_ID;
  const apiKey = env.VITE_FIREBASE_API_KEY || env.FIREBASE_API_KEY;

  if (!projectId || !apiKey) {
    console.log(
      'ℹ️  [PF-Hub] Chưa cấu hình VITE_FIREBASE_PROJECT_ID, chỉ lưu vào hub-state.json cục bộ.'
    );
    return;
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/panelforge_hub/workspace_state?key=${apiKey}`;
  const body = toFirestoreValue(state).mapValue;

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('❌ [PF-Hub] Lỗi đẩy lên Firestore:', errText);
  } else {
    console.log('☁️  [PF-Hub] Đã đồng bộ thành công lên Firebase Firestore!');
  }
}

async function main() {
  const env = loadEnv();

  // Nhận tham số truyền vào từ Git Hook: node scripts/sync-hub.mjs <repoName>
  const targetRepoArg = process.argv[2];
  const reposToScan = targetRepoArg && REPO_MAP[targetRepoArg]
    ? [REPO_MAP[targetRepoArg]]
    : Object.values(REPO_MAP);

  if (!fs.existsSync(HUB_JSON_PATH)) {
    console.error(`❌ Không tìm thấy file trạng thái tại: ${HUB_JSON_PATH}`);
    process.exit(1);
  }

  const hubState = JSON.parse(fs.readFileSync(HUB_JSON_PATH, 'utf8'));
  let hasChanges = false;

  for (const repo of reposToScan) {
    if (!fs.existsSync(repo.folder)) continue;

    const commitHash = runGit(repo.folder, 'rev-parse --short HEAD');
    if (!commitHash) continue;

    // Kiểm tra xem commit này đã được ghi nhận trong syncLogs chưa
    const alreadySynced = hubState.syncLogs?.some(
      (log) => log.commitHash === commitHash && log.repo === repo.platform
    );
    if (alreadySynced) continue;

    const author = runGit(repo.folder, 'log -1 --format="%an"');
    const timestamp = runGit(repo.folder, 'log -1 --format="%cI"');
    const subject = runGit(repo.folder, 'log -1 --format="%s"');
    const body = runGit(repo.folder, 'log -1 --format="%b"');
    const fullMessage = `${subject}\n${body}`.trim();
    const changedFiles = runGit(
      repo.folder,
      'diff-tree --no-commit-id --name-only -r HEAD'
    )
      .split('\n')
      .filter(Boolean);

    const commitUrl = `${repo.url}/commit/${commitHash}`;
    const affectedTaskIds = [];
    const affectedDiagramIds = [];

    // 1. TỰ ĐỘNG CẬP NHẬT TASK & SUB-TASK THEO COMMIT MESSAGE
    // Cú pháp hỗ trợ trong commit:
    // - [SUB-1] hoặc [PF-CF4-01] -> Đánh dấu Done cho Sub-task thuộc platform tương ứng
    // - [WIP:SUB-1] -> Đánh dấu InProgress
    for (const task of hubState.tasks || []) {
      for (const sub of task.subTasks || []) {
        const isSubMentioned =
          fullMessage.includes(`[${sub.id}]`) ||
          (fullMessage.includes(`[${task.id}]`) && sub.platform === repo.platform);
        const isWipMentioned =
          fullMessage.includes(`[WIP:${sub.id}]`) ||
          (fullMessage.includes(`[WIP:${task.id}]`) && sub.platform === repo.platform);

        if (isWipMentioned && sub.status !== 'Done') {
          sub.status = 'InProgress';
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

      // Tự động tính lại trạng thái của Task cha từ các Sub-tasks (BE, FE, MOBILE)
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

    // 2. TỰ ĐỘNG CẬP NHẬT VERSION CỦA STATE DIAGRAM KHI CÓ FILE .mermaid THAY ĐỔI
    // Nếu trong repo có sửa file docs/flows/<diagramId>.mermaid hoặc có tag [FLOW:flowId]
    for (const file of changedFiles) {
      if (file.endsWith('.mermaid') || file.endsWith('.mmd')) {
        const diagramId = path.basename(file, path.extname(file));
        const diagram = hubState.diagrams?.find((d) => d.id === diagramId);
        const fullFilePath = path.join(repo.folder, file);

        if (diagram && fs.existsSync(fullFilePath)) {
          const newMermaidCode = fs.readFileSync(fullFilePath, 'utf8').trim();
          const latestRev = diagram.revisions[diagram.revisions.length - 1];

          if (!latestRev || latestRev.mermaidCode !== newMermaidCode) {
            const nextVer = (diagram.currentVersion || 1) + 1;
            diagram.currentVersion = nextVer;
            diagram.revisions.push({
              version: nextVer,
              updatedAt: timestamp,
              updatedBy: author,
              repo: repo.platform,
              commitHash,
              commitUrl,
              changelog: subject,
              mermaidCode: newMermaidCode,
            });
            affectedDiagramIds.push(diagram.id);
            hasChanges = true;
          }
        }
      }
    }

    // 3. GHI LOG ĐỒNG BỘ VÀO TIMELINE
    hubState.syncLogs = hubState.syncLogs || [];
    hubState.syncLogs.unshift({
      id: `sync-${repo.platform}-${commitHash}`,
      timestamp,
      repo: repo.platform,
      author,
      commitHash,
      commitUrl,
      message: subject,
      affectedTaskIds,
      affectedDiagramIds,
    });
    // Giữ tối đa 100 bản ghi gần nhất
    hubState.syncLogs = hubState.syncLogs.slice(0, 100);
    hasChanges = true;

    console.log(
      `✅ [PF-Hub] Đã bắt commit [${repo.platform}] ${commitHash} bởi ${author}: "${subject}"`
    );
  }

  if (hasChanges) {
    hubState.lastSyncedAt = new Date().toISOString();
    fs.writeFileSync(HUB_JSON_PATH, JSON.stringify(hubState, null, 2), 'utf8');
    await pushToFirestoreRest(hubState, env);
  } else {
    console.log('ℹ️  [PF-Hub] Không phát hiện commit mới nào cần đồng bộ.');
  }
}

main().catch((err) => {
  console.error('❌ [PF-Hub] Lỗi không mong muốn:', err);
  process.exit(1);
});
