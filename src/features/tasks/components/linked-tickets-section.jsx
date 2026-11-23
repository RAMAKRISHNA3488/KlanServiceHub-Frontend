'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Link2,
  Plus,
  Trash2,
  ExternalLink,
  ShieldAlert,
  AlertCircle,
  Bookmark,
  CheckSquare,
  Zap,
  List,
  TrendingUp,
  Clock,
  User,
  ArrowRight,
  GitCommit,
  Edit2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ticketLinksApi } from '@/lib/api-client';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from 'sonner';
import { LinkTicketModal } from './link-ticket-modal';
import { DependencyBanner } from './dependency-banner';
import { DependencyVisualizer } from './dependency-visualizer';

const TYPE_ICONS = {
  Story: { icon: Bookmark, color: '#36B37E' },
  Task: { icon: CheckSquare, color: '#0052CC' },
  Bug: { icon: AlertCircle, color: '#FF5630' },
  Epic: { icon: Zap, color: '#6554C0' },
  'Sub-task': { icon: List, color: '#00B8D9' },
  Improvement: { icon: TrendingUp, color: '#FFAB00' },
};

const STATUS_COLORS = {
  BACKLOG: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  TODO: 'bg-slate-50 text-slate-700 border-slate-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
  CODE_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
  REVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
  TESTING: 'bg-amber-50 text-amber-700 border-amber-200',
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

function formatStatusLabel(status) {
  if (!status) return 'To Do';
  const s = String(status).trim().toUpperCase();
  if (s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'IN_REVIEW' || s === 'CODE_REVIEW' || s === 'REVIEW') return 'In Review';
  if (s === 'DONE' || s === 'RESOLVED') return 'Done';
  if (s === 'TODO' || s === 'TO_DO') return 'To Do';
  if (s === 'BACKLOG') return 'Backlog';
  if (s === 'TESTING' || s === 'TEST') return 'Testing';
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ');
}

function formatPriorityLabel(priority) {
  if (!priority) return '';
  const p = String(priority).trim().toUpperCase();
  if (p === 'MEDIUM') return 'Medium';
  if (p === 'HIGH') return 'High';
  if (p === 'HIGHEST' || p === 'CRITICAL') return 'Critical';
  if (p === 'LOW') return 'Low';
  if (p === 'LOWEST') return 'Lowest';
  return p.charAt(0) + p.slice(1).toLowerCase();
}

const GROUP_CONFIG = {
  blocks: {
    title: 'Blocks',
    description: 'Tickets prevented from progressing by this ticket',
    icon: ShieldAlert,
  },
  isBlockedBy: {
    title: 'Is Blocked By',
    description: 'Tickets this ticket depends upon',
    icon: AlertCircle,
  },
  relatesTo: {
    title: 'Relates To',
    description: 'Related tickets without direct blocking dependency',
    icon: Link2,
  },
  duplicates: {
    title: 'Duplicates / Duplicated By',
    description: 'Duplicate ticket references',
    icon: GitCommit,
  },
  clones: {
    title: 'Clones / Cloned By',
    description: 'Ticket clones and copies',
    icon: GitCommit,
  },
};

export function LinkedTicketsSection({
  currentTask,
  onNavigateToTicket,
  onRefreshTask,
}) {
  const [linksData, setLinksData] = useState(null);
  const [dependenciesData, setDependenciesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [editDesc, setEditDesc] = useState('');

  const [UnlinkDialog, confirmUnlink] = useConfirm(
    'Unlink Ticket',
    'Are you sure you want to remove the relationship between these tickets? This action will be logged in activity history.',
    'destructive'
  );

  const currentTaskId = currentTask?.id || currentTask?.$id;

  const fetchLinksAndDependencies = useCallback(async () => {
    if (!currentTaskId) return;
    try {
      setLoading(true);
      const [linksRes, depRes] = await Promise.all([
        ticketLinksApi.getLinks(currentTaskId),
        ticketLinksApi.getDependencies(currentTaskId).catch(() => null),
      ]);

      if (linksRes?.data) {
        setLinksData(linksRes.data);
      }
      if (depRes?.data) {
        setDependenciesData(depRes.data);
      }
    } catch (err) {
      console.error('Error fetching ticket links:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTaskId]);

  useEffect(() => {
    fetchLinksAndDependencies();
  }, [fetchLinksAndDependencies]);

  const handleUnlink = async (linkId, targetKey) => {
    const ok = await confirmUnlink();
    if (!ok) return;

    try {
      await ticketLinksApi.deleteLink(linkId);
      toast.success(`Removed link with ${targetKey || 'ticket'}`);
      fetchLinksAndDependencies();
      if (onRefreshTask) onRefreshTask();
    } catch (err) {
      toast.error('Failed to remove relationship');
    }
  };

  const handleSaveDescription = async (linkId) => {
    try {
      await ticketLinksApi.updateLink(linkId, { description: editDesc });
      toast.success('Relationship note updated');
      setEditingLinkId(null);
      fetchLinksAndDependencies();
    } catch (err) {
      toast.error('Failed to update note');
    }
  };

  const toggleGroup = (groupKey) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const grouped = linksData?.grouped || {
    blocks: [],
    isBlockedBy: [],
    relatesTo: [],
    duplicates: [],
    clones: [],
  };

  const totalLinks = linksData?.totalLinks || 0;
  const unresolvedBlockers = grouped.isBlockedBy?.filter((item) => item.isUnresolvedBlocker) || [];

  return (
    <div className="space-y-3 pt-1">
      <UnlinkDialog />

      {/* Prominent Dependency Blocker Banner */}
      <DependencyBanner
        unresolvedBlockers={unresolvedBlockers}
        onNavigateToTicket={onNavigateToTicket}
      />

      {/* Refined Minimalist Section Toolbar */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Link2 className="size-3.5 text-blue-600" />
          <h3 className="text-[13px] font-semibold text-neutral-800">
            Linked Tickets & Dependencies
          </h3>
          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
            {totalLinks}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowLinkModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium text-neutral-700 bg-white hover:bg-neutral-50 hover:text-neutral-900 border border-neutral-300 rounded-md shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="size-3 text-neutral-500" />
          <span>Link ticket</span>
        </button>
      </div>

      {/* Visual Dependency Flow Chains (if dependencies exist) */}
      {dependenciesData?.visualChains?.length > 0 && (
        <DependencyVisualizer
          currentTicketId={currentTaskId}
          visualChains={dependenciesData.visualChains}
          onNavigateToTicket={onNavigateToTicket}
        />
      )}

      {/* Grouped Links List */}
      {totalLinks === 0 ? (
        <div className="p-5 text-center rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 space-y-2">
          <p className="text-[12px] text-neutral-500">
            No linked tickets or dependencies yet for this ticket.
          </p>
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-neutral-700 bg-white border border-neutral-300 rounded-md hover:bg-neutral-50 hover:text-neutral-900 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="size-3 text-neutral-500" />
            <span>Link a ticket</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {Object.entries(GROUP_CONFIG).map(([groupKey, config]) => {
            const items = grouped[groupKey] || [];
            if (items.length === 0) return null;

            const isCollapsed = collapsedGroups[groupKey];
            const GroupIcon = config.icon;

            return (
              <div
                key={groupKey}
                className="rounded-lg border border-neutral-200 bg-white overflow-hidden shadow-2xs"
              >
                {/* Clean Group Header */}
                <div
                  onClick={() => toggleGroup(groupKey)}
                  className="flex items-center justify-between px-3 py-2 bg-neutral-50/70 border-b border-neutral-200 cursor-pointer hover:bg-neutral-100/50 transition-colors select-none"
                >
                  <div className="flex items-center gap-2">
                    <GroupIcon className="size-3.5 text-neutral-500" />
                    <span className="text-[12px] font-semibold text-neutral-800">
                      {config.title}
                    </span>
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200">
                      {items.length}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-normal hidden sm:inline">
                      — {config.description}
                    </span>
                  </div>
                  <button type="button" className="text-neutral-400 hover:text-neutral-600">
                    {isCollapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
                  </button>
                </div>

                {/* Items List */}
                {!isCollapsed && (
                  <div className="divide-y divide-neutral-100">
                    {items.map((link) => {
                      const t = link.ticket || {};
                      const typeCfg = TYPE_ICONS[t.issueType || 'Task'] || TYPE_ICONS.Task;
                      const TypeIcon = typeCfg.icon;
                      const statusClass = STATUS_COLORS[t.status] || 'bg-neutral-100 text-neutral-600 border-neutral-200';
                      const isBlocker = link.isUnresolvedBlocker;
                      const isEditing = editingLinkId === link.id;
                      const ticketTitle = (t.title || t.name || '').trim() || '(No summary)';

                      const formattedDate = link.createdAt
                        ? new Date(link.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : '';

                      return (
                        <div
                          key={link.id}
                          className={`px-3 py-2 transition-colors flex flex-col gap-1 ${
                            isBlocker ? 'bg-rose-50/40 hover:bg-rose-50/60' : 'hover:bg-neutral-50/80'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 min-w-0">
                            {/* Left: Type Icon, Ticket Key, Title */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <TypeIcon className="size-3.5 shrink-0" style={{ color: typeCfg.color }} />
                              <button
                                type="button"
                                onClick={() => onNavigateToTicket && onNavigateToTicket(t.id)}
                                className="font-mono font-semibold text-[11px] text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                                title="Open ticket details"
                              >
                                {t.key || 'TASK'}
                              </button>
                              <span
                                onClick={() => onNavigateToTicket && onNavigateToTicket(t.id)}
                                className={`text-[12px] truncate cursor-pointer hover:text-blue-600 transition-colors ${
                                  ticketTitle === '(No summary)' ? 'text-neutral-400 italic' : 'text-neutral-800 font-medium'
                                }`}
                                title={ticketTitle}
                              >
                                {ticketTitle}
                              </span>
                            </div>

                            {/* Right: Assignee, Priority, Status, Date, Trash */}
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Assignee */}
                              {t.assignee ? (
                                <div
                                  className="flex items-center gap-1.5 text-[11px] text-neutral-600 bg-neutral-50 hover:bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200/60 transition-colors"
                                  title={t.assignee.name}
                                >
                                  {t.assignee.avatarUrl ? (
                                    <img src={t.assignee.avatarUrl} alt="" className="size-3.5 rounded-full object-cover" />
                                  ) : (
                                    <div className="size-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                                      {t.assignee.name.charAt(0)}
                                    </div>
                                  )}
                                  <span className="max-w-[85px] truncate font-normal">{t.assignee.name}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-neutral-400 italic hidden sm:inline">Unassigned</span>
                              )}

                              {/* Priority */}
                              {t.priority && (
                                <span className="text-[10px] font-medium text-neutral-600 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200/80">
                                  {formatPriorityLabel(t.priority)}
                                </span>
                              )}

                              {/* Status Badge */}
                              <span className={`text-[10px] font-medium uppercase px-2 py-0.5 rounded-[4px] border tracking-wide ${statusClass}`}>
                                {formatStatusLabel(t.status)}
                              </span>

                              {/* Creation Date */}
                              {formattedDate && (
                                <span className="text-[10px] text-neutral-400 font-normal hidden md:inline-block">
                                  {formattedDate}
                                </span>
                              )}

                              {/* Unlink Action */}
                              <button
                                type="button"
                                onClick={() => handleUnlink(link.id, t.key)}
                                className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Remove relationship"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Optional Note / Description or inline editor */}
                          {isEditing ? (
                            <div className="flex items-center gap-2 pt-1 pl-6">
                              <input
                                type="text"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="Add note or description..."
                                className="flex-1 text-[11px] px-2 py-0.5 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveDescription(link.id)}
                                className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                                title="Save note"
                              >
                                <Check className="size-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingLinkId(null)}
                                className="p-1 rounded bg-neutral-100 text-neutral-700 hover:bg-neutral-200 cursor-pointer"
                                title="Cancel"
                              >
                                <X className="size-3" />
                              </button>
                            </div>
                          ) : link.description ? (
                            <div className="flex items-center justify-between text-[11px] text-neutral-500 pl-6">
                              <span className="italic truncate">"{link.description}"</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingLinkId(link.id);
                                  setEditDesc(link.description || '');
                                }}
                                className="text-neutral-400 hover:text-blue-600 ml-2 cursor-pointer p-0.5"
                                title="Edit note"
                              >
                                <Edit2 className="size-2.5" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Link Ticket Modal */}
      <LinkTicketModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        currentTask={currentTask}
        onLinkCreated={() => {
          fetchLinksAndDependencies();
          if (onRefreshTask) onRefreshTask();
        }}
      />
    </div>
  );
}

export default LinkedTicketsSection;
