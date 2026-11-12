import React, { useEffect, useRef, useState, useId } from 'react';
import mermaid from 'mermaid';
import { ZoomIn, ZoomOut, RotateCcw, Copy, Check, Maximize2, Minimize2, Download } from 'lucide-react';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
  themeVariables: {
    darkMode: true,
    background: '#0f172a',
    primaryColor: '#6366f1',
    primaryTextColor: '#f8fafc',
    primaryBorderColor: '#818cf8',
    lineColor: '#94a3b8',
    secondaryColor: '#1e293b',
    tertiaryColor: '#0f172a',
    mainBkg: '#1e293b',
    nodeBorder: '#475569',
    clusterBkg: '#0f172a80',
    titleColor: '#e2e8f0',
    edgeLabelBackground: '#1e293b',
  },
});

interface MermaidDiagramProps {
  code: string;
  title?: string;
  className?: string;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ code, title, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const rawId = useId().replace(/:/g, '');
  const renderId = `mermaid-${rawId}`;

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      if (!code.trim()) return;
      setError(null);
      try {
        const id = `mermaid-render-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(id, code.trim());
        if (isMounted) {
          setSvgHtml(svg);
        }
      } catch (err: unknown) {
        console.error('Mermaid rendering error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram syntax');
        }
      }
    };

    renderDiagram();
    return () => {
      isMounted = false;
    };
  }, [code]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const handleDownloadSvg = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'diagram'}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 bg-slate-900/98 shadow-2xl' : ''
      } ${className}`}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/70 border-b border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            {title || 'Mermaid Diagram'}
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {Math.round(scale * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <button
            onClick={() => setScale((s) => Math.min(s + 0.15, 2.5))}
            className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded-md transition"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s - 0.15, 0.4))}
            className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded-md transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setScale(1)}
            className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded-md transition"
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-slate-800 mx-1"></div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 text-xs px-2 py-1 hover:bg-slate-800 hover:text-slate-200 rounded-md transition"
            title="Copy Mermaid Code"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Code'}</span>
          </button>
          <button
            onClick={handleDownloadSvg}
            className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded-md transition"
            title="Export SVG"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 hover:bg-slate-800 hover:text-slate-200 rounded-md transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Diagram Canvas Body */}
      <div
        ref={containerRef}
        id={renderId}
        className="relative flex-1 p-6 overflow-auto min-h-[340px] flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
      >
        {error ? (
          <div className="max-w-md p-4 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300 text-sm">
            <p className="font-semibold mb-1 text-rose-200">Diagram Rendering Failed</p>
            <p className="text-xs font-mono text-rose-400 break-words">{error}</p>
            <pre className="mt-3 p-2 bg-slate-950 rounded text-[11px] text-slate-400 overflow-x-auto">
              {code}
            </pre>
          </div>
        ) : svgHtml ? (
          <div
            className="transition-transform duration-150 origin-center select-none"
            style={{ transform: `scale(${scale})` }}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            Rendering architecture diagram...
          </div>
        )}
      </div>
    </div>
  );
};

