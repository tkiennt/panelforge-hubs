// panelforge-hub/src/types/hub.ts
export * from '../config/firebase';

import type { PlatformType } from '../config/firebase';

export type RepoType = PlatformType;
export type CoreFlowId = 'CF1' | 'CF2' | 'CF3' | 'CF4' | 'CF5' | 'OVERVIEW';
export type TaskPriority = 'P0' | 'P1' | 'P2';

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
    tech: 'React 19, Vite, Tailwind CSS, Lucian UX/UI, Fabric/Konva, Zustand',
  },
  MOBILE: {
    name: 'panelforge-mobile',
    platform: 'MOBILE',
    branch: 'main',
    remote: 'https://github.com/tranbaoming/panelforge-mobile',
    commitBaseUrl: 'https://github.com/tranbaoming/panelforge-mobile/commit/',
    tech: 'Flutter 3.x, Dart, Riverpod, Mobile Reader & Review Studio',
  },
};
