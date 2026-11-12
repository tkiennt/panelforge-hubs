import React from 'react';
import { isFirebaseConfigured } from '../config/firebase';
import type { HubState } from '../types/hub';
import { Network, Database, Download, RefreshCw, GitBranch, Layers, GitPullRequest } from 'lucide-react';

interface NavbarProps {
  currentTab: 'diagrams' | 'tasks' | 'synclog';
  onTabChange: (tab: 'diagrams' | 'tasks' | 'synclog') => void;
  state: HubState;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  state,
}) => {
  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'hub-state.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-100 tracking-tight text-base sm:text-lg">
                  PanelForge <span className="text-indigo-400">Hub</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                  v2.5
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">
                Visual Documentation & Multi-Repo Sync
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onTabChange('diagrams')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'diagrams'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Core Flows & Diagrams</span>
            </button>

            <button
              onClick={() => onTabChange('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'tasks'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GitBranch className="w-4 h-4" />
              <span>Multi-Repo Tasks</span>
            </button>

            <button
              onClick={() => onTabChange('synclog')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                currentTab === 'synclog'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GitPullRequest className="w-4 h-4" />
              <span>AI Agent Sync Log</span>
            </button>
          </nav>

          {/* Actions & Connection Status */}
          <div className="flex items-center gap-2">
            {/* Storage status badge */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${
                isFirebaseConfigured
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                  : 'bg-slate-900 text-slate-400 border-slate-800'
              }`}
              title={
                isFirebaseConfigured
                  ? 'Connected to Firebase Firestore Realtime'
                  : 'Running in serverless static mode with local fallback (hub-state.json)'
              }
            >
              <Database className="w-3 h-3" />
              <span>
                {isFirebaseConfigured ? 'Firestore Live' : 'Static Fallback'}
              </span>
            </div>

            {/* Export JSON button */}
            <button
              onClick={exportJson}
              className="p-2 sm:px-2.5 sm:py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center gap-1.5 transition"
              title="Download hub-state.json"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export JSON</span>
            </button>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className="p-2 sm:p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80 rounded-lg transition"
              title="Reload data"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
