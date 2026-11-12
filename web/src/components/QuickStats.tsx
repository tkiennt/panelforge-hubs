import React from 'react';
import type { HubState } from '../types/hub';
import { Layers, CheckCircle2, ShieldCheck, GitCommit } from 'lucide-react';

interface QuickStatsProps {
  state: HubState;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ state }) => {
  const allSubtasks = state.tasks?.flatMap((t) => t.subTasks || []) || [];
  const doneSubtasks = allSubtasks.filter((s) => s.status === 'Done').length;
  const totalSubtasks = allSubtasks.length;
  const percentDone = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;
  
  const beTasks = allSubtasks.filter((s) => s.platform === 'BE');
  const feTasks = allSubtasks.filter((s) => s.platform === 'FE');
  const moTasks = allSubtasks.filter((s) => s.platform === 'MOBILE');

  const beDone = beTasks.filter((s) => s.status === 'Done').length;
  const feDone = feTasks.filter((s) => s.status === 'Done').length;
  const moDone = moTasks.filter((s) => s.status === 'Done').length;

  const totalDiagrams = state.diagrams?.length || 0;
  const totalLogs = state.syncLogs?.length || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Stat 1: Subtask Completion */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Multi-Repo Progress
          </span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-100 font-mono">{percentDone}%</span>
          <span className="text-xs text-slate-400 font-mono">
            ({doneSubtasks}/{totalSubtasks} Sub-tasks)
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${percentDone}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
          <span>BE: {beDone}/{beTasks.length}</span>
          <span>FE: {feDone}/{feTasks.length}</span>
          <span>MO: {moDone}/{moTasks.length}</span>
        </div>
      </div>

      {/* Stat 2: Core Flows & State Machines */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Architecture Specs
          </span>
          <Layers className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-100 font-mono">{totalDiagrams}</span>
          <span className="text-xs text-slate-400">Diagrams & Machines</span>
        </div>
        <p className="text-[11px] text-indigo-400 font-mono mt-2.5">
          CF1–CF5 + 5 Core Life Cycles
        </p>
      </div>

      {/* Stat 3: Zero-Trust Quality Gates */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Quality Gates V2.6
          </span>
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-cyan-400 font-mono">100%</span>
          <span className="text-xs text-slate-400">Gate Integrity</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-2.5">
          Bible Gate · Script Freeze · SHA-256
        </p>
      </div>

      {/* Stat 4: Commits & Audit Trail */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Audit Logs Trail
          </span>
          <GitCommit className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-100 font-mono">{totalLogs}</span>
          <span className="text-xs text-slate-400">Tracked Commits</span>
        </div>
        <p className="text-[11px] text-purple-400 font-mono mt-2.5 truncate">
          Last Sync: {new Date(state.lastSyncedAt || Date.now()).toLocaleTimeString('vi-VN')}
        </p>
      </div>
    </div>
  );
};
