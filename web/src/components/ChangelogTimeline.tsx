import React, { useState, useMemo } from 'react';
import type { CommitsDiffData, CommitDiffItem, CommitChangedFile, GitHubApiStatus } from '../types/hub';
import { formatRelativeDate } from '../services/dataService';
import { CommitDiffView } from './CommitDiffView';
import {
  GitCommit,
  Calendar,
  User,
  Search,
  ChevronRight,
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface ChangelogTimelineProps {
  commitsData: CommitsDiffData;
  onOpenDocDiff?: (filePath: string, commitHash: string) => void;
  gitHubStatus?: GitHubApiStatus;
  onRefreshLive?: () => void;
  refreshing?: boolean;
}

export const ChangelogTimeline: React.FC<ChangelogTimelineProps> = ({
  commitsData,
  onOpenDocDiff,
  gitHubStatus,
  onRefreshLive,
  refreshing = false,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCommit, setSelectedCommit] = useState<CommitDiffItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<CommitChangedFile | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Lọc commit theo từ khóa
  const filteredCommits = useMemo(() => {
    if (!searchFilter.trim()) return commitsData.commits;
    const q = searchFilter.toLowerCase();
    return commitsData.commits.filter(
      (c) =>
        c.message.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.hash.toLowerCase().includes(q) ||
        c.files.some((f) => f.path.toLowerCase().includes(q))
    );
  }, [commitsData.commits, searchFilter]);

  // Nhóm commits theo ngày
  const groupedCommits = useMemo(() => {
    const groups: Record<string, CommitDiffItem[]> = {};

    for (const c of filteredCommits) {
      const dateObj = new Date(c.date);
      const dayKey = isNaN(dateObj.getTime())
        ? 'Gần đây'
        : dateObj.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });

      if (!groups[dayKey]) groups[dayKey] = [];
      groups[dayKey].push(c);
    }

    return Object.entries(groups);
  }, [filteredCommits]);

  const copyHash = (hash: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  // Nếu đang xem chi tiết diff của một file cụ thể
  if (selectedCommit && selectedFile) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-hairline">
          <button
            onClick={() => {
              setSelectedFile(null);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại danh sách thay đổi của commit {selectedCommit.hash}</span>
          </button>
          <div className="text-xs text-ink-muted font-mono">{selectedFile.path}</div>
        </div>

        <CommitDiffView
          commit={selectedCommit}
          file={selectedFile}
          filePath={selectedFile.path}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview & Filter Bar */}
      <div className="p-5 bg-paper-subtle border border-hairline rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-semibold">
              Live GitHub API Audit
            </span>
            <span className="text-xs text-ink-muted">
              {commitsData.totalCommits} commits • tkiennt/panelforge-hubs
            </span>
            {gitHubStatus && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-hairline bg-white text-stone-600">
                ● {gitHubStatus.source === 'live-api' ? 'Trực tiếp' : gitHubStatus.source === 'cached' ? 'Cache' : 'Fallback'}
              </span>
            )}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mt-1.5">
            Nhật ký kiểm toán & Thay đổi Specs
          </h2>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-2xl">
            Tất cả các lần cập nhật tài liệu, bổ sung sơ đồ Mermaid và thay đổi quy tắc nghiệp vụ từ các tác giả được nạp trực tiếp từ GitHub REST API.
          </p>
        </div>

        {/* Search & Refresh Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {onRefreshLive && (
            <button
              onClick={onRefreshLive}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-hairline rounded-md text-xs text-ink hover:border-accent transition-colors shrink-0 disabled:opacity-50"
              title="Làm mới từ GitHub API"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-accent ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          )}

          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Lọc commit, tác giả, file..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-hairline rounded-md text-xs text-ink placeholder:text-stone-400 focus:outline-none focus:border-accent"
            />
          </div>
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="space-y-8">
        {groupedCommits.length === 0 ? (
          <div className="p-10 text-center bg-white border border-hairline rounded-lg text-ink-muted text-xs">
            Không tìm thấy commit nào khớp với bộ lọc.
          </div>
        ) : (
          groupedCommits.map(([dayLabel, commits]) => (
            <div key={dayLabel} className="space-y-3">
              {/* Day Section Header */}
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-accent" />
                <span>{dayLabel}</span>
                <span className="text-[11px] font-mono text-stone-400 font-normal">
                  ({commits.length} commits)
                </span>
              </div>

              {/* Commit Cards */}
              <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-hairline">
                {commits.map((c) => {
                  return (
                    <div
                      key={c.fullHash}
                      className="bg-white border border-hairline rounded-lg p-4 space-y-3 hover:border-stone-400 transition-colors shadow-sm"
                    >
                      {/* Commit Header */}
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="space-y-1 max-w-2xl">
                          <p className="font-medium text-sm text-ink leading-snug">
                            {c.message}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-ink">
                              <User className="w-3 h-3 text-stone-400" />
                              {c.author}
                            </span>
                            <span>•</span>
                            <span title={c.date}>{formatRelativeDate(c.date)}</span>
                            <span>•</span>
                            <span className="text-stone-400">
                              {c.files.length} file tài liệu thay đổi
                            </span>
                          </div>
                        </div>

                        {/* Hash Badge, Copy & GitHub Link */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => copyHash(c.hash, e)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-paper-subtle border border-hairline text-[11px] font-mono text-ink-muted hover:text-ink hover:bg-stone-100 transition-colors"
                            title="Sao chép hash"
                          >
                            <GitCommit className="w-3 h-3 text-accent" />
                            <span>{c.hash}</span>
                            {copiedHash === c.hash ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                          <a
                            href={`https://github.com/tkiennt/panelforge-hubs/commit/${c.fullHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded bg-paper-subtle border border-hairline text-ink-muted hover:text-accent hover:bg-stone-100 transition-colors"
                            title="Xem commit trên GitHub"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      {/* Files Modified in this Commit */}
                      <div className="pt-2 border-t border-hairline">
                        <div className="text-[11px] uppercase tracking-wider font-mono text-stone-400 mb-2">
                          Các tài liệu bị ảnh hưởng:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {c.files.map((file, fIdx) => {
                            const statusColor =
                              file.status === 'A'
                                ? 'bg-diff-added text-diff-addedText border-diff-addedBorder'
                                : file.status === 'D'
                                ? 'bg-diff-removed text-diff-removedText border-diff-removedBorder'
                                : 'bg-paper-subtle text-ink border-hairline';

                            return (
                              <button
                                key={fIdx}
                                onClick={() => {
                                  if (onOpenDocDiff) {
                                    onOpenDocDiff(file.path, c.hash);
                                  } else {
                                    setSelectedCommit(c);
                                    setSelectedFile(file);
                                  }
                                }}
                                className="group flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs text-left hover:border-accent transition-colors bg-white"
                              >
                                <span
                                  className={`text-[10px] font-mono font-bold px-1 rounded border ${statusColor}`}
                                >
                                  {file.status}
                                </span>
                                <span className="font-mono text-[11px] text-stone-700 group-hover:text-accent truncate max-w-xs">
                                  {file.path}
                                </span>
                                <ChevronRight className="w-3 h-3 text-stone-400 group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
