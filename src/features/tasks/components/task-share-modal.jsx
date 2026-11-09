import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Bookmark,
  CheckSquare,
  AlertCircle,
  Zap,
  List,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

const TYPE_ICONS = {
  Story: { icon: Bookmark, color: '#36B37E' },
  Task: { icon: CheckSquare, color: '#0052CC' },
  Bug: { icon: AlertCircle, color: '#FF5630' },
  Epic: { icon: Zap, color: '#6554C0' },
  'Sub-task': { icon: List, color: '#00B8D9' },
  Improvement: { icon: TrendingUp, color: '#FFAB00' },
};

export const TaskShareModal = ({ open, onClose, task, workspaceId }) => {
  const [copiedType, setCopiedType] = useState(null); // 'url' | 'keyTitle' | 'markdown'

  if (!open || !task) return null;

  const taskId = task.id || task.$id;
  const taskKey = task.key || 'TASK';
  const taskName = task.name || 'Untitled Issue';
  const issueType = task.issueType || task.issue_type || 'Task';
  const typeConfig = TYPE_ICONS[issueType] || TYPE_ICONS.Task;
  const TypeIcon = typeConfig.icon;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/workspaces/${workspaceId || task.workspaceId || task.workspace_id}/tasks/${taskId}`;
  const keyTitle = `${taskKey}: ${taskName}`;
  const markdownLink = `[${taskKey}: ${taskName}](${shareUrl})`;

  const handleCopy = async (text, type, label) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedType(type);
      toast.success(`${label} copied to clipboard!`);
      setTimeout(() => {
        setCopiedType(null);
      }, 2500);
    } catch (err) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: keyTitle,
          text: `Check out ${keyTitle} on KlanServiceHub`,
          url: shareUrl,
        });
        toast.success('Shared successfully!');
      } catch (e) {
        if (e.name !== 'AbortError') {
          handleCopy(shareUrl, 'url', 'Link');
        }
      }
    } else {
      handleCopy(shareUrl, 'url', 'Link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-neutral-200/90 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/70">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100/80 shadow-2xs">
              <Share2 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Share Ticket</h3>
              <p className="text-[11px] text-neutral-500">Collaborate with your team</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Ticket Card Preview */}
          <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <TypeIcon className="size-4 shrink-0" style={{ color: typeConfig.color }} />
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60">
                {taskKey}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-white px-1.5 py-0.5 rounded border border-neutral-200">
                {issueType}
              </span>
              {task.status && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  {task.status}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-neutral-800 line-clamp-2 leading-relaxed">
              {taskName}
            </p>
          </div>

          {/* Direct Permalink Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-700">Ticket Permalink</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 text-xs font-mono text-neutral-600 bg-neutral-100/70 border border-neutral-300 rounded-xl focus:outline-none selection:bg-blue-100"
              />
              <button
                type="button"
                onClick={() => handleCopy(shareUrl, 'url', 'Link')}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition shadow-xs shrink-0 ${
                  copiedType === 'url'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {copiedType === 'url' ? (
                  <>
                    <Check className="size-3.5 stroke-[2.5]" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Copy Variations */}
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Quick Formats
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCopy(keyTitle, 'keyTitle', 'Key & Summary')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 hover:border-blue-400 bg-white hover:bg-blue-50/30 transition text-left group"
              >
                <div className="truncate pr-1">
                  <div className="text-[11px] font-bold text-neutral-800 group-hover:text-blue-700">
                    Key & Title
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">{keyTitle}</div>
                </div>
                {copiedType === 'keyTitle' ? (
                  <Check className="size-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                ) : (
                  <Copy className="size-3.5 text-neutral-400 group-hover:text-blue-600 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleCopy(markdownLink, 'markdown', 'Markdown link')}
                className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 hover:border-blue-400 bg-white hover:bg-blue-50/30 transition text-left group"
              >
                <div className="truncate pr-1">
                  <div className="text-[11px] font-bold text-neutral-800 group-hover:text-blue-700">
                    Markdown Link
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">[Key: Title](url)</div>
                </div>
                {copiedType === 'markdown' ? (
                  <Check className="size-3.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                ) : (
                  <Copy className="size-3.5 text-neutral-400 group-hover:text-blue-600 shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Native Web Share Button */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition"
            >
              <Share2 className="size-3.5" />
              <span>Share via System (Slack, Teams, Email, WhatsApp)</span>
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-100 bg-neutral-50/60 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-neutral-600 hover:text-neutral-900 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
