import React, { useState } from 'react';
import type { HubTask, SubTask, TaskStatus, PlatformType, CoreFlowId } from '../types/hub';
import { ExternalLink, CheckCircle2, Clock, PlayCircle, Eye, GitCommit, ChevronDown, ChevronRight, Check, AlertCircle } from 'lucide-react';

interface TaskListViewProps {
  tasks: HubTask[];
  onSubtaskStatusChange: (taskId: string, subtaskId: string, newStatus: TaskStatus) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onSubtaskStatusChange,
}) => {
  const [collapsedFlows, setCollapsedFlows] = useState<Record<string, boolean>>({});

  const toggleFlowCollapse = (flowId: string) => {
    setCollapsedFlows((prev) => ({ ...prev, [flowId]: !prev[flowId] }));
  };

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

  const flowGroups: CoreFlowId[] = ['CF1', 'CF2', 'CF3', 'CF4', 'CF5'];

  return (
    <div className="space-y-6">
      {flowGroups.map((flowId) => {
        const flowTasks = tasks.filter((t) => t.coreFlow === flowId);
        if (flowTasks.length === 0) return null;

        const totalSubtasks = flowTasks.reduce((sum, t) => sum + (t.subTasks?.length || 0), 0);
        const doneSubtasks = flowTasks.reduce(
          (sum, t) => sum + (t.subTasks?.filter((st) => st.status === 'Done').length || 0),
          0
        );
        const percent = totalSubtasks > 0 ? Math.round((doneSubtasks / totalSubtasks) * 100) : 0;
        const isCollapsed = Boolean(collapsedFlows[flowId]);

        return (
          <div
            key={flowId}
            className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md"
          >
            {/* Flow Header */}
            <div
              onClick={() => toggleFlowCollapse(flowId)}
              className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-slate-800/80 cursor-pointer hover:bg-slate-950 transition"
            >
              <div className="flex items-center gap-3">
                <button className="text-slate-400 hover:text-slate-200">
                  {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-700/60">
                    {flowId}
                  </span>
                  <h3 className="font-semibold text-slate-100 text-sm sm:text-base">
                    Core Flow: {flowId} Implementation Matrix
                  </h3>
                </div>
              </div>

              {/* Progress Bar & Counter */}
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-28 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-semibold">{percent}%</span>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {doneSubtasks}/{totalSubtasks} Sub-tasks Done
                </span>
              </div>
            </div>

            {/* Flow Task Content */}
            {!isCollapsed && (
              <div className="divide-y divide-slate-800/80">
                {flowTasks.map((task) => (
                  <div key={task.id} className="p-4 hover:bg-slate-950/30 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-indigo-400">{task.id}</span>
                        <h4 className="text-sm font-semibold text-slate-200">{task.title}</h4>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                            task.priority === 'P0'
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60'
                              : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-xs text-slate-400">Owner: {task.owner}</span>
                      </div>

                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 self-start md:self-auto ${
                          task.status === 'Done'
                            ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                            : task.status === 'InProgress'
                            ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                            : task.status === 'InReview'
                            ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/60'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {task.status === 'Done' && <Check className="w-3.5 h-3.5" />}
                        {task.status}
                      </span>
                    </div>

                    {/* Sub-task Breakdown Table */}
                    <div className="bg-slate-950/60 rounded-lg border border-slate-800/70 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-900/60">
                            <th className="py-2 px-3">Repo</th>
                            <th className="py-2 px-3">Sub-task ID & Title</th>
                            <th className="py-2 px-3">Completed By</th>
                            <th className="py-2 px-3">Status</th>
                            <th className="py-2 px-3">Completed At</th>
                            <th className="py-2 px-3">Git Commit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40">
                          {task.subTasks?.map((st: SubTask) => {
                            const commitUrl = st.commitUrl || (st.commitHash ? `${st.repoUrl}/commit/${st.commitHash}` : null);

                            return (
                              <tr key={st.id} className="hover:bg-slate-900/40 transition">
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <span
                                    className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getRepoBadgeColor(
                                      st.platform
                                    )}`}
                                  >
                                    [{st.platform}]
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-semibold text-slate-200">{st.title}</div>
                                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                    ID: {st.id}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap text-slate-300 font-mono">
                                  {st.completedBy || '—'}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  <button
                                    onClick={() =>
                                      onSubtaskStatusChange(task.id, st.id, nextStatusMap[st.status] || 'Done')
                                    }
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                                      st.status === 'Done'
                                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/50'
                                        : st.status === 'InProgress'
                                        ? 'bg-amber-950/60 text-amber-300 border-amber-700/60 hover:bg-amber-900/50'
                                        : st.status === 'InReview'
                                        ? 'bg-indigo-950/60 text-indigo-300 border-indigo-700/60 hover:bg-indigo-900/50'
                                        : st.status === 'Blocked'
                                        ? 'bg-rose-950/60 text-rose-300 border-rose-700/60 hover:bg-rose-900/50'
                                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                                    }`}
                                    title="Click to cycle status"
                                  >
                                    {st.status === 'Done' ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : st.status === 'InProgress' ? (
                                      <PlayCircle className="w-3 h-3" />
                                    ) : st.status === 'InReview' ? (
                                      <Eye className="w-3 h-3" />
                                    ) : st.status === 'Blocked' ? (
                                      <AlertCircle className="w-3 h-3" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    <span>{st.status}</span>
                                  </button>
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                                  {st.completedAt
                                    ? new Date(st.completedAt).toLocaleDateString('vi-VN', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : '—'}
                                </td>
                                <td className="py-2.5 px-3 whitespace-nowrap">
                                  {commitUrl ? (
                                    <a
                                      href={commitUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 hover:underline font-mono text-[11px]"
                                    >
                                      <GitCommit className="w-3.5 h-3.5" />
                                      <span>{st.commitHash}</span>
                                      <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                  ) : (
                                    <span className="text-slate-600 font-mono text-[11px]">Pending</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
