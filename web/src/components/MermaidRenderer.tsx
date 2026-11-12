import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw, Copy, Check, Maximize2, Minimize2 } from 'lucide-react';

// Khởi tạo Mermaid chuẩn Editorial Paper & Ink
mermaid.initialize({
  startOnLoad: false,
  theme: 'base',
  securityLevel: 'loose',
  fontFamily: 'Plus Jakarta Sans, sans-serif',
  themeVariables: {
    darkMode: false,
    background: '#FAF9F5',
    primaryColor: '#F3F1EC',
    primaryTextColor: '#171717',
    primaryBorderColor: '#D6D2CA',
    lineColor: '#57534E',
    secondaryColor: '#FFFFFF',
    tertiaryColor: '#FAF9F5',
    mainBkg: '#FFFFFF',
    nodeBorder: '#D6D2CA',
    clusterBkg: '#F3F1EC80',
    titleColor: '#171717',
    edgeLabelBackground: '#FAF9F5',
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

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`my-6 rounded-lg border border-hairline bg-paper-card overflow-hidden transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl flex flex-col' : ''
      } ${className}`}
    >
      {/* Editorial Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-hairline bg-paper-sidebar text-xs text-ink-muted">
        <div className="flex items-center gap-2 font-mono text-[11px] font-medium text-ink">
          <span className="w-2 h-2 rounded-full bg-accent"></span>
          <span>{title || 'Mermaid Diagram'}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}
            title="Thu nhỏ"
            className="p-1 rounded hover:bg-paper-hover text-ink-muted hover:text-ink transition"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale((s) => Math.min(2.0, s + 0.15))}
            title="Phóng to"
            className="p-1 rounded hover:bg-paper-hover text-ink-muted hover:text-ink transition"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale(1)}
            title="Đặt lại zoom"
            className="p-1 rounded hover:bg-paper-hover text-ink-muted hover:text-ink transition ml-0.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-[1px] bg-hairline mx-1" />

          <button
            onClick={handleCopy}
            title="Sao chép cú pháp Mermaid"
            className="p-1 rounded hover:bg-paper-hover text-ink-muted hover:text-ink transition flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Thu nhỏ lại' : 'Toàn màn hình'}
            className="p-1 rounded hover:bg-paper-hover text-ink-muted hover:text-ink transition"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Diagram Canvas */}
      <div
        ref={containerRef}
        className={`p-4 overflow-auto flex items-center justify-center bg-paper ${
          isFullscreen ? 'flex-1' : 'min-h-[240px]'
        }`}
      >
        {error ? (
          <div className="p-4 text-xs font-mono text-diff-remText bg-diff-remBg border border-diff-remBorder rounded-md max-w-lg">
            <strong>Lỗi render sơ đồ:</strong>
            <pre className="mt-1 whitespace-pre-wrap">{error}</pre>
          </div>
        ) : svgHtml ? (
          <div
            style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}
            className="transition-transform duration-150 inline-block"
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <div className="text-xs text-ink-subtle font-mono">Đang render sơ đồ...</div>
        )}
      </div>
    </div>
  );
};
