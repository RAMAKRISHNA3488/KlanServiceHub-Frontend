'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Link2,
  Search,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Bookmark,
  CheckSquare,
  Zap,
  List,
  TrendingUp,
} from 'lucide-react';
import { tasksApi, ticketLinksApi } from '@/lib/api-client';
import { toast } from 'sonner';

const RELATIONSHIP_OPTIONS = [
  {
    value: 'blocks',
    label: 'Blocks',
    description: 'This ticket prevents the selected ticket from progressing',
  },
  {
    value: 'is blocked by',
    label: 'Is Blocked By',
    description: 'This ticket depends on the selected ticket to progress',
  },
  {
    value: 'relates to',
    label: 'Relates To',
    description: 'Associated tickets with no direct dependency',
  },
  {
    value: 'duplicates',
    label: 'Duplicates',
    description: 'This ticket duplicates the selected ticket',
  },
  {
    value: 'is duplicated by',
    label: 'Is Duplicated By',
    description: 'The selected ticket duplicates this ticket',
  },
  {
    value: 'clones',
    label: 'Clones',
    description: 'This ticket is a copy of the selected ticket',
  },
  {
    value: 'is cloned by',
    label: 'Is Cloned By',
    description: 'The selected ticket was created as a copy of this ticket',
  },
];

const TYPE_ICONS = {
  Story: { icon: Bookmark, color: '#36B37E' },
  Task: { icon: CheckSquare, color: '#0052CC' },
  Bug: { icon: AlertCircle, color: '#FF5630' },
  Epic: { icon: Zap, color: '#6554C0' },
  'Sub-task': { icon: List, color: '#00B8D9' },
  Improvement: { icon: TrendingUp, color: '#FFAB00' },
};

export function LinkTicketModal({ isOpen, onClose, currentTask, onLinkCreated }) {
  const [relationshipType, setRelationshipType] = useState('relates to');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState('');
  const [description, setDescription] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projectTasks, setProjectTasks] = useState([]);

  const currentTaskId = currentTask?.id || currentTask?.$id;
  const currentProjectId = currentTask?.project_id || currentTask?.projectId;
  const currentWorkspaceId = currentTask?.workspace_id || currentTask?.workspaceId;

  // Fetch project tickets whenever modal opens
  useEffect(() => {
    if (!isOpen || !currentProjectId || !currentWorkspaceId) return;

    let mounted = true;
    setLoadingTasks(true);
    setSelectedTicketId('');
    setSearchQuery('');
    setDescription('');
    setRelationshipType('relates to');

    tasksApi.getTasks({
      workspaceId: currentWorkspaceId,
      projectId: currentProjectId,
      limit: 100,
    })
      .then((res) => {
        if (!mounted) return;
        const tasks = res?.data?.documents || res?.data || [];
        setProjectTasks(Array.isArray(tasks) ? tasks : []);
      })
      .catch((err) => {
        console.error('Failed to load project tickets for linking:', err);
        toast.error('Failed to load tickets for linking');
      })
      .finally(() => {
        if (mounted) setLoadingTasks(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, currentProjectId, currentWorkspaceId]);

  // Filter tasks (exclude current ticket and match search query)
  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return projectTasks.filter((t) => {
      const tId = t.id || t.$id;
      if (tId === currentTaskId) return false;
      if (!q) return true;
      const key = (t.key || '').toLowerCase();
      const name = (t.name || '').toLowerCase();
      return key.includes(q) || name.includes(q);
    });
  }, [projectTasks, searchQuery, currentTaskId]);

  const selectedTicket = useMemo(() => {
    return projectTasks.find((t) => (t.id || t.$id) === selectedTicketId) || null;
  }, [projectTasks, selectedTicketId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicketId) {
      toast.error('Please select a ticket to link');
      return;
    }

    try {
      setSubmitting(true);
      const res = await ticketLinksApi.createLink({
        sourceTicketId: currentTaskId,
        targetTicketId: selectedTicketId,
        relationshipType,
        description: description.trim(),
      });

      if (res?.error) {
        toast.error(res.error);
        return;
      }

      toast.success('Tickets linked successfully');
      if (onLinkCreated) onLinkCreated(res?.data);
      onClose();
    } catch (err) {
      const msg = err?.message || 'Failed to create ticket link';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">
              <Link2 className="size-4" />
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-neutral-900">Link Tickets</h3>
              <p className="text-[11px] text-neutral-500">
                Connect <span className="font-semibold text-neutral-700">{currentTask?.key || 'current ticket'}</span> with another ticket
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Relationship Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-700">
              Relationship Type <span className="text-red-500">*</span>
            </label>
            <select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              className="w-full px-2.5 py-1.5 text-[12px] font-medium bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label} — {opt.description}
                </option>
              ))}
            </select>
          </div>

          {/* Search & Select Target Ticket */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-neutral-700">
                Select Ticket in Same Project <span className="text-red-500">*</span>
              </label>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                Same project
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by key (e.g. PROJ-12) or summary..."
                className="w-full pl-8 pr-3 py-1.5 text-[12px] bg-neutral-50/50 border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Ticket Selection List */}
            <div className="border border-neutral-200 rounded-lg max-h-44 overflow-y-auto divide-y divide-neutral-100 bg-white">
              {loadingTasks ? (
                <div className="p-4 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
                  <Loader2 className="size-3.5 animate-spin text-blue-600" />
                  Loading project tickets...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-[11px] text-neutral-500">
                  {searchQuery ? 'No matching tickets found.' : 'No other tickets found in this project.'}
                </div>
              ) : (
                filteredTasks.map((t) => {
                  const tId = t.id || t.$id;
                  const isSelected = selectedTicketId === tId;
                  const typeCfg = TYPE_ICONS[t.issue_type || t.issueType || 'Task'] || TYPE_ICONS.Task;
                  const TypeIcon = typeCfg.icon;

                  return (
                    <div
                      key={tId}
                      onClick={() => setSelectedTicketId(tId)}
                      className={`flex items-center justify-between px-3 py-2 cursor-pointer text-[12px] transition-colors ${
                        isSelected
                          ? 'bg-blue-50/80 text-blue-900 font-medium'
                          : 'hover:bg-neutral-50 text-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <TypeIcon className="size-3.5 shrink-0" style={{ color: typeCfg.color }} />
                        <span className="font-mono font-semibold text-[11px] text-neutral-700 shrink-0">
                          {t.key || 'TASK'}
                        </span>
                        <span className="truncate text-neutral-800 text-[12px]">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600 border border-neutral-200">
                          {t.status}
                        </span>
                        {isSelected && <CheckCircle2 className="size-3.5 text-blue-600 shrink-0" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {selectedTicket && (
              <div className="text-[11px] text-emerald-700 bg-emerald-50/80 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span className="truncate">
                  Selected: <strong className="font-semibold">{selectedTicket.key}</strong> — {selectedTicket.name}
                </span>
              </div>
            )}
          </div>

          {/* Optional Description / Comment */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-neutral-700">
              Optional Note or Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Depends on backend schema migration before UI work can begin..."
              className="w-full px-2.5 py-1.5 text-[12px] bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-3 py-1.5 text-[11px] font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedTicketId}
              className="px-3 py-1.5 text-[11px] font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              {submitting && <Loader2 className="size-3 animate-spin" />}
              <span>Link ticket</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LinkTicketModal;
