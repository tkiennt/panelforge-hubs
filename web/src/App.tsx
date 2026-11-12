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
import { QUICK_PINNED_DOCS } from './components/QuickAccessBar';
import {
  BookOpen,
  GitCommit,
  Layers,
  Search,
  ChevronRight,
  ChevronDown,
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
  Link as LinkIcon,
  History,
  FileText,
  ExternalLink,
  Pin,
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
  const [activeHeadingId, setActiveHeadingId] = useState<string>('');
  const [showRecent, setShowRecent] = useState<boolean>(false);

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

  // Segment nội dung doc để render (loại bỏ dòng # H1 trùng lặp ở đầu bài vì đã có Hero Header)
  const contentSegments = useMemo(() => {
    if (!currentDoc) return [];
    let body = currentDoc.content.replace(/^\uFEFF/, '');
    const firstH1Match = body.match(/^\s*#\s+(.+?)(?:\r?\n|$)/);
    if (firstH1Match) {
      const h1Text = firstH1Match[1].trim().toLowerCase();
      const docTitle = currentDoc.title.trim().toLowerCase();
      if (h1Text === docTitle || body.trimStart().startsWith('# ')) {
        body = body.slice(firstH1Match[0].length).replace(/^\s*\r?\n/, '');
      }
    }
    return parseMarkdownSegments(body);
  }, [currentDoc]);

  // IntersectionObserver theo dõi heading đang đọc để highlight trên Mục lục bên phải
  useEffect(() => {
    if (activeTab !== 'docs' || activeMode !== 'reader' || !currentDoc) return;

    const timer = setTimeout(() => {
      const headingEls = Array.from(
        document.querySelectorAll('.editorial-prose h1[id], .editorial-prose h2[id], .editorial-prose h3[id]')
      );
      if (headingEls.length === 0) return;

      setActiveHeadingId(headingEls[0].id);

      const observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          if (visible.length > 0) {
            setActiveHeadingId(visible[0].target.id);
          }
        },
        {
          rootMargin: '-72px 0px -70% 0px',
          threshold: [0, 1],
        }
      );

      headingEls.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }, 80);

    return () => clearTimeout(timer);
  }, [currentDoc, activeTab, activeMode, contentSegments]);

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
    <div className="min-h-screen bg-[#F1F5F9] text-[#0F172A] font-sans flex flex-col selection:bg-sky-500/20 selection:text-[#0F172A]">
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
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#0F172A] text-white text-xs font-semibold shadow-xl border border-slate-700 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* 1. Primary Top Bar (h-14, Crisp Sky Blue Daylight Header) */}
      <header className="sticky top-0 z-40 h-14 bg-[#0284C7] border-b border-[#0369A1] text-white px-4 lg:px-6 flex items-center justify-between gap-3">
        {/* Left: Brand mark + SSOT DOCS pill */}
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-1.5 text-white/90 hover:text-white rounded-md hover:bg-white/15 transition-colors"
            aria-label="Mở menu tài liệu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setActiveTab('docs');
              if (docsManifest.docs[0]) handleSelectDoc(docsManifest.docs[0].slug);
            }}
            className="flex items-center gap-2 text-left"
          >
            <span className="font-serif font-bold text-base tracking-tight text-white whitespace-nowrap">
              PANELFORGE HUB
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/15 border border-white/25 text-white font-semibold tracking-wider">
              SSOT DOCS
            </span>
          </button>
        </div>

        {/* Center: Clean 3-tab segmented switch */}
        <nav className="flex items-center gap-0.5 bg-[#0369A1]/80 p-1 rounded-lg border border-[#0369A1] text-xs font-medium">
          <button
            onClick={() => setActiveTab('docs')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              activeTab === 'docs'
                ? 'bg-white text-[#0284C7] shadow-sm font-semibold'
                : 'text-sky-100 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tài liệu</span>
            <span
              className={`hidden md:inline text-[10px] font-mono ${
                activeTab === 'docs' ? 'text-[#0284C7]/70' : 'text-sky-200/80'
              }`}
            >
              {docsManifest.totalDocs}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('changelog')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              activeTab === 'changelog'
                ? 'bg-white text-[#0284C7] shadow-sm font-semibold'
                : 'text-sky-100 hover:text-white'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Changelog & Diff</span>
            <span className="sm:hidden">Changelog</span>
          </button>
          <button
            onClick={() => setActiveTab('diagrams')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
              activeTab === 'diagrams'
                ? 'bg-white text-[#0284C7] shadow-sm font-semibold'
                : 'text-sky-100 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sơ đồ kiến trúc</span>
            <span className="sm:hidden">Sơ đồ</span>
          </button>
        </nav>

        {/* Right: Compact ⌘K search trigger + Git sync status indicator dot */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-white/15 border border-white/20 rounded-md text-xs text-white hover:bg-white/25 transition-colors"
            title="Tìm kiếm nhanh (Ctrl/Cmd + K)"
          >
            <Search className="w-3.5 h-3.5 text-sky-100" />
            <span className="hidden lg:inline">Tìm...</span>
            <kbd className="font-mono text-[10px] bg-white/20 border border-white/25 px-1 rounded text-white">
              ⌘K
            </kbd>
          </button>

          {/* Compact Git Sync Status Dot (opens Token & API Modal) */}
          <button
            onClick={() => setIsTokenModalOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1.5 bg-white/15 border border-white/20 rounded-md text-[11px] font-mono text-white hover:bg-white/25 transition-colors"
            title={
              gitHubStatus?.source === 'live-api'
                ? 'GitHub API: Đã đồng bộ trực tiếp (Nhấp để cấu hình Token)'
                : gitHubStatus?.source === 'cached'
                ? 'GitHub API: Đang dùng cache (Nhấp để cấu hình Token)'
                : 'GitHub API: Đang dùng bản chụp build (Nhấp để cấu hình Token)'
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                gitHubStatus?.source === 'live-api'
                  ? 'bg-emerald-300'
                  : gitHubStatus?.source === 'cached'
                  ? 'bg-amber-300'
                  : 'bg-sky-200'
              }`}
            />
            <span className="hidden xl:inline">
              {gitHubStatus?.source === 'live-api'
                ? 'Live'
                : gitHubStatus?.source === 'cached'
                ? 'Cache'
                : 'Sync'}
            </span>
          </button>

          <button
            onClick={() => loadData(true)}
            disabled={refreshingCommits}
            className="p-1.5 bg-white/15 border border-white/20 text-white hover:bg-white/25 rounded-md transition-colors disabled:opacity-50"
            title="Làm mới commits từ GitHub"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingCommits ? 'animate-spin text-white' : ''}`} />
          </button>

          <a
            href="https://github.com/tkiennt/panelforge-hubs"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex p-1.5 bg-white/15 border border-white/20 text-white hover:bg-white/25 rounded-md transition-colors"
            title="Mở kho lưu trữ GitHub"
          >
            <Github className="w-3.5 h-3.5" />
          </a>
        </div>
      </header>

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

          {/* LEFT SIDEBAR (270px Fixed & Sticky) */}
          <aside
            className={`fixed lg:sticky top-14 lg:top-[56px] lg:self-start shrink-0 z-30 h-[calc(100vh-56px)] w-[280px] lg:w-[270px] bg-[#F8FAFC] border-r border-[#E2E8F0] flex flex-col transition-transform duration-200 ${
              mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
          >
            {/* Slim Single-Line Dismissible Pill for Unread Updates (Fresh Emerald) */}
            {showUnreadBanner && unreadSlugs.size > 0 && (
              <div className="px-3 pt-2.5">
                <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700">
                  <button
                    onClick={() => {
                      setActiveTab('changelog');
                      handleMarkAllAsRead();
                    }}
                    className="flex items-center gap-1.5 truncate hover:underline text-left"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] shrink-0 animate-pulse" />
                    <span className="truncate">{unreadSlugs.size} cập nhật mới • Xem diff →</span>
                  </button>
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-emerald-500 hover:text-emerald-900 shrink-0 p-0.5"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Sidebar Search Filter */}
            <div className="p-3 border-b border-[#E2E8F0]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc tài liệu..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-md text-xs text-[#0F172A] placeholder:text-slate-400 focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>

            {/* Scrollable Navigation Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Pinned Core Specs Section */}
              {!sidebarSearch && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-wider text-[#64748B] font-semibold px-2 py-0.5">
                    <Pin className="w-3 h-3 text-[#0284C7]" />
                    <span>Tài liệu cốt lõi (Pinned)</span>
                  </div>
                  <div className="space-y-0.5">
                    {QUICK_PINNED_DOCS.slice(0, 5).map((item) => {
                      const isSelected = selectedDocSlug === item.slug;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.slug}
                          onClick={() => handleSelectDoc(item.slug)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between gap-2 transition-colors ${
                            isSelected
                              ? 'bg-white text-[#0F172A] font-semibold border border-[#E2E8F0] shadow-sm'
                              : 'text-[#334155] hover:bg-[#E0F2FE]/50 hover:text-[#0F172A]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 ${
                                isSelected ? 'text-[#0284C7]' : 'text-[#64748B]'
                              }`}
                            />
                            <span className="truncate">{item.title}</span>
                          </div>
                          {item.badge && (
                            <span
                              className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                                item.highlight
                                  ? 'bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD] font-semibold'
                                  : 'bg-slate-100 text-[#64748B]'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Collapsible Recently Viewed ("Vừa xem") */}
              {recentDocsList.length > 0 && !sidebarSearch && (
                <div className="pt-2 border-t border-[#E2E8F0]">
                  <button
                    onClick={() => setShowRecent(!showRecent)}
                    className="w-full flex items-center justify-between text-[10.5px] font-mono uppercase tracking-wider text-[#64748B] hover:text-[#0F172A] font-semibold px-2 py-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      <History className="w-3 h-3" />
                      <span>Vừa xem ({recentDocsList.length})</span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform ${
                        showRecent ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {showRecent && (
                    <div className="mt-1 space-y-0.5">
                      {recentDocsList.map((doc) => (
                        <button
                          key={doc.slug}
                          onClick={() => handleSelectDoc(doc.slug)}
                          className={`w-full text-left px-2.5 py-1 rounded-md text-[11.5px] flex items-center gap-1.5 transition-colors truncate ${
                            doc.slug === selectedDocSlug
                              ? 'bg-white text-[#0F172A] font-semibold border border-[#E2E8F0] shadow-sm'
                              : 'text-[#475569] hover:bg-[#E0F2FE]/50 hover:text-[#0F172A]'
                          }`}
                          title={doc.title}
                        >
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{doc.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Categorized Document Navigation Tree */}
              <div className="pt-2 border-t border-[#E2E8F0] space-y-4">
                {categorizedDocs.map(([category, items]) => (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-mono uppercase tracking-wider text-[#64748B] font-semibold px-2 py-0.5">
                      <Folder className="w-3 h-3 text-[#64748B]" />
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
                            className={`group w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between gap-2 transition-colors ${
                              isSelected
                                ? 'bg-white text-[#0F172A] font-semibold border border-[#E2E8F0] shadow-sm'
                                : 'text-[#334155] hover:bg-[#E0F2FE]/50 hover:text-[#0F172A]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-1 h-3 rounded-full shrink-0 ${
                                  isSelected ? 'bg-[#0284C7]' : 'bg-transparent'
                                }`}
                              />
                              <span className="truncate">{doc.title}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Subtle commit hash badge on hover */}
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity font-mono text-[9.5px] text-[#64748B] bg-slate-100 px-1 rounded">
                                {doc.lastCommit.hash}
                              </span>
                              {/* Solid 6px Emerald dot for updated docs */}
                              {isUnread && (
                                <span
                                  className="w-1.5 h-1.5 rounded-full bg-[#10B981]"
                                  title="Tài liệu vừa cập nhật"
                                />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="px-3 py-2.5 border-t border-[#E2E8F0] bg-[#F1F5F9]/70 text-[11px] text-[#64748B] flex items-center justify-between font-mono">
              <span>{docsManifest.totalDocs} tài liệu</span>
              <span>SSOT Hub</span>
            </div>
          </aside>

          {/* CENTER READING & DIFF CANVAS (Elevated Editorial Paper Sheet on Cool Slate Backdrop) */}
          <main className="flex-1 min-w-0 bg-[#F1F5F9] px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
            {currentDoc ? (
              <article className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_rgba(15,23,42,0.04)] px-6 sm:px-10 py-8 sm:py-10 max-w-[780px] mx-auto w-full space-y-6">
                {/* Breadcrumb & Prominent Đọc | Diff Segmented Pill */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0] text-xs">
                  {/* Interactive Breadcrumb */}
                  <div className="flex items-center gap-1.5 text-[#64748B] font-mono text-[11px] flex-wrap">
                    <button
                      onClick={() => setSidebarSearch('')}
                      className="hover:text-[#0F172A]"
                    >
                      docs
                    </button>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <button
                      onClick={() => setSidebarSearch(currentDoc.category)}
                      className="hover:text-[#0284C7] font-medium text-[#475569] underline underline-offset-2"
                      title="Lọc tài liệu theo danh mục này"
                    >
                      {currentDoc.category}
                    </button>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span className="text-[#0F172A] font-semibold truncate max-w-[200px]">
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

                    {/* Prominent Mode Toggle [Đọc | Diff] */}
                    <div className="flex items-center bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg p-1 ml-1">
                      <button
                        onClick={() => handleSelectDoc(currentDoc.slug, undefined, 'reader')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          activeMode === 'reader'
                            ? 'bg-white text-[#0F172A] shadow-sm font-semibold'
                            : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Đọc</span>
                      </button>
                      <button
                        onClick={() => handleSelectDoc(currentDoc.slug, undefined, 'diff')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all ${
                          activeMode === 'diff'
                            ? 'bg-[#0284C7] text-white shadow-sm font-semibold'
                            : 'text-[#64748B] hover:text-[#0F172A]'
                        }`}
                      >
                        <Split className="w-3.5 h-3.5" />
                        <span>Diff</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Document Hero Header */}
                <div className="space-y-2.5 pb-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight leading-tight">
                    {currentDoc.title}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748B] pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Cập nhật: {formatRelativeDate(currentDoc.lastCommit.date)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <GitCommit className="w-3.5 h-3.5 text-[#0284C7]" />
                      commit {currentDoc.lastCommit.hash}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {currentDoc.lastCommit.author}
                    </span>
                  </div>
                </div>

                {/* Center Content: Reader Mode vs Diff Mode */}
                {activeMode === 'reader' ? (
                  <div className="space-y-6">
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
                            __html: renderMarkdown(seg.content, docsManifest.docs, currentDoc, idx),
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
              </article>
            ) : (
              <div className="p-8 text-center text-[#78716C]">Chưa chọn tài liệu nào.</div>
            )}
          </main>

          {/* RIGHT INSPECTOR (240px Fixed & Sticky) */}
          <aside className="hidden xl:block sticky top-[56px] self-start shrink-0 h-[calc(100vh-56px)] w-[240px] border-l border-[#E2E8F0] p-4 space-y-6 overflow-y-auto bg-[#F8FAFC] text-xs text-[#0F172A]">
            {/* Table of Contents (TOC) with IntersectionObserver Active Highlight */}
            <div className="space-y-2">
              <div className="text-[10.5px] uppercase tracking-wider font-mono text-[#64748B] font-semibold">
                Mục lục trang
              </div>
              {currentDoc?.headings && currentDoc.headings.length > 0 ? (
                <div className="space-y-0.5 border-l border-[#E2E8F0]">
                  {currentDoc.headings
                    .filter((h, i) => !(i === 0 && h.level === 1 && h.text.trim().toLowerCase() === currentDoc.title.trim().toLowerCase()))
                    .map((h, hIdx) => {
                      const isActive = activeHeadingId === h.id;
                      const indent =
                        h.level === 1 ? 'pl-2.5' : h.level === 2 ? 'pl-2.5' : 'pl-5 text-[11px]';

                      return (
                        <button
                          key={hIdx}
                          onClick={() => {
                            setActiveHeadingId(h.id);
                            scrollToHeading(h.id);
                          }}
                          className={`block text-left w-full truncate py-1 pr-1 transition-all -ml-[1px] ${indent} ${
                            isActive
                              ? 'border-l-2 border-[#0284C7] text-[#0F172A] font-medium'
                              : 'border-l-2 border-transparent text-[#64748B] hover:text-[#0F172A]'
                          }`}
                          title={h.text}
                        >
                          {h.text}
                        </button>
                      );
                    })}
                </div>
              ) : (
                <div className="text-[11px] text-[#64748B]">Không có mục lục.</div>
              )}
            </div>

            {/* Compact Mini-Timeline: Last 3 Commits for Active File */}
            <div className="space-y-2.5 pt-4 border-t border-[#E2E8F0]">
              <div className="text-[10.5px] uppercase tracking-wider font-mono text-[#64748B] font-semibold">
                Lịch sử thay đổi file này
              </div>
              <div className="space-y-2">
                {currentDoc?.fileCommits && currentDoc.fileCommits.length > 0 ? (
                  currentDoc.fileCommits.slice(0, 3).map((fc, idx) => (
                    <button
                      key={fc.fullHash}
                      onClick={() => {
                        setSelectedDiffHash(fc.hash);
                        setActiveMode('diff');
                      }}
                      className="w-full text-left p-2 rounded-lg border border-[#E2E8F0] bg-white hover:border-[#0284C7] cursor-pointer transition-colors space-y-1 group"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-[#0284C7] font-semibold flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${idx === 0 ? 'bg-[#0284C7]' : 'bg-slate-300'}`} />
                          {fc.hash}
                        </span>
                        <span className="text-[#64748B]">{formatRelativeDate(fc.date)}</span>
                      </div>
                      <div className="text-[11px] text-[#334155] group-hover:text-[#0F172A] line-clamp-2 leading-snug">
                        {fc.subject}
                      </div>
                      <div className="text-[10px] text-[#78716C]">{fc.author}</div>
                    </button>
                  ))
                ) : (
                  <div className="text-[11px] text-[#78716C]">Chưa có commit history.</div>
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
