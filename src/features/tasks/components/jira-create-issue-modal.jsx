import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { tasksApi, sprintsApi, workflowsAdminApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  X,
  Plus,
  Zap,
  Bookmark,
  CheckSquare,
  AlertCircle,
  List,
  TrendingUp,
  ChevronDown,
  Sparkles,
  User,
  Calendar,
  Layers,
  Clock,
  Tag,
  Info,
} from 'lucide-react';

const ISSUE_TYPES = [
  { id: 'Story', name: 'Story', icon: Bookmark, color: '#36B37E', desc: 'Functionality or user requirement' },
  { id: 'Task', name: 'Task', icon: CheckSquare, color: '#0052CC', desc: 'A task that needs to be done' },
  { id: 'Bug', name: 'Bug', icon: AlertCircle, color: '#FF5630', desc: 'An impairment or defect in functionality' },
  { id: 'Epic', name: 'Epic', icon: Zap, color: '#6554C0', desc: 'A large collection of related issues' },
  { id: 'Sub-task', name: 'Sub-task', icon: List, color: '#00B8D9', desc: 'A sub-piece of work required for a parent issue' },
  { id: 'Improvement', name: 'Improvement', icon: TrendingUp, color: '#FFAB00', desc: 'An enhancement to an existing feature' },
];

const PRIORITIES = [
  { id: 'CRITICAL', name: 'P0 - Critical', color: '#E11D48', icon: '🔥' },
  { id: 'HIGH', name: 'P1 - High', color: '#FF7452', icon: '⬆️' },
  { id: 'MEDIUM', name: 'P2 - Medium', color: '#FFAB00', icon: '🟰' },
  { id: 'LOW', name: 'P3 - Low', color: '#36B37E', icon: '⬇️' },
  { id: 'LOWEST', name: 'P4 - Lowest', color: '#00B8D9', icon: '⬇️⬇️' },
];

