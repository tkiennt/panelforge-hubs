// panelforge-hub/web/src/types/hub.ts

export type PlatformType = 'BE' | 'FE' | 'MOBILE' | 'HUB';
export type TaskStatus = 'Todo' | 'InProgress' | 'InReview' | 'Done' | 'Blocked';
export type CoreFlowId = 'CF1' | 'CF2' | 'CF3' | 'CF4' | 'CF5' | 'OVERVIEW';
export type TaskPriority = 'P0' | 'P1' | 'P2';

export interface DiagramRevision {
  version: number;
  updatedAt: string;
  updatedBy: string;
  repo: PlatformType;
  commitHash: string;
  commitUrl: string;
  changelog: string;
  mermaidCode: string;
  architectureRationale?: string;
}

export interface FlowDiagram {
  id: string;
  coreFlow: CoreFlowId;
  title: string;
  currentVersion: number;
  revisions: DiagramRevision[];
}

export interface SubTask {
  id: string; // VD: "SUB-CF4-BE-01"
  platform: PlatformType;
  repoUrl: string;
  title: string;
  status: TaskStatus;
  completedBy?: string | null;
  commitHash?: string | null;
  commitUrl?: string | null;
  completedAt?: string | null;
}

export interface HubTask {
  id: string; // VD: "PF-CF4-01"
  coreFlow: 'CF1' | 'CF2' | 'CF3' | 'CF4' | 'CF5';
  linkedDiagramNode?: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  owner: string;
  subTasks: SubTask[];
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  repo: PlatformType;
  author: string;
  commitHash: string;
  commitUrl: string;
  message: string;
  affectedTaskIds: string[];
  affectedDiagramIds: string[];
}

export interface HubState {
  lastSyncedAt: string;
  diagrams: FlowDiagram[];
  tasks: HubTask[];
  syncLogs: SyncLogEntry[];
}

export interface FeatureAuditItem {
  id: string;
  code: string;
  featureName: string;
  module: string;
  oldVersion: string; // V2.0 / V2.5
  newVersionV26: string; // V2.6
  rationale: string;
  status: 'Done' | 'InProgress' | 'Planned';
  commits: { repo: PlatformType; hash: string; url: string }[];
}

export interface DocFileItem {
  id: string;
  title: string;
  category: 'spec' | 'standards' | 'architecture' | 'tracking' | 'note';
  path: string; // e.g. "docs/spec/PANELFORGE_MASTER_SPECIFICATION_V2_6.md"
  description: string;
}

export interface RepoConfig {
  name: string;
  platform: PlatformType;
  branch: string;
  remote: string;
  commitBaseUrl: string;
  tech: string;
}

export const DEFAULT_REPOS: Record<PlatformType, RepoConfig> = {
  BE: {
    name: 'PanelForge_FA26SE251',
    platform: 'BE',
    branch: 'trungkien',
    remote: 'https://github.com/DontPassAway/PanelForge_FA26SE251',
    commitBaseUrl: 'https://github.com/DontPassAway/PanelForge_FA26SE251/commit/',
    tech: '.NET 9 Clean Architecture, MediatR CQRS, EF Core, CAS SHA-256',
  },
  FE: {
    name: 'panelforge-fe',
    platform: 'FE',
    branch: 'trungkien',
    remote: 'https://github.com/tkiennt/panelforge-fe',
    commitBaseUrl: 'https://github.com/tkiennt/panelforge-fe/commit/',
    tech: 'React 19, Vite, Tailwind CSS, Canvas/Konva, Zustand',
  },
  MOBILE: {
    name: 'panelforge-mobile',
    platform: 'MOBILE',
    branch: 'main',
    remote: 'https://github.com/tranbaoming/panelforge-mobile',
    commitBaseUrl: 'https://github.com/tranbaoming/panelforge-mobile/commit/',
    tech: 'Flutter 3.x, Dart, Riverpod, Mobile Reader & Review Studio',
  },
  HUB: {
    name: 'panelforge-hub',
    platform: 'HUB',
    branch: 'main',
    remote: 'https://github.com/tkiennt/panelforge-hubs',
    commitBaseUrl: 'https://github.com/tkiennt/panelforge-hubs/commit/',
    tech: 'React 19, Vite, Static Zero-Firebase, Mermaid, Markdown Docs',
  },
};
