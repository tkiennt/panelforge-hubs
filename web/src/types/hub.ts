// panelforge-hub/web/src/types/hub.ts

export type PlatformType = 'BE' | 'FE' | 'MOBILE' | 'HUB';
export type TaskStatus = 'Todo' | 'InProgress' | 'InReview' | 'Done' | 'Blocked';
export type CoreFlowId = 'CF1' | 'CF2' | 'CF3' | 'CF4' | 'CF5' | 'OVERVIEW';

export interface DocHeading {
  level: number;
  text: string;
  id: string;
}

export interface FileCommit {
  hash: string;
  fullHash: string;
  author: string;
  date: string;
  subject: string;
}

export interface DocItem {
  slug: string;
  path: string;
  repoPath: string;
  category: string;
  title: string;
  content: string;
  headings: DocHeading[];
  mermaidBlocks: string[];
  fileCommits: FileCommit[];
  lastCommit: {
    hash: string;
    fullHash: string;
    date: string;
    author: string;
  };
}

export interface DocsManifestData {
  generatedAt: string;
  totalDocs: number;
  docs: DocItem[];
}

export interface CommitChangedFile {
  status: string; // 'M', 'A', 'D'
  path: string;
  patch: string;
}

export interface CommitDiffItem {
  fullHash: string;
  hash: string;
  author: string;
  date: string;
  message: string;
  repoId?: 'HUB' | 'BE' | 'FE' | 'MOBILE';
  repoName?: string;
  repoOwner?: string;
  repoSlug?: string;
  files: CommitChangedFile[];
}

export interface CommitsDiffData {
  latestHash: string;
  totalCommits: number;
  commits: CommitDiffItem[];
}

export type ActiveMode = 'reader' | 'diff';
export type DiffViewMode = 'split' | 'unified';

export interface GitHubApiStatus {
  source: 'live-api' | 'cached' | 'fallback';
  rateLimitRemaining?: number;
  lastFetchedAt?: string;
  errorMessage?: string;
}

