import React, { useState, useEffect, useRef } from 'react';
import type { DocItem } from '../types/hub';
import { QUICK_PINNED_DOCS } from './QuickAccessBar';
import { Search, FileText, Hash, CornerDownLeft, X, Zap } from 'lucide-react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  docs: DocItem[];
  onSelectDoc: (slug: string, headingId?: string) => void;
}

interface SearchResult {
  doc: DocItem;
  headingMatch?: { text: string; id: string };
  snippet?: string;
  score: number;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  docs,
  onSelectDoc,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Tìm kiếm toàn văn trên docs manifest
  const results: SearchResult[] = React.useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase().trim();
    const matches: SearchResult[] = [];

    for (const doc of docs) {
      let score = 0;
      let headingMatch: { text: string; id: string } | undefined;
      let snippet: string | undefined;

      // 1. Khớp tiêu đề tài liệu
      if (doc.title.toLowerCase().includes(lowerQuery)) {
        score += 100;
      }

      // 2. Khớp category hoặc path
      if (doc.category.toLowerCase().includes(lowerQuery) || doc.path.toLowerCase().includes(lowerQuery)) {
        score += 40;
      }

      // 3. Khớp các Heading (H1, H2, H3)
      for (const h of doc.headings || []) {
        if (h.text.toLowerCase().includes(lowerQuery)) {
          score += 60;
          if (!headingMatch) {
            headingMatch = { text: h.text, id: h.id };
          }
        }
      }

      // 4. Khớp nội dung Markdown
      const contentLower = doc.content.toLowerCase();
      const matchPos = contentLower.indexOf(lowerQuery);
      if (matchPos !== -1) {
        score += 20;
        const start = Math.max(0, matchPos - 40);
        const end = Math.min(doc.content.length, matchPos + lowerQuery.length + 60);
        snippet = (start > 0 ? '...' : '') + doc.content.substring(start, end).replace(/\n/g, ' ') + (end < doc.content.length ? '...' : '');
      }

      if (score > 0) {
        matches.push({ doc, headingMatch, snippet, score });
      }
    }

    // Sắp xếp theo độ liên quan cao nhất
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 10);
  }, [docs, query]);

  // Phím tắt bàn phím
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (results.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % (results.length || 1));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        const item = results[selectedIndex];
        onSelectDoc(item.doc.slug, item.headingMatch?.id);
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onSelectDoc, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-stone-900/40">
      <div
        className="w-full max-w-2xl bg-white border border-hairline rounded-lg shadow-xl overflow-hidden flex flex-col animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-hairline bg-paper">
          <Search className="w-4 h-4 text-ink-muted mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Tìm kiếm tài liệu, tiêu đề, mã quy tắc (VD: CF1, BR-15, Token, API)..."
            className="flex-1 bg-transparent text-sm text-ink placeholder:text-stone-400 focus:outline-none font-sans"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-ink-muted hover:text-ink rounded"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded border border-hairline text-stone-400">
              ESC để đóng
            </span>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-hairline">
          {query.trim() === '' ? (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold px-2">
                <Zap className="w-3.5 h-3.5 text-accent" />
                <span>Lối tắt tài liệu truy cập nhanh:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {QUICK_PINNED_DOCS.map((item) => (
                  <button
                    key={item.slug}
                    onClick={() => {
                      onSelectDoc(item.slug);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-md border border-[#E5E2DC] bg-[#FAF9F5] hover:bg-white hover:border-accent text-left transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-stone-400 group-hover:text-accent shrink-0" />
                      <span className="font-serif font-semibold text-xs text-ink truncate">
                        {item.title}
                      </span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-500 shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-stone-400 text-center pt-2">
                Gõ từ khóa bất kỳ để tìm kiếm toàn văn trong 33+ tài liệu.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-ink-muted">
              Không tìm thấy tài liệu nào khớp với từ khóa "<strong>{query}</strong>".
            </div>
          ) : (
            results.map((res, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={`${res.doc.slug}-${index}`}
                  onClick={() => {
                    onSelectDoc(res.doc.slug, res.headingMatch?.id);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isSelected ? 'bg-paper-subtle' : 'hover:bg-paper-subtle/50'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span className="font-serif font-semibold text-sm text-ink truncate">
                        {res.doc.title}
                      </span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border border-hairline text-ink-muted bg-white shrink-0">
                        {res.doc.category}
                      </span>
                    </div>

                    {res.headingMatch && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-600 pl-5">
                        <Hash className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="font-medium text-ink truncate">{res.headingMatch.text}</span>
                      </div>
                    )}

                    {res.snippet && (
                      <div className="text-xs text-stone-500 pl-5 font-mono text-[11px] line-clamp-1">
                        {res.snippet}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-1 text-[11px] text-stone-400">
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-accent" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-2.5 bg-paper-subtle border-t border-hairline flex items-center justify-between text-[11px] text-ink-muted px-4 font-mono">
          <span>{results.length} kết quả tìm kiếm</span>
          <div className="flex items-center gap-3">
            <span>↑↓ di chuyển</span>
            <span>↵ chọn</span>
            <span>esc đóng</span>
          </div>
        </div>
      </div>
    </div>
  );
};
