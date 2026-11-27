import fs from 'fs';
import path from 'path';

const docsDir = path.resolve('D:/FPT-STUDY/10_FALL-2026/SEP490/panelforge-hub/docs');

function getAllFiles(dir, list = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(full, list);
    } else if (entry.name.endsWith('.md')) {
      list.push(full);
    }
  }
  return list;
}

const mdFiles = getAllFiles(docsDir);
console.log('Found ' + mdFiles.length + ' markdown files in docs.\n');

const findings = {
  legacyRoutes: [],
  rolesModel: [],
  readingDirection: [],
  statuses: [],
  brokenLinks: [],
  structureAndTOC: []
};

// 1. Broken links
for (const f of mdFiles) {
  const txt = fs.readFileSync(f, 'utf8');
  const stripped = txt.replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '');
  const linkMatches = [...stripped.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
  for (const m of linkMatches) {
    const rawLink = m[2];
    if (rawLink.startsWith('http') || rawLink.startsWith('mailto') || rawLink.startsWith('#') || rawLink.startsWith('file://')) {
      continue;
    }
    const clean = rawLink.split('#')[0].split('?')[0];
    if (!clean) continue;
    const target = path.resolve(path.dirname(f), clean);
    if (!fs.existsSync(target)) {
      findings.brokenLinks.push({
        file: path.relative(docsDir, f),
        link: rawLink,
        target: path.relative(docsDir, target)
      });
    }
  }
}

// 2. Legacy / Mismatched Routes (e.g. /studios/:id/projects/:id instead of /workspaces/:id/series/:id)
for (const f of mdFiles) {
  const rel = path.relative(docsDir, f);
  const txt = fs.readFileSync(f, 'utf8');
  const lines = txt.split('\n');
  lines.forEach((l, idx) => {
    if (/\/studios\/|\/projects\//.test(l)) {
      findings.legacyRoutes.push({
        file: rel,
        line: idx + 1,
        content: l.trim(),
        issue: 'Contains /studios/ or /projects/ route snippet instead of canonical /workspaces/.../series/...'
      });
    }
  });
}

// 3. Roles Model Check
for (const f of mdFiles) {
  const rel = path.relative(docsDir, f);
  const txt = fs.readFileSync(f, 'utf8');
  const lines = txt.split('\n');
  lines.forEach((l, idx) => {
    if (/6\s*roles|6\s*vai trò|sáu vai trò/i.test(l) && !/series/i.test(l) && !/lịch sử/i.test(l) && !/trước đây/i.test(l) && !/UI_CURRENT_SCREENS/i.test(rel)) {
      findings.rolesModel.push({ file: rel, line: idx + 1, content: l.trim(), issue: 'Mentions 6 roles without clarifying Studio vs Series scope (Spec D10).' });
    }
    if (/WorkspaceRole\.(Writer|Artist|Letterer|Editor|Publisher)/.test(l)) {
      findings.rolesModel.push({ file: rel, line: idx + 1, content: l.trim(), issue: 'Refers to specialist roles as WorkspaceRole instead of SeriesRole/series_members.' });
    }
    if (/studio.*?(chọn vai trò|mời|invite).*?(writer|artist|letterer|editor)/i.test(l)) {
      findings.rolesModel.push({ file: rel, line: idx + 1, content: l.trim(), issue: 'Refers to inviting specialist roles at Studio level rather than Producer/Member.' });
    }
  });
}

// 4. Reading Direction Enum Check
for (const f of mdFiles) {
  const rel = path.relative(docsDir, f);
  const txt = fs.readFileSync(f, 'utf8');
  const lines = txt.split('\n');
  lines.forEach((l, idx) => {
    if (/ReadingDirection/i.test(l) || /RightToLeft|LeftToRight/i.test(l)) {
      if (/LeftToRight\s*=\s*0|0\s*=\s*LeftToRight/i.test(l)) {
        findings.readingDirection.push({ file: rel, line: idx + 1, content: l.trim(), issue: 'Inverted ReadingDirection enum: 0 is RightToLeft (Manga), not LeftToRight.' });
      }
    }
  });
}

// 5. TOC in README.md & STRUCTURE_GUIDE.md
const readmeTxt = fs.readFileSync(path.join(docsDir, 'README.md'), 'utf8');
const structureTxt = fs.readFileSync(path.join(docsDir, 'STRUCTURE_GUIDE.md'), 'utf8');
for (const f of mdFiles) {
  const base = path.basename(f);
  if (base === 'README.md' || base === 'STRUCTURE_GUIDE.md') continue;
  if (!readmeTxt.includes(base) && !structureTxt.includes(base)) {
    findings.structureAndTOC.push({
      file: path.relative(docsDir, f),
      issue: 'File is not mentioned or linked in either README.md or STRUCTURE_GUIDE.md'
    });
  }
}

// 6. State Machine Status Consistency
for (const f of mdFiles) {
  const rel = path.relative(docsDir, f);
  const txt = fs.readFileSync(f, 'utf8');
  const lines = txt.split('\n');
  lines.forEach((l, idx) => {
    // Check if ChapterStatus has InProduction or PreProduction or PostProduction
    if (/ChapterStatus\.PostProduction/i.test(l)) {
      findings.statuses.push({ file: rel, line: idx + 1, content: l.trim(), issue: 'Invalid ChapterStatus.PostProduction (PostProduction is in Assignment/ProductionStage, not ChapterStatus)' });
    }
    // Check if InProgress is mistakenly called UnderWork / Doing
    if (/AssignmentStatus\.(Doing|Working|UnderWork)/i.test(l)) {
      findings.statuses.push({ file: rel, line: idx + 1, content: l.trim(), issue: 'Invalid AssignmentStatus (expected InProgress/Submitted/Approved/Returned)' });
    }
  });
}

console.log('=== AUDIT SUMMARY ===');
console.log('Broken Links:', findings.brokenLinks.length);
console.log('Legacy Routes (/studios/ or /projects/):', findings.legacyRoutes.length);
console.log('Roles Model Discrepancies:', findings.rolesModel.length);
console.log('Reading Direction Issues:', findings.readingDirection.length);
console.log('TOC / Index Missing:', findings.structureAndTOC.length);
console.log('Statuses & State Machine Issues:', findings.statuses.length);

if (findings.legacyRoutes.length > 0) {
  console.log('\n--- Legacy Routes Details ---');
  findings.legacyRoutes.forEach(r => console.log('  [' + r.file + ':' + r.line + '] ' + r.content));
}

if (findings.rolesModel.length > 0) {
  console.log('\n--- Roles Model Details ---');
  findings.rolesModel.forEach(r => console.log('  [' + r.file + ':' + r.line + '] (' + r.issue + ') ' + r.content));
}

if (findings.structureAndTOC.length > 0) {
  console.log('\n--- TOC / Index Missing Details ---');
  findings.structureAndTOC.forEach(s => console.log('  [' + s.file + '] ' + s.issue));
}

if (findings.statuses.length > 0) {
  console.log('\n--- Statuses & State Machine Details ---');
  findings.statuses.forEach(s => console.log('  [' + s.file + ':' + s.line + '] ' + s.content));
}
