import React, { useEffect, useState, useMemo, useCallback } from 'react';
import type {
  DocsManifestData,
  CommitsDiffData,
  DocItem,
  ActiveMode,
  GitHubApiStatus,
} from './types/hub';
import {
  fetchDocsManifest,
  fetchCommitsDiffWithStatus,
  renderMarkdown,
  getUnreadDocs,
  saveLastSeenCommitHash,
  formatRelativeDate,
} from './services/dataService';
import { MermaidRenderer } from './components/MermaidRenderer';
import { CommitDiffView } from './components/CommitDiffView';
import { SearchModal } from './components/SearchModal';
import { ChangelogTimeline } from './components/ChangelogTimeline';
import { GitHubTokenModal } from './components/GitHubTokenModal';
import { MermaidGalleryView } from './views/MermaidGalleryView';
import { QuickAccessBar } from './components/QuickAccessBar';
import {
  BookOpen,
  GitCommit,
  Layers,
  Search,
  ChevronRight,
  Github,
  Clock,
  User,
  Copy,
  Check,
  Split,
  RefreshCw,
  Folder,
  Menu,
  X,
  Key,
  Link as LinkIcon,
  History,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface ContentSegment {
  type: 'markdown' | 'mermaid';
  content: string;
}

// Hàm chia nhỏ Markdown thành các đoạn text và diagram để render Mermaid thành React component tương tác
function parseMarkdownSegments(markdown: string): ContentSegment[] {
  if (!markdown) return [];
  const segments: ContentSegment[] = [];
  const lines = markdown.split('\n');
  let currentType: 'markdown' | 'mermaid' = 'markdown';
  let buffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith('```mermaid')) {
      if (buffer.length > 0) {
        segments.push({ type: 'markdown', content: buffer.join('\n') });
        buffer = [];
      }
      currentType = 'mermaid';
    } else if (currentType === 'mermaid' && line.trim() === '```') {
      segments.push({ type: 'mermaid', content: buffer.join('\n') });
      buffer = [];
      currentType = 'markdown';
    } else {
      buffer.push(line);
    }
  }

  if (buffer.length > 0) {
    segments.push({ type: currentType, content: buffer.join('\n') });
  }

  return segments;
}

