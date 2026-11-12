import React, { useState, useEffect } from 'react';
import { SYSTEM_DOCS_LIST, fetchMarkdownDoc, renderMarkdownToHtml } from '../services/dataService';
import type { DocFileItem } from '../types/hub';
import { BookOpen, FileText, Search, RefreshCw } from 'lucide-react';

export const DocsView: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<DocFileItem>(SYSTEM_DOCS_LIST[0]);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetchMarkdownDoc(selectedDoc.path).then((text) => {
      if (isMounted) {
        setHtmlContent(renderMarkdownToHtml(text));
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedDoc]);

  const categories = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'spec', label: 'Đặc tả V2.6' },
    { key: 'tracking', label: 'Audit & Tracking' },
    { key: 'standards', label: 'Thuật ngữ & Chuẩn' },
    { key: 'architecture', label: 'Kiến trúc & Storage' },
    { key: 'note', label: 'Kế hoạch triển khai' },
  ];

  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredDocs = SYSTEM_DOCS_LIST.filter((doc) => {
    const matchCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;
    const matchSearch =
      doc.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      doc.description.toLowerCase().includes(searchFilter.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            NƠI ĐỌC TÀI LIỆU TRUNG TÂM (CENTRAL KNOWLEDGE BASE)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            System Documentation Explorer
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Đọc trực tiếp các file Markdown tĩnh từ <code>panelforge-hub/docs/</code>. Toàn bộ đặc tả, state machines,
            luồng nghiệp vụ và kế hoạch được chuẩn hóa tại đây.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoading(true);
              fetchMarkdownDoc(selectedDoc.path).then((text) => {
                setHtmlContent(renderMarkdownToHtml(text));
                setLoading(false);
              });
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            Tải lại
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Document Selector */}
        <div className="lg:col-span-4 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm tài liệu..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-1.5 pb-1">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategoryFilter(c.key)}
                className={`text-[11px] px-2.5 py-1 rounded-md transition-colors ${
                  categoryFilter === c.key
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Document list */}
          <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
            {filteredDocs.map((doc) => {
              const isSelected = selectedDoc.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <h3 className="text-xs font-semibold text-slate-200 line-clamp-1">{doc.title}</h3>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed pl-6">
                    {doc.description}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-500 font-mono truncate pl-6">
                    {doc.path}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Markdown Viewer */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl min-h-[600px]">
            {/* Header of the opened doc */}
            <div className="border-b border-slate-800 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  {selectedDoc.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white mt-2 tracking-tight">
                  {selectedDoc.title}
                </h2>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  Đường dẫn: <code>{selectedDoc.path}</code>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <span className="text-sm">Đang tải và render tài liệu Markdown...</span>
              </div>
            ) : (
              <div
                className="markdown-content prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
