import React, { useState, useEffect } from 'react';
import { getGitHubToken, saveGitHubToken, GITHUB_REPO_OWNER, GITHUB_REPO_NAME } from '../services/githubService';
import type { GitHubApiStatus } from '../types/hub';
import { Key, Github, CheckCircle2, X } from 'lucide-react';

interface GitHubTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: GitHubApiStatus;
  onRefreshLive: () => void;
}

export const GitHubTokenModal: React.FC<GitHubTokenModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefreshLive,
}) => {
  const [token, setToken] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setToken(getGitHubToken());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveGitHubToken(token);
    setSavedSuccess(true);
    setTimeout(() => {
      onRefreshLive();
      onClose();
    }, 800);
  };

  const handleClear = () => {
    setToken('');
    saveGitHubToken('');
    setSavedSuccess(true);
    setTimeout(() => {
      onRefreshLive();
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40">
      <div
        className="w-full max-w-md bg-white border border-hairline rounded-lg shadow-xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-hairline bg-paper-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github className="w-4 h-4 text-ink" />
            <span className="font-serif font-bold text-sm text-ink">
              Cấu hình GitHub Live API
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-muted hover:text-ink rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Live Status Card */}
          <div className="p-3 bg-paper rounded-md border border-hairline space-y-1.5 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Repository:</span>
              <span className="font-semibold text-ink">
                {GITHUB_REPO_OWNER}/{GITHUB_REPO_NAME}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500">Nguồn dữ liệu:</span>
              <span className="flex items-center gap-1 font-semibold text-accent">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                {status?.source === 'live-api'
                  ? 'GitHub API trực tiếp'
                  : status?.source === 'cached'
                  ? 'Bộ nhớ tạm (Cache)'
                  : 'Dự phòng (Static Fallback)'}
              </span>
            </div>
            {status?.rateLimitRemaining !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-stone-500">Lượt gọi còn lại:</span>
                <span className="font-semibold text-ink">
                  {status.rateLimitRemaining} / {getGitHubToken() ? '5,000' : '60'} req/h
                </span>
              </div>
            )}
            {status?.lastFetchedAt && (
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span>Cập nhật gần nhất:</span>
                <span>{status.lastFetchedAt}</span>
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="space-y-1 text-stone-600 leading-relaxed">
            <p className="font-medium text-ink">Tùy chọn: GitHub Personal Access Token</p>
            <p>
              Mặc định, trang web gọi trực tiếp GitHub API không cần đăng nhập (giới hạn 60 lượt/giờ/IP).
              Nếu bạn muốn tăng hạn mức lên <strong>5,000 lượt/giờ</strong>, hãy dán một Personal Access Token (classic hoặc fine-grained với quyền <code>public_repo</code> read-only).
            </p>
            <p className="text-[11px] text-stone-500 italic">
              🔒 Token chỉ được lưu tại <code>localStorage</code> trên trình duyệt của bạn và không bao giờ gửi đến bất kỳ server bên thứ 3 nào.
            </p>
          </div>

          {/* Token Input */}
          <div className="space-y-1.5">
            <label className="block font-medium text-ink">
              Personal Access Token:
            </label>
            <div className="relative">
              <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                placeholder="ghp_... hoặc github_pat_..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-paper-subtle border border-hairline rounded font-mono text-xs text-ink focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {savedSuccess && (
            <div className="flex items-center gap-1.5 text-green-700 bg-green-50 p-2 rounded border border-green-200 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đã lưu thành công! Đang tải lại commit từ GitHub...</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-paper-subtle border-t border-hairline flex items-center justify-between">
          {token ? (
            <button
              onClick={handleClear}
              className="text-stone-500 hover:text-red-600 text-xs font-medium"
            >
              Xóa token
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 border border-hairline rounded text-xs text-ink-muted hover:text-ink hover:bg-stone-100"
            >
              Đóng
            </button>
            <button
              onClick={handleSave}
              className="px-3.5 py-1.5 bg-ink text-paper rounded text-xs font-semibold hover:bg-stone-800 transition-colors"
            >
              Lưu & Làm mới
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
