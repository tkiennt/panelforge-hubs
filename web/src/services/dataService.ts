// panelforge-hub/web/src/services/dataService.ts
import { marked } from 'marked';
import type { DocsManifestData, CommitsDiffData, DocItem, GitHubApiStatus } from '../types/hub';
import { fetchLiveCommitsFromGitHub } from './githubService';

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

// Nạp static commits diff làm dự phòng (fallback) khi offline hoặc rate-limited
export async function fetchStaticCommitsDiff(): Promise<CommitsDiffData> {
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const url = `${cleanBase}generated/commits-diff.json?t=${Date.now()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: Không tải được commits-diff.json`);
  }
  return res.json();
}

// Nạp commits từ GitHub API trực tiếp, fallback về static file nếu gặp lỗi
export async function fetchCommitsDiff(forceRefresh = false): Promise<CommitsDiffData> {
  const result = await fetchCommitsDiffWithStatus(forceRefresh);
  return result.data;
}

export async function fetchCommitsDiffWithStatus(
  forceRefresh = false
): Promise<{ data: CommitsDiffData; status: GitHubApiStatus }> {
  try {
    const liveResult = await fetchLiveCommitsFromGitHub(forceRefresh);
    return liveResult;
  } catch (liveErr: any) {
    console.warn('[dataService] Lỗi GitHub Live API, chuyển sang static fallback:', liveErr);
    try {
      const fallbackData = await fetchStaticCommitsDiff();
      return {
        data: fallbackData,
        status: {
          source: 'fallback',
          errorMessage: liveErr?.message || 'Không thể kết nối GitHub API trực tiếp',
          lastFetchedAt: new Date().toLocaleTimeString('vi-VN'),
        },
      };
    } catch (fallbackErr) {
      throw liveErr;
    }
  }
}

