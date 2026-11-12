import React, { useState, useMemo } from 'react';
import type { DocItem } from '../types/hub';
import { MermaidRenderer } from '../components/MermaidRenderer';
import { Search, ArrowRight } from 'lucide-react';

interface MermaidGalleryViewProps {
  docs: DocItem[];
  onOpenDoc: (slug: string) => void;
}

export const MermaidGalleryView: React.FC<MermaidGalleryViewProps> = ({
  docs,
  onOpenDoc,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Trích xuất toàn bộ các sơ đồ kèm thông tin tài liệu gốc
  const allDiagrams = useMemo(() => {
    const list: Array<{
      id: string;
      doc: DocItem;
      index: number;
      code: string;
      firstLine: string;
    }> = [];

    docs.forEach((d) => {
      d.mermaidBlocks.forEach((code, idx) => {
        const firstLine = code.split('\n')[0]?.trim() || 'Mermaid Diagram';
        list.push({
          id: `${d.slug}-m${idx}`,
          doc: d,
          index: idx + 1,
          code,
          firstLine,
        });
      });
    });

    return list;
  }, [docs]);

  // Danh mục doc có chứa sơ đồ
  const categories = useMemo(() => {
    const set = new Set<string>();
    allDiagrams.forEach((item) => set.add(item.doc.category));
    return ['ALL', ...Array.from(set)];
  }, [allDiagrams]);

  // Lọc sơ đồ
  const filteredDiagrams = useMemo(() => {
    return allDiagrams.filter((item) => {
      const matchCat = selectedCategory === 'ALL' || item.doc.category === selectedCategory;
      const q = searchFilter.toLowerCase();
      const matchSearch =
        !q ||
        item.doc.title.toLowerCase().includes(q) ||
        item.firstLine.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [allDiagrams, selectedCategory, searchFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-5 bg-paper-subtle border border-hairline rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-accent/10 border border-accent/20 text-accent font-semibold">
              Diagram Hub
            </span>
            <span className="text-xs text-ink-muted">
              {allDiagrams.length} sơ đồ kiến trúc & luồng nghiệp vụ
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-ink mt-1.5">
            Thư viện Sơ đồ Kiến trúc & Kịch bản (Mermaid)
          </h2>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-2xl">
            Tất cả các State Diagram, Sequence Flow và Architecture Map từ các file đặc tả trong <code>docs/</code> được tổng hợp trực quan với đầy đủ tính năng phóng to, thu nhỏ và sao chép.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Tìm theo tên sơ đồ, mã luồng..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-hairline rounded-md text-xs text-ink placeholder:text-stone-400 focus:outline-none focus:border-accent"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="text-stone-400 font-mono text-[11px] uppercase mr-1">Lọc:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors border ${
              selectedCategory === cat
                ? 'bg-ink text-paper border-ink font-semibold'
                : 'bg-white text-ink-muted border-hairline hover:text-ink hover:border-stone-400'
            }`}
          >
            {cat === 'ALL' ? 'Tất cả' : cat}
          </button>
        ))}
        <span className="text-ink-muted text-xs ml-auto">
          Hiện {filteredDiagrams.length} / {allDiagrams.length} sơ đồ
        </span>
      </div>

      {/* Diagrams Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredDiagrams.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-hairline rounded-lg overflow-hidden flex flex-col shadow-sm"
          >
            {/* Diagram Card Header */}
            <div className="p-3.5 bg-paper-subtle border-b border-hairline flex items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded border border-hairline bg-white text-ink-muted font-semibold">
                    {item.doc.category}
                  </span>
                  <span className="font-serif font-bold text-ink truncate">
                    {item.doc.title}
                  </span>
                </div>
                <div className="font-mono text-[11px] text-stone-500 mt-0.5 truncate">
                  Loại sơ đồ: <strong>{item.firstLine}</strong>
                </div>
              </div>

              <button
                onClick={() => onOpenDoc(item.doc.slug)}
                className="shrink-0 flex items-center gap-1 text-[11px] text-accent font-medium hover:underline"
              >
                <span>Xem tài liệu gốc</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Diagram Interactive Canvas */}
            <div className="p-3 flex-1 bg-paper/40">
              <MermaidRenderer
                code={item.code}
                idPrefix={item.id}
                title={`${item.doc.title} - Sơ đồ #${item.index}`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
