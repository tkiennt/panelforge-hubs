// panelforge-hub/web/src/services/githubService.ts
import type { CommitsDiffData, CommitDiffItem, CommitChangedFile, GitHubApiStatus } from '../types/hub';

export type RepoFilterId = 'ALL' | 'HUB' | 'BE' | 'FE' | 'MOBILE';

export const GITHUB_REPO_OWNER = 'tkiennt';
export const GITHUB_REPO_NAME = 'panelforge-hubs';

export interface MonitoredRepoConfig {
  id: 'HUB' | 'BE' | 'FE' | 'MOBILE';
  name: string;
  owner: string;
  repo: string;
  badge: string;
  badgeClass: string;
  description: string;
}

export const MONITORED_REPOS: MonitoredRepoConfig[] = [
  {
    id: 'HUB',
    name: 'Hub Docs (SSOT)',
    owner: 'tkiennt',
    repo: 'panelforge-hubs',
    badge: 'DOCS HUB',
    badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'SSOT Docs & Specs Hub',
  },
  {
    id: 'BE',
    name: 'Backend (.NET 9)',
    owner: 'DontPassAway',
    repo: 'PanelForge_FA26SE251',
    badge: 'BACKEND .NET',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'Clean Architecture .NET 9 Backend & Database',
  },
  {
    id: 'FE',
    name: 'Frontend (React 19)',
    owner: 'tkiennt',
    repo: 'panelforge-fe',
    badge: 'FRONTEND REACT',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Studio Editor & Web UI (React 19 + Tailwind)',
  },
  {
    id: 'MOBILE',
    name: 'Mobile (Flutter)',
    owner: 'tranbaoming',
    repo: 'panelforge-mobile',
    badge: 'MOBILE FLUTTER',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Reader App Mobile (Flutter)',
  },
];

export const GITHUB_API_BASE = 'https://api.github.com';

const STORAGE_GH_TOKEN = 'panelforge_hub_gh_token';
const CACHE_COMMITS_DATA_KEY = 'panelforge_hub_gh_multirepo_cache_v4';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 phút TTL trong localStorage để tránh chạm Rate Limit 60 req/giờ

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
    'User-Agent': 'PanelForge-MultiRepo-Hub',
  };
  const token = getGitHubToken();
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
}

// Lấy chi tiết commit (gồm danh sách file và patch diff) từ GitHub API
export async function fetchCommitDetail(
  owner: string,
  repo: string,
  sha: string
): Promise<CommitChangedFile[]> {
  const cacheKey = `gh_commit_detail_${owner}_${repo}_${sha}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {}

  const url = `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits/${sha}`;
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

// Lấy commits cho một repository đơn lẻ (mặc định đọc từ mới nhất giống GitHub)
async function fetchSingleRepoCommits(
  repoConfig: MonitoredRepoConfig,
  perPage = 20,
  forceRefresh = false
): Promise<{ items: CommitDiffItem[]; rateLimited: boolean }> {
  const cacheKey = `gh_commits_v4_${repoConfig.id}_${perPage}`;
  let staleItems: CommitDiffItem[] = [];

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed.items)) {
        staleItems = parsed.items;
        if (!forceRefresh && Date.now() - parsed.timestamp < CACHE_TTL_MS) {
          return { items: parsed.items, rateLimited: false };
        }
      }
    }
  } catch {}

  try {
    const listUrl = `${GITHUB_API_BASE}/repos/${repoConfig.owner}/${repoConfig.repo}/commits?per_page=${perPage}`;
    const res = await fetch(listUrl, { headers: getAuthHeaders() });

    if (!res.ok) {
      const isRateLimit = res.status === 403 || res.status === 429;
      console.warn(
        `[githubService] Không tải được commits từ ${repoConfig.owner}/${repoConfig.repo}: HTTP ${res.status}`
      );
      return { items: staleItems, rateLimited: isRateLimit };
    }

    const commitsList: any[] = await res.json();
    if (!Array.isArray(commitsList)) return { items: staleItems, rateLimited: false };

    const items: CommitDiffItem[] = commitsList.map((c: any) => ({
      fullHash: c.sha,
      hash: c.sha.substring(0, 7),
      author: c.commit?.author?.name || c.author?.login || 'Team Member',
      date: c.commit?.author?.date || new Date().toISOString(),
      message: c.commit?.message || '',
      repoId: repoConfig.id,
      repoName: repoConfig.name,
      repoOwner: repoConfig.owner,
      repoSlug: repoConfig.repo,
      files: [],
    }));

    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({ items, timestamp: Date.now() })
      );
    } catch {}

    return { items, rateLimited: false };
  } catch (err) {
    console.warn(`[githubService] Lỗi kết nối ${repoConfig.owner}/${repoConfig.repo}:`, err);
    return { items: staleItems, rateLimited: false };
  }
}

// Gọi trực tiếp GitHub Commits API cho toàn bộ 4 repositories (Multi-Repo Stream)
export async function fetchLiveCommitsFromGitHub(
  forceRefresh = false
): Promise<{
  data: CommitsDiffData;
  status: GitHubApiStatus;
}> {
  // 1. Kiểm tra cache tổng trong localStorage nếu không ép buộc làm mới
  if (!forceRefresh) {
    try {
      const raw = localStorage.getItem(CACHE_COMMITS_DATA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data?.commits?.length > 0) {
          return {
            data: parsed.data,
            status: {
              source: 'cached',
              lastFetchedAt: new Date(parsed.timestamp).toLocaleTimeString('vi-VN'),
            },
          };
        }
      }
    } catch {}
  }

  // 2. Tải song song 20 commits mới nhất từ cả 4 repositories
  const allRepoResults = await Promise.all(
    MONITORED_REPOS.map((repo) => fetchSingleRepoCommits(repo, 20, forceRefresh))
  );

  const anyRateLimited = allRepoResults.some((r) => r.rateLimited);

  // Ghép và sắp xếp từ mới nhất -> cũ nhất (giống GitHub)
  const combinedCommits: CommitDiffItem[] = allRepoResults
    .flatMap((r) => r.items)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (combinedCommits.length === 0) {
    throw new Error(
      anyRateLimited
        ? 'GitHub API tạm hết hạn mức (60 req/giờ theo IP). Đang dùng dữ liệu build gần nhất.'
        : 'Không thể tải commits từ bất kỳ repository nào qua GitHub API.'
    );
  }

  const diffData: CommitsDiffData = {
    latestHash: combinedCommits[0]?.hash || '',
    totalCommits: combinedCommits.length,
    commits: combinedCommits,
  };

  try {
    localStorage.setItem(
      CACHE_COMMITS_DATA_KEY,
      JSON.stringify({ data: diffData, timestamp: Date.now() })
    );
  } catch {}

  return {
    data: diffData,
    status: {
      source: anyRateLimited ? 'cached' : 'live-api',
      rateLimited: anyRateLimited,
      lastFetchedAt: new Date().toLocaleTimeString('vi-VN'),
    },
  };
}