export const App: React.FC = () => {
  const [docsManifest, setDocsManifest] = useState<DocsManifestData | null>(null);
  const [commitsDiff, setCommitsDiff] = useState<CommitsDiffData | null>(null);
  const [gitHubStatus, setGitHubStatus] = useState<GitHubApiStatus | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshingCommits, setRefreshingCommits] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Điều hướng chính
  const [activeTab, setActiveTab] = useState<'docs' | 'changelog' | 'diagrams'>('docs');
  const [selectedDocSlug, setSelectedDocSlug] = useState<string>('');
  const [activeMode, setActiveMode] = useState<ActiveMode>('reader');
  const [selectedDiffHash, setSelectedDiffHash] = useState<string | null>(null);

  // Tìm kiếm & Modals
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);
  const [unreadSlugs, setUnreadSlugs] = useState<Set<string>>(new Set());
  const [showUnreadBanner, setShowUnreadBanner] = useState<boolean>(true);
  const [sidebarSearch, setSidebarSearch] = useState<string>('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  // Danh sách vừa xem gần đây
  const [recentSlugs, setRecentSlugs] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('panelforge_hub_recent_slugs_v1');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const copyWithToast = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast(message);
    setTimeout(() => setCopyToast(null), 2500);
  };

  // Tải dữ liệu lúc khởi tạo (Hỗ trợ gọi trực tiếp GitHub REST API)
  const loadData = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshingCommits(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [manifest, commitsResult] = await Promise.all([
        fetchDocsManifest(),
        fetchCommitsDiffWithStatus(forceRefresh),
      ]);

      setDocsManifest(manifest);
      setCommitsDiff(commitsResult.data);
      setGitHubStatus(commitsResult.status);

      // Thiết lập doc mặc định
      if (manifest.docs.length > 0 && !selectedDocSlug) {
        setSelectedDocSlug(manifest.docs[0].slug);
      }

      // Xác định tài liệu unread
      const unreads = getUnreadDocs(manifest.docs, commitsResult.data.latestHash);
      setUnreadSlugs(unreads);
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu Hub:', err);
      setError(err?.message || 'Không thể nạp dữ liệu manifest');
    } finally {
      setLoading(false);
      setRefreshingCommits(false);
    }
  }, [selectedDocSlug]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Phím tắt bàn phím ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Doc hiện tại đang được chọn
  const currentDoc: DocItem | undefined = useMemo(() => {
    if (!docsManifest) return undefined;
    return (
      docsManifest.docs.find((d) => d.slug === selectedDocSlug) ||
      docsManifest.docs[0]
    );
  }, [docsManifest, selectedDocSlug]);

  // Nhóm docs theo category ở Sidebar
  const categorizedDocs = useMemo(() => {
    if (!docsManifest) return [];
    const groups: Record<string, DocItem[]> = {};

    for (const doc of docsManifest.docs) {
      if (
        sidebarSearch &&
        !doc.title.toLowerCase().includes(sidebarSearch.toLowerCase()) &&
        !doc.path.toLowerCase().includes(sidebarSearch.toLowerCase())
      ) {
        continue;
      }

      const cat = doc.category || 'Tài liệu khác';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(doc);
    }

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [docsManifest, sidebarSearch]);

  // Segment nội dung doc để render
  const contentSegments = useMemo(() => {
    if (!currentDoc) return [];
    return parseMarkdownSegments(currentDoc.content);
  }, [currentDoc]);

  // Tìm commit diff tương ứng với file hiện tại
  const currentFileDiff = useMemo(() => {
    if (!commitsDiff || !currentDoc) return null;

    // Tìm trong commit được chọn, hoặc commit gần nhất của file
    const targetHash = selectedDiffHash || currentDoc.lastCommit?.hash;

    const targetCommit = commitsDiff.commits.find(
      (c) => c.hash === targetHash || c.fullHash === targetHash
    );

    if (!targetCommit) {
      // Lấy commit đầu tiên có chứa file này
      const commitWithFile = commitsDiff.commits.find((c) =>
        c.files.some((f) => f.path === currentDoc.repoPath)
      );
      if (commitWithFile) {
        const file = commitWithFile.files.find((f) => f.path === currentDoc.repoPath);
        return { commit: commitWithFile, file };
      }
      return null;
    }

    const file = targetCommit.files.find((f) => f.path === currentDoc.repoPath);
    return { commit: targetCommit, file };
  }, [commitsDiff, currentDoc, selectedDiffHash]);

  // Đánh dấu tất cả là đã đọc
  const handleMarkAllAsRead = () => {
    if (commitsDiff?.latestHash) {
      saveLastSeenCommitHash(commitsDiff.latestHash);
      setUnreadSlugs(new Set());
      setShowUnreadBanner(false);
    }
  };

  // Đồng bộ URL Hash (#/docs/:slug, #/diff/:slug, #/changelog, #/diagrams)
  useEffect(() => {
    if (!docsManifest) return;

    const handleHashSync = () => {
      const hash = window.location.hash;
      if (!hash) return;

      if (hash === '#/changelog') {
        setActiveTab('changelog');
        return;
      }
      if (hash === '#/diagrams') {
        setActiveTab('diagrams');
        return;
      }
      if (hash.startsWith('#/docs/')) {
        const slug = decodeURIComponent(hash.substring(7));
        const doc = docsManifest.docs.find((d) => d.slug === slug);
        if (doc) {
          setSelectedDocSlug(slug);
          setActiveTab('docs');
          setActiveMode('reader');
        }
      } else if (hash.startsWith('#/diff/')) {
        const slug = decodeURIComponent(hash.substring(7));
        const doc = docsManifest.docs.find((d) => d.slug === slug);
        if (doc) {
          setSelectedDocSlug(slug);
          setActiveTab('docs');
          setActiveMode('diff');
        }
      }
    };

    handleHashSync();
    window.addEventListener('hashchange', handleHashSync);
    return () => window.removeEventListener('hashchange', handleHashSync);
  }, [docsManifest]);

  const recentDocsList = useMemo(() => {
    if (!docsManifest) return [];
    return recentSlugs
      .map((slug) => docsManifest.docs.find((d) => d.slug === slug))
      .filter((d): d is DocItem => Boolean(d));
  }, [docsManifest, recentSlugs]);

  // Cuộn mượt đến anchor heading
  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Chọn doc với Deep Link Hash & Lưu Recent
  const handleSelectDoc = (
    slug: string,
    headingId?: string,
    mode: ActiveMode = 'reader'
  ) => {
    setSelectedDocSlug(slug);
    setActiveTab('docs');
    setActiveMode(mode);
    setMobileSidebarOpen(false);

    // Cập nhật URL Hash để có deep link tức thì
    const targetHash = mode === 'diff' ? `#/diff/${slug}` : `#/docs/${slug}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }

    // Cập nhật danh sách vừa xem gần đây
    setRecentSlugs((prev) => {
      const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, 5);
      try {
        localStorage.setItem('panelforge_hub_recent_slugs_v1', JSON.stringify(next));
      } catch {}
      return next;
    });

    if (headingId) {
      setTimeout(() => scrollToHeading(headingId), 200);
    }
  };

  // Mở diff trực tiếp từ Changelog
  const handleOpenDocDiff = (filePath: string, commitHash: string) => {
    const matchedDoc = docsManifest?.docs.find((d) => d.repoPath === filePath);
    if (matchedDoc) {
      setSelectedDiffHash(commitHash);
      handleSelectDoc(matchedDoc.slug, undefined, 'diff');
    }
  };

  if (loading && !docsManifest) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-ink">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 mx-auto text-accent animate-spin" />
          <h1 className="font-serif text-lg font-bold">PanelForge Documentation Hub</h1>
          <p className="text-xs text-ink-muted">Đang nạp manifest tài liệu và lịch sử Git...</p>
        </div>
      </div>
    );
  }

  if (error || !docsManifest) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center p-6 text-ink">
        <div className="max-w-md text-center space-y-4 p-6 bg-white border border-diff-removedBorder rounded-lg">
          <div className="text-red-600 font-semibold text-sm">Không thể nạp dữ liệu SSOT Docs</div>
          <p className="text-xs text-ink-muted">{error}</p>
          <button
            onClick={() => loadData()}
            className="px-4 py-2 bg-ink text-paper rounded-md text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            Thử tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#171717] font-sans flex flex-col selection:bg-accent/20 selection:text-ink">
      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        docs={docsManifest.docs}
        onSelectDoc={handleSelectDoc}
      />

      {/* GitHub Token & API Settings Modal */}
      <GitHubTokenModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        status={gitHubStatus}
        onRefreshLive={() => loadData(true)}
      />

      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#171717] text-white text-xs font-semibold shadow-xl border border-stone-700 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* 1. Header Bar (Editorial Paper & Ink) */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E2DC] px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-1.5 text-ink-muted hover:text-ink rounded-md hover:bg-stone-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-extrabold text-base sm:text-lg tracking-tight text-ink">
                PANELFORGE HUB
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-semibold">
                SSOT Docs
              </span>
            </div>
            <div className="text-[11px] text-ink-muted hidden sm:block">
              Single Source of Truth • Technical Specs & Audit Logs
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-paper-subtle p-0.5 rounded-lg border border-hairline text-xs font-medium">
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'docs'
                ? 'bg-white text-ink shadow-sm font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tài liệu ({docsManifest.totalDocs})</span>
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'changelog'
                ? 'bg-white text-ink shadow-sm font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span>Changelog ({commitsDiff?.totalCommits || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('diagrams')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'diagrams'
                ? 'bg-white text-ink shadow-sm font-semibold'
                : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sơ đồ Mermaid</span>
          </button>
        </nav>

        {/* Right Tools: Search Button, Live GitHub Indicator, Settings & Git Info */}
        <div className="flex items-center gap-2">
          {/* GitHub Live API Status Indicator */}
          <button
            onClick={() => setIsTokenModalOpen(true)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors ${
              gitHubStatus?.source === 'live-api'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                : gitHubStatus?.source === 'cached'
                ? 'bg-amber-50/80 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-stone-100 border-hairline text-stone-600 hover:bg-stone-200'
            }`}
            title="Nhấp để cấu hình GitHub API Token và xem hạn mức"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                gitHubStatus?.source === 'live-api'
                  ? 'bg-emerald-600 animate-pulse'
                  : gitHubStatus?.source === 'cached'
                  ? 'bg-amber-500'
                  : 'bg-stone-400'
              }`}
            />
            <span className="hidden sm:inline font-semibold">
              {gitHubStatus?.source === 'live-api'
                ? 'GitHub API: Live'
                : gitHubStatus?.source === 'cached'
                ? 'GitHub: Cache'
                : 'GitHub: Fallback'}
            </span>
          </button>

          {/* Refresh Commits Live Button */}
          <button
            onClick={() => loadData(true)}
            disabled={refreshingCommits}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-paper-subtle border border-hairline rounded-md transition-colors disabled:opacity-50"
            title="Làm mới commits từ GitHub API"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-accent ${refreshingCommits ? 'animate-spin' : ''}`} />
          </button>

          {/* Search Trigger */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-paper-subtle border border-hairline rounded-md text-xs text-ink-muted hover:text-ink hover:border-stone-400 transition-colors"
          >
            <Search className="w-3.5 h-3.5 text-stone-400" />
            <span className="hidden md:inline">Tìm kiếm...</span>
            <kbd className="hidden md:inline font-mono text-[10px] bg-white border border-hairline px-1 rounded text-stone-500">
              ⌘K
            </kbd>
          </button>

          {/* GitHub Token Config Key Button */}
          <button
            onClick={() => setIsTokenModalOpen(true)}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-paper-subtle rounded-md transition-colors"
            title="Cấu hình Token GitHub API"
          >
            <Key className="w-4 h-4 text-stone-500" />
          </button>

          <a
            href="https://github.com/tkiennt/panelforge-hubs"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-paper-subtle rounded-md transition-colors"
            title="Xem GitHub Repo"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Quick Pinned Access Bar */}
      <QuickAccessBar
        currentSlug={selectedDocSlug}
        onSelectDoc={(slug) => handleSelectDoc(slug)}
      />

      {/* Main Container */}
      {activeTab === 'changelog' ? (
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <ChangelogTimeline
            commitsData={commitsDiff!}
            onOpenDocDiff={handleOpenDocDiff}
            gitHubStatus={gitHubStatus}
            onRefreshLive={() => loadData(true)}
            refreshing={refreshingCommits}
          />
        </main>
      ) : activeTab === 'diagrams' ? (
        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          <MermaidGalleryView
            docs={docsManifest.docs}
            onOpenDoc={(slug) => {
              setSelectedDocSlug(slug);
              setActiveTab('docs');
            }}
          />
        </main>
      ) : (
        /* 2. 3-Pane Editorial Layout for Docs */
        <div className="flex-1 flex flex-col lg:flex-row relative">
          {/* Mobile Sidebar Backdrop */}
          {mobileSidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-stone-900/40 lg:hidden"
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

          {/* LEFT SIDEBAR (260px Fixed & Sticky) */}
          <aside
            className={`fixed lg:sticky top-12 lg:top-[53px] lg:self-start shrink-0 z-30 h-[calc(100vh-53px)] w-[280px] lg:w-[260px] bg-[#F3F1EC] border-r border-[#E5E2DC] flex flex-col transition-transform duration-200 ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            {/* Unread Docs Banner */}
            {showUnreadBanner && unreadSlugs.size > 0 && (
              <div className="p-3 bg-orange-50 border-b border-accent/20 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-accent">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span>Có {unreadSlugs.size} tài liệu mới</span>
                  </div>
                  <button
                    onClick={() => setShowUnreadBanner(false)}
                    className="text-stone-400 hover:text-ink text-[11px]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[11px] text-stone-600 leading-snug">
                  Đã có cập nhật kể từ lần truy cập gần nhất của bạn.
                </p>
                <button
                  onClick={handleMarkAllAsRead}
                  className="self-start text-[11px] text-accent font-semibold hover:underline"
                >
                  ✓ Đánh dấu tất cả đã đọc
                </button>
              </div>
            )}

            {/* Sidebar Search Filter */}
            <div className="p-3 border-b border-hairline">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Lọc tài liệu..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 bg-white border border-hairline rounded text-xs text-ink placeholder:text-stone-400 focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Vừa xem gần đây (Recently Viewed) */}
            {recentDocsList.length > 0 && !sidebarSearch && (
              <div className="p-3 pb-2 border-b border-hairline space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold px-1">
                  <div className="flex items-center gap-1">
                    <History className="w-3 h-3 text-stone-400" />
                    <span>Vừa xem:</span>
                  </div>
                  <button
                    onClick={() => {
                      setRecentSlugs([]);
                      localStorage.removeItem('panelforge_hub_recent_slugs_v1');
                    }}
                    className="hover:text-ink text-[10px] lowercase"
                    title="Xóa danh sách vừa xem"
                  >
                    xóa
                  </button>
                </div>
                <div className="flex flex-col gap-0.5">
                  {recentDocsList.map((doc) => (
                    <button
                      key={doc.slug}
                      onClick={() => handleSelectDoc(doc.slug)}
                      className={`text-left px-2 py-1 rounded text-[11.5px] transition-colors truncate border ${
                        doc.slug === selectedDocSlug
                          ? 'bg-white text-ink font-semibold border-hairline shadow-sm'
                          : 'bg-transparent text-stone-600 border-transparent hover:bg-stone-200/50 hover:text-ink'
                      }`}
                      title={doc.title}
                    >
                      {doc.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Document Navigation Tree */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {categorizedDocs.map(([category, items]) => (
                <div key={category} className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold px-2 py-1">
                    <Folder className="w-3 h-3 text-stone-400" />
                    <span>{category}</span>
                  </div>
                  <div className="space-y-0.5">
                    {items.map((doc) => {
                      const isSelected = doc.slug === selectedDocSlug;
                      const isUnread = unreadSlugs.has(doc.slug);

                      return (
                        <button
                          key={doc.slug}
                          onClick={() => handleSelectDoc(doc.slug)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between gap-2 transition-colors ${
                            isSelected
                              ? 'bg-white text-ink font-semibold border border-hairline shadow-sm'
                              : 'text-stone-600 hover:text-ink hover:bg-stone-200/50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`w-1 h-3 rounded-full shrink-0 ${
                                isSelected ? 'bg-accent' : 'bg-transparent'
                              }`}
                            />
                            <span className="truncate">{doc.title}</span>
                          </div>

                          {/* Unread Orange Dot */}
                          {isUnread && (
                            <span
                              className="shrink-0 w-2 h-2 rounded-full bg-accent ring-2 ring-orange-200"
                              title="Tài liệu vừa cập nhật"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-hairline bg-paper-subtle/50 text-[11px] text-ink-muted flex items-center justify-between font-mono">
              <span>{docsManifest.totalDocs} tài liệu</span>
              <span>Build tĩnh Git</span>
            </div>
          </aside>

          {/* CENTER READING & DIFF CANVAS (Flexible, max-w 72ch centered) */}
          <main className="flex-1 min-w-0 bg-[#FAF9F5] px-4 sm:px-8 lg:px-12 py-8 flex justify-center">
            {currentDoc ? (
              <div className="w-full max-w-[72ch] space-y-6">
                {/* Breadcrumb & Mode Switcher Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline text-xs">
                  {/* Interactive Breadcrumb */}
                  <div className="flex items-center gap-1.5 text-ink-muted font-mono text-[11px] flex-wrap">
                    <button
                      onClick={() => setSidebarSearch('')}
                      className="hover:text-ink text-stone-500"
                    >
                      docs
                    </button>
                    <ChevronRight className="w-3 h-3 text-stone-400" />
                    <button
                      onClick={() => setSidebarSearch(currentDoc.category)}
                      className="hover:text-accent font-medium text-stone-600 underline underline-offset-2"
                      title="Lọc tài liệu theo danh mục này"
                    >
                      {currentDoc.category}
                    </button>
                    <ChevronRight className="w-3 h-3 text-stone-400" />
                    <span className="text-ink font-semibold truncate max-w-[180px]">
                      {currentDoc.repoPath.split('/').pop()}
                    </span>
                  </div>

                  {/* Quick Copy Shortcuts & Mode Switcher */}
                  <div className="flex items-center gap-1.5">
                    {/* Deep Link Button */}
                    <button
                      onClick={() => {
                        const directUrl = `${window.location.origin}${window.location.pathname}#/docs/${currentDoc.slug}`;
                        copyWithToast(directUrl, 'Đã sao chép liên kết trực tiếp (Deep Link)!');
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-hairline bg-white hover:bg-stone-50 text-[11px] text-stone-700 transition-colors"
                      title="Sao chép liên kết web trực tiếp tới tài liệu này"
                    >
                      <LinkIcon className="w-3 h-3 text-accent" />
                      <span className="hidden sm:inline">Deep Link</span>
                    </button>

                    {/* Copy Markdown Link */}
                    <button
                      onClick={() => {
                        const mdLink = `[${currentDoc.title}](https://github.com/tkiennt/panelforge-hubs/blob/main/${currentDoc.repoPath})`;
                        copyWithToast(mdLink, 'Đã sao chép link Markdown!');
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded border border-hairline bg-white hover:bg-stone-50 text-[11px] text-stone-700 transition-colors"
                      title="Sao chép cú pháp Markdown [Tiêu đề](đường dẫn)"
                    >
                      <FileText className="w-3 h-3 text-stone-500" />
                      <span className="hidden sm:inline">Markdown</span>
                    </button>

                    {/* Open on GitHub */}
                    <a
                      href={`https://github.com/tkiennt/panelforge-hubs/blob/main/${currentDoc.repoPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded border border-hairline bg-white hover:bg-stone-50 text-stone-500 hover:text-accent transition-colors"
                      title="Xem file gốc trên GitHub"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* Mode Toggle [Đọc chuẩn | So sánh Diff] */}
                    <div className="flex items-center bg-paper-subtle border border-hairline rounded-md p-0.5 ml-1">
                      <button
                        onClick={() => handleSelectDoc(currentDoc.slug, undefined, 'reader')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          activeMode === 'reader'
                            ? 'bg-white text-ink shadow-sm font-semibold'
                            : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>Đọc</span>
                      </button>
                      <button
                        onClick={() => handleSelectDoc(currentDoc.slug, undefined, 'diff')}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          activeMode === 'diff'
                            ? 'bg-white text-ink shadow-sm font-semibold'
                            : 'text-ink-muted hover:text-ink'
                        }`}
                      >
                        <Split className="w-3 h-3" />
                        <span>Diff</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Document Header Info */}
                <div className="space-y-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight leading-tight">
                    {currentDoc.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-ink-muted pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      Cập nhật: {formatRelativeDate(currentDoc.lastCommit.date)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <GitCommit className="w-3.5 h-3.5 text-accent" />
                      commit {currentDoc.lastCommit.hash}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      {currentDoc.lastCommit.author}
                    </span>
                  </div>
                </div>

                {/* Center Content: Reader Mode vs Diff Mode */}
                {activeMode === 'reader' ? (
                  <div className="space-y-6 pt-2">
                    {contentSegments.map((seg, idx) => {
                      if (seg.type === 'mermaid') {
                        return (
                          <div key={idx} className="my-6">
                            <MermaidRenderer
                              code={seg.content}
                              idPrefix={`doc-diagram-${idx}`}
                              title={`Sơ đồ Mermaid #${idx + 1}`}
                            />
                          </div>
                        );
                      }

                      return (
                        <div
                          key={idx}
                          className="editorial-prose"
                          onClick={(e) => {
                            const target = e.target as HTMLElement | null;
                            if (!target) return;

                            const docTrigger = target.closest('[data-doc-slug]') as HTMLElement | null;
                            if (docTrigger) {
                              const slug = docTrigger.getAttribute('data-doc-slug');
                              if (slug) {
                                e.preventDefault();
                                handleSelectDoc(slug);
                                return;
                              }
                            }

                            const anchor = target.closest('a') as HTMLAnchorElement | null;
                            if (anchor) {
                              const href = anchor.getAttribute('href') || '';
                              if (href.startsWith('#') && !href.startsWith('#/')) {
                                e.preventDefault();
                                const id = href.slice(1);
                                document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
                              }
                            }
                          }}
                          dangerouslySetInnerHTML={{
                            __html: renderMarkdown(seg.content, docsManifest.docs, currentDoc),
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="pt-2">
                    <CommitDiffView
                      commit={currentFileDiff?.commit}
                      file={currentFileDiff?.file}
                      filePath={currentDoc.repoPath}
                      onSelectCommit={(hash) => setSelectedDiffHash(hash)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-ink-muted">Chưa chọn tài liệu nào.</div>
            )}
          </main>

          {/* RIGHT INSPECTOR (240px Fixed & Sticky) */}
          <aside className="hidden xl:block sticky top-[53px] self-start shrink-0 h-[calc(100vh-53px)] w-[240px] border-l border-[#E5E2DC] p-4 space-y-6 overflow-y-auto bg-[#F7F5F0]/70 text-xs text-[#171717]">
            {/* Table of Contents (TOC) */}
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wider font-mono text-stone-500 font-semibold">
                Mục lục trang
              </div>
              {currentDoc?.headings && currentDoc.headings.length > 0 ? (
                <div className="space-y-1 pl-1 border-l border-hairline">
                  {currentDoc.headings.map((h, hIdx) => {
                    const indent =
                      h.level === 1 ? 'pl-1 font-semibold text-ink' : h.level === 2 ? 'pl-3 text-stone-600' : 'pl-5 text-stone-500 text-[11px]';

                    return (
                      <button
                        key={hIdx}
                        onClick={() => scrollToHeading(h.id)}
                        className={`block text-left w-full truncate py-0.5 hover:text-accent transition-colors ${indent}`}
                      >
                        {h.text}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[11px] text-ink-muted">Không có mục lục.</div>
              )}
            </div>

            {/* File Commit History */}
            <div className="space-y-2 pt-4 border-t border-hairline">
              <div className="text-[11px] uppercase tracking-wider font-mono text-stone-500 font-semibold">
                Lịch sử file này
              </div>
              <div className="space-y-2">
                {currentDoc?.fileCommits && currentDoc.fileCommits.length > 0 ? (
                  currentDoc.fileCommits.map((fc) => (
                    <div
                      key={fc.fullHash}
                      onClick={() => {
                        setSelectedDiffHash(fc.hash);
                        setActiveMode('diff');
                      }}
                      className="p-2 rounded border border-hairline bg-white hover:border-accent cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between font-mono text-[10.5px]">
                        <span className="text-accent font-semibold">{fc.hash}</span>
                        <span className="text-stone-400">{fc.date}</span>
                      </div>
                      <div className="text-[11px] text-ink line-clamp-2 leading-tight">
                        {fc.subject}
                      </div>
                      <div className="text-[10px] text-stone-500">{fc.author}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-ink-muted">Chưa có commit history.</div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {currentDoc && (
              <div className="space-y-2 pt-4 border-t border-hairline">
                <div className="text-[11px] uppercase tracking-wider font-mono text-stone-500 font-semibold">
                  Lối tắt & Đường dẫn
                </div>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      const directUrl = `${window.location.origin}${window.location.pathname}#/docs/${currentDoc.slug}`;
                      copyWithToast(directUrl, 'Đã sao chép liên kết trực tiếp (Deep Link)!');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded border border-hairline bg-white hover:bg-stone-50 text-[11px] text-stone-700 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <LinkIcon className="w-3.5 h-3.5 text-accent" />
                      <span>Sao chép Deep Link</span>
                    </span>
                    <Copy className="w-3 h-3 text-stone-400" />
                  </button>

                  <button
                    onClick={() => {
                      const mdLink = `[${currentDoc.title}](https://github.com/tkiennt/panelforge-hubs/blob/main/${currentDoc.repoPath})`;
                      copyWithToast(mdLink, 'Đã sao chép link Markdown!');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded border border-hairline bg-white hover:bg-stone-50 text-[11px] text-stone-700 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-stone-500" />
                      <span>Sao chép Markdown Link</span>
                    </span>
                    <Copy className="w-3 h-3 text-stone-400" />
                  </button>

                  <button
                    onClick={() => {
                      copyWithToast(currentDoc.repoPath, 'Đã sao chép đường dẫn repo!');
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded border border-hairline bg-white hover:bg-stone-50 text-[11px] text-stone-700 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-stone-500" />
                      <span>Sao chép Repo Path</span>
                    </span>
                    <Copy className="w-3 h-3 text-stone-400" />
                  </button>

                  <a
                    href={`https://github.com/tkiennt/panelforge-hubs/blob/main/${currentDoc.repoPath}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded border border-hairline bg-white hover:bg-stone-50 text-[11px] text-stone-700 transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
                      <span>Mở file trên GitHub</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-stone-400" />
                  </a>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default App;
