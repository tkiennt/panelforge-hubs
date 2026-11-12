import React, { useState, useMemo } from 'react';
import type { CommitsDiffData, CommitDiffItem, GitHubApiStatus } from '../types/hub';
import { formatRelativeDate } from '../services/dataService';
import { MONITORED_REPOS, type RepoFilterId } from '../services/githubService';
import {
  GitCommit,
  Calendar,
  User,
  Search,
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
  gitHubStatus,
  onRefreshLive,
  refreshing = false,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedRepo, setSelectedRepo] = useState<RepoFilterId>('ALL');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Lọc commit theo repo, từ khóa và luôn sắp xếp từ mới nhất -> cũ nhất giống GitHub
  const filteredCommits = useMemo(() => {
    let list = [...commitsData.commits].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    if (selectedRepo !== 'ALL') {
      list = list.filter((c) => c.repoId === selectedRepo);
    }
    if (!searchFilter.trim()) return list;
    const q = searchFilter.toLowerCase();
    return list.filter(
      (c) =>
        c.message.toLowerCase().includes(q) ||
        c.author.toLowerCase().includes(q) ||
        c.hash.toLowerCase().includes(q) ||
        c.repoName?.toLowerCase().includes(q)
    );
  }, [commitsData.commits, selectedRepo, searchFilter]);

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

  return (
    <div className="space-y-6">
      {/* Overview & Filter Bar */}
      <div className="p-5 bg-paper-subtle border border-hairline rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-semibold">
              Live Multi-Repo Audit
            </span>
            <span className="text-xs text-ink-muted">
              {commitsData.totalCommits} commits trên 4 repositories
            </span>
            {gitHubStatus && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-hairline bg-white text-stone-600">
                ● {gitHubStatus.source === 'live-api' ? 'GitHub API trực tiếp' : gitHubStatus.source === 'cached' ? 'Cache' : 'Fallback'}
              </span>
            )}
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mt-1.5">
            Nhật ký kiểm toán & Commit Đa Repository (FE, BE, Mobile, Hub)
          </h2>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-2xl">
            Tập trung dòng commit thời gian thực từ toàn bộ 4 kho mã nguồn (Backend .NET 9, Frontend React 19, Mobile Flutter và Hub Docs) để kiểm soát tiến độ triển khai đồng bộ.
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

      {/* Multi-Repo Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-1 text-xs">
        <span className="text-stone-500 font-mono text-[11px] uppercase mr-1">Kho mã nguồn:</span>
        <button
          onClick={() => setSelectedRepo('ALL')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors border ${
            selectedRepo === 'ALL'
              ? 'bg-ink text-paper border-ink font-semibold shadow-sm'
              : 'bg-white text-stone-700 border-[#E5E2DC] hover:border-stone-400'
          }`}
        >
          <span>Tất cả (4 Repos)</span>
          <span className="text-[10px] opacity-75 font-mono">({commitsData.totalCommits})</span>
        </button>

        {MONITORED_REPOS.map((repo) => {
          const count = commitsData.commits.filter((c) => c.repoId === repo.id).length;
          const isSelected = selectedRepo === repo.id;

          return (
            <button
              key={repo.id}
              onClick={() => setSelectedRepo(repo.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors border ${
                isSelected
                  ? 'bg-ink text-paper border-ink font-semibold shadow-sm'
                  : 'bg-white text-stone-700 border-[#E5E2DC] hover:border-stone-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-accent' : 'bg-stone-400'}`} />
              <span>{repo.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({count})</span>
            </button>
          );
        })}
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
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="flex items-center gap-2 flex-wrap">
                            {c.repoId && (
                              <span
                                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold ${
                                  c.repoId === 'BE'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : c.repoId === 'FE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : c.repoId === 'MOBILE'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                                }`}
                              >
                                {c.repoName || c.repoId}
                              </span>
                            )}
                            <p className="font-medium text-sm text-ink leading-snug">
                              {c.message}
                            </p>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-ink-muted flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-ink">
                              <User className="w-3 h-3 text-stone-400" />
                              {c.author}
                            </span>
                            <span>•</span>
                            <span title={c.date}>{formatRelativeDate(c.date)}</span>
                          </div>
                        </div>

                        {/* Hash Badge, Copy & Direct GitHub Commit Link */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => copyHash(c.hash, e)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-paper-subtle border border-hairline text-[11px] font-mono text-ink-muted hover:text-ink hover:bg-stone-100 transition-colors"
                            title="Sao chép mã commit"
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
                            href={
                              c.repoOwner && c.repoSlug
                                ? `https://github.com/${c.repoOwner}/${c.repoSlug}/commit/${c.fullHash}`
                                : `https://github.com/tkiennt/panelforge-hubs/commit/${c.fullHash}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white border border-hairline text-[11px] font-medium text-ink hover:text-accent hover:border-accent transition-colors"
                            title="Mở commit này trên GitHub"
                          >
                            <span>Xem commit</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
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
