import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { workflowsAdminApi } from '@/lib/api-client';
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

export const WorkflowsAdminView = () => {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const pipelineScrollRef = React.useRef(null);
  const [workflows, setWorkflows] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [activeTab, setActiveTab] = useState('WORKFLOWS'); // WORKFLOWS, ISSUE_TYPES
  const [loading, setLoading] = useState(true);

  // Edit Workflow Metadata Modal/State
  const [editWorkflowModal, setEditWorkflowModal] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({ name: '', description: '' });

  // Add Status Modal
  const [addStatusModal, setAddStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState({ name: '', category: 'IN_PROGRESS', color: '#3B82F6' });

  // Edit Status Modal
  const [editingStatus, setEditingStatus] = useState(null); // { id, name, category, color }

  // Delete Status Confirmation Modal
  const [deleteConfirmStatus, setDeleteConfirmStatus] = useState(null); // { workflowId, statusId, name }
  const [deletingStatus, setDeletingStatus] = useState(false);

  // Add Issue Type Modal
  const [addTypeModal, setAddTypeModal] = useState(false);
  const [newType, setNewType] = useState({ name: '', icon: 'bookmark', color: '#4F46E5', description: '' });

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
      await workflowsAdminApi.addStatus(workspaceId, defaultWorkflow.id, newStatus);
      toast.success(`Status "${newStatus.name.toUpperCase().replace(/\s+/g, '_')}" added to workflow!`);
      setAddStatusModal(false);
      setNewStatus({ name: '', category: 'IN_PROGRESS', color: '#3B82F6' });
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
      title: 'Delete Issue Type',
      message: `Are you sure you want to delete issue type "${typeName}"? Issues currently assigned to this type will retain their history but may require reassignment.`,
      variant: 'destructive',
      confirmText: 'Delete Type',
      warningNotice: 'This action cannot be undone.'
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

  if (loading) {
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
            Configure custom enterprise lifecycle transition pipelines, issue categories, and status states that drive your Kanban Boards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/boards`)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
          >
            <Columns3 className="size-3.5 text-blue-600" />
            <span>View Kanban Board</span>
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
          Workflow Status Pipeline
        </button>
        <button
          onClick={() => setActiveTab('ISSUE_TYPES')}
          className={`border-b-2 px-4 py-2.5 text-xs font-bold transition ${
            activeTab === 'ISSUE_TYPES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          Issue Types & Schemas
        </button>
      </div>

      {/* Workflow Designer Tab */}
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
              <span>Live Synced with Engineering Kanban Board ➔</span>
            </button>
          </div>

          {/* Visual Pipeline with Edit, Add, Reorder, Delete & Horizontal Scrolling */}
          <div className="rounded-xl bg-neutral-50 p-6 border border-neutral-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  Active Lifecycle Progression Path ({defaultWorkflow.statuses?.length || 0} Stages)
                </p>
                <span className="text-[10px] text-neutral-400">Scroll horizontally to view all stages • Use arrows on cards to reorder</span>
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
              {(defaultWorkflow.statuses || []).map((st, idx) => (
                <React.Fragment key={st.id}>
                  <div className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs w-[215px] shrink-0 min-h-[125px] hover:border-blue-300 hover:shadow-md transition group">
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
                      </div>
                    </div>

                    {/* Middle Row: Status Name */}
                    <div className="py-2">
                      <p className="text-xs font-bold text-neutral-900 break-words line-clamp-2 leading-snug" title={st.name}>
                        {st.name}
                      </p>
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
                          disabled={idx === 0}
                          onClick={() => handleReorderStatus(idx, 'left')}
                          className="p-0.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                          title="Move step left"
                        >
                          <ChevronLeft className="size-3" />
                        </button>
                        <button
                          disabled={idx === defaultWorkflow.statuses.length - 1}
                          onClick={() => handleReorderStatus(idx, 'right')}
                          className="p-0.5 rounded text-neutral-500 hover:text-neutral-900 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
                          title="Move step right"
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
              ))}

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

                  <button
                    onClick={() => handleDeleteIssueType(it.id, it.name)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-600 rounded transition"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                <p className="text-xs text-neutral-600 mt-3 line-clamp-2">{it.description || 'Standard issue type'}</p>
              </div>
            );
          })}
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
