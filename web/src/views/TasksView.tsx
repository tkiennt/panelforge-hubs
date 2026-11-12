import React, { useState } from 'react';
import type { HubTask, TaskStatus, CoreFlowId } from '../types/hub';
import { TaskKanbanBoard } from '../components/TaskKanbanBoard';
import { TaskListView } from '../components/TaskListView';
import { Kanban, List, Filter, Search } from 'lucide-react';

interface TasksViewProps {
  tasks: HubTask[];
  onSubtaskStatusChange: (taskId: string, subtaskId: string, newStatus: TaskStatus) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onSubtaskStatusChange,
}) => {
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedFlow, setSelectedFlow] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedRepo, setSelectedRepo] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTasks = tasks.filter((task) => {
    if (selectedFlow !== 'ALL' && task.coreFlow !== selectedFlow) return false;
    if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) return false;
    if (selectedStatus !== 'ALL' && task.status !== selectedStatus) return false;
    if (selectedRepo !== 'ALL') {
      const hasRepoSubtask = task.subTasks?.some((st) => st.platform === selectedRepo);
      if (!hasRepoSubtask) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchOwner = task.owner.toLowerCase().includes(q);
      const matchSub = task.subTasks?.some(
        (st) =>
          st.title.toLowerCase().includes(q) ||
          (st.completedBy && st.completedBy.toLowerCase().includes(q)) ||
          (st.commitHash && st.commitHash.toLowerCase().includes(q)) ||
          st.id.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchOwner && !matchSub) return false;
    }
    return true;
  });

  const flows: CoreFlowId[] = ['CF1', 'CF2', 'CF3', 'CF4', 'CF5'];

  return (
    <div className="space-y-6">
      {/* View Header & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-400" />
              Multi-Repo Task & Sub-task Board
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tasks broken down into [BE], [FE], and [MOBILE] sub-tasks with real Git commit linkage.
            </p>
          </div>

          {/* Kanban / List Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 self-start lg:self-auto">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Grouped List View</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks, subtasks or commits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Flow filter */}
          <select
            value={selectedFlow}
            onChange={(e) => setSelectedFlow(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Core Flows (CF1–CF5)</option>
            {flows.map((f) => (
              <option key={f} value={f}>
                {f} - Flow
              </option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="P0">P0 - Critical</option>
            <option value="P1">P1 - High</option>
            <option value="P2">P2 - Normal</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Task Statuses</option>
            <option value="Todo">To Do</option>
            <option value="InProgress">In Progress</option>
            <option value="InReview">In Review & Gate</option>
            <option value="Done">Completed (Done)</option>
          </select>

          {/* Repo filter */}
          <select
            value={selectedRepo}
            onChange={(e) => setSelectedRepo(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Repositories</option>
            <option value="BE">BE (.NET 9)</option>
            <option value="FE">FE (React 19)</option>
            <option value="MOBILE">MOBILE (Flutter)</option>
          </select>
        </div>
      </div>

      {/* Task Content: Kanban or List */}
      {viewMode === 'kanban' ? (
        <TaskKanbanBoard
          tasks={filteredTasks}
          onSubtaskStatusChange={onSubtaskStatusChange}
        />
      ) : (
        <TaskListView
          tasks={filteredTasks}
          onSubtaskStatusChange={onSubtaskStatusChange}
        />
      )}
    </div>
  );
};
