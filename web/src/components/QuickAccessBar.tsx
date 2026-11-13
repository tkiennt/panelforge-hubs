import React from 'react';
import {
  Sparkles,
  Search,
  FileCheck2,
  Layers,
  Cpu,
  FolderTree,
  BookOpen,
  ClipboardList,
} from 'lucide-react';

interface QuickAccessBarProps {
  currentSlug: string;
  onSelectDoc: (slug: string) => void;
}

export const QUICK_PINNED_DOCS = [
  {
    title: 'V2.6 Master Spec',
    slug: 'V2.6/PANELFORGE_MASTER_SPECIFICATION_V2_6',
    icon: Sparkles,
    badge: 'V2.6 FINAL',
    highlight: true,
  },
  {
    title: 'Implementation Plan',
    slug: 'note/PANELFORGE_V2_6_IMPLEMENTATION_PLAN',
    icon: Search,
    badge: 'Plan',
  },
  {
    title: 'Audit Logs',
    slug: 'tracking/AUDIT_LOGS',
    icon: FileCheck2,
    badge: 'Logs',
  },
  {
    title: 'Team Workboard',
    slug: 'tracking/TEAM_WORKBOARD',
    icon: ClipboardList,
    badge: 'Tasks',
  },
  {
    title: 'Clean Architecture',
    slug: 'architecture/clean-architecture-structure',
    icon: Cpu,
    badge: 'Backend',
  },
  {
    title: 'Chapter & Script Spec',
    slug: 'spec/CHAPTER_AND_SCRIPT_SPECIFICATION',
    icon: Layers,
    badge: 'Spec',
  },
  {
    title: 'Structure Guide',
    slug: 'STRUCTURE_GUIDE',
    icon: FolderTree,
    badge: 'Repos',
  },
  {
    title: 'Quy tắc SSOT',
    slug: 'README',
    icon: BookOpen,
    badge: 'Bắt buộc',
  },
];

export const QuickAccessBar: React.FC<QuickAccessBarProps> = ({
  currentSlug,
  onSelectDoc,
}) => {
  return (
    <div className="bg-[#FAF9F5] border-b border-[#E5E2DC] px-4 lg:px-8 py-2 overflow-x-auto">
      <div className="flex items-center gap-1.5 min-w-max text-xs">
        <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold mr-1 flex items-center gap-1">
          <span>⚡ Lối tắt:</span>
        </span>

        {QUICK_PINNED_DOCS.map((doc) => {
          const isActive = currentSlug === doc.slug;
          const Icon = doc.icon;

          return (
            <button
              key={doc.slug}
              onClick={() => onSelectDoc(doc.slug)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11.5px] font-medium transition-colors border ${
                isActive
                  ? 'bg-ink text-paper border-ink font-semibold shadow-sm'
                  : doc.highlight
                  ? 'bg-orange-50/70 border-accent/30 text-accent hover:bg-orange-100 hover:border-accent'
                  : 'bg-white border-[#E5E2DC] text-stone-700 hover:text-ink hover:border-stone-400'
              }`}
            >
              <Icon className={`w-3 h-3 ${isActive ? 'text-accent' : doc.highlight ? 'text-accent' : 'text-stone-400'}`} />
              <span>{doc.title}</span>
              {doc.badge && (
                <span
                  className={`text-[9.5px] font-mono px-1 py-0.2 rounded ${
                    isActive
                      ? 'bg-stone-800 text-stone-200'
                      : doc.highlight
                      ? 'bg-accent/10 text-accent font-bold'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {doc.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
