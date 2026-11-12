import React, { useState } from 'react';
import { STATIC_FEATURE_AUDIT } from '../services/dataService';
import type { FeatureAuditItem } from '../types/hub';
import { CheckCircle2, Clock, GitCommit, Layers, ExternalLink, ShieldCheck, ArrowRight, Search, Filter } from 'lucide-react';

export const FeatureAuditView: React.FC = () => {
  const [selectedAudit, setSelectedAudit] = useState<FeatureAuditItem | null>(STATIC_FEATURE_AUDIT[0]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');

  const modules = ['ALL', ...Array.from(new Set(STATIC_FEATURE_AUDIT.map((item) => item.module)))];

  const filteredAudits = STATIC_FEATURE_AUDIT.filter((item) => {
    const matchesSearch =
      item.featureName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.newVersionV26.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.rationale.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesModule = moduleFilter === 'ALL' || item.module === moduleFilter;

    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5" />
              BẢN KIỂM TOÁN CHỨC NĂNG (V2.0/V2.5 VS V2.6 FINAL)
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Feature Audit & Architecture Evolution
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Đối chiếu chi tiết từng chức năng giữa kiến trúc ban đầu và bản chuẩn hóa tối cao V2.6.
              Mọi cập nhật được chứng thực qua commit hash từ 3 repositories Backend, Frontend và Mobile.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-[11px] font-medium text-emerald-500">SSOT V2.6 Aligned</div>
            </div>
            <div className="px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-center">
              <div className="text-2xl font-bold">{STATIC_FEATURE_AUDIT.length}</div>
              <div className="text-[11px] font-medium text-indigo-400">Core Audited Areas</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm chức năng, từ khóa, thay đổi V2.6, lý do kiến trúc..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {modules.map((m) => (
                <option key={m} value={m}>
                  {m === 'ALL' ? 'Tất cả Module' : m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content: Split List and Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Audit Feature Cards List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Danh sách tính năng đã kiểm toán ({filteredAudits.length})
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {filteredAudits.map((item) => {
              const isSelected = selectedAudit?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedAudit(item)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/90 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700">
                      {item.code}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-400 line-clamp-1">
                    {item.featureName}
                  </h3>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-slate-500" />
                    <span>{item.module}</span>
                  </div>

                  <div className="mt-2.5 text-xs text-slate-300 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 line-clamp-2">
                    <span className="text-indigo-400 font-medium">V2.6:</span> {item.newVersionV26}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Deep Inspection View */}
        <div className="lg:col-span-7">
          {selectedAudit ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xl space-y-6 sticky top-6">
              {/* Feature Title and Code */}
              <div className="border-b border-slate-800 pb-5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-mono px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    {selectedAudit.code}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Module: <strong className="text-slate-200">{selectedAudit.module}</strong></span>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {selectedAudit.featureName}
                </h2>
              </div>

              {/* Side by side comparison (Old vs New) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Old Version Card */}
                <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-4.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    Bản cũ (V2.0 / V2.5)
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {selectedAudit.oldVersion}
                  </p>
                </div>

                {/* New V2.6 Version Card */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Bản chuẩn hóa V2.6 Final
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {selectedAudit.newVersionV26}
                  </p>
                </div>
              </div>

              {/* Architectural Rationale */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  Lý do kỹ thuật & Giá trị kiến trúc
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {selectedAudit.rationale}
                </p>
              </div>

              {/* Commits Verified Across Repositories */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5 text-slate-500" />
                  Các commit chứng thực (Verified Repositories)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {selectedAudit.commits.map((c, idx) => (
                    <a
                      key={idx}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500 hover:bg-slate-800 transition-all text-xs group"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            c.repo === 'BE'
                              ? 'bg-blue-500/20 text-blue-400'
                              : c.repo === 'FE'
                              ? 'bg-cyan-500/20 text-cyan-400'
                              : c.repo === 'MOBILE'
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {c.repo}
                        </span>
                        <span className="font-mono text-slate-300 group-hover:text-indigo-300">
                          {c.hash.slice(0, 7)}
                        </span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-indigo-400" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
              Chọn một tính năng bên trái để xem bản đối chiếu chi tiết.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
