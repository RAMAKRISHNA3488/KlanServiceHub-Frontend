import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
  User,
  Calendar,
  Layers,
  Clock,
  Tag,
  Info,
  Image as ImageIcon,
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

export const KlanserviceHubCreateIssueModal = ({ open, onClose, onCreated, defaultProjectId = null, defaultSprintId = null }) => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { data: projectsData } = useGetProjects({ workspaceId });
  const { data: membersData } = useGetMembers({ workspaceId });

  const projects = projectsData?.documents || [];
  const members = membersData?.documents || [];

  const [workspaceIssueTypes, setWorkspaceIssueTypes] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [creating, setCreating] = useState(false);
  const [createAnother, setCreateAnother] = useState(false);
  const [descriptionImages, setDescriptionImages] = useState([]);

  const handleDescriptionImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newImgs = [];
    let processed = 0;
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        newImgs.push({
          id: String(Date.now()) + Math.random().toString(36).substring(2, 7),
          name: file.name,
          size: file.size,
          fileType: file.type,
          dataUrl: loadEvt.target.result,
        });
        processed++;
        if (processed === files.length) {
          setDescriptionImages((prev) => [...prev, ...newImgs]);
          toast.success(`${newImgs.length} image${newImgs.length > 1 ? 's' : ''} attached to description`);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleDescriptionPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            const newImg = {
              id: String(Date.now()) + Math.random().toString(36).substring(2, 7),
              name: file.name || 'screenshot.png',
              size: file.size,
              fileType: file.type,
              dataUrl: loadEvt.target.result,
            };
            setDescriptionImages((prev) => [...prev, newImg]);
            toast.success('Screenshot attached to description');
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleRemoveDescriptionImage = (imgId) => {
    setDescriptionImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  useEffect(() => {
    if (workspaceId) {
      workflowsAdminApi.getIssueTypes(workspaceId)
        .then((res) => {
          if (res?.data && res.data.length > 0) {
            setWorkspaceIssueTypes(res.data);
          }
        })
        .catch(() => {});
    }
  }, [workspaceId]);

  const availableIssueTypes = workspaceIssueTypes.length > 0 ? workspaceIssueTypes : ISSUE_TYPES;

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
        descriptionImages,
        status: form.status,
        priority: form.priority,
        issueType: form.issueType,
        parentTaskId: form.parentTaskId || null,
        assigneeId: selectedAssigneeIds[0] || null,
        assigneeIds: selectedAssigneeIds,
        sprintId: form.sprintId || null,
        storyPoints: Number(form.storyPoints) || 1,
        dueDate: form.dueDate || null,
        labels: labelsArray,
        originalEstimateHours: Number(form.originalEstimateHours) || 0,
      });

      toast.success(`Issue created: ${res.data?.key || 'Issue'}`);
      setDescriptionImages([]);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['boards-view-data'] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['team-workload'] });
      queryClient.invalidateQueries({ queryKey: ['dependencies-graph'] });
      queryClient.invalidateQueries({ queryKey: ['capacity'] });
      queryClient.invalidateQueries({ queryKey: ['workload'] });
      if (onCreated) onCreated(res.data);
      window.dispatchEvent(new CustomEvent('klanservicehub-issue-created', { detail: res.data }));
      window.dispatchEvent(new CustomEvent('klanservicehub-task-updated', { detail: { task: res.data, action: 'created' } }));

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
      <div className="flex flex-col w-full max-w-2xl max-h-[90vh] rounded-xl bg-white shadow-2xl border border-neutral-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-neutral-200/80 bg-neutral-50/50">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <Plus className="size-3.5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-[12px] font-semibold text-neutral-900">Create Issue</h2>
              <p className="text-[10px] text-neutral-500">Add a new task, story, bug, or epic to your workspace</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-[11px]">
          {/* Project & Issue Type Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-semibold text-neutral-600 mb-1">Project *</label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                required
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-neutral-800 focus:border-blue-600 focus:outline-none h-7 shadow-2xs"
              >
                {projects.map((p) => (
                  <option key={p.$id || p.id} value={p.$id || p.id}>
                    {p.name} ({p.key || 'PROJ'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-neutral-600 mb-1">Issue Type *</label>
              <div className="relative">
                <select
                  value={form.issueType}
                  onChange={(e) => setForm({ ...form, issueType: e.target.value })}
                  className="w-full rounded-md border border-neutral-200 bg-white pl-7 pr-2 py-1 text-[10px] font-medium text-neutral-800 focus:border-blue-600 focus:outline-none h-7 shadow-2xs"
                >
                  {availableIssueTypes.map((t) => (
                    <option key={t.id || t.name} value={t.name || t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <div className="absolute left-2 top-2 pointer-events-none">
                  {(() => {
                    const activeTypeObj = availableIssueTypes.find((t) => t.id === form.issueType || t.name === form.issueType);
                    const iconVal = activeTypeObj?.icon;
                    const IconComp = typeof iconVal === 'function' ? iconVal : (
                      iconVal === 'bookmark' ? Bookmark :
                      iconVal === 'zap' ? Zap :
                      iconVal === 'alert-circle' ? AlertCircle :
                      iconVal === 'list' ? List :
                      iconVal === 'trending-up' ? TrendingUp :
                      CheckSquare
                    );
                    return (
                      <IconComp
                        className="size-3"
                        style={{ color: activeTypeObj?.color || '#0052CC' }}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Summary / Title */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-600 mb-1">Summary / Title *</label>
            <input
              type="text"
              required
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Implement OAuth2 Google Login with callback verification"
              className="w-full rounded-md border border-neutral-300 px-2.5 py-1 text-[11px] font-medium focus:border-blue-600 focus:outline-none h-7 shadow-2xs"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-semibold text-neutral-600">Description</label>
              {descriptionImages.length > 0 && (
                <span className="text-[10px] text-neutral-400 font-medium">
                  {descriptionImages.length} image{descriptionImages.length > 1 ? 's' : ''} attached
                </span>
              )}
            </div>

            <div className="relative rounded-lg border border-neutral-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 bg-white transition shadow-2xs overflow-hidden">
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                onPaste={handleDescriptionPaste}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer?.files || []);
                  if (files.length) handleDescriptionImageUpload({ target: { files, value: '' } });
                }}
                onDragOver={(e) => e.preventDefault()}
                placeholder="Provide acceptance criteria, technical requirements, steps to reproduce... (Type here, paste screenshot with Ctrl+V, or click Attach Image)"
                className="w-full bg-transparent p-2.5 text-[11px] text-neutral-800 placeholder-neutral-400 focus:outline-none resize-none leading-relaxed"
              />

              <div className="flex items-center justify-between border-t border-neutral-100 px-2.5 py-1 bg-neutral-50/70">
                <label
                  title="Attach images to description"
                  className="cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-100 hover:text-blue-600 shadow-2xs transition"
                >
                  <ImageIcon className="size-3 text-blue-600" />
                  <span>Attach Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleDescriptionImageUpload}
                    className="hidden"
                  />
                </label>
                <span className="text-[9px] text-neutral-400 italic hidden sm:inline">
                  Paste screenshot with Ctrl+V or drag & drop
                </span>
              </div>
            </div>

            {/* Attached Images Gallery */}
            {descriptionImages.length > 0 && (
              <div className="space-y-1">
                <div className="flex flex-wrap gap-2 p-1.5 bg-neutral-50 rounded-lg border border-neutral-200">
                  {descriptionImages.map((img) => (
                    <div key={img.id} className="relative group rounded-md overflow-hidden border border-neutral-300 bg-white size-14 shrink-0 shadow-2xs">
                      <img
                        src={img.dataUrl}
                        alt={img.name || 'Description attachment'}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveDescriptionImage(img.id)}
                        className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-600 text-white rounded-full p-0.5 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Remove image"
                      >
                        <X className="size-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
                {/* Expiration hint */}
                <div className="flex items-center gap-1 text-[9px] text-amber-700 font-medium bg-amber-50/80 border border-amber-200/60 rounded px-1.5 py-0.2 w-fit">
                  <Clock className="size-2.5" />
                  <span>Active (expires 6 days after ticket is completed)</span>
                </div>
              </div>
            )}
          </div>

          {/* Priority & Sprint Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-0.5">
            <div>
              <label className="block text-[10px] font-semibold text-neutral-600 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-neutral-800 focus:border-blue-600 focus:outline-none h-7 shadow-2xs"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-neutral-600 mb-1">Sprint</label>
              <select
                value={form.sprintId}
                onChange={(e) => setForm({ ...form, sprintId: e.target.value })}
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-neutral-800 focus:border-blue-600 focus:outline-none h-7 shadow-2xs"
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
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-semibold text-neutral-600">Assignees (Assign to Multiple Members)</label>
              {(form.assigneeIds || []).length > 0 && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, assigneeIds: [], assigneeId: '' })}
                  className="text-[10px] font-medium text-neutral-400 hover:text-red-500 transition"
                >
                  Clear all ({(form.assigneeIds || []).length})
                </button>
              )}
            </div>

            {/* Selected Assignee Chips */}
            {(form.assigneeIds || []).length > 0 && (
              <div className="flex flex-wrap gap-1 p-1.5 mb-1.5 bg-neutral-50 rounded-md border border-neutral-200">
                {form.assigneeIds.map((id) => {
                  const m = members.find((mem) => (mem.$id || mem.id) === id);
                  if (!m) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded-md text-[10px] font-medium text-neutral-800 border border-neutral-200 shadow-2xs"
                    >
                      <div className="size-3.5 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center">
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
            <div className="rounded-md border border-neutral-200 bg-white max-h-32 overflow-y-auto divide-y divide-neutral-100 shadow-2xs">
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
                    className={`flex items-center justify-between px-2.5 py-1.5 cursor-pointer transition select-none text-[10px] ${
                      isSelected ? 'bg-blue-50/70 text-blue-900 font-medium' : 'hover:bg-neutral-50 text-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="size-4 rounded-full bg-indigo-600 text-white text-[8px] font-bold flex items-center justify-center">
                        {m.name?.substring(0, 1).toUpperCase() || 'M'}
                      </div>
                      <span>{m.name || m.email}</span>
                      <span className="text-[9px] text-neutral-400">({m.role || 'MEMBER'})</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="size-3.5 rounded text-blue-600 focus:ring-blue-500 border-neutral-300"
                    />
                  </div>
                );
              })}
              {members.length === 0 && (
                <div className="p-2.5 text-center text-[10px] text-neutral-400">No members found</div>
              )}
            </div>
          </div>

          {/* Story Points & Due Date & Estimate Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
            <div>
              <label className="block text-[10px] font-semibold text-neutral-600 mb-1">Story Points</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.storyPoints}
                onChange={(e) => setForm({ ...form, storyPoints: e.target.value })}
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-neutral-800 focus:border-blue-600 focus:outline-none h-7 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-neutral-600 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-neutral-800 focus:border-blue-600 focus:outline-none h-7 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-neutral-600 mb-1">Estimate (Hours)</label>
              <input
                type="number"
                min={0}
                value={form.originalEstimateHours}
                onChange={(e) => setForm({ ...form, originalEstimateHours: e.target.value })}
                className="w-full rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] font-medium text-neutral-800 focus:border-blue-600 focus:outline-none h-7 shadow-2xs"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-[10px] font-semibold text-neutral-600 mb-1">Labels (comma-separated)</label>
            <input
              type="text"
              value={form.labels}
              onChange={(e) => setForm({ ...form, labels: e.target.value })}
              placeholder="frontend, auth, high-priority, v2-release"
              className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[10px] font-medium text-neutral-800 focus:border-blue-600 focus:outline-none h-7 shadow-2xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={createAnother}
                onChange={(e) => setCreateAnother(e.target.checked)}
                className="size-3.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              Create another issue
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded px-2.5 py-1 text-[10px] font-medium text-neutral-600 hover:bg-neutral-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="rounded bg-blue-600 px-3.5 py-1 text-[10px] font-semibold text-white shadow-2xs hover:bg-blue-700 transition disabled:opacity-50"
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
