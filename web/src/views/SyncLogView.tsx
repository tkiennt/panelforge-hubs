import React from 'react';
import type { SyncLogEntry } from '../types/hub';
import { SyncTimeline } from '../components/SyncTimeline';
import { Bot, Terminal, Cpu } from 'lucide-react';

interface SyncLogViewProps {
  logs: SyncLogEntry[];
}

export const SyncLogView: React.FC<SyncLogViewProps> = ({ logs }) => {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                AI Agent & Multi-Repo Git Synchronization Timeline
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time chronological log of codebase mutations, state flow updates, and subtask completions.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>git commit -m "... [SUB-xxx]"</span>
          </div>
        </div>

        {/* Sync Rule Reminder */}
        <div className="mt-4 p-3 bg-purple-950/20 border border-purple-800/40 rounded-lg flex items-start gap-2.5 text-xs text-purple-200">
          <Bot className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-purple-300">Automated Post-Commit Hook Active:</span> Running a commit in any of the 3 repositories automatically triggers <code className="px-1.5 py-0.5 rounded bg-slate-950 text-indigo-300 font-mono">sync-hub.mjs</code> to update task statuses (<code className="text-emerald-300 font-mono">[SUB-xxx]</code> $\rightarrow$ Done, <code className="text-amber-300 font-mono">[WIP:SUB-xxx]</code> $\rightarrow$ InProgress) and bump diagram revisions if <code className="text-indigo-300 font-mono">.mermaid</code> files changed.
          </div>
        </div>
      </div>

      {/* Sync Timeline component */}
      <SyncTimeline logs={logs} />
    </div>
  );
};
