// panelforge-hub/src/config/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  type Firestore,
} from 'firebase/firestore';

// 1. Định nghĩa kiểu dữ liệu chuẩn cho Diagram & Task của PanelForge
export type PlatformType = 'BE' | 'FE' | 'MOBILE';
export type TaskStatus = 'Todo' | 'InProgress' | 'InReview' | 'Done' | 'Blocked';

export interface DiagramRevision {
  version: number;
  updatedAt: string;
  updatedBy: string;
  repo: PlatformType;
  commitHash: string;
  commitUrl: string;
  changelog: string;
  mermaidCode: string;
}

export interface FlowDiagram {
  id: string;
  coreFlow: 'CF1' | 'CF2' | 'CF3' | 'CF4' | 'CF5' | 'OVERVIEW';
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
  priority: 'P0' | 'P1' | 'P2';
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

// 2. Cấu hình Firebase từ biến môi trường Vite (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = getFirestore(app);
}

const HUB_COLLECTION = 'panelforge_hub';
const HUB_DOC_ID = 'workspace_state';

/**
 * Lắng nghe dữ liệu Realtime từ Firestore.
 * Nếu chưa cấu hình Firebase, tự động fetch từ file tĩnh /data/hub-state.json
 */
export function subscribeToHubState(
  onData: (state: HubState) => void,
  onError?: (err: Error) => void
): () => void {
  if (db && isFirebaseConfigured) {
    const docRef = doc(db, HUB_COLLECTION, HUB_DOC_ID);
    return onSnapshot(
      docRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          onData(snapshot.data() as HubState);
        } else {
          // Nếu Firestore chưa có document, nạp bản seed từ file JSON tĩnh
          try {
            const fallback = await fetchStaticHubState();
            onData(fallback);
          } catch (err) {
            onError?.(err as Error);
          }
        }
      },
      async (error) => {
        console.warn('Firestore lỗi, chuyển sang đọc JSON tĩnh:', error);
        if (onError) onError(error);
        try {
          const fallback = await fetchStaticHubState();
          onData(fallback);
        } catch (err) {
          onError?.(err as Error);
        }
      }
    );
  }

  // Fallback khi chạy thuần trên GitHub Pages không cần Firebase
  fetchStaticHubState()
    .then(onData)
    .catch((err) => onError?.(err));

  return () => {};
}

export async function fetchStaticHubState(): Promise<HubState> {
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const res = await fetch(`${cleanBase}data/hub-state.json?t=${Date.now()}`);
  if (!res.ok) {
    // Retry relative if nested
    const retryRes = await fetch(`./data/hub-state.json?t=${Date.now()}`);
    if (!retryRes.ok) {
      throw new Error('Không thể tải dữ liệu hub-state.json');
    }
    return retryRes.json();
  }
  return res.json();
}

/**
 * Cho phép cập nhật trạng thái trực tiếp từ Web UI (nếu cần)
 */
export async function saveHubStateToCloud(newState: HubState): Promise<void> {
  if (!db || !isFirebaseConfigured) return;
  const docRef = doc(db, HUB_COLLECTION, HUB_DOC_ID);
  await setDoc(docRef, newState, { merge: true });
}

export { app, db };

