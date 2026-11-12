import React, { useState } from 'react';
import type { SyncLogEntry, PlatformType } from '../types/hub';
import { GitCommit, ExternalLink, Clock, Search, Layers, CheckCircle } from 'lucide-react';

interface SyncTimelineProps {
  logs: SyncLogEntry[];
}

export const SyncTimeline: React.FC<SyncTimelineProps> = ({ logs }) => {
  const [selectedRepo, setSelectedRepo] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getRepoBadgeColor = (platform: PlatformType) => {
    switch (platform) {
      case 'BE':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60';
      case 'FE':
        return 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60';
      case 'MOBILE':
        return 'bg-purple-950/80 text-purple-300 border-purple-700/60';
    }
  };

  const filteredLogs = (logs || []).filter((log) => {
    if (selectedRepo !== 'ALL' && log.repo !== selectedRepo) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message?.toLowerCase().includes(q);
      const matchAuthor = log.author?.toLowerCase().includes(q);
      const matchHash = log.commitHash?.toLowerCase().includes(q);
      const matchTasks = log.affectedTaskIds?.some((t) => t.toLowerCase().includes(q));
      if (!matchMsg && !matchAuthor && !matchHash && !matchTasks) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search commit message, hash, author or task ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Repositories</option>
              <option value="BE">BE (.NET 9)</option>
              <option value="FE">FE (React 19)</option>
              <option value="MOBILE">MOBILE (Flutter)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative border-l-2 border-slate-800 ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-6">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No synchronization records matching filters.
          </div>
        ) : (
          filteredLogs.map((log) => {
            return (
              <div key={log.id} className="relative group">
                {/* Node icon on vertical line */}
                <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-8 h-8 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 bg-slate-900 border-indigo-500 text-indigo-300">
                  <GitCommit className="w-4 h-4" />
                </div>

                {/* Log Entry Card */}
                <div className="bg-slate-900 border border-slate-800 group-hover:border-slate-700/90 rounded-xl p-4 sm:p-5 shadow-md transition space-y-3">
                  {/* Top line: Author, Repo, Timestamp */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-200 text-xs">{log.author}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getRepoBadgeColor(
                          log.repo
                        )}`}
                      >
                        [{log.repo}]
                      </span>

                      {log.affectedDiagramIds?.map((dId) => (
                        <span key={dId} className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5" />
                          {dId}
                        </span>
                      ))}

                      {log.affectedTaskIds?.map((tId) => (
                        <span key={tId} className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                          <CheckCircle className="w-2.5 h-2.5" />
                          {tId}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : ''}</span>
                    </div>
                  </div>

                  {/* Commit Message */}
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-xs sm:text-sm text-slate-100 font-medium font-mono">
                      {log.message}
                    </p>

                    {log.commitUrl && (
                      <a
                        href={log.commitUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-slate-700 text-xs font-mono shrink-0 transition"
                      >
                        <GitCommit className="w-3.5 h-3.5" />
                        <span>{log.commitHash}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
