// scripts/build-docs-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HUB_ROOT = path.resolve(__dirname, '..');
const DOCS_DIR = path.join(HUB_ROOT, 'docs');
const OUT_DIR = path.join(HUB_ROOT, 'web/public/generated');

fs.mkdirSync(OUT_DIR, { recursive: true });

function git(cmd) {
  try {
    return execSync(`git ${cmd}`, {
      cwd: HUB_ROOT,
      encoding: 'utf8',
      maxBuffer: 15 * 1024 * 1024,
    }).trim();
  } catch (err) {
    return '';
  }
}

// 1. Quét đệ quy toàn bộ file .md
function scanMarkdownFiles(dir, baseDir = dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(scanMarkdownFiles(fullPath, baseDir));
    } else if (entry.name.endsWith('.md')) {
      const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      const repoRelPath = `docs/${relPath}`;
      const content = fs.readFileSync(fullPath, 'utf8');

      // Lấy commit gần nhất của file
      const lastHash = git(`log -1 --format="%h" -- "${repoRelPath}"`) || git('log -1 --format="%h"');
      const lastFullHash = git(`log -1 --format="%H" -- "${repoRelPath}"`) || git('log -1 --format="%H"');
      const lastDate = git(`log -1 --format="%cI" -- "${repoRelPath}"`) || new Date().toISOString();
      const lastAuthor = git(`log -1 --format="%an" -- "${repoRelPath}"`) || 'Team PanelForge';

      // Lấy danh sách toàn bộ các commit của file này (để chọn so sánh diff)
      const fileCommitsRaw = git(`log -n 20 --format="%h|%H|%an|%cI|%s" -- "${repoRelPath}"`);
      const fileCommits = (fileCommitsRaw ? fileCommitsRaw.split('\n') : [])
        .filter(Boolean)
        .map((line) => {
          const [h, H, an, ci, ...subParts] = line.split('|');
          return { hash: h, fullHash: H, author: an, date: ci, subject: subParts.join('|') };
        });

      // Tách các header để tạo mục lục (TOC)
      const headings = [];
      const headingRegex = /^(#{1,3})\s+(.+)$/gm;
      let match;
      while ((match = headingRegex.exec(content)) !== null) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        headings.push({ level, text, id });
      }

      // Trích xuất các khối mermaid
      const mermaidBlocks = [];
      const mermaidRegex = /```mermaid\s*([\s\S]*?)```/g;
      let mMatch;
      while ((mMatch = mermaidRegex.exec(content)) !== null) {
        mermaidBlocks.push(mMatch[1].trim());
      }

      // Suy ra Category từ folder cha
      const parts = relPath.split('/');
      const category = parts.length > 1 ? parts[0] : 'general';

      results.push({
        slug: relPath.replace(/\.md$/, ''),
        path: relPath,
        repoPath: repoRelPath,
        category,
        title: content.match(/^#\s+(.+)$/m)?.[1] || entry.name.replace(/\.md$/, ''),
        content,
        headings,
        mermaidBlocks,
        fileCommits,
        lastCommit: { hash: lastHash, fullHash: lastFullHash, date: lastDate, author: lastAuthor },
      });
    }
  }
  return results;
}

// 2. Lấy 50 commit gần nhất kèm danh sách file thay đổi & patch diff
function extractCommits(limit = 50) {
  const rawLog = git(
    `log -n ${limit} --pretty=format:"---COMMIT---%n%H|%h|%an|%cI|%s"`
  );
  if (!rawLog) return [];

  return rawLog
    .split('---COMMIT---\n')
    .filter(Boolean)
    .map((block) => {
      const [headerLine] = block.split('\n');
      const [fullHash, hash, author, date, ...msgParts] = headerLine.split('|');
      const message = msgParts.join('|');

      // Lấy danh sách file .md thay đổi trong commit này
      const changedFilesRaw = git(
        `diff-tree --no-commit-id --name-status -r ${fullHash}`
      );
      const files = changedFilesRaw
        .split('\n')
        .filter(Boolean)
        .filter((line) => line.includes('.md'))
        .map((line) => {
          const [status, filePath] = line.split('\t');
          // Trích xuất patch diff của file
          const patch = git(`diff ${fullHash}~1..${fullHash} -- "${filePath}"`) ||
            git(`show ${fullHash} --pretty="" -- "${filePath}"`);
          return { status, path: filePath, patch };
        });

      return { fullHash, hash, author, date, message, files };
    })
    .filter((c) => c.files.length > 0);
}

console.log('🔍 [Build Docs Data] Đang quét toàn bộ file Markdown & Git history...');
const docs = scanMarkdownFiles(DOCS_DIR);
const commits = extractCommits(50);

// Ghi ra JSON
fs.writeFileSync(
  path.join(OUT_DIR, 'docs-manifest.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), totalDocs: docs.length, docs }, null, 2)
);

fs.writeFileSync(
  path.join(OUT_DIR, 'commits-diff.json'),
  JSON.stringify({ latestHash: commits[0]?.hash || '', totalCommits: commits.length, commits }, null, 2)
);

console.log(`✅ [Build Docs Data] Đã đóng gói thành công ${docs.length} file Markdown và ${commits.length} commit diff vào web/public/generated/`);
