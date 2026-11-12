import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw, Copy, Check, Maximize2, X } from 'lucide-react';

// Khởi tạo Mermaid chuẩn Editorial Paper & Ink (hỗ trợ font tiếng Việt)
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  fontFamily: '"Be Vietnam Pro", Inter, sans-serif',
  themeVariables: {
    darkMode: false,
    background: '#F8FAFC',
    primaryColor: '#E0F2FE',
    primaryTextColor: '#0F172A',
    primaryBorderColor: '#7DD3FC',
    lineColor: '#475569',
    secondaryColor: '#FFFFFF',
    tertiaryColor: '#F8FAFC',
    mainBkg: '#FFFFFF',
    nodeBorder: '#CBD5E1',
    clusterBkg: '#F1F5F9',
    titleColor: '#0F172A',
    edgeLabelBackground: '#F8FAFC',
  },
});

interface MermaidRendererProps {
  code: string;
  title?: string;
  className?: string;
  idPrefix?: string;
}

export const MermaidRenderer: React.FC<MermaidRendererProps> = ({
  code,
  title,
  className = '',
  idPrefix = 'mermaid-render',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!code.trim()) return;
      setError(null);
      try {
        const id = `${idPrefix.replace(/[^a-zA-Z0-9_-]/g, '_')}-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, code.trim());
        if (isMounted) {
          setSvgHtml(svg);
        }
      } catch (err: unknown) {
        console.error('Mermaid render error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Lỗi cú pháp Mermaid diagram');
        }
      }
    };

    renderDiagram();
    return () => {
      isMounted = false;
    };
  }, [code]);

  // Đóng phóng to bằng phím ESC
  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderCard = (fullscreenMode: boolean) => (
    <div
      className={
        fullscreenMode
          ? 'w-full h-full max-w-6xl max-h-[90vh] rounded-lg border border-hairline bg-white shadow-2xl flex flex-col overflow-hidden'
          : `my-6 rounded-lg border border-hairline bg-white overflow-hidden ${className}`
      }
      onClick={(e) => e.stopPropagation()}
    >
      {/* Editorial Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#64748B] shrink-0">
        <div className="flex items-center gap-2 font-mono text-[11px] font-medium text-[#0F172A]">
          <span className="w-2 h-2 rounded-full bg-[#0284C7]"></span>
          <span>{title || 'Mermaid Diagram'}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.15).toFixed(2))))}
            title="Thu nhỏ"
            className="p-1 rounded hover:bg-sky-50 text-[#64748B] hover:text-[#0284C7] transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1 min-w-[42px] text-center text-[#0F172A]">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.15).toFixed(2))))}
            title="Phóng to"
            className="p-1 rounded hover:bg-sky-50 text-[#64748B] hover:text-[#0284C7] transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale(1)}
            title="Đặt lại zoom"
            className="p-1 rounded hover:bg-sky-50 text-[#64748B] hover:text-[#0284C7] transition ml-0.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-[1px] bg-[#E2E8F0] mx-1" />

          <button
            onClick={handleCopy}
            title="Sao chép cú pháp Mermaid"
            className="p-1 rounded hover:bg-sky-50 text-[#64748B] hover:text-[#0284C7] transition flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsFullscreen(!fullscreenMode)}
            title={fullscreenMode ? 'Thu nhỏ lại (ESC)' : 'Phóng to toàn màn hình'}
            className="p-1 rounded hover:bg-sky-50 text-[#64748B] hover:text-[#0284C7] transition"
          >
            {fullscreenMode ? <X className="w-4 h-4 text-[#0F172A]" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Diagram Canvas: sử dụng CSS zoom để khung cuộn tự co giãn chuẩn xác, không bị đè lên header hay giao diện */}
      <div
        ref={fullscreenMode ? undefined : containerRef}
        className={`p-4 overflow-auto bg-[#F8FAFC] ${
          fullscreenMode ? 'flex-1' : 'min-h-[240px] max-h-[70vh]'
        }`}
      >
        {error ? (
          <div className="p-4 text-xs font-mono text-diff-remText bg-diff-remBg border border-diff-remBorder rounded-md max-w-lg mx-auto">
            <strong>Lỗi render sơ đồ:</strong>
            <pre className="mt-1 whitespace-pre-wrap">{error}</pre>
          </div>
        ) : svgHtml ? (
          <div className="min-w-full w-fit flex justify-center">
            <div
              style={{ zoom: scale }}
              className="inline-block"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>
        ) : (
          <div className="text-xs text-ink-subtle font-mono text-center py-8">
            Đang render sơ đồ...
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {renderCard(false)}
      {isFullscreen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-[1px] p-4 sm:p-6 lg:p-10 flex items-center justify-center"
            onClick={() => setIsFullscreen(false)}
          >
            {renderCard(true)}
          </div>,
          document.body
        )}
    </>
  );
};
