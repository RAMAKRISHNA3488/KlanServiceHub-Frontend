import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { sprintsApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  PlayCircle,
  CheckCircle2,
  Plus,
  Calendar,
  Layers,
  MoreVertical,
  CheckSquare,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Flame,
  AlertCircle,
} from 'lucide-react';

export const SprintsView = () => {
  const workspaceId = useWorkspaceId();
  const [sprints, setSprints] = useState([]);
  const [backlog, setBacklog] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Complete Active Sprint',
    'Are you sure you want to complete this sprint?',
    'warning'
  );

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', goal: '', startDate: '', endDate: '', status: 'ACTIVE' });

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSprint, setEditingSprint] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', goal: '', startDate: '', endDate: '', status: 'FUTURE' });

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingSprint, setDeletingSprint] = useState(null);

  // Closed Sprints Accordion toggle
  const [showClosedSprints, setShowClosedSprints] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await sprintsApi.getSprints(workspaceId);
      if (res?.data) {
        setSprints(res.data.sprints || []);
        setBacklog(res.data.backlog || []);
      }
    } catch (e) {
      toast.error('Failed to load sprints and backlog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId]);

  const handleCreateSprint = async (e) => {
    e.preventDefault();
    try {
      await sprintsApi.createSprint(workspaceId, createForm);
      toast.success(`Sprint "${createForm.name}" created successfully!`);
      setCreateModalOpen(false);
      setCreateForm({ name: '', goal: '', startDate: '', endDate: '', status: 'ACTIVE' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create sprint');
    }
  };

  const openEditModal = (sprint) => {
    setEditingSprint(sprint);
    setEditForm({
      name: sprint.name || '',
      goal: sprint.goal || '',
      startDate: sprint.startDate ? sprint.startDate.slice(0, 10) : (sprint.start_date ? sprint.start_date.slice(0, 10) : ''),
      endDate: sprint.endDate ? sprint.endDate.slice(0, 10) : (sprint.end_date ? sprint.end_date.slice(0, 10) : ''),
      status: sprint.status || 'FUTURE',
    });
    setEditModalOpen(true);
  };

  const handleUpdateSprint = async (e) => {
    e.preventDefault();
    if (!editingSprint) return;
    try {
      await sprintsApi.updateSprint(workspaceId, editingSprint.id, editForm);
      toast.success(`Sprint "${editForm.name}" updated successfully!`);
      setEditModalOpen(false);
      setEditingSprint(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update sprint');
    }
  };

  const openDeleteModal = (sprint) => {
    setDeletingSprint(sprint);
    setDeleteModalOpen(true);
  };

  const handleDeleteSprint = async () => {
    if (!deletingSprint) return;
    try {
      await sprintsApi.deleteSprint(workspaceId, deletingSprint.id);
      toast.success(`Sprint "${deletingSprint.name}" deleted. Any assigned tasks were moved to Backlog.`);
      setDeleteModalOpen(false);
      setDeletingSprint(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete sprint');
    }
  };

  const handleStartSprint = async (sprintId) => {
    try {
      await sprintsApi.startSprint(workspaceId, sprintId);
      toast.success('Sprint started!');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to start sprint');
    }
  };

  const handleCompleteSprint = async (sprintId, sprintName = 'this sprint') => {
    const ok = await confirmAction({
      title: 'Complete Active Sprint',
      message: `Are you sure you want to complete sprint "${sprintName}"?`,
      variant: 'warning',
      confirmText: 'Complete Sprint',
      warningNotice: 'Incomplete tasks will automatically be moved back to the backlog for prioritization into future sprints.'
    });
    if (!ok) return;

    try {
      await sprintsApi.completeSprint(workspaceId, sprintId);
      toast.success('Sprint completed!');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to complete sprint');
    }
  };

  const handleMoveToSprint = async (taskId, sprintId) => {
    try {
      await sprintsApi.moveTask(workspaceId, taskId, sprintId);
      toast.success('Task moved to sprint');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to move task');
    }
  };

  const handleMoveToBacklog = async (taskId) => {
    try {
      await sprintsApi.moveTask(workspaceId, taskId, null);
      toast.success('Task moved back to backlog');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to move task');
    }
  };

  const formatPriority = (p) => {
    const norm = (p || 'MEDIUM').toUpperCase();
    switch (norm) {
      case 'CRITICAL': return 'P0 - Critical';
      case 'HIGHEST':
      case 'HIGH': return 'P1 - High';
      case 'MEDIUM': return 'P2 - Medium';
      case 'LOW': return 'P3 - Low';
      case 'LOWEST': return 'P4 - Lowest';
      default: return p || 'P2 - Medium';
    }
  };

  const getPriorityBadgeClass = (p) => {
    const norm = (p || 'MEDIUM').toUpperCase();
    switch (norm) {
      case 'HIGHEST':
      case 'CRITICAL':
      case 'P0':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      case 'HIGH':
      case 'P1':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'LOW':
      case 'P3':
        return 'bg-blue-100 text-blue-700 border border-blue-200';
      case 'LOWEST':
      case 'P4':
        return 'bg-slate-100 text-slate-700 border border-slate-200';
      default:
        return 'bg-amber-100 text-amber-800 border border-amber-200';
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="size-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const activeSprints = sprints.filter((s) => (s.status || '').toUpperCase() === 'ACTIVE');
  const futureSprints = sprints.filter((s) => (s.status || '').toUpperCase() === 'FUTURE' || !['ACTIVE', 'CLOSED'].includes((s.status || '').toUpperCase()));
  const closedSprints = sprints.filter((s) => (s.status || '').toUpperCase() === 'CLOSED');

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Flame className="size-5 text-amber-500" />
            Sprints & Agile Backlog
          </h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Create, manage, and iterate Scrum sprints. Prioritize backlog tickets and track sprint completion velocity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-95"
          >
            <Plus className="size-3.5" />
            Create Sprint
          </button>
        </div>
      </div>

      {/* Active Sprints */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-2">
          <span className="inline-block size-2 rounded-full bg-emerald-500 animate-ping"></span>
          Active Sprint
        </h3>

        {activeSprints.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400 space-y-3">
            <PlayCircle className="size-8 mx-auto text-neutral-300" />
            <div>
              <p className="text-sm font-semibold text-neutral-700">No active sprint currently running.</p>
              <p className="text-xs text-neutral-400 mt-1">Start a planned sprint below or create a new active sprint to begin tracking.</p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              {futureSprints.length > 0 && (
                <button
                  onClick={() => handleStartSprint(futureSprints[0].id)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition"
                >
                  <PlayCircle className="size-3.5" />
                  Start "{futureSprints[0].name}"
                </button>
              )}
              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
              >
                <Plus className="size-3.5" />
                Create Active Sprint
              </button>
            </div>
          </div>
        ) : (
          activeSprints.map((s) => (
            <div key={s.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/20 p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-neutral-900">{s.name}</h4>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
                      ACTIVE
                    </span>
                    {(s.startDate || s.start_date) && (
                      <span className="text-[11px] text-neutral-500 flex items-center gap-1">
                        <Calendar className="size-3 text-neutral-400" />
                        {(s.startDate || s.start_date).slice(0, 10)} &rarr; {(s.endDate || s.end_date)?.slice(0, 10) || 'Ongoing'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 mt-1">
                    Goal: <span className="italic font-medium">{s.goal || 'Complete scheduled user stories & bug fixes'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-bold text-neutral-900 block">{s.progressPercent}% Completed</span>
                    <span className="text-[10px] text-neutral-400">
                      {s.completedCount} / {s.taskCount} tasks
                    </span>
                  </div>

                  <button
                    onClick={() => openEditModal(s)}
                    className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-white rounded-lg border border-neutral-200 transition shadow-xs"
                    title="Edit Sprint details"
                  >
                    <Pencil className="size-3.5" />
                  </button>

                  <button
                    onClick={() => openDeleteModal(s)}
                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-neutral-200 transition shadow-xs"
                    title="Delete Sprint"
                  >
                    <Trash2 className="size-3.5" />
                  </button>

                  <button
                    onClick={() => handleCompleteSprint(s.id, s.name)}
                    className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-neutral-800"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Complete Sprint
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${s.progressPercent}%` }} />
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                {(s.tasks || []).length === 0 ? (
                  <p className="text-xs text-neutral-400 italic py-2 text-center">No tasks in active sprint. Move tasks from backlog below.</p>
                ) : (
                  s.tasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-3 shadow-xs hover:border-neutral-300 transition"
                    >
                      <div className="flex items-center gap-3">
                        <CheckSquare className="size-4 text-blue-600 shrink-0" />
                        <span className="font-mono text-xs font-bold text-neutral-500">{t.key || 'TASK'}</span>
                        <span className="text-xs font-semibold text-neutral-900">{t.name}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${getPriorityBadgeClass(t.priority)}`}>
                          {formatPriority(t.priority)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                            t.status === 'DONE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {t.status}
                        </span>
                        <button
                          onClick={() => handleMoveToBacklog(t.id)}
                          className="text-[11px] text-neutral-400 hover:text-neutral-700 px-2 py-1 rounded hover:bg-neutral-100 transition"
                          title="Move to Backlog"
                        >
                          Move to Backlog
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Planned Sprints */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-500">Planned Sprints ({futureSprints.length})</h3>
        {futureSprints.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 text-center text-neutral-400 text-xs">
            No planned sprints in queue. Click <span className="font-bold text-blue-600">"Create Sprint"</span> to schedule your next iteration.
          </div>
        ) : (
          futureSprints.map((s) => (
            <div key={s.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3 hover:border-neutral-300 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-neutral-900">{s.name}</h4>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                      FUTURE
                    </span>
                    {(s.startDate || s.start_date) && (
                      <span className="text-[11px] text-neutral-400 flex items-center gap-1">
                        <Calendar className="size-3" />
                        {(s.startDate || s.start_date).slice(0, 10)} &rarr; {(s.endDate || s.end_date)?.slice(0, 10) || 'TBD'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5">{s.goal || 'Planned sprint iteration'}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-500 mr-2">{s.taskCount} tasks planned</span>

                  <button
                    onClick={() => openEditModal(s)}
                    className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition"
                    title="Edit Sprint"
                  >
                    <Pencil className="size-3.5" />
                  </button>

                  <button
                    onClick={() => openDeleteModal(s)}
                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Sprint"
                  >
                    <Trash2 className="size-3.5" />
                  </button>

                  <button
                    onClick={() => handleStartSprint(s.id)}
                    className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-95"
                  >
                    <PlayCircle className="size-3.5" />
                    Start Sprint
                  </button>
                </div>
              </div>

              {/* Tasks list in planned sprint if any */}
              {(s.tasks || []).length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                  {s.tasks.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-neutral-500">{t.key || 'TASK'}</span>
                        <span className="font-medium text-neutral-800">{t.name}</span>
                        <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${getPriorityBadgeClass(t.priority)}`}>
                          {formatPriority(t.priority)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleMoveToBacklog(t.id)}
                        className="text-[10px] text-neutral-400 hover:text-neutral-700"
                        title="Move back to backlog"
                      >
                        Backlog
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Completed / Closed Sprints (Accordion) */}
      {closedSprints.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-3">
          <button
            onClick={() => setShowClosedSprints(!showClosedSprints)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-2">
              {showClosedSprints ? <ChevronDown className="size-4 text-neutral-500" /> : <ChevronRight className="size-4 text-neutral-500" />}
              <h3 className="text-sm font-bold text-neutral-800">
                Completed Sprints ({closedSprints.length})
              </h3>
            </div>
            <span className="text-xs text-neutral-400">Click to {showClosedSprints ? 'collapse' : 'view history'}</span>
          </button>

          {showClosedSprints && (
            <div className="space-y-3 pt-2">
              {closedSprints.map((s) => (
                <div key={s.id} className="rounded-xl border border-neutral-100 bg-neutral-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-neutral-800">{s.name}</h4>
                        <span className="rounded-full bg-neutral-200 px-2 py-0.2 text-[10px] font-bold text-neutral-600">
                          CLOSED
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500">{s.goal || 'Completed sprint'}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500 font-medium">
                        {s.completedCount || 0} / {s.taskCount || 0} tasks done
                      </span>
                      <button
                        onClick={() => openEditModal(s)}
                        className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 rounded"
                        title="Edit Sprint"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(s)}
                        className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete Sprint"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backlog Section */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Backlog ({backlog.length} issues)</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Tickets ready to be prioritized and slotted into upcoming sprints.</p>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {backlog.length === 0 ? (
            <p className="text-xs text-neutral-400 italic py-4 text-center">Backlog is empty.</p>
          ) : (
            backlog.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 hover:bg-neutral-100/60 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-neutral-500">{t.key || 'TASK'}</span>
                  <span className="text-xs font-semibold text-neutral-900">{t.name}</span>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${getPriorityBadgeClass(t.priority)}`}>
                    {formatPriority(t.priority)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {sprints.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleMoveToSprint(t.id, e.target.value);
                      }}
                      defaultValue=""
                      className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700 focus:outline-none focus:border-blue-500 shadow-xs"
                    >
                      <option value="" disabled>
                        Move to Sprint...
                      </option>
                      {sprints.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 1. Create Sprint Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Flame className="size-4 text-blue-600" />
                Create Sprint
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSprint} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Sprint Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Sprint 12 (Authentication & Billing)"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Sprint Goal</label>
                <textarea
                  value={createForm.goal}
                  onChange={(e) => setCreateForm({ ...createForm, goal: e.target.value })}
                  rows={2}
                  placeholder="What is the objective of this sprint iteration?"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={createForm.startDate}
                    onChange={(e) => setCreateForm({ ...createForm, startDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={createForm.endDate}
                    onChange={(e) => setCreateForm({ ...createForm, endDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Initial Status</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="ACTIVE">Active (In Progress - displays in Active Sprint)</option>
                  <option value="FUTURE">Future (Planned - displays in Planned Sprints)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
                >
                  Create Sprint
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Sprint Modal */}
      {editModalOpen && editingSprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Pencil className="size-4 text-blue-600" />
                Edit Sprint
              </h3>
              <button onClick={() => setEditModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateSprint} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Sprint Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. Sprint 12"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Sprint Goal</label>
                <textarea
                  value={editForm.goal}
                  onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                  rows={2}
                  placeholder="What is the objective of this sprint iteration?"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="FUTURE">Future (Planned)</option>
                  <option value="ACTIVE">Active (In Progress)</option>
                  <option value="CLOSED">Closed (Completed)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {deleteModalOpen && deletingSprint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="rounded-full bg-red-100 p-2">
                <AlertCircle className="size-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">Delete Sprint</h3>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed mb-4">
              Are you sure you want to delete <span className="font-bold text-neutral-900">"{deletingSprint.name}"</span>?
              All associated tasks ({deletingSprint.taskCount || 0}) will automatically be returned to the Backlog.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeletingSprint(null);
                }}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSprint}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-700 transition"
              >
                Delete Sprint
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};

