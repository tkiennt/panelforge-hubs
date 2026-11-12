// panelforge-hub/web/src/services/dataService.ts
import { marked } from 'marked';
import type { DocsManifestData, CommitsDiffData, DocItem } from '../types/hub';

const STORAGE_LAST_SEEN_HASH = 'panelforge_hub_last_seen_hash_v1';

// Cấu hình marked để render HTML sạch
marked.setOptions({
  gfm: true,
  breaks: true,
});

// Nạp docs manifest sinh ra lúc build
export async function fetchDocsManifest(): Promise<DocsManifestData> {
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const url = `${cleanBase}generated/docs-manifest.json?t=${Date.now()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Không tải được docs-manifest.json`);
  }
  return res.json();
}

// Nạp commits diff sinh ra lúc build
export async function fetchCommitsDiff(): Promise<CommitsDiffData> {
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const url = `${cleanBase}generated/commits-diff.json?t=${Date.now()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Không tải được commits-diff.json`);
  }
  return res.json();
}

// Render markdown sang HTML
export function renderMarkdown(md: string): string {
  try {
    return marked.parse(md) as string;
  } catch (e) {
    return `<pre>${md}</pre>`;
  }
}

// Quản lý trạng thái đọc tài liệu (Unread / New orange dot)
export function getLastSeenCommitHash(): string {
  try {
    return localStorage.getItem(STORAGE_LAST_SEEN_HASH) || '';
  } catch {
    return '';
  }
}

export function saveLastSeenCommitHash(hash: string): void {
  try {
    localStorage.setItem(STORAGE_LAST_SEEN_HASH, hash);
  } catch (e) {
    console.warn('[dataService] Không thể lưu vào localStorage:', e);
  }
}

// Kiểm tra danh sách tài liệu mới được cập nhật kể từ hash cuối cùng người dùng thấy
export function getUnreadDocs(docs: DocItem[], latestHash: string): Set<string> {
  const lastSeen = getLastSeenCommitHash();
  const unreadSlugs = new Set<string>();

  if (!lastSeen) {
    // Lần đầu vào web: lưu hash hiện tại làm mốc
    if (latestHash) {
      saveLastSeenCommitHash(latestHash);
    }
    return unreadSlugs;
  }

  if (lastSeen === latestHash) {
    return unreadSlugs;
  }

  // Nếu hash khác: những file nào có lastCommit.hash khác hoặc mới hơn lastSeen sẽ đánh dấu
  for (const doc of docs) {
    if (doc.lastCommit?.hash && doc.lastCommit.hash !== lastSeen) {
      unreadSlugs.add(doc.slug);
    }
  }

  return unreadSlugs;
}

// Định dạng thời gian tương đối
export function formatRelativeDate(isoDate: string): string {
  try {
    const diff = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days === 1) return 'Hôm qua';
    if (days < 30) return `${days} ngày trước`;
    return new Date(isoDate).toLocaleDateString('vi-VN');
  } catch {
    return isoDate;
  }
}