export const JiraCreateIssueModal = ({ open, onClose, onCreated, defaultProjectId = null, defaultSprintId = null }) => {
  const workspaceId = useWorkspaceId();
  const { data: projectsData } = useGetProjects({ workspaceId });
  const { data: membersData } = useGetMembers({ workspaceId });

  const projects = projectsData?.documents || [];
  const members = membersData?.documents || [];

  const [sprints, setSprints] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);

  const [form, setForm] = useState({
    projectId: defaultProjectId || '',
    issueType: 'Task',
    name: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    assigneeIds: [],
    sprintId: defaultSprintId || '',
    storyPoints: 1,
    dueDate: '',
    labels: '',
    originalEstimateHours: 0,
  });

  useEffect(() => {
    if (projects.length > 0 && !form.projectId) {
      setForm((prev) => ({ ...prev, projectId: defaultProjectId || projects[0].$id || projects[0].id }));
    }
  }, [projects, defaultProjectId]);

  useEffect(() => {
    if (workspaceId && form.projectId) {
      sprintsApi.getSprints(workspaceId, form.projectId).then((res) => {
        if (res?.data?.sprints) setSprints(res.data.sprints);
      }).catch(() => {});
    }
  }, [workspaceId, form.projectId]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Summary is required');
      return;
    }
    if (!form.projectId) {
      toast.error('Please select a project');
      return;
    }

    try {
      setCreating(true);
      const labelsArray = form.labels
        ? form.labels.split(',').map((l) => l.trim()).filter(Boolean)
        : [];

      const selectedAssigneeIds = form.assigneeIds && form.assigneeIds.length > 0 
        ? form.assigneeIds 
        : (form.assigneeId ? [form.assigneeId] : []);

      const res = await tasksApi.createTask({
        workspaceId,
        projectId: form.projectId,
        name: form.name.trim(),
        description: form.description,
        status: form.status,
        priority: form.priority,
        issueType: form.issueType,
        assigneeId: selectedAssigneeIds[0] || null,
        assigneeIds: selectedAssigneeIds,
        sprintId: form.sprintId || null,
        storyPoints: Number(form.storyPoints) || 1,
        dueDate: form.dueDate || null,
        labels: labelsArray,
        originalEstimateHours: Number(form.originalEstimateHours) || 0,
      });

      toast.success(`Issue created: ${res.data?.key || 'Issue'}`);
      if (onCreated) onCreated(res.data);
      window.dispatchEvent(new CustomEvent('jira-issue-created', { detail: res.data }));

      if (createAnother) {
        setForm((prev) => ({
          ...prev,
          name: '',
          description: '',
          dueDate: '',
          labels: '',
        }));
      } else {
        onClose();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create issue');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/80 bg-neutral-50/50">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Plus className="size-4 stroke-[3]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Create Issue</h2>
              <p className="text-[11px] text-neutral-500">Add a new task, story, bug, or epic to your workspace</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Project & Issue Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-neutral-700 mb-1.5">Project *</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                required
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none shadow-xs"
              >
                {projects.map((p) => (
                  <option key={p.$id || p.id} value={p.$id || p.id}>
                    {p.name} ({p.key || 'PROJ'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1.5">Issue Type *</label>
              <div className="relative">
                <select
                  value={form.issueType}
                  onChange={(e) => setForm({ ...form, issueType: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 bg-white pl-8 pr-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none shadow-xs"
                >
                  {ISSUE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="absolute left-2.5 top-2.5 pointer-events-none">
                  {React.createElement(
                    ISSUE_TYPES.find((t) => t.id === form.issueType)?.icon || CheckSquare,
                    {
                      className: 'size-3.5',
                      style: {
                        color: ISSUE_TYPES.find((t) => t.id === form.issueType)?.color || '#0052CC',
                      },
                    }
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Summary / Title */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1.5">Summary / Title *</label>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Implement OAuth2 Google Login with callback verification"
              className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm font-medium focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-xs"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1.5">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Provide acceptance criteria, technical requirements, steps to reproduce, or context..."
              className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-xs text-neutral-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none shadow-xs"
            />
          </div>

          {/* Priority & Sprint Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block font-bold text-neutral-700 mb-1.5">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none shadow-xs"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1.5">Sprint</label>
              <select
                value={form.sprintId}
                onChange={(e) => setForm({ ...form, sprintId: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none shadow-xs"
              >
                <option value="">Backlog (No Sprint)</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Multiple Assignees Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block font-bold text-neutral-700">Assignees (Assign to Multiple Members)</label>
              {(form.assigneeIds || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, assigneeIds: [], assigneeId: '' })}
                  className="text-[11px] font-medium text-neutral-400 hover:text-red-500 transition"
                >
                  Clear all ({(form.assigneeIds || []).length})
                </button>
              )}
            </div>

            {/* Selected Assignee Chips */}
            {(form.assigneeIds || []).length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 mb-2 bg-neutral-50 rounded-lg border border-neutral-200">
                {form.assigneeIds.map((id) => {
                  const m = members.find((mem) => (mem.$id || mem.id) === id);
                  if (!m) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full text-xs font-medium text-neutral-800 border border-neutral-200 shadow-xs"
                    >
                      <div className="size-4 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {m.name?.substring(0, 1).toUpperCase() || 'M'}
                      </div>
                      <span className="truncate max-w-[120px]">{m.name || m.email}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const next = form.assigneeIds.filter((item) => item !== id);
                          setForm({ ...form, assigneeIds: next, assigneeId: next[0] || '' });
                        }}
                        className="text-neutral-400 hover:text-red-500 rounded-full ml-0.5"
                      >
                        &times;
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Member Checkbox List */}
            <div className="rounded-lg border border-neutral-200 bg-white max-h-36 overflow-y-auto divide-y divide-neutral-100 shadow-xs">
              {members.map((m) => {
                const id = m.$id || m.id;
                const isSelected = (form.assigneeIds || []).includes(id);
                const toggle = () => {
                  const current = form.assigneeIds || [];
                  const next = isSelected ? current.filter((x) => x !== id) : [...current, id];
                  setForm({ ...form, assigneeIds: next, assigneeId: next[0] || '' });
                };
                return (
                  <div
                    key={id}
                    onClick={toggle}
                    className={`flex items-center justify-between px-3 py-2 cursor-pointer transition select-none ${
                      isSelected ? 'bg-blue-50/70 text-blue-900 font-semibold' : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                        {m.name?.substring(0, 1).toUpperCase() || 'M'}
                      </div>
                      <span className="text-xs">{m.name || m.email}</span>
                      <span className="text-[10px] text-neutral-400">({m.role || 'MEMBER'})</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="size-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-300"
                    />
                  </div>
                );
              })}
              {members.length === 0 && (
                <div className="p-3 text-center text-xs text-neutral-400">No members found</div>
              )}
            </div>
          </div>

          {/* Story Points & Due Date & Estimate Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-neutral-700 mb-1.5">Story Points (Fibonacci)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.storyPoints}
                onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1.5">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-1.5">Original Estimate (Hours)</label>
              <input
                type="number"
                min={0}
                value={form.originalEstimateHours}
                onChange={(e) => setForm({ ...form, originalEstimateHours: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block font-bold text-neutral-700 mb-1.5">Labels (comma-separated)</label>
            <input
              type="text"
              value={form.labels}
              onChange={(e) => setForm({ ...form, labels: e.target.value })}
              placeholder="frontend, auth, high-priority, v2-release"
              className="w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-xs focus:border-blue-600 focus:outline-none shadow-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-neutral-700">
              <input
                type="checkbox"
                checked={createAnother}
                onChange={(e) => setCreateAnother(e.target.checked)}
                className="size-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              Create another issue
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white shadow hover:bg-blue-700 transition disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
