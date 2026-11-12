import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured, type HubState, type TaskStatus } from '../config/firebase';

const FIRESTORE_COLLECTION = 'panelforge_hub';
const FIRESTORE_DOC_ID = 'workspace_state';
const LOCAL_STORAGE_KEY = 'panelforge_hub_state_v1';

export async function fetchDefaultJsonState(): Promise<HubState> {
  const baseUrl = import.meta.env.BASE_URL || './';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const res = await fetch(`${cleanBase}data/hub-state.json?t=${Date.now()}`);
  if (!res.ok) {
    const fallback = await fetch(`./data/hub-state.json?t=${Date.now()}`);
    return fallback.json();
  }
  return res.json();
}

export async function loadHubState(): Promise<{ state: HubState; source: 'firestore' | 'local_storage' | 'json_fallback' }> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as HubState;
        return { state: data, source: 'firestore' };
      }
    } catch (err) {
      console.warn('[dataService] Firestore read failed, falling back to local/JSON:', err);
    }
  }

  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached) as HubState;
      return { state: parsed, source: 'local_storage' };
    }
  } catch (e) {
    console.warn('[dataService] Failed to read from localStorage:', e);
  }

  const state = await fetchDefaultJsonState();
  return { state, source: 'json_fallback' };
}

export async function saveHubState(state: HubState): Promise<boolean> {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[dataService] Could not save to localStorage:', e);
  }

  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC_ID);
      await setDoc(docRef, {
        ...state,
        lastSyncedAt: new Date().toISOString(),
      }, { merge: true });
      return true;
    } catch (err) {
      console.error('[dataService] Firestore write failed:', err);
      return false;
    }
  }

  return true;
}

export async function updateSubTaskStatus(
  currentState: HubState,
  taskId: string,
  subtaskId: string,
  newStatus: TaskStatus
): Promise<HubState> {
  const updatedTasks = currentState.tasks.map((task) => {
    if (task.id !== taskId) return task;

    const updatedSubtasks = (task.subTasks || []).map((st) => {
      if (st.id !== subtaskId) return st;
      return {
        ...st,
        status: newStatus,
        completedAt: newStatus === 'Done' ? new Date().toISOString() : st.completedAt,
      };
    });

    const allDone = updatedSubtasks.every((st) => st.status === 'Done');
    const someInProgress = updatedSubtasks.some((st) => st.status === 'InProgress' || st.status === 'InReview');

    let parentStatus: TaskStatus = task.status;
    if (allDone) parentStatus = 'Done';
    else if (someInProgress) parentStatus = 'InProgress';
    else if (updatedSubtasks.every((st) => st.status === 'Todo')) parentStatus = 'Todo';

    return {
      ...task,
      status: parentStatus,
      subTasks: updatedSubtasks,
    };
  });

  const updatedState: HubState = {
    ...currentState,
    tasks: updatedTasks,
    lastSyncedAt: new Date().toISOString(),
  };

  await saveHubState(updatedState);
  return updatedState;
}
