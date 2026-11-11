import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { workflowsAdminApi } from '@/lib/api-client';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useUpdateProject } from '@/features/projects/api/use-update-project';
import { toast } from 'sonner';
import {
  GitBranch,
  ArrowRight,
  ArrowLeft,
  Plus,
  Bookmark,
  Zap,
  CheckSquare,
  AlertCircle,
  AlertTriangle,
  List,
  TrendingUp,
  FileText,
  Trash2,
  RefreshCw,
  X,
  Kanban,
  Columns3,
  Sparkles,
  Pencil,
  Edit2,
  Check,
  Palette,
  Layers,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

const ICON_MAP = {
  zap: Zap,
  bookmark: Bookmark,
  'check-square': CheckSquare,
  'alert-circle': AlertCircle,
  list: List,
  'trending-up': TrendingUp,
  'file-text': FileText,
};

const COLOR_PRESETS = [
  { label: 'Slate', color: '#64748B' },
  { label: 'Blue', color: '#3B82F6' },
  { label: 'Indigo', color: '#6366F1' },
  { label: 'Purple', color: '#8B5CF6' },
  { label: 'Pink', color: '#EC4899' },
  { label: 'Amber', color: '#F59E0B' },
  { label: 'Cyan', color: '#06B6D4' },
  { label: 'Emerald', color: '#10B981' },
  { label: 'Red', color: '#EF4444' },
];

const OVERLOAD_COLOR_PRESETS = [
  { label: 'Red / Crimson', color: '#EF4444' },
  { label: 'Rose', color: '#F43F5E' },
  { label: 'Amber', color: '#F59E0B' },
  { label: 'Orange', color: '#EA580C' },
  { label: 'Violet', color: '#8B5CF6' },
  { label: 'Pink', color: '#EC4899' },
];

export const WorkflowsAdminView = () => {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const pipelineScrollRef = React.useRef(null);
  const [workflows, setWorkflows] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [activeTab, setActiveTab] = useState('WORKFLOWS'); // WORKFLOWS, ISSUE_TYPES
  const [loading, setLoading] = useState(true);

  // Projects integration for project-wise WIP limits & stage overload customization
  const { data: projectsData } = useGetProjects({ workspaceId });
  const projects = projectsData?.documents || [];
  const { mutate: updateProject, isPending: isUpdatingProject } = useUpdateProject();
  const [selectedProjectId, setSelectedProjectId] = useState('WORKSPACE_DEFAULT');

  const selectedProject = React.useMemo(() => {
    if (selectedProjectId === 'WORKSPACE_DEFAULT') return null;
    return projects.find((p) => (p.$id || p.id) === selectedProjectId) || null;
  }, [selectedProjectId, projects]);

  const projectStageLimits = React.useMemo(() => {
    return selectedProject?.stageLimits || selectedProject?.stage_limits || {};
  }, [selectedProject]);

  // Project Stage WIP Limit Edit Modal
  const [editingProjectStage, setEditingProjectStage] = useState(null); // { status, maxTasks, overloadColor }

  const handleOpenEditProjectStage = (st) => {
    if (!selectedProject) return;
    const isDone = (st.category || '').toUpperCase() === 'DONE' || st.name.toUpperCase().includes('DONE');
    if (isDone) return;

    const override = projectStageLimits[st.name];
    const defaultLimit = st.maxTasks !== undefined ? st.maxTasks : (st.max_tasks !== undefined ? st.max_tasks : 5);
    const defaultColor = st.overloadColor || st.overload_color || '#EF4444';

    setEditingProjectStage({
      status: st,
      maxTasks: override?.maxTasks !== undefined ? override.maxTasks : defaultLimit,
      overloadColor: override?.overloadColor || defaultColor,
    });
  };

  const handleSaveProjectStageLimit = (e) => {
    e.preventDefault();
    if (!selectedProject || !editingProjectStage) return;

    const statusName = editingProjectStage.status.name;
    const isDone = (editingProjectStage.status.category || '').toUpperCase() === 'DONE' || statusName.toUpperCase().includes('DONE');

    const updatedStageLimits = {
      ...projectStageLimits,
      [statusName]: {
        maxTasks: isDone ? 0 : (Number(editingProjectStage.maxTasks) || 5),
        overloadColor: editingProjectStage.overloadColor || '#EF4444',
      },
    };

    updateProject({
      form: { stageLimits: updatedStageLimits },
      param: { projectId: selectedProject.$id || selectedProject.id },
    }, {
      onSuccess: () => {
        toast.success(`Updated ${statusName.replace(/_/g, ' ')} WIP limits for ${selectedProject.name}!`);
        setEditingProjectStage(null);
        queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['boards-view-data', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
      },
    });
  };

  const handleResetProjectStageLimit = (statusName) => {
    if (!selectedProject) return;
    const updatedStageLimits = { ...projectStageLimits };
    delete updatedStageLimits[statusName];

    updateProject({
      form: { stageLimits: updatedStageLimits },
      param: { projectId: selectedProject.$id || selectedProject.id },
    }, {
      onSuccess: () => {
        toast.success(`Reset ${statusName.replace(/_/g, ' ')} to workspace default for ${selectedProject.name}!`);
        setEditingProjectStage(null);
        queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['boards-view-data', workspaceId] });
        queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId] });
      },
    });
  };

  // Edit Workflow Metadata Modal/State
  const [editWorkflowModal, setEditWorkflowModal] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({ name: '', description: '' });

  // Add Status Modal
  const [addStatusModal, setAddStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState({ name: '', category: 'IN_PROGRESS', color: '#3B82F6', maxTasks: 5, overloadColor: '#EF4444' });

  // Edit Status Modal
  const [editingStatus, setEditingStatus] = useState(null); // { id, name, category, color, maxTasks, overloadColor }

  // Delete Status Confirmation Modal
  const [deleteConfirmStatus, setDeleteConfirmStatus] = useState(null); // { workflowId, statusId, name }
  const [deletingStatus, setDeletingStatus] = useState(false);

  // Add Issue Type Modal
  const [addTypeModal, setAddTypeModal] = useState(false);
  const [newType, setNewType] = useState({ name: '', icon: 'bookmark', color: '#4F46E5', description: '' });

  // Edit Issue Type Modal
  const [editingType, setEditingType] = useState(null); // { id, name, icon, color, description }

  const handleOpenEditIssueType = (it) => {
    setEditingType({
      id: it.id,
      name: it.name || '',
      icon: it.icon || 'bookmark',
      color: it.color || '#4F46E5',
      description: it.description || '',
    });
  };

  const handleSaveEditIssueType = async (e) => {
    e.preventDefault();
    if (!editingType) return;
    try {
      await workflowsAdminApi.updateIssueType(workspaceId, editingType.id, {
        name: editingType.name,
        icon: editingType.icon,
        color: editingType.color,
        description: editingType.description,
      });
      toast.success(`Issue type "${editingType.name}" updated successfully!`);
      setEditingType(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update issue type');
    }
  };

  const scrollPipeline = (direction) => {
    if (pipelineScrollRef.current) {
      const scrollOffset = direction === 'left' ? -280 : 280;
      pipelineScrollRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wfRes, typesRes] = await Promise.all([
        workflowsAdminApi.getWorkflows(workspaceId),
        workflowsAdminApi.getIssueTypes(workspaceId),
      ]);
      if (wfRes?.data) setWorkflows(wfRes.data);
      if (typesRes?.data) setIssueTypes(typesRes.data);
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['issue-types'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
    } catch (e) {
      toast.error('Failed to load workflows & issue types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId]);

  const defaultWorkflow = workflows[0];

  const handleOpenEditWorkflow = () => {
    if (!defaultWorkflow) return;
    setWorkflowForm({
      name: defaultWorkflow.name || '',
      description: defaultWorkflow.description || '',
    });
    setEditWorkflowModal(true);
  };

  const handleSaveWorkflow = async (e) => {
    e.preventDefault();
    if (!defaultWorkflow) return;
    try {
      await workflowsAdminApi.updateWorkflow(workspaceId, defaultWorkflow.id, workflowForm);
      toast.success('Workflow updated successfully!');
      setEditWorkflowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update workflow');
    }
  };

  const handleAddStatus = async (e) => {
    e.preventDefault();
    if (!defaultWorkflow) return;
    try {
      await workflowsAdminApi.addStatus(workspaceId, defaultWorkflow.id, {
        ...newStatus,
        maxTasks: newStatus.category === 'DONE' ? 0 : Number(newStatus.maxTasks ?? 5),
        overloadColor: newStatus.overloadColor || '#EF4444',
      });
      toast.success(`Status "${newStatus.name.toUpperCase().replace(/\s+/g, '_')}" added to workflow!`);
      setAddStatusModal(false);
      setNewStatus({ name: '', category: 'IN_PROGRESS', color: '#3B82F6', maxTasks: 5, overloadColor: '#EF4444' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to add status');
    }
  };

  const handleOpenEditStatus = (st) => {
    setEditingStatus({
      id: st.id,
      name: st.name || '',
      category: st.category || 'IN_PROGRESS',
      color: st.color || '#3B82F6',
      maxTasks: st.category === 'DONE' ? 0 : (st.maxTasks !== undefined ? st.maxTasks : (st.max_tasks !== undefined ? st.max_tasks : 5)),
      overloadColor: st.overloadColor || st.overload_color || '#EF4444',
    });
  };

  const handleSaveEditStatus = async (e) => {
    e.preventDefault();
    if (!defaultWorkflow || !editingStatus) return;
    try {
      await workflowsAdminApi.updateStatus(workspaceId, defaultWorkflow.id, editingStatus.id, {
        name: editingStatus.name,
        category: editingStatus.category,
        color: editingStatus.color,
        maxTasks: editingStatus.category === 'DONE' ? 0 : Number(editingStatus.maxTasks ?? 5),
        overloadColor: editingStatus.overloadColor || '#EF4444',
      });
      toast.success(`Status "${editingStatus.name}" updated!`);
      setEditingStatus(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    }
  };

  const handleConfirmDeleteStatus = async () => {
    if (!deleteConfirmStatus || !defaultWorkflow) return;
    try {
      setDeletingStatus(true);
      await workflowsAdminApi.deleteStatus(workspaceId, deleteConfirmStatus.workflowId, deleteConfirmStatus.statusId);
      toast.success(`Status "${deleteConfirmStatus.name}" removed.`);
      setDeleteConfirmStatus(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove status');
    } finally {
      setDeletingStatus(false);
    }
  };

  const handleReorderStatus = async (idx, direction) => {
    if (!defaultWorkflow?.statuses) return;
    const currentStatuses = [...defaultWorkflow.statuses];
    const targetIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentStatuses.length) return;

    // Swap positions
    const temp = currentStatuses[idx];
    currentStatuses[idx] = currentStatuses[targetIdx];
    currentStatuses[targetIdx] = temp;

    // Optimistic update
    setWorkflows((prev) => [
      {
        ...prev[0],
        statuses: currentStatuses,
      },
      ...prev.slice(1),
    ]);

    try {
      const statusIds = currentStatuses.map((s) => s.id);
      await workflowsAdminApi.reorderStatuses(workspaceId, defaultWorkflow.id, statusIds);
      toast.success('Workflow order updated!');
    } catch (err) {
      toast.error('Failed to reorder statuses');
      fetchData();
    }
  };

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Delete Issue Type',
    'Are you sure you want to permanently delete this custom issue type?',
    'destructive'
  );

  const handleAddIssueType = async (e) => {
    e.preventDefault();
    try {
      await workflowsAdminApi.createIssueType(workspaceId, newType);
      toast.success(`Issue type ${newType.name} created!`);
      setAddTypeModal(false);
      setNewType({ name: '', icon: 'bookmark', color: '#4F46E5', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create issue type');
    }
  };

  const handleDeleteIssueType = async (id, typeName = 'this issue type') => {
    const ok = await confirmAction({
      title: 'Remove Issue Type',
      subtitle: 'Issue category removal',
      targetName: typeName,
      message: `Are you sure you want to remove issue type "${typeName}"?`,
      variant: 'destructive',
      confirmText: 'Remove Type',
      impactTitle: 'Issue Category Impact',
      impactNotice: 'Existing issues assigned to this category will retain their history but may require reassignment to another valid issue type.',
    });
    if (!ok) return;
    try {
      await workflowsAdminApi.deleteIssueType(workspaceId, id);
      toast.success('Issue type deleted.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete issue type');
    }
  };

  if (loading && workflows.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="size-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <GitBranch className="size-5 text-blue-600" />
            Workflows & Issue Types
          </h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Manage lifecycle pipelines, statuses, and issue categories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/boards`)}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs hover:bg-neutral-800 transition"
            title="Open Engineering Kanban Board to view active workflow columns and task cards"
          >
            <Columns3 className="size-3.5 text-blue-400" />
            <span>Engineering Kanban Board ➔</span>
          </button>

          {activeTab === 'WORKFLOWS' ? (
            <button
              onClick={() => setAddStatusModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
            >
              <Plus className="size-3.5" />
              Add Status
            </button>
          ) : (
            <button
              onClick={() => setAddTypeModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
            >
              <Plus className="size-3.5" />
              Add Issue Type
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 gap-2">
        <button
          onClick={() => setActiveTab('WORKFLOWS')}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'WORKFLOWS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Workflow Pipeline
        </button>
        <button
          onClick={() => setActiveTab('ISSUE_TYPES')}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'ISSUE_TYPES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Issue Types
        </button>
      </div>

      {/* Global Sync Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-950">
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-4 text-blue-600 shrink-0" />
          <span>
            <strong>Global Reflection Active:</strong> Status stages and issue types configured here immediately reflect across all project Engineering Kanban Boards, task cards, and issue creation dialogs.
          </span>
        </div>
        <button
          onClick={() => navigate(`/workspaces/${workspaceId}/boards`)}
          className="shrink-0 font-bold text-blue-700 hover:text-blue-950 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
        >
          <span>Open Kanban Board</span>
          <ArrowRight className="size-3" />
        </button>
      </div>

      {/* Workflow Designer Tab */}
      {activeTab === 'WORKFLOWS' && !defaultWorkflow && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm space-y-4">
          <div className="size-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <GitBranch className="size-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-neutral-900">No Workflow Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              Set up standard stages from Backlog to Done for this workspace.
            </p>
          </div>
          <button
            onClick={async () => {
              try {
                setLoading(true);
                await workflowsAdminApi.createWorkflow(workspaceId, {
                  name: 'Standard Software Development Workflow',
                  description: 'Default enterprise workflow for software development lifecycle',
                  statuses: [
                    { name: 'BACKLOG', category: 'TODO', color: '#94A3B8' },
                    { name: 'TODO', category: 'TODO', color: '#3B82F6' },
                    { name: 'IN_PROGRESS', category: 'IN_PROGRESS', color: '#F59E0B' },
                    { name: 'IN_REVIEW', category: 'IN_PROGRESS', color: '#8B5CF6' },
                    { name: 'TESTING', category: 'IN_PROGRESS', color: '#06B6D4' },
                    { name: 'DONE', category: 'DONE', color: '#10B981' },
                  ],
                });
                toast.success('Default workflow initialized!');
                fetchData();
              } catch (err) {
                toast.error(err.message || 'Failed to initialize workflow');
              } finally {
                setLoading(false);
              }
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
          >
            <Sparkles className="size-4" />
            Initialize Workflow
          </button>
        </div>
      )}

      {activeTab === 'WORKFLOWS' && defaultWorkflow && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-6">
          {/* Workflow Header with Edit & Sync Info */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <GitBranch className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-neutral-900">{defaultWorkflow.name}</h3>
                  <button
                    onClick={handleOpenEditWorkflow}
                    className="p-1 rounded text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Edit Workflow Name & Description"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{defaultWorkflow.description}</p>
              </div>
            </div>

            <button
              onClick={() => navigate(`/workspaces/${workspaceId}/boards`)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition shadow-2xs self-start sm:self-auto"
            >
              <Columns3 className="size-3.5" />
              <span>Synced with Kanban ➔</span>
            </button>
          </div>

          {/* Project WIP Limits & Overload Scope Switcher */}
          <div className="rounded-xl border border-neutral-200/90 bg-white p-4 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                    <span>Capacity Limit & Overload Scope</span>
                    {selectedProject ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wide">
                        Project Customization Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600 uppercase tracking-wide">
                        Workspace Baseline
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    {selectedProject
                      ? `Customizing stage WIP capacity limits and alert colors for "${selectedProject.name}". Unconfigured stages automatically inherit workspace defaults.`
                      : 'Configuring baseline WIP capacity and overload alert colors applied to all standard project boards.'}
                  </p>
                </div>
              </div>

              {/* Selector dropdown */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <label className="text-xs font-semibold text-neutral-600 whitespace-nowrap">
                  Configure For:
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-2xs focus:border-blue-500 focus:outline-none min-w-[210px]"
                >
                  <option value="WORKSPACE_DEFAULT">🌐 Workspace Baseline (All Projects)</option>
                  {projects.map((p) => (
                    <option key={p.$id || p.id} value={p.$id || p.id}>
                      📁 {p.name} ({p.key || 'PROJ'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedProject && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-neutral-100 text-xs">
                <div className="flex items-center gap-2 text-neutral-600">
                  <ShieldCheck className="size-3.5 text-blue-600 shrink-0" />
                  <span>
                    <strong>{Object.keys(projectStageLimits).filter(k => !k.toUpperCase().includes('DONE')).length}</strong> of{' '}
                    <strong>{(defaultWorkflow.statuses || []).filter(s => (s.category || '').toUpperCase() !== 'DONE').length}</strong> active stages customized for{' '}
                    <span className="font-semibold text-neutral-900">{selectedProject.name}</span>.
                  </span>
                </div>
                {Object.keys(projectStageLimits).length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      updateProject({
                        form: { stageLimits: {} },
                        param: { projectId: selectedProject.$id || selectedProject.id },
                      }, {
                        onSuccess: () => {
                          toast.success(`Reset all stage limits to workspace default for ${selectedProject.name}!`);
                          queryClient.invalidateQueries({ queryKey: ['projects', workspaceId] });
                          queryClient.invalidateQueries({ queryKey: ['boards-view-data', workspaceId] });
                        }
                      });
                    }}
                    className="text-[11px] font-semibold text-neutral-500 hover:text-red-600 transition flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="size-3" />
                    Reset All to Workspace Default
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Visual Pipeline with Edit, Add, Reorder, Delete & Horizontal Scrolling */}
          <div className="rounded-xl bg-neutral-50 p-6 border border-neutral-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  Lifecycle Stages ({defaultWorkflow.statuses?.length || 0})
                </p>
                <span className="text-[10px] text-neutral-400">Scroll to view stages • Use arrows to reorder</span>
              </div>

              {/* Scroll buttons toolbar */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => scrollPipeline('left')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 shadow-2xs transition"
                  title="Scroll Left"
                >
                  <ChevronLeft className="size-3.5 text-neutral-600" />
                  <span className="text-[11px]">Left</span>
                </button>
                <button
                  type="button"
                  onClick={() => scrollPipeline('right')}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg border border-neutral-300 bg-white hover:bg-neutral-100 text-neutral-700 shadow-2xs transition"
                  title="Scroll Right"
                >
                  <span className="text-[11px]">Right</span>
                  <ChevronRight className="size-3.5 text-neutral-600" />
                </button>
              </div>
            </div>

            {/* Scrollable Pipeline Track */}
            <div
              ref={pipelineScrollRef}
              className="flex items-center gap-3 overflow-x-auto pb-5 pt-1 custom-scrollbar w-full scroll-smooth"
              style={{ scrollBehavior: 'smooth' }}
            >
              {(defaultWorkflow.statuses || []).map((st, idx) => {
                const isDone = st.category === 'DONE' || st.name.toUpperCase().includes('DONE');
                const projectOverride = selectedProject ? projectStageLimits[st.name] : null;
                const defaultLimit = st.maxTasks !== undefined ? st.maxTasks : (st.max_tasks !== undefined ? st.max_tasks : 5);
                const effectiveMaxTasks = isDone
                  ? 0
                  : (projectOverride?.maxTasks !== undefined
                      ? projectOverride.maxTasks
                      : defaultLimit);
                const defaultColor = st.overloadColor || st.overload_color || '#EF4444';
                const effectiveOverloadColor = projectOverride?.overloadColor || defaultColor;
                const isProjectCustomized = Boolean(projectOverride);

                return (
                <React.Fragment key={st.id}>
                  <div className={`flex flex-col justify-between rounded-xl border bg-white p-3.5 shadow-xs w-[225px] shrink-0 min-h-[135px] transition group ${
                    selectedProject && isProjectCustomized
                      ? 'border-blue-400 ring-1 ring-blue-200 bg-blue-50/20 shadow-sm'
                      : 'border-neutral-200 hover:border-blue-300 hover:shadow-md'
                  }`}>
                    {/* Top Row: Step badge on left, color & actions on right */}
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                        Step {idx + 1}
                      </span>
                      
                      <div className="flex items-center gap-1">
                        <span
                          className="size-2.5 rounded-full ring-1 ring-black/10 shrink-0 mr-0.5"
                          style={{ backgroundColor: st.color || '#3B82F6' }}
                          title={`Color: ${st.color || '#3B82F6'}`}
                        />
                        {selectedProject ? (
                          !isDone && (
                            <button
                              onClick={() => handleOpenEditProjectStage(st)}
                              className="p-1 rounded text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title={`Customize ${st.name} WIP Limit for ${selectedProject.name}`}
                            >
                              <Pencil className="size-3" />
                            </button>
                          )
                        ) : (
                          <>
                            <button
                              onClick={() => handleOpenEditStatus(st)}
                              className="p-1 rounded text-neutral-400 hover:text-blue-600 hover:bg-blue-50 transition"
                              title="Edit Status"
                            >
                              <Pencil className="size-3" />
                            </button>
                            {defaultWorkflow.statuses.length > 2 && (
                              <button
                                onClick={() =>
                                  setDeleteConfirmStatus({
                                    workflowId: defaultWorkflow.id,
                                    statusId: st.id,
                                    name: st.name,
                                  })
                                }
                                className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                                title="Remove Status"
                              >
                                <Trash2 className="size-3" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Status Name */}
                    <div className="py-2">
                      <p className="text-xs font-bold text-neutral-900 break-words line-clamp-2 leading-snug" title={st.name}>
                        {st.name}
                      </p>
                    </div>

                    {/* Stage WIP Capacity & Overload Indicator */}
                    <div className="flex flex-col gap-1 py-1.5 border-t border-neutral-100 text-[10px]">
                      <div className="flex items-center justify-between text-neutral-500">
                        <span className="font-medium">Overload Limit:</span>
                        {isDone ? (
                          <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            Exempt (Done)
                          </span>
                        ) : (
                          <div className="flex items-center gap-1.5 font-bold text-neutral-700">
                            <span>{effectiveMaxTasks} max</span>
                            <span
                              className="size-2 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: effectiveOverloadColor }}
                              title={`Overload Color: ${effectiveOverloadColor}`}
                            />
                          </div>
                        )}
                      </div>

                      {selectedProject && !isDone && (
                        <div className="flex items-center justify-between pt-1">
                          {isProjectCustomized ? (
                            <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                              <span className="size-1 rounded-full bg-blue-600 inline-block" />
                              Project Override
                            </span>
                          ) : (
                            <span className="text-[9px] font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                              Inheriting Default
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenEditProjectStage(st)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                          >
                            {isProjectCustomized ? 'Edit' : 'Customize'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: Category on left, reorder arrows on right */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        st.category === 'DONE' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : st.category === 'TODO' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {st.category}
                      </span>

                      {/* Card Reordering Arrows */}
                      <div className="flex items-center gap-0.5 bg-neutral-100 rounded-md p-0.5">
                        <button
                          disabled={idx === 0 || Boolean(selectedProject)}
                          onClick={() => handleReorderStatus(idx, 'left')}
                          className="p-0.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                          title={selectedProject ? "Switch to Workspace Baseline to reorder stages" : "Move step left"}
                        >
                          <ChevronLeft className="size-3" />
                        </button>
                        <button
                          disabled={idx === defaultWorkflow.statuses.length - 1 || Boolean(selectedProject)}
                          onClick={() => handleReorderStatus(idx, 'right')}
                          className="p-0.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                          title={selectedProject ? "Switch to Workspace Baseline to reorder stages" : "Move step right"}
                        >
                          <ChevronRight className="size-3" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {idx < defaultWorkflow.statuses.length - 1 && (
                    <ArrowRight className="size-4 text-neutral-400 shrink-0 mx-0.5" />
                  )}
                </React.Fragment>
                );
              })}

              {/* Quick Add Step Button inside Pipeline */}
              <button
                onClick={() => setAddStatusModal(true)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-300 bg-white/70 p-4 w-[140px] h-[125px] shrink-0 text-neutral-500 hover:border-blue-400 hover:text-blue-600 hover:bg-white transition shadow-2xs"
              >
                <Plus className="size-4" />
                <span className="text-xs font-bold">Add Step</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Issue Types Tab */}
      {activeTab === 'ISSUE_TYPES' && (
        <div className="space-y-4">
          {issueTypes.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center shadow-sm space-y-4">
              <div className="size-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Bookmark className="size-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">No Issue Types Found</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
                  Set up standard issue types (Epic, Story, Task, Bug, Sub-task).
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const standardTypes = [
                      { name: 'Epic', icon: 'zap', color: '#8B5CF6', description: 'A big body of work that can be broken down into stories and tasks' },
                      { name: 'Story', icon: 'bookmark', color: '#10B981', description: 'A user requirement or functional enhancement' },
                      { name: 'Task', icon: 'check-square', color: '#3B82F6', description: 'A general task that needs to be performed' },
                      { name: 'Bug', icon: 'alert-circle', color: '#EF4444', description: 'A problem which impairs or prevents system functions' },
                      { name: 'Sub-task', icon: 'list', color: '#6B7280', description: 'A piece of work required to complete another task' },
                    ];
                    for (const t of standardTypes) {
                      await workflowsAdminApi.createIssueType(workspaceId, t);
                    }
                    toast.success('Standard issue types initialized!');
                    fetchData();
                  } catch (err) {
                    toast.error(err.message || 'Failed to initialize issue types');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition"
              >
                <Sparkles className="size-4" />
                Initialize Issue Types
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {issueTypes.map((it) => {
                const Icon = ICON_MAP[it.icon] || Bookmark;
                return (
                  <div
                    key={it.id}
                    className="group relative rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="size-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                          style={{ backgroundColor: it.color }}
                        >
                          <Icon className="size-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900">{it.name}</h4>
                          <span className="font-mono text-[10px] text-neutral-400">{it.color}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => handleOpenEditIssueType(it)}
                          className="p-1 text-neutral-400 hover:text-blue-600 rounded hover:bg-neutral-100 transition cursor-pointer"
                          title="Edit Issue Type"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteIssueType(it.id, it.name)}
                          className="p-1 text-neutral-400 hover:text-red-600 rounded hover:bg-red-50 transition cursor-pointer"
                          title="Delete Issue Type"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 mt-3 line-clamp-2">{it.description || 'Standard issue type'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Workflow Name/Description Modal */}
      {editWorkflowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Edit Workflow Details</h3>
              <button onClick={() => setEditWorkflowModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkflow} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Workflow Name *</label>
                <input
                  type="text"
                  required
                  value={workflowForm.name}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, name: e.target.value })}
                  placeholder="e.g. Standard Software Development Workflow"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  value={workflowForm.description}
                  onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })}
                  rows={3}
                  placeholder="Describe the workflow purpose and rules..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditWorkflowModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      {editingStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Edit Workflow Status</h3>
              <button onClick={() => setEditingStatus(null)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStatus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Status Name *</label>
                <input
                  type="text"
                  required
                  value={editingStatus.name}
                  onChange={(e) => setEditingStatus({ ...editingStatus, name: e.target.value })}
                  placeholder="e.g. TESTING"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Status Category</label>
                <select
                  value={editingStatus.category}
                  onChange={(e) => setEditingStatus({ ...editingStatus, category: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="TODO">To Do / Backlog Category</option>
                  <option value="IN_PROGRESS">In Progress Category</option>
                  <option value="DONE">Done / Completed Category</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Color Badge</label>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setEditingStatus({ ...editingStatus, color: p.color })}
                      className={`size-6 rounded-full border transition-all ${
                        editingStatus.color === p.color ? 'ring-2 ring-blue-600 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.label}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={editingStatus.color}
                  onChange={(e) => setEditingStatus({ ...editingStatus, color: e.target.value })}
                  className="h-9 w-full rounded-lg border border-neutral-300 p-1 cursor-pointer"
                />
              </div>

              {/* Stage Overload Capacity (WIP Limit) */}
              <div className="pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">Stage Capacity / WIP Limit (Tickets)</label>
                  {editingStatus.category === 'DONE' ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Exempt (Done Stage)
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-mono">Default: 5</span>
                  )}
                </div>
                {editingStatus.category === 'DONE' ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200 text-[11px] text-emerald-800">
                    Done / Completed stages are automatically exempt from overload limits. Completed tickets will never trigger bottleneck alerts.
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editingStatus.maxTasks ?? 5}
                      onChange={(e) => setEditingStatus({ ...editingStatus, maxTasks: parseInt(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="5"
                    />
                    <p className="text-[10.5px] text-neutral-500 mt-1">
                      When tickets in this column exceed this number, the column top line changes to the custom overload color. Below this limit, it displays green.
                    </p>
                  </>
                )}
              </div>

              {/* Custom Overload Alert Color */}
              {editingStatus.category !== 'DONE' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Custom Overload Alert Color (When &gt; {editingStatus.maxTasks ?? 5} tickets)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {OVERLOAD_COLOR_PRESETS.map((p) => (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => setEditingStatus({ ...editingStatus, overloadColor: p.color })}
                        className={`size-6 rounded-full border transition-all ${
                          (editingStatus.overloadColor || '#EF4444') === p.color ? 'ring-2 ring-blue-600 ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={p.label}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingStatus.overloadColor || '#EF4444'}
                      onChange={(e) => setEditingStatus({ ...editingStatus, overloadColor: e.target.value })}
                      className="h-9 w-14 rounded-lg border border-neutral-300 p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={editingStatus.overloadColor || '#EF4444'}
                      onChange={(e) => setEditingStatus({ ...editingStatus, overloadColor: e.target.value })}
                      className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-mono uppercase focus:outline-none"
                    />
                  </div>

                  {/* Live Visual Telemetry Preview */}
                  <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2">
                    <div className="text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider">
                      Kanban Board Top Line Preview
                    </div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-neutral-600 font-semibold">
                          <span>Healthy Flow (&le; {editingStatus.maxTasks ?? 5} tickets):</span>
                          <span className="text-emerald-700 font-bold">Green Line</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-emerald-500 w-full shadow-2xs" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-neutral-600 font-semibold">
                          <span>Stage Overloaded (&gt; {editingStatus.maxTasks ?? 5} tickets):</span>
                          <span className="font-bold" style={{ color: editingStatus.overloadColor || '#EF4444' }}>
                            Custom Overload Color
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full w-full shadow-2xs"
                          style={{ backgroundColor: editingStatus.overloadColor || '#EF4444' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingStatus(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project-Specific Stage WIP & Overload Customization Modal */}
      {editingProjectStage && selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div
                  className="size-8 rounded-lg flex items-center justify-center font-bold text-white shadow-2xs"
                  style={{ backgroundColor: editingProjectStage.status.color || '#3B82F6' }}
                >
                  <SlidersHorizontal className="size-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                    Customize {editingProjectStage.status.name.replace(/_/g, ' ')} WIP Limit
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Project:{' '}
                    <span className="font-semibold text-blue-600">
                      {selectedProject.name} ({selectedProject.key || 'PROJ'})
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProjectStage(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProjectStageLimit} className="mt-4 space-y-4">
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 text-xs text-blue-800 flex items-start gap-2">
                <ShieldCheck className="size-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Project-Specific Override:</strong> Changes saved here apply strictly to the Kanban board and telemetry for{' '}
                  <strong>{selectedProject.name}</strong>. All other workspace projects continue using the default baseline.
                </div>
              </div>

              {/* Status Reference Info */}
              <div className="flex items-center justify-between p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: editingProjectStage.status.color || '#3B82F6' }}
                  />
                  <span className="font-bold text-neutral-800">{editingProjectStage.status.name}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-neutral-200 text-neutral-700 uppercase">
                    {editingProjectStage.status.category || 'IN_PROGRESS'}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-500">
                  Workspace Baseline:{' '}
                  <span className="font-semibold text-neutral-700">
                    {editingProjectStage.status.maxTasks ?? 5} tickets
                  </span>
                </div>
              </div>

              {/* Capacity Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Stage Capacity / WIP Limit (Tickets)
                  </label>
                  <span className="text-[11px] text-neutral-500">1 – 100 tickets</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={editingProjectStage.maxTasks}
                  onChange={(e) =>
                    setEditingProjectStage({
                      ...editingProjectStage,
                      maxTasks: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  When active tickets in this column exceed this count on {selectedProject.name}&apos;s Kanban board, the column top line highlights in the custom overload alert color.
                </p>
              </div>

              {/* Overload Alert Color */}
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Custom Stage Overload Indicator Color
                </label>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {OVERLOAD_COLOR_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() =>
                        setEditingProjectStage({
                          ...editingProjectStage,
                          overloadColor: p.color,
                        })
                      }
                      className={`size-6 rounded-full border transition-all ${
                        (editingProjectStage.overloadColor || '#EF4444') === p.color
                          ? 'ring-2 ring-blue-600 ring-offset-2 scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.label}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={editingProjectStage.overloadColor || '#EF4444'}
                    onChange={(e) =>
                      setEditingProjectStage({
                        ...editingProjectStage,
                        overloadColor: e.target.value,
                      })
                    }
                    className="h-9 w-14 rounded-lg border border-neutral-300 p-1 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={editingProjectStage.overloadColor || '#EF4444'}
                    onChange={(e) =>
                      setEditingProjectStage({
                        ...editingProjectStage,
                        overloadColor: e.target.value,
                      })
                    }
                    className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-mono uppercase focus:outline-none"
                  />
                </div>
              </div>

              {/* Live Visual Telemetry Preview */}
              <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/80 space-y-2.5">
                <div className="flex items-center justify-between text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider">
                  <span>Kanban Board Top Telemetry Preview</span>
                  <span className="text-[10px] text-blue-600 font-normal">Active for {selectedProject.name}</span>
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-neutral-600 font-medium">
                      <span>Healthy Flow (&le; {editingProjectStage.maxTasks ?? 5} tickets):</span>
                      <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                        <span className="size-2 rounded-full bg-emerald-500 inline-block" /> Normal Green
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-emerald-500 w-full shadow-2xs" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-neutral-600 font-medium">
                      <span>Stage Overloaded (&gt; {editingProjectStage.maxTasks ?? 5} tickets):</span>
                      <span className="font-semibold text-xs flex items-center gap-1" style={{ color: editingProjectStage.overloadColor || '#EF4444' }}>
                        <span className="size-2 rounded-full inline-block" style={{ backgroundColor: editingProjectStage.overloadColor || '#EF4444' }} /> Custom Alert Line
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full w-full shadow-2xs transition-colors duration-200"
                      style={{ backgroundColor: editingProjectStage.overloadColor || '#EF4444' }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <div>
                  {projectStageLimits[editingProjectStage.status.name] && (
                    <button
                      type="button"
                      disabled={isUpdatingProject}
                      onClick={() => handleResetProjectStageLimit(editingProjectStage.status.name)}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                    >
                      <RotateCcw className="size-3.5" />
                      Reset to Default
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProjectStage(null)}
                    disabled={isUpdatingProject}
                    className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingProject}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Check className="size-3.5" />
                    {isUpdatingProject ? 'Saving...' : 'Save Project Limit'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Status Modal */}
      {addStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Add Workflow Status</h3>
              <button onClick={() => setAddStatusModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddStatus} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Status Name *</label>
                <input
                  type="text"
                  required
                  value={newStatus.name}
                  onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                  placeholder="e.g. READY_FOR_DEPLOY"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Status Category</label>
                <select
                  value={newStatus.category}
                  onChange={(e) => setNewStatus({ ...newStatus, category: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="TODO">To Do / Backlog Category</option>
                  <option value="IN_PROGRESS">In Progress Category</option>
                  <option value="DONE">Done / Completed Category</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Color Badge</label>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setNewStatus({ ...newStatus, color: p.color })}
                      className={`size-6 rounded-full border transition-all ${
                        newStatus.color === p.color ? 'ring-2 ring-blue-600 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.label}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={newStatus.color}
                  onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                  className="h-9 w-full rounded-lg border border-neutral-300 p-1 cursor-pointer"
                />
              </div>

              {/* Stage Overload Capacity (WIP Limit) */}
              <div className="pt-2 border-t border-neutral-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-neutral-700">Stage Capacity / WIP Limit (Tickets)</label>
                  {newStatus.category === 'DONE' ? (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Exempt (Done Stage)
                    </span>
                  ) : (
                    <span className="text-[10px] text-neutral-400 font-mono">Default: 5</span>
                  )}
                </div>
                {newStatus.category === 'DONE' ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-200 text-[11px] text-emerald-800">
                    Done / Completed stages are automatically exempt from overload limits. Completed tickets will never trigger bottleneck alerts.
                  </div>
                ) : (
                  <>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={newStatus.maxTasks ?? 5}
                      onChange={(e) => setNewStatus({ ...newStatus, maxTasks: parseInt(e.target.value) || 1 })}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      placeholder="5"
                    />
                    <p className="text-[10.5px] text-neutral-500 mt-1">
                      When tickets in this column exceed this number, the column top line changes to the custom overload color. Below this limit, it displays green.
                    </p>
                  </>
                )}
              </div>

              {/* Custom Overload Alert Color */}
              {newStatus.category !== 'DONE' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Custom Overload Alert Color (When &gt; {newStatus.maxTasks ?? 5} tickets)
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {OVERLOAD_COLOR_PRESETS.map((p) => (
                      <button
                        key={p.color}
                        type="button"
                        onClick={() => setNewStatus({ ...newStatus, overloadColor: p.color })}
                        className={`size-6 rounded-full border transition-all ${
                          (newStatus.overloadColor || '#EF4444') === p.color ? 'ring-2 ring-blue-600 ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: p.color }}
                        title={p.label}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newStatus.overloadColor || '#EF4444'}
                      onChange={(e) => setNewStatus({ ...newStatus, overloadColor: e.target.value })}
                      className="h-9 w-14 rounded-lg border border-neutral-300 p-1 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={newStatus.overloadColor || '#EF4444'}
                      onChange={(e) => setNewStatus({ ...newStatus, overloadColor: e.target.value })}
                      className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-mono uppercase focus:outline-none"
                    />
                  </div>

                  {/* Live Visual Telemetry Preview */}
                  <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 space-y-2">
                    <div className="text-[10.5px] font-bold text-neutral-500 uppercase tracking-wider">
                      Kanban Board Top Line Preview
                    </div>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-neutral-600 font-semibold">
                          <span>Healthy Flow (&le; {newStatus.maxTasks ?? 5} tickets):</span>
                          <span className="text-emerald-700 font-bold">Green Line</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-emerald-500 w-full shadow-2xs" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-neutral-600 font-semibold">
                          <span>Stage Overloaded (&gt; {newStatus.maxTasks ?? 5} tickets):</span>
                          <span className="font-bold" style={{ color: newStatus.overloadColor || '#EF4444' }}>
                            Custom Overload Color
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full w-full shadow-2xs"
                          style={{ backgroundColor: newStatus.overloadColor || '#EF4444' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setAddStatusModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  Add Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Issue Type Modal */}
      {addTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Add Custom Issue Type</h3>
              <button onClick={() => setAddTypeModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAddIssueType} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Issue Type Name *</label>
                <input
                  type="text"
                  required
                  value={newType.name}
                  onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                  placeholder="e.g. Security Vulnerability"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Icon</label>
                <select
                  value={newType.icon}
                  onChange={(e) => setNewType({ ...newType, icon: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="bookmark">Bookmark</option>
                  <option value="zap">Zap (Epic)</option>
                  <option value="check-square">Check Square (Task)</option>
                  <option value="alert-circle">Alert Circle (Bug)</option>
                  <option value="list">List (Sub-task)</option>
                  <option value="trending-up">Trending Up (Improvement)</option>
                  <option value="file-text">File Text</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Color Theme</label>
                <input
                  type="color"
                  value={newType.color}
                  onChange={(e) => setNewType({ ...newType, color: e.target.value })}
                  className="h-10 w-full rounded-lg border border-neutral-300 p-1 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  value={newType.description}
                  onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                  rows={2}
                  placeholder="When to use this issue type..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setAddTypeModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  Create Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Issue Type Modal */}
      {editingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Edit Issue Type</h3>
              <button onClick={() => setEditingType(null)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditIssueType} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Issue Type Name *</label>
                <input
                  type="text"
                  required
                  value={editingType.name}
                  onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                  placeholder="e.g. Bug, Feature, Spike"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editingType.description}
                  onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                  placeholder="Describe when this issue type is used..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Color Badge</label>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => setEditingType({ ...editingType, color: p.color })}
                      className={`size-6 rounded-full border transition-all ${
                        editingType.color === p.color ? 'ring-2 ring-blue-600 ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: p.color }}
                      title={p.label}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={editingType.color}
                  onChange={(e) => setEditingType({ ...editingType, color: e.target.value })}
                  className="h-9 w-full rounded-lg border border-neutral-300 p-1 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Icon</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(ICON_MAP).map(([key, IconComp]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditingType({ ...editingType, icon: key })}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition ${
                        editingType.icon === key
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <IconComp className="size-4" />
                      <span className="text-[10px] capitalize">{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingType(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Professional Status Deletion Confirmation Modal */}
      {deleteConfirmStatus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100 shrink-0">
                  <AlertTriangle className="size-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Remove Workflow Status</h3>
                  <p className="text-[11px] text-neutral-500">Pipeline modification confirmation</p>
                </div>
              </div>
              <button
                type="button"
                disabled={deletingStatus}
                onClick={() => setDeleteConfirmStatus(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body with the exact prompt */}
            <div className="mt-4 space-y-3">
              <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                Are you sure you want to remove status{' '}
                <span className="font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                  &ldquo;{deleteConfirmStatus.name}&rdquo;
                </span>{' '}
                from this workflow pipeline?
              </p>

              <div className="rounded-xl bg-amber-50 border border-amber-200/80 p-3 text-[11px] text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block text-amber-900">Kanban Board Impact</span>
                  <span>
                    Tasks currently under this stage on the Engineering Kanban and Tasks views will need to be transitioned or reassigned to another valid stage.
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 mt-5 border-t border-neutral-100">
              <button
                type="button"
                disabled={deletingStatus}
                onClick={() => setDeleteConfirmStatus(null)}
                className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingStatus}
                onClick={handleConfirmDeleteStatus}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition disabled:opacity-50"
              >
                {deletingStatus ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    <span>Remove Status</span>
                  </>
                )}
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
