import React, { useEffect, useState, useCallback } from 'react';
import type { HubState, TaskStatus } from './types/hub';
import { fetchHubState, saveLocalCustomState } from './services/dataService';
import { Navbar, type ActiveTabType } from './components/Navbar';
import { QuickStats } from './components/QuickStats';
import { DiagramsView } from './views/DiagramsView';
import { TasksView } from './views/TasksView';
import { FeatureAuditView } from './views/FeatureAuditView';
import { SyncLogView } from './views/SyncLogView';
import { DocsView } from './views/DocsView';
import { ExternalLink, Github, Sparkles, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [hubState, setHubState] = useState<HubState | null>(null);
  const [currentTab, setCurrentTab] = useState<ActiveTabType>('diagrams');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setRefreshing(true);
    setError(null);

    try {
      const state = await fetchHubState();
      setHubState(state);
    } catch (err: any) {
      console.error('Error fetching hub state:', err);
      setError(err?.message || 'Không thể tải dữ liệu hub-state.json');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubtaskStatusChange = (
    taskId: string,
    subtaskId: string,
    newStatus: TaskStatus
  ) => {
    if (!hubState) return;

    const updatedTasks = hubState.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const updatedSubtasks =
        task.subTasks?.map((st) => {
          if (st.id !== subtaskId) return st;
          return {
            ...st,
            status: newStatus,
            completedAt: newStatus === 'Done' ? new Date().toISOString() : st.completedAt,
          };
        }) || [];

      const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.status === 'Done');
      const anyActive = updatedSubtasks.some(
        (st) => st.status === 'InProgress' || st.status === 'Done' || st.status === 'InReview'
      );

      return {
        ...task,
        status: (allDone ? 'Done' : anyActive ? 'InProgress' : 'Todo') as TaskStatus,
        subTasks: updatedSubtasks,
      };
    });

    const newState: HubState = {
      ...hubState,
      tasks: updatedTasks,
    };

    setHubState(newState);
    saveLocalCustomState('tasks_override', updatedTasks);
    showToast(`Đã chuyển trạng thái ${subtaskId} sang ${newStatus}`);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 border border-indigo-500/50 text-indigo-300 shadow-2xl shadow-indigo-500/20 text-xs font-semibold animate-fade-in backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navigation Header */}
      {hubState && (
        <Navbar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          state={hubState}
          onRefresh={() => loadData(true)}
          isRefreshing={refreshing}
        />
      )}

      {/* Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
            <div className="text-sm text-slate-400 font-medium">
              Đang nạp dữ liệu kiến trúc & tài liệu tĩnh...
            </div>
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-rose-950/20 border border-rose-800/40 text-center space-y-3">
            <h3 className="text-lg font-bold text-rose-300">Không thể nạp dữ liệu Hub</h3>
            <p className="text-sm text-slate-400">{error}</p>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700"
            >
              Thử lại
            </button>
          </div>
        ) : hubState ? (
          <div className="space-y-6">
            {/* Quick Metrics Bar */}
            <QuickStats state={hubState} />

            {/* Active Tab Views */}
            {currentTab === 'diagrams' && (
              <DiagramsView diagrams={hubState.diagrams || []} />
            )}

            {currentTab === 'tasks' && (
              <TasksView
                tasks={hubState.tasks || []}
                onSubtaskStatusChange={handleSubtaskStatusChange}
              />
            )}

            {currentTab === 'audit' && (
              <FeatureAuditView />
            )}

            {currentTab === 'synclog' && (
              <SyncLogView logs={hubState.syncLogs || []} />
            )}

            {currentTab === 'docs' && (
              <DocsView />
            )}
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-8 px-4 sm:px-6 lg:px-8 mt-12 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <span>PanelForge Hub V2.6 Final · Static Markdown Architecture</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono">
            <a
              href="https://github.com/DontPassAway/PanelForge_FA26SE251"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 flex items-center gap-1 transition"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Backend (.NET 9)</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>

            <a
              href="https://github.com/tkiennt/panelforge-fe"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 flex items-center gap-1 transition"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Frontend (React 19)</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>

            <a
              href="https://github.com/tranbaoming/panelforge-mobile"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 flex items-center gap-1 transition"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Mobile (Flutter)</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>

            <a
              href="https://github.com/tkiennt/panelforge-hubs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 flex items-center gap-1 transition text-indigo-300 font-semibold"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Hub & Docs</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

