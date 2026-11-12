import React from 'react';
import type { HubTask, TaskStatus, PlatformType } from '../types/hub';
import { ExternalLink, CheckCircle2, Clock, PlayCircle, Eye, GitCommit, Layers, AlertCircle } from 'lucide-react';

interface TaskKanbanBoardProps {
  tasks: HubTask[];
  onSubtaskStatusChange: (taskId: string, subtaskId: string, newStatus: TaskStatus) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string; border: string; bg: string }[] = [
  { id: 'Todo', label: 'To Do', color: 'text-slate-400', border: 'border-slate-700', bg: 'bg-slate-900/60' },
  { id: 'InProgress', label: 'In Progress', color: 'text-amber-400', border: 'border-amber-500/40', bg: 'bg-amber-950/10' },
  { id: 'InReview', label: 'In Review & Gate', color: 'text-indigo-400', border: 'border-indigo-500/40', bg: 'bg-indigo-950/10' },
  { id: 'Done', label: 'Completed (Done)', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/10' },
];

export const TaskKanbanBoard: React.FC<TaskKanbanBoardProps> = ({
  tasks,
  onSubtaskStatusChange,
}) => {
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

  const nextStatusMap: Record<TaskStatus, TaskStatus> = {
    Todo: 'InProgress',
    InProgress: 'InReview',
    InReview: 'Done',
    Done: 'Todo',
    Blocked: 'InProgress',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter((t) => t.status === column.id);

        return (
          <div
            key={column.id}
            className={`flex flex-col bg-slate-900/80 border ${column.border} rounded-xl p-4 shadow-md backdrop-blur-sm min-h-[550px]`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  column.id === 'Done' ? 'bg-emerald-500' :
                  column.id === 'InProgress' ? 'bg-amber-500' :
                  column.id === 'InReview' ? 'bg-indigo-500' : 'bg-slate-500'
                }`}></span>
                <h3 className={`text-sm font-semibold tracking-wide ${column.color}`}>
                  {column.label}
                </h3>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {columnTasks.length}
              </span>
            </div>

            {/* Task Cards */}
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {columnTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-600 text-xs border border-dashed border-slate-800/80 rounded-lg">
                  <Layers className="w-6 h-6 mb-2 opacity-50" />
                  <span>No tasks in this lane</span>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-lg p-3.5 shadow-sm transition hover:shadow-md space-y-3"
                  >
                    {/* Task Header: Flow & Priority */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-semibold">
                          {task.coreFlow}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {task.id}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                          task.priority === 'P0'
                            ? 'bg-rose-950/90 text-rose-300 border border-rose-800/60'
                            : 'bg-amber-950/90 text-amber-300 border border-amber-800/60'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-100 leading-snug">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                        <span>Owner: <strong className="text-slate-300 font-mono">{task.owner}</strong></span>
                        {task.linkedDiagramNode && (
                          <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/60 px-1.5 rounded border border-indigo-900/60">
                            node: {task.linkedDiagramNode}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Subtask Breakdown: [BE], [FE], [MOBILE] */}
                    <div className="pt-2 border-t border-slate-900 space-y-2">
                      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                        Multi-Repo Sub-tasks ({task.subTasks?.filter((s) => s.status === 'Done').length || 0}/{task.subTasks?.length || 0} Done)
                      </div>

                      <div className="space-y-1.5">
                        {task.subTasks?.map((subtask) => {
                          const commitUrl = subtask.commitUrl || (subtask.commitHash ? `${subtask.repoUrl}/commit/${subtask.commitHash}` : null);

                          return (
                            <div
                              key={subtask.id}
                              className="p-2 bg-slate-900/90 rounded border border-slate-800/70 hover:border-slate-700/80 transition"
                            >
                              <div className="flex items-start justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border font-semibold ${getRepoBadgeColor(
                                      subtask.platform
                                    )}`}
                                  >
                                    [{subtask.platform}]
                                  </span>
                                  <span className="text-[11px] text-slate-200 font-medium leading-tight">
                                    {subtask.title}
                                  </span>
                                </div>

                                {/* Click to toggle subtask status */}
                                <button
                                  onClick={() =>
                                    onSubtaskStatusChange(
                                      task.id,
                                      subtask.id,
                                      nextStatusMap[subtask.status] || 'Done'
                                    )
                                  }
                                  title={`Status: ${subtask.status}. Click to cycle.`}
                                  className={`shrink-0 p-1 rounded hover:bg-slate-800 transition ${
                                    subtask.status === 'Done'
                                      ? 'text-emerald-400'
                                      : subtask.status === 'InProgress'
                                      ? 'text-amber-400'
                                      : subtask.status === 'InReview'
                                      ? 'text-indigo-400'
                                      : subtask.status === 'Blocked'
                                      ? 'text-rose-400'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  {subtask.status === 'Done' ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  ) : subtask.status === 'InProgress' ? (
                                    <PlayCircle className="w-3.5 h-3.5" />
                                  ) : subtask.status === 'InReview' ? (
                                    <Eye className="w-3.5 h-3.5" />
                                  ) : subtask.status === 'Blocked' ? (
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  ) : (
                                    <Clock className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>

                              {/* Assignee & Git Commit Link */}
                              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-slate-950/60 font-mono">
                                <span>{subtask.completedBy || 'Unassigned'}</span>

                                {commitUrl ? (
                                  <a
                                    href={commitUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline transition"
                                  >
                                    <GitCommit className="w-3 h-3" />
                                    <span>{subtask.commitHash}</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <span className="text-slate-600 italic">No commit yet</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
