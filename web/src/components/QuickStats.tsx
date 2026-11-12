import React from 'react';
import type { HubState } from '../types/hub';
import { GitCommit, Layers, CheckCircle2, ShieldCheck, Cpu } from 'lucide-react';

interface QuickStatsProps {
  state: HubState;
}

export const QuickStats: React.FC<QuickStatsProps> = ({ state }) => {
  const allSubtasks = state.tasks?.flatMap((t) => t.subTasks || []) || [];
  const doneSubtasks = allSubtasks.filter((s) => s.status === 'Done').length;
  const totalSubtasks = allSubtasks.length;
  const percentDone = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;
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
          <span className="text-xs text-slate-400">Flows & State Machines</span>
        </div>
        <p className="text-[11px] text-indigo-400 font-mono mt-2">
          CF1–CF5 + 5 Core Life Cycles
        </p>
      </div>

      {/* Stat 3: Zero-Trust Gates & Tests */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Verification Gates
          </span>
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-100 font-mono">100%</span>
          <span className="text-xs text-emerald-400 font-semibold">Active & Enforced</span>
        </div>
        <p className="text-[11px] text-slate-400 font-mono mt-2">
          Bible Gate + CAS SHA-256 + RBAC
        </p>
      </div>

      {/* Stat 4: Git Sync Events */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Sync Events
          </span>
          <Cpu className="w-4 h-4 text-purple-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-100 font-mono">{totalLogs}</span>
          <span className="text-xs text-slate-400">Commits Tracked</span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-[11px] text-purple-300 font-mono">
          <GitCommit className="w-3.5 h-3.5" />
          <span>Across BE, FE & Mobile</span>
        </div>
      </div>
    </div>
  );
};
