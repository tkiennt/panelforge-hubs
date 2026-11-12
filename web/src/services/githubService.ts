// panelforge-hub/web/src/services/githubService.ts
import type { CommitsDiffData, CommitDiffItem, CommitChangedFile, GitHubApiStatus } from '../types/hub';

export const GITHUB_REPO_OWNER = 'tkiennt';
export const GITHUB_REPO_NAME = 'panelforge-hubs';
export const GITHUB_API_BASE = 'https://api.github.com';

const STORAGE_GH_TOKEN = 'panelforge_hub_gh_token';
const CACHE_COMMITS_DATA_KEY = 'panelforge_hub_gh_commits_cache_v2';
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 phút TTL cho cache tự động

export function getGitHubToken(): string {
  try {
    return localStorage.getItem(STORAGE_GH_TOKEN) || '';
  } catch {
    return '';
  }
}

export function saveGitHubToken(token: string): void {
  try {
    if (!token.trim()) {
      localStorage.removeItem(STORAGE_GH_TOKEN);
    } else {
      localStorage.setItem(STORAGE_GH_TOKEN, token.trim());
    }
  } catch (e) {
    console.warn('[githubService] Không thể lưu token:', e);
  }
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'PanelForge-Hub-App',
  };
  const token = getGitHubToken();
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
}

// Lấy cache từ sessionStorage
function getCachedCommits(): { data: CommitsDiffData; timestamp: number } | null {
  try {
    const raw = sessionStorage.getItem(CACHE_COMMITS_DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
      return parsed;
    }
  } catch {}
  return null;
}

function setCachedCommits(data: CommitsDiffData): void {
  try {
    sessionStorage.setItem(
      CACHE_COMMITS_DATA_KEY,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {}
}

// Lấy chi tiết commit (gồm danh sách file và patch diff) từ GitHub API
export async function fetchCommitDetail(sha: string): Promise<CommitChangedFile[]> {
  const cacheKey = `gh_commit_detail_${sha}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  const url = `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commits/${sha}`;
  const res = await fetch(url, { headers: getAuthHeaders() });

  if (!res.ok) {
    throw new Error(`GitHub API HTTP ${res.status}: Không lấy được chi tiết commit ${sha}`);
  }

  const detail = await res.json();
  const rawFiles: any[] = detail.files || [];

  const files: CommitChangedFile[] = rawFiles.map((f) => {
    let status = 'M';
    if (f.status === 'added') status = 'A';
    else if (f.status === 'removed') status = 'D';
    else if (f.status === 'renamed') status = 'R';

    return {
      status,
      path: f.filename,
      patch: f.patch || '',
    };
  });

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(files));
  } catch {}

  return files;
}

// Gọi trực tiếp GitHub Commits API
export async function fetchLiveCommitsFromGitHub(
  forceRefresh = false
): Promise<{
  data: CommitsDiffData;
  status: GitHubApiStatus;
}> {
  // 1. Kiểm tra cache nếu không ép buộc làm mới
  if (!forceRefresh) {
    const cached = getCachedCommits();
    if (cached) {
      return {
        data: cached.data,
        status: {
          source: 'cached',
          lastFetchedAt: new Date(cached.timestamp).toLocaleTimeString('vi-VN'),
        },
      };
    }
  }

  const listUrl = `${GITHUB_API_BASE}/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/commits?per_page=30`;
  const res = await fetch(listUrl, { headers: getAuthHeaders() });

  const remaining = res.headers.get('x-ratelimit-remaining');
  const rateLimitRemaining = remaining ? parseInt(remaining, 10) : undefined;

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('Đã chạm giới hạn GitHub API Rate Limit (60 req/h). Hãy cấu hình GitHub Token để tiếp tục.');
    }
    throw new Error(`GitHub API HTTP ${res.status}: Không thể lấy danh sách commits`);
  }

  const commitsList: any[] = await res.json();
  if (!Array.isArray(commitsList)) {
    throw new Error('Dữ liệu trả về từ GitHub không hợp lệ');
  }

  // 2. Tải chi tiết file và patch cho từng commit (tối đa 15 commit gần nhất)
  const detailSlice = commitsList.slice(0, 15);
  const commitsWithFiles: CommitDiffItem[] = await Promise.all(
    detailSlice.map(async (c: any) => {
      let files: CommitChangedFile[] = [];
      try {
        files = await fetchCommitDetail(c.sha);
      } catch (e) {
        console.warn(`[githubService] Không lấy được files cho commit ${c.sha}:`, e);
      }

      return {
        fullHash: c.sha,
        hash: c.sha.substring(0, 7),
        author: c.commit?.author?.name || c.author?.login || 'Team Member',
        date: c.commit?.author?.date || new Date().toISOString(),
        message: c.commit?.message || '',
        files,
      };
    })
  );

  const diffData: CommitsDiffData = {
    latestHash: commitsWithFiles[0]?.hash || '',
    totalCommits: commitsList.length,
    commits: commitsWithFiles,
  };

  setCachedCommits(diffData);

  return {
    data: diffData,
    status: {
      source: 'live-api',
      rateLimitRemaining,
      lastFetchedAt: new Date().toLocaleTimeString('vi-VN'),
    },
  };
}
