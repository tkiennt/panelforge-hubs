import React, { useState } from 'react';
import type { FlowDiagram } from '../types/hub';
import { MermaidDiagram } from './MermaidDiagram';
import { GitCompare, Sparkles, FileCode2, ExternalLink } from 'lucide-react';

interface DiagramDiffViewerProps {
  entity: FlowDiagram;
}

export const DiagramDiffViewer: React.FC<DiagramDiffViewerProps> = ({ entity }) => {
  const revisions = entity.revisions || [];
  const [leftIndex, setLeftIndex] = useState<number>(0);
  const [rightIndex, setRightIndex] = useState<number>(Math.max(0, revisions.length - 1));
  const [showCodeDiff, setShowCodeDiff] = useState<boolean>(false);

  const leftRev = revisions[leftIndex] || revisions[0];
  const rightRev = revisions[rightIndex] || revisions[revisions.length - 1];

  // Calculate line diff for mermaidCode
  const getLineDiff = () => {
    const leftLines = (leftRev?.mermaidCode || '').split('\n');
    const rightLines = (rightRev?.mermaidCode || '').split('\n');
    const diffs: { type: 'added' | 'removed' | 'same'; text: string }[] = [];

    const leftSet = new Set(leftLines.map((l) => l.trim()));
    const rightSet = new Set(rightLines.map((l) => l.trim()));

    leftLines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !rightSet.has(trimmed)) {
        diffs.push({ type: 'removed', text: line });
      }
    });

    rightLines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !leftSet.has(trimmed)) {
        diffs.push({ type: 'added', text: line });
      } else if (trimmed && leftSet.has(trimmed)) {
        diffs.push({ type: 'same', text: line });
      }
    });

    return diffs;
  };

  const lineDiffs = getLineDiff();

  return (
    <div className="space-y-6">
      {/* Diff Controls & Revision Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-100 text-lg">Architecture Version Diff</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 font-mono">
                  {entity.id}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comparing architecture revisions, state transition contracts, and security gates.
              </p>
            </div>
          </div>

          {/* Selectors for comparison */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-xs text-rose-400 font-medium">Base (Older):</span>
              <select
                value={leftIndex}
                onChange={(e) => setLeftIndex(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
              >
                {revisions.map((rev, idx) => (
                  <option key={rev.version} value={idx}>
                    v{rev.version} - {rev.changelog.slice(0, 24)}...
                  </option>
                ))}
              </select>
            </div>

            <span className="text-slate-600 font-mono">➔</span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-400 font-medium">Target (Newer):</span>
              <select
                value={rightIndex}
                onChange={(e) => setRightIndex(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-md px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
              >
                {revisions.map((rev, idx) => (
                  <option key={rev.version} value={idx}>
                    v{rev.version} - {rev.changelog.slice(0, 24)}...
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowCodeDiff(!showCodeDiff)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition ml-auto ${
                showCodeDiff
                  ? 'bg-indigo-600 border-indigo-500 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5" />
              <span>{showCodeDiff ? 'Hide Syntax Diff' : 'Mermaid Syntax Diff'}</span>
            </button>
          </div>
        </div>

        {/* Transition Changes Banner / Summary */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-950/50 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Base: v{leftRev?.version} ({leftRev?.updatedAt ? new Date(leftRev.updatedAt).toLocaleDateString() : ''})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{leftRev?.updatedBy}</span>
            </div>
            <p className="text-xs text-slate-300 font-medium">{leftRev?.changelog}</p>
            {leftRev?.commitUrl && (
              <a
                href={leftRev.commitUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:underline mt-2 font-mono"
              >
                <span>Commit: {leftRev.commitHash}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>

          <div className="p-3.5 bg-slate-950/50 rounded-lg border border-emerald-950/60 bg-emerald-950/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Target: v{rightRev?.version} ({rightRev?.updatedAt ? new Date(rightRev.updatedAt).toLocaleDateString() : ''})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{rightRev?.updatedBy}</span>
            </div>
            <p className="text-xs text-slate-200 font-medium">{rightRev?.changelog}</p>
            {rightRev?.commitUrl && (
              <a
                href={rightRev.commitUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline mt-2 font-mono"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Commit: {rightRev.commitHash}</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Syntax Diff Viewer */}
      {showCodeDiff && (
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto shadow-inner">
          <div className="text-slate-400 text-[11px] mb-2 font-sans font-medium flex items-center justify-between">
            <span>Mermaid Syntax Differential (v{leftRev?.version} vs v{rightRev?.version})</span>
            <span className="text-slate-500">Green = added, Red = removed</span>
          </div>
          <div className="space-y-0.5">
            {lineDiffs.map((diff, idx) => (
              <div
                key={idx}
                className={`px-2 py-1 rounded flex items-center gap-2 ${
                  diff.type === 'added'
                    ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500'
                    : diff.type === 'removed'
                    ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 line-through opacity-70'
                    : 'text-slate-400'
                }`}
              >
                <span className="w-4 select-none text-[10px] text-slate-600">
                  {diff.type === 'added' ? '+' : diff.type === 'removed' ? '-' : ' '}
                </span>
                <span>{diff.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Diagram Visual Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Revision v{leftRev?.version}
            </span>
            <span className="text-xs text-slate-400">{leftRev?.changelog}</span>
          </div>
          <MermaidDiagram
            code={leftRev?.mermaidCode || ''}
            title={`${entity.title} (v${leftRev?.version})`}
            className="border-rose-950/50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Revision v{rightRev?.version} (Current Target)
            </span>
            <span className="text-xs text-slate-400">{rightRev?.changelog}</span>
          </div>
          <MermaidDiagram
            code={rightRev?.mermaidCode || ''}
            title={`${entity.title} (v${rightRev?.version})`}
            className="border-emerald-950/50"
          />
        </div>
      </div>
    </div>
  );
};
