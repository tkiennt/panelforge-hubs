import React, { useEffect, useState } from 'react';
import type { HubState, TaskStatus } from './types/hub';
import {
  subscribeToHubState,
  saveHubStateToCloud,
} from './config/firebase';
import { Navbar } from './components/Navbar';
import { QuickStats } from './components/QuickStats';
import { DiagramsView } from './views/DiagramsView';
import { TasksView } from './views/TasksView';
import { SyncLogView } from './views/SyncLogView';
import { ExternalLink, Github, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [hubState, setHubState] = useState<HubState | null>(null);
  const [currentTab, setCurrentTab] = useState<'diagrams' | 'tasks' | 'synclog'>('diagrams');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToHubState(
      (state) => {
        setHubState(state);
        setLoading(false);
      },
      (err) => {
        console.warn('subscribeToHubState notice:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubtaskStatusChange = async (
    taskId: string,
    subtaskId: string,
    newStatus: TaskStatus
  ) => {
    if (!hubState) return;

    const updatedTasks = hubState.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const updatedSubtasks = task.subTasks?.map((st) => {
        if (st.id !== subtaskId) return st;
        return {
          ...st,
          status: newStatus,
          completedAt: newStatus === 'Done' ? new Date().toISOString() : st.completedAt,
        };
      }) || [];

      // Auto update parent task status
      const allDone = updatedSubtasks.every((st) => st.status === 'Done');
      const someInProgress = updatedSubtasks.some(
        (st) => st.status === 'InProgress' || st.status === 'InReview'
      );

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
      ...hubState,
      tasks: updatedTasks,
      lastSyncedAt: new Date().toISOString(),
    };

    setHubState(updatedState);
    showToast(`Sub-task updated to "${newStatus}"`);

    // Sync to Firestore if cloud is connected
    try {
      await saveHubStateToCloud(updatedState);
    } catch (e) {
      console.warn('Could not save to cloud:', e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-200 font-semibold text-sm">Loading PanelForge Hub Architecture & Task State...</p>
        <p className="text-slate-500 text-xs font-mono mt-1">Connecting to Firestore / Static Hub State</p>
      </div>
    );
  }

  if (error && !hubState) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md p-6 bg-slate-900 border border-rose-800 rounded-xl text-center">
          <p className="text-rose-400 font-bold text-lg mb-2">Error Loading Hub Data</p>
          <p className="text-slate-300 text-xs mb-4">{error || 'Could not parse hub state'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-indigo-600 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 animate-fade-in border border-indigo-400/50">
          <Sparkles className="w-4 h-4 text-indigo-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      {hubState && (
        <Navbar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          state={hubState}
        />
      )}

      {/* Main Container */}
      {hubState && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Quick Stats Overview */}
          <QuickStats state={hubState} />

          {/* Active Tab View */}
          {currentTab === 'diagrams' && (
            <DiagramsView diagrams={hubState.diagrams || []} />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={hubState.tasks || []}
              onSubtaskStatusChange={handleSubtaskStatusChange}
            />
          )}

          {currentTab === 'synclog' && (
            <SyncLogView logs={hubState.syncLogs || []} />
          )}
        </main>
      )}

      {/* Footer */}
      <footer className="bg-slate-950/80 border-t border-slate-900 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>PanelForge Platform &copy; 2026.</span>
            <span>Clean Architecture CQRS + React 19 + Flutter.</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <a
              href="https://github.com/DontPassAway/PanelForge_FA26SE251"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-slate-300 transition"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Backend (.NET)</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>

            <a
              href="https://github.com/tkiennt/panelforge-fe"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-slate-300 transition"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Frontend (React)</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>

            <a
              href="https://github.com/tranbaoming/panelforge-mobile"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-slate-300 transition"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Mobile (Flutter)</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
