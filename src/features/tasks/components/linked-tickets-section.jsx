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
  BACKLOG: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  TODO: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-800 border-amber-200',
  IN_REVIEW: 'bg-purple-50 text-purple-800 border-purple-200',
  CODE_REVIEW: 'bg-purple-50 text-purple-800 border-purple-200',
  REVIEW: 'bg-purple-50 text-purple-800 border-purple-200',
  TESTING: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  DONE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  RESOLVED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const GROUP_CONFIG = {
  blocks: {
    title: 'Blocks',
    description: 'Tickets prevented from progressing by this ticket',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: ShieldAlert,
  },
  isBlockedBy: {
    title: 'Is Blocked By',
    description: 'Tickets this ticket depends upon',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    icon: AlertCircle,
  },
  relatesTo: {
    title: 'Relates To',
    description: 'Related tickets without direct blocking dependency',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Link2,
  },
  duplicates: {
    title: 'Duplicates / Duplicated By',
    description: 'Duplicate ticket references',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: GitCommit,
  },
  clones: {
    title: 'Clones / Cloned By',
    description: 'Ticket clones and copies',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
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
      toast.success('Relationship description updated');
      setEditingLinkId(null);
      fetchLinksAndDependencies();
    } catch (err) {
      toast.error('Failed to update description');
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
    <div className="space-y-4 pt-2">
      <UnlinkDialog />

      {/* Prominent Dependency Blocker Banner */}
      <DependencyBanner
        unresolvedBlockers={unresolvedBlockers}
        onNavigateToTicket={onNavigateToTicket}
      />

      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Link2 className="size-4 text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
            Linked Tickets & Dependencies
          </h3>
          <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {totalLinks}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowLinkModal(true)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200 cursor-pointer shadow-2xs"
        >
          <Plus className="size-3.5" />
          <span>Link Ticket</span>
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
        <div className="p-6 text-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50/50 space-y-2">
          <p className="text-xs text-neutral-500">
            No linked tickets or dependencies yet for this ticket.
          </p>
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-neutral-300 rounded-lg hover:border-blue-400 transition shadow-2xs"
          >
            <Plus className="size-3.5" />
            <span>Link a Ticket</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(GROUP_CONFIG).map(([groupKey, config]) => {
            const items = grouped[groupKey] || [];
            if (items.length === 0) return null;

            const isCollapsed = collapsedGroups[groupKey];
            const GroupIcon = config.icon;

            return (
              <div
                key={groupKey}
                className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs"
              >
                {/* Group Header */}
                <div
                  onClick={() => toggleGroup(groupKey)}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-neutral-50/80 border-b border-neutral-200 cursor-pointer hover:bg-neutral-100/60 transition select-none"
                >
                  <div className="flex items-center gap-2">
                    <GroupIcon className="size-3.5 text-neutral-600" />
                    <span className="text-xs font-bold text-neutral-800">
                      {config.title}
                    </span>
                    <span className={`text-2xs font-extrabold px-1.5 py-0.2 rounded-full border ${config.badgeColor}`}>
                      {items.length}
                    </span>
                    <span className="text-2xs text-neutral-400 hidden sm:inline">
                      — {config.description}
                    </span>
                  </div>
                  <button className="text-neutral-400 hover:text-neutral-700">
                    {isCollapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
                  </button>
                </div>

                {/* Items List */}
                {!isCollapsed && (
                  <div className="divide-y divide-neutral-100">
                    {items.map((link) => {
                      const t = link.ticket;
                      const typeCfg = TYPE_ICONS[t.issueType || 'Task'] || TYPE_ICONS.Task;
                      const TypeIcon = typeCfg.icon;
                      const statusClass = STATUS_COLORS[t.status] || 'bg-neutral-100 text-neutral-700 border-neutral-300';
                      const isBlocker = link.isUnresolvedBlocker;
                      const isEditing = editingLinkId === link.id;

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
                          className={`p-3 transition flex flex-col gap-2 ${
                            isBlocker ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-neutral-50/60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            {/* Left: Key, Type, Title */}
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <TypeIcon className="size-3.5 shrink-0" style={{ color: typeCfg.color }} />
                              <button
                                type="button"
                                onClick={() => onNavigateToTicket && onNavigateToTicket(t.id)}
                                className="font-mono font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                                title="Open ticket details"
                              >
                                {t.key || 'TASK'}
                              </button>
                              <span
                                onClick={() => onNavigateToTicket && onNavigateToTicket(t.id)}
                                className="text-xs text-neutral-800 truncate cursor-pointer hover:text-blue-600 font-medium"
                                title={t.title || t.name}
                              >
                                {t.title || t.name}
                              </span>
                            </div>

                            {/* Right: Relationship Badge, Status, Priority, Assignee, Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              {/* Relationship Type Badge */}
                              <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200">
                                {link.relationshipType}
                              </span>

                              {/* Status Badge */}
                              <span className={`text-2xs font-bold px-2 py-0.5 rounded-md border uppercase ${statusClass}`}>
                                {t.status}
                              </span>

                              {/* Priority */}
                              {t.priority && (
                                <span className="text-2xs font-semibold text-neutral-500 uppercase px-1.5 py-0.5 rounded bg-neutral-50 border border-neutral-200">
                                  {t.priority}
                                </span>
                              )}

                              {/* Assignee */}
                              {t.assignee ? (
                                <div className="flex items-center gap-1 text-2xs text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200" title={t.assignee.name}>
                                  {t.assignee.avatarUrl ? (
                                    <img src={t.assignee.avatarUrl} alt="" className="size-3.5 rounded-full object-cover" />
                                  ) : (
                                    <div className="size-3.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-3xs font-bold">
                                      {t.assignee.name.charAt(0)}
                                    </div>
                                  )}
                                  <span className="max-w-[80px] truncate">{t.assignee.name}</span>
                                </div>
                              ) : (
                                <span className="text-2xs text-neutral-400 italic">Unassigned</span>
                              )}

                              {/* Creation Date */}
                              {formattedDate && (
                                <span className="text-3xs text-neutral-400 hidden sm:inline">
                                  {formattedDate}
                                </span>
                              )}

                              {/* Unlink Action */}
                              <button
                                type="button"
                                onClick={() => handleUnlink(link.id, t.key)}
                                className="p-1 rounded-md text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Remove relationship"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Optional Description / Notes */}
                          {isEditing ? (
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                type="text"
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="Add note or description..."
                                className="flex-1 text-xs px-2.5 py-1 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                              />
                              <button
                                onClick={() => handleSaveDescription(link.id)}
                                className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <Check className="size-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingLinkId(null)}
                                className="p-1 rounded bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ) : (
                            link.description ? (
                              <div className="flex items-center justify-between text-2xs text-neutral-500 bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-100">
                                <span className="italic">"{link.description}"</span>
                                <button
                                  onClick={() => {
                                    setEditingLinkId(link.id);
                                    setEditDesc(link.description || '');
                                  }}
                                  className="text-neutral-400 hover:text-blue-600 ml-2"
                                  title="Edit note"
                                >
                                  <Edit2 className="size-2.5" />
                                </button>
                              </div>
                            ) : null
                          )}
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
