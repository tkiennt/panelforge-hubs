import React, { useState, useMemo } from 'react';
import type { CommitDiffItem, CommitChangedFile, DiffViewMode } from '../types/hub';
import { MermaidRenderer } from './MermaidRenderer';
import { GitCommit, Split, AlignJustify, Eye, Filter, FileText } from 'lucide-react';

interface CommitDiffViewProps {
  commit?: CommitDiffItem | null;
  file?: CommitChangedFile | null;
  filePath?: string;
  onSelectCommit?: (hash: string) => void;
}

interface ParsedDiffLine {
  type: 'context' | 'added' | 'removed' | 'header';
  oldLineNumber?: number;
  newLineNumber?: number;
  text: string;
}

interface ParsedHunk {
  header: string;
  lines: ParsedDiffLine[];
}

export const CommitDiffView: React.FC<CommitDiffViewProps> = ({
  commit,
  file,
  filePath,
}) => {
  const [viewMode, setViewMode] = useState<DiffViewMode>('split');
  const [hideUnchanged, setHideUnchanged] = useState<boolean>(false);

  // Phân tích patch git sang hunks và lines
  const parsedData = useMemo(() => {
    if (!file?.patch) {
      return { hunks: [], oldMermaid: '', newMermaid: '', hasMermaidChange: false };
    }

    const lines = file.patch.split('\n');
    const hunks: ParsedHunk[] = [];
    let currentHunk: ParsedHunk | null = null;
    let oldLine = 0;
    let newLine = 0;

    const oldMermaidLines: string[] = [];
    const newMermaidLines: string[] = [];
    let inOldMermaid = false;
    let inNewMermaid = false;

    for (const rawLine of lines) {
      // Hunk header: @@ -10,6 +10,8 @@
      if (rawLine.startsWith('@@')) {
        const match = rawLine.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        if (match) {
          oldLine = parseInt(match[1], 10);
          newLine = parseInt(match[2], 10);
        }
        currentHunk = { header: rawLine, lines: [] };
        hunks.push(currentHunk);
        continue;
      }

      if (!currentHunk) {
        currentHunk = { header: '@@ Khởi tạo @@', lines: [] };
        hunks.push(currentHunk);
      }

      if (rawLine.startsWith('+') && !rawLine.startsWith('+++')) {
        const text = rawLine.substring(1);
        currentHunk.lines.push({
          type: 'added',
          newLineNumber: newLine++,
          text,
        });

        // Mermaid detection
        if (text.includes('```mermaid')) inNewMermaid = true;
        else if (inNewMermaid && text.includes('```')) inNewMermaid = false;
        else if (inNewMermaid) newMermaidLines.push(text);
      } else if (rawLine.startsWith('-') && !rawLine.startsWith('---')) {
        const text = rawLine.substring(1);
        currentHunk.lines.push({
          type: 'removed',
          oldLineNumber: oldLine++,
          text,
        });

        // Mermaid detection
        if (text.includes('```mermaid')) inOldMermaid = true;
        else if (inOldMermaid && text.includes('```')) inOldMermaid = false;
        else if (inOldMermaid) oldMermaidLines.push(text);
      } else {
        const text = rawLine.startsWith(' ') ? rawLine.substring(1) : rawLine;
        currentHunk.lines.push({
          type: 'context',
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
          text,
        });
      }
    }

    const oldMermaid = oldMermaidLines.join('\n').trim();
    const newMermaid = newMermaidLines.join('\n').trim();
    const hasMermaidChange = (oldMermaid.length > 0 || newMermaid.length > 0) && oldMermaid !== newMermaid;

    return { hunks, oldMermaid, newMermaid, hasMermaidChange };
  }, [file?.patch]);

  if (!file) {
    return (
      <div className="p-8 text-center bg-paper-subtle border border-hairline rounded-lg text-ink-muted">
        <FileText className="w-8 h-8 mx-auto mb-2 text-stone-400 stroke-[1.5]" />
        <p className="font-serif text-base text-ink font-medium">Chưa có dữ liệu so sánh diff</p>
        <p className="text-xs text-ink-muted mt-1 max-w-sm mx-auto">
          File này chưa có commit nào được chọn hoặc không có thay đổi trong commit gần nhất. Hãy chọn một commit từ thanh bên phải.
        </p>
      </div>
    );
  }

  // Thống kê số dòng thêm/bớt
  let addedCount = 0;
  let removedCount = 0;
  parsedData.hunks.forEach((h) => {
    h.lines.forEach((l) => {
      if (l.type === 'added') addedCount++;
      if (l.type === 'removed') removedCount++;
    });
  });

  return (
    <div className="space-y-6">
      {/* Diff Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-paper-subtle border border-hairline rounded-lg text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-ink">
            <GitCommit className="w-3.5 h-3.5 text-accent" />
            <span className="font-semibold">{commit?.hash || 'Commit'}</span>
            <span className="text-ink-muted hidden sm:inline">({file.path || filePath})</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="px-1.5 py-0.5 rounded bg-diff-added text-diff-addedText border border-diff-addedBorder font-semibold">
              +{addedCount}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-diff-removed text-diff-removedText border border-diff-removedBorder font-semibold">
              -{removedCount}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Hide Unchanged Lines */}
          <button
            onClick={() => setHideUnchanged(!hideUnchanged)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors ${
              hideUnchanged
                ? 'bg-accent/10 border-accent text-accent'
                : 'bg-white border-hairline text-ink-muted hover:text-ink'
            }`}
            title="Ẩn bớt các dòng không thay đổi để xem tập trung"
          >
            <Filter className="w-3 h-3" />
            <span>{hideUnchanged ? 'Hiện đủ ngữ cảnh' : 'Chỉ hiện thay đổi'}</span>
          </button>

          {/* Toggle Split vs Unified */}
          <div className="flex items-center bg-white border border-hairline rounded-md p-0.5">
            <button
              onClick={() => setViewMode('split')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'split' ? 'bg-stone-200 text-ink font-semibold' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Split className="w-3 h-3" />
              <span className="hidden sm:inline">Chia đôi (Split)</span>
            </button>
            <button
              onClick={() => setViewMode('unified')}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'unified' ? 'bg-stone-200 text-ink font-semibold' : 'text-ink-muted hover:text-ink'
              }`}
            >
              <AlignJustify className="w-3 h-3" />
              <span className="hidden sm:inline">Thống nhất (Unified)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Commit Info Banner */}
      {commit && (
        <div className="p-3 bg-white border border-hairline rounded-lg text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink">{commit.message}</span>
            <span className="text-ink-muted font-mono">{commit.date}</span>
          </div>
          <div className="flex items-center gap-2 text-ink-muted">
            <span>Tác giả: <strong className="text-ink">{commit.author}</strong></span>
            <span>•</span>
            <span className="font-mono">{commit.fullHash.substring(0, 8)}</span>
          </div>
        </div>
      )}

      {/* Smart Mermaid Diff (Side by side rendering) */}
      {parsedData.hasMermaidChange && (
        <div className="border border-accent/30 rounded-lg p-4 bg-orange-50/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-wider">
              <Eye className="w-4 h-4" />
              <span>Phát hiện thay đổi Sơ đồ Mermaid (Smart Diagram Diff)</span>
            </div>
            <span className="text-[11px] text-ink-muted">So sánh trực quan trước vs sau commit</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-stone-600 px-1">
                <span>🔴 Bản trước commit (Old Diagram)</span>
              </div>
              <div className="border border-diff-removedBorder rounded-md overflow-hidden bg-diff-removed/10">
                <MermaidRenderer code={parsedData.oldMermaid} idPrefix="old-diagram" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium text-stone-600 px-1">
                <span>🟢 Bản sau commit (New Diagram)</span>
              </div>
              <div className="border border-diff-addedBorder rounded-md overflow-hidden bg-diff-added/10">
                <MermaidRenderer code={parsedData.newMermaid} idPrefix="new-diagram" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Code Diff Display */}
      <div className="border border-hairline rounded-lg overflow-hidden bg-white shadow-sm font-mono text-[12px]">
        {/* Table of diff */}
        {viewMode === 'unified' ? (
          <div className="overflow-x-auto divide-y divide-hairline">
            {parsedData.hunks.map((hunk, hIdx) => {
              const displayLines = hideUnchanged
                ? hunk.lines.filter((l) => l.type !== 'context')
                : hunk.lines;

              return (
                <div key={hIdx}>
                  <div className="px-3 py-1 bg-stone-100 text-stone-500 text-[11px] font-semibold border-b border-hairline">
                    {hunk.header}
                  </div>
                  {displayLines.map((line, lIdx) => {
                    const isAdded = line.type === 'added';
                    const isRemoved = line.type === 'removed';

                    return (
                      <div
                        key={lIdx}
                        className={`flex items-start transition-colors ${
                          isAdded
                            ? 'bg-diff-added text-diff-addedText'
                            : isRemoved
                            ? 'bg-diff-removed text-diff-removedText'
                            : 'text-ink hover:bg-stone-50'
                        }`}
                      >
                        {/* Old line number */}
                        <div className="w-12 py-0.5 px-2 text-right text-stone-400 select-none border-r border-hairline text-[11px] shrink-0">
                          {line.oldLineNumber || ''}
                        </div>
                        {/* New line number */}
                        <div className="w-12 py-0.5 px-2 text-right text-stone-400 select-none border-r border-hairline text-[11px] shrink-0">
                          {line.newLineNumber || ''}
                        </div>
                        {/* Prefix marker */}
                        <div className="w-6 py-0.5 text-center font-bold select-none shrink-0">
                          {isAdded ? '+' : isRemoved ? '-' : ' '}
                        </div>
                        {/* Line content */}
                        <div className="py-0.5 px-2 whitespace-pre-wrap break-all flex-1">
                          {line.text}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          /* Split View */
          <div className="overflow-x-auto">
            {parsedData.hunks.map((hunk, hIdx) => {
              // Ghép các dòng removed và added tương ứng theo hàng
              const rows: Array<{
                left?: ParsedDiffLine;
                right?: ParsedDiffLine;
              }> = [];

              const removedLines = hunk.lines.filter((l) => l.type === 'removed');
              const addedLines = hunk.lines.filter((l) => l.type === 'added');

              if (hideUnchanged) {
                const maxDiff = Math.max(removedLines.length, addedLines.length);
                for (let i = 0; i < maxDiff; i++) {
                  rows.push({
                    left: removedLines[i],
                    right: addedLines[i],
                  });
                }
              } else {
                let rIdx = 0;
                let aIdx = 0;
                let cIdx = 0;

                for (const line of hunk.lines) {
                  if (line.type === 'context') {
                    rows.push({ left: line, right: line });
                    cIdx++;
                  } else if (line.type === 'removed') {
                    rows.push({ left: line });
                    rIdx++;
                  } else if (line.type === 'added') {
                    // Cố gắng ghép với hàng trước nếu hàng trước chỉ có left
                    const lastRow = rows[rows.length - 1];
                    if (lastRow && lastRow.left && lastRow.left.type === 'removed' && !lastRow.right) {
                      lastRow.right = line;
                    } else {
                      rows.push({ right: line });
                    }
                    aIdx++;
                  }
                }
              }

              return (
                <div key={hIdx} className="border-b border-hairline last:border-b-0">
                  <div className="px-3 py-1 bg-stone-100 text-stone-500 text-[11px] font-semibold border-b border-hairline">
                    {hunk.header}
                  </div>
                  <div className="divide-y divide-hairline">
                    {rows.map((row, rIdx) => (
                      <div key={rIdx} className="grid grid-cols-2 text-[11.5px]">
                        {/* Left Column (Old) */}
                        <div
                          className={`flex items-start border-r border-hairline ${
                            row.left?.type === 'removed'
                              ? 'bg-diff-removed text-diff-removedText'
                              : row.left
                              ? 'text-ink'
                              : 'bg-stone-50/50'
                          }`}
                        >
                          <div className="w-10 py-0.5 px-1.5 text-right text-stone-400 select-none border-r border-hairline text-[10.5px] shrink-0">
                            {row.left?.oldLineNumber || ''}
                          </div>
                          <div className="w-5 py-0.5 text-center font-bold select-none shrink-0 text-red-700">
                            {row.left?.type === 'removed' ? '-' : ''}
                          </div>
                          <div className="py-0.5 px-2 whitespace-pre-wrap break-all flex-1 min-h-[1.5rem]">
                            {row.left?.text || ''}
                          </div>
                        </div>

                        {/* Right Column (New) */}
                        <div
                          className={`flex items-start ${
                            row.right?.type === 'added'
                              ? 'bg-diff-added text-diff-addedText'
                              : row.right
                              ? 'text-ink'
                              : 'bg-stone-50/50'
                          }`}
                        >
                          <div className="w-10 py-0.5 px-1.5 text-right text-stone-400 select-none border-r border-hairline text-[10.5px] shrink-0">
                            {row.right?.newLineNumber || ''}
                          </div>
                          <div className="w-5 py-0.5 text-center font-bold select-none shrink-0 text-green-700">
                            {row.right?.type === 'added' ? '+' : ''}
                          </div>
                          <div className="py-0.5 px-2 whitespace-pre-wrap break-all flex-1 min-h-[1.5rem]">
                            {row.right?.text || ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-muted px-1">
        <span>💡 Nhấn <strong>Chỉ hiện thay đổi</strong> để lọc bớt context lines giữ nguyên.</span>
        <span>Phông chữ JetBrains Mono 12px • Chuẩn Editorial Paper</span>
      </div>
    </div>
  );
};