// Tìm tài liệu khớp với đường dẫn nội bộ hoặc link GitHub
export function resolveDocFromPath(
  rawPath: string,
  currentDoc: DocItem | undefined,
  docs: DocItem[]
): DocItem | undefined {
  if (!rawPath || !docs.length) return undefined;

  let cleaned = rawPath.trim();

  // Nếu là link GitHub trỏ về chính repo panelforge-hubs
  const ghMatch = cleaned.match(
    /^https?:\/\/github\.com\/tkiennt\/panelforge-hubs\/(?:blob|tree)\/[^/]+\/(.+)$/i
  );
  if (ghMatch) {
    cleaned = ghMatch[1];
  } else if (/^https?:\/\//i.test(cleaned) || cleaned.startsWith('mailto:') || cleaned.startsWith('#')) {
    return undefined;
  }

  // Bỏ anchor #... và query ?...
  cleaned = cleaned.split('#')[0].split('?')[0];
  try {
    cleaned = decodeURIComponent(cleaned);
  } catch {}
  cleaned = cleaned.replace(/\\/g, '/').trim();
  if (!cleaned) return undefined;

  // Xử lý đường dẫn tương đối (./ hoặc ../) so với file hiện tại
  if ((cleaned.startsWith('./') || cleaned.startsWith('../')) && currentDoc) {
    const baseParts = currentDoc.path.split('/').slice(0, -1);
    for (const seg of cleaned.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') baseParts.pop();
      else baseParts.push(seg);
    }
    cleaned = baseParts.join('/');
  }

  cleaned = cleaned.replace(/^\/+/, '').replace(/^\.\//, '');
  const withoutDocsPrefix = cleaned.replace(/^docs\//i, '');
  const lowerClean = cleaned.toLowerCase();
  const lowerNoDocs = withoutDocsPrefix.toLowerCase();
  const lowerNoExt = lowerNoDocs.replace(/\.md$/i, '');

  // 1. Khớp chính xác repoPath, path hoặc slug
  const exact = docs.find(
    (d) =>
      d.repoPath.toLowerCase() === lowerClean ||
      d.path.toLowerCase() === lowerNoDocs ||
      d.slug.toLowerCase() === lowerNoExt
  );
  if (exact) return exact;

  // 2. Nếu trỏ tới thư mục (ví dụ: docs/V2.6/ hoặc docs/spec/)
  if (cleaned.endsWith('/') || !withoutDocsPrefix.includes('.')) {
    const folderPrefix = lowerNoDocs.endsWith('/') ? lowerNoDocs : `${lowerNoDocs}/`;
    const folderDoc =
      docs.find((d) => d.path.toLowerCase() === `${folderPrefix}readme.md`) ||
      docs.find((d) => d.path.toLowerCase().startsWith(folderPrefix));
    if (folderDoc) return folderDoc;
  }

  // 3. Khớp theo tên file (nếu chỉ ghi tên file.md)
  const fileName = lowerNoDocs.split('/').pop();
  if (fileName && fileName.endsWith('.md')) {
    return docs.find((d) => d.path.split('/').pop()?.toLowerCase() === fileName);
  }

  return undefined;
}

// Render markdown sang HTML (tự động chuyển đường dẫn file .md thành link nội bộ, đồng bộ heading IDs, metadata grid & tables)
export function renderMarkdown(
  md: string,
  docs?: DocItem[],
  currentDoc?: DocItem,
  segmentIndex = 0
): string {
  try {
    const normalizedMd = md.normalize('NFC');
    const rawHtml = marked.parse(normalizedMd) as string;
    if (typeof DOMParser === 'undefined') {
      return rawHtml;
    }

    const parsed = new DOMParser().parseFromString(rawHtml, 'text/html');

    // 1. Gán ID chuẩn cho h1, h2, h3 để TOC & IntersectionObserver cuộn chính xác + gắn badge số mục cho h2
    let h2Counter = 0;
    parsed.querySelectorAll('h1, h2, h3').forEach((el) => {
      const text = (el.textContent || '').trim();
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      if (id && !el.id) {
        el.id = id;
      }
      if (el.tagName === 'H2') {
        h2Counter++;
        const numMatch = text.match(/^(\d+(?:\.\d+)?)\s*[.):\-–]\s*(.+)$/);
        const badge = parsed.createElement('span');
        badge.className = 'h2-section-badge';
        if (numMatch) {
          badge.textContent = numMatch[1].padStart(2, '0');
          // Giữ nguyên phần text phía sau số mục nếu là text thuần
          if (el.childNodes.length === 1 && el.firstChild?.nodeType === 3) {
            el.textContent = numMatch[2];
          }
          el.prepend(badge);
        } else {
          badge.textContent = String(h2Counter).padStart(2, '0');
          el.prepend(badge);
        }
      }
    });

    // 2. Biến danh sách metadata đầu bài (nếu ở segment đầu tiên) thành 2-column key-value grid
    if (segmentIndex === 0) {
      const firstUl = parsed.body.querySelector(':scope > ul');
      if (firstUl && firstUl.children.length >= 2 && firstUl.children.length <= 8) {
        const items = Array.from(firstUl.children);
        const kvPairs: { key: string; valHtml: string }[] = [];
        let allKv = true;

        for (const li of items) {
          const strong = li.querySelector(':scope > strong:first-child');
          if (!strong) {
            allKv = false;
            break;
          }
          const rawKey = (strong.textContent || '').replace(/[:：]\s*$/, '').trim();
          const clone = li.cloneNode(true) as HTMLElement;
          const cloneStrong = clone.querySelector(':scope > strong:first-child');
          cloneStrong?.remove();
          const valHtml = clone.innerHTML.replace(/^[\s:：-]+/, '').trim();
          if (!rawKey || !valHtml) {
            allKv = false;
            break;
          }
          kvPairs.push({ key: rawKey, valHtml });
        }

        if (allKv && kvPairs.length >= 2) {
          const grid = parsed.createElement('div');
          grid.className = 'doc-metadata-grid';
          for (const kv of kvPairs) {
            const item = parsed.createElement('div');
            item.className = 'doc-metadata-item';
            const kEl = parsed.createElement('span');
            kEl.className = 'doc-metadata-key';
            kEl.textContent = kv.key;
            const vEl = parsed.createElement('span');
            vEl.className = 'doc-metadata-val';
            vEl.innerHTML = kv.valHtml;
            item.appendChild(kEl);
            item.appendChild(vEl);
            grid.appendChild(item);
          }
          firstUl.replaceWith(grid);
        }
      }
    }

    // 3. Bọc <table> trong .table-wrap để cuộn ngang mượt
    parsed.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.classList.contains('table-wrap')) return;
      const wrap = parsed.createElement('div');
      wrap.className = 'table-wrap';
      table.parentNode?.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    // 4. Chuyển các thẻ <a> trỏ tới file .md thành link mở trực tiếp trên web
    if (docs && docs.length > 0) {
      parsed.querySelectorAll('a[href]').forEach((el) => {
        const href = el.getAttribute('href') || '';
        const matched = resolveDocFromPath(href, currentDoc, docs);
        if (matched) {
          el.setAttribute('href', `#/docs/${matched.slug}`);
          el.setAttribute('data-doc-slug', matched.slug);
          el.setAttribute('title', `Mở tài liệu: ${matched.title}`);
        } else if (/^https?:\/\//i.test(href)) {
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
        }
      });

      // 5. Biến các inline code chứa đường dẫn file .md / thư mục docs/ thành nút bấm mở file
      parsed.querySelectorAll('code').forEach((el) => {
        if (el.closest('pre') || el.closest('a')) return;
        const text = el.textContent?.trim() || '';
        if (!text || (!text.includes('/') && !text.endsWith('.md'))) return;
        const matched = resolveDocFromPath(text, currentDoc, docs);
        if (matched) {
          el.setAttribute('data-doc-slug', matched.slug);
          el.setAttribute('title', `Mở tài liệu trên web: ${matched.title}`);
          el.classList.add('doc-path-link');
        }
      });
    }

    return parsed.body.innerHTML;
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
