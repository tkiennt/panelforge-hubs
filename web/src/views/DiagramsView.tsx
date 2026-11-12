import React, { useState } from 'react';
import type { FlowDiagram } from '../types/hub';
import { MermaidDiagram } from '../components/MermaidDiagram';
import { DiagramDiffViewer } from '../components/DiagramDiffViewer';
import { GitCompare, Sparkles, Layers, Activity, Calendar, UserCheck } from 'lucide-react';

interface DiagramsViewProps {
  diagrams: FlowDiagram[];
}

export const DiagramsView: React.FC<DiagramsViewProps> = ({ diagrams }) => {
  const [selectedId, setSelectedId] = useState<string>(diagrams[0]?.id || 'CF1');
  const [diffMode, setDiffMode] = useState<boolean>(true);
  const [singleVersionIdx, setSingleVersionIdx] = useState<number>(0);

  const selectedEntity = diagrams.find((d) => d.id === selectedId) || diagrams[0];

  const coreFlowDiagrams = diagrams.filter((d) => d.id.startsWith('CF'));
  const stateMachineDiagrams = diagrams.filter((d) => !d.id.startsWith('CF'));

  const currentRevision =
    selectedEntity?.revisions[singleVersionIdx] ||
    selectedEntity?.revisions[selectedEntity.revisions.length - 1];

  if (!selectedEntity) {
    return (
      <div className="p-8 text-center text-slate-500 text-sm">
        No diagrams available to display.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category & Diagram Selection Pills */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Interactive State Diagram & Core Flow Viewer
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any Core Flow (CF1–CF5) or State Machine to inspect architectural contracts and version diffs.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800 self-start lg:self-auto">
            <button
              onClick={() => setDiffMode(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                diffMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Version Diff Mode</span>
            </button>
            <button
              onClick={() => setDiffMode(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                !diffMode
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Single Diagram View</span>
            </button>
          </div>
        </div>

        {/* Diagram Pills Selection */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          {/* Core Flows (CF1-CF5) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold shrink-0">
              Core Flows:
            </span>
            {coreFlowDiagrams.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedId(d.id);
                  setSingleVersionIdx(d.revisions.length - 1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition ${
                  selectedId === d.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {d.id}
              </button>
            ))}
          </div>

          {/* State Machines */}
          {stateMachineDiagrams.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold shrink-0">
                State Machines:
              </span>
              {stateMachineDiagrams.map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setSelectedId(d.id);
                    setSingleVersionIdx(d.revisions.length - 1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                    selectedId === d.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  {d.title.replace(' State Machine', '').replace(' Lifecycle', '')}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Entity Title & Metadata */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold text-slate-100">{selectedEntity.title}</h3>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold">
              Current: v{selectedEntity.currentVersion}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {currentRevision?.updatedAt ? new Date(currentRevision.updatedAt).toLocaleDateString() : 'N/A'}
            </span>
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-slate-500" />
              {currentRevision?.updatedBy || 'N/A'}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Flow: <span className="text-indigo-400 font-mono">{selectedEntity.coreFlow}</span> • Active Diagram Version v{selectedEntity.currentVersion}
        </p>
      </div>

      {/* Main View Area: Diff Mode or Single Diagram */}
      {diffMode ? (
        <DiagramDiffViewer entity={selectedEntity} />
      ) : (
        <div className="space-y-4">
          {/* Version dropdown for single view */}
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl">
            <span className="text-xs text-slate-300 font-medium">Viewing Revision:</span>
            <div className="flex items-center gap-2">
              <select
                value={singleVersionIdx}
                onChange={(e) => setSingleVersionIdx(Number(e.target.value))}
                className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                {selectedEntity.revisions.map((rev, idx) => (
                  <option key={rev.version} value={idx}>
                    v{rev.version} - {rev.changelog} ({rev.updatedAt ? new Date(rev.updatedAt).toLocaleDateString() : ''})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Render Single Mermaid Canvas */}
          <MermaidDiagram
            code={currentRevision?.mermaidCode || ''}
            title={`${selectedEntity.title} (v${currentRevision?.version})`}
          />

          {/* Changelog for this revision */}
          {currentRevision?.changelog && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-slate-200 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Revision Changelog:
              </h4>
              <p className="text-xs text-slate-300">{currentRevision.changelog}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
