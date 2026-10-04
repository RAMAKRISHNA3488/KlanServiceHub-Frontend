import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useGetWorkspaces } from '@/features/workspaces/api/use-get-workspaces';
import { useDeleteWorkspace } from '@/features/workspaces/api/use-delete-workspace';
import { useUpdateWorkspace } from '@/features/workspaces/api/use-update-workspace';
import { useCreateWorkspaceModal } from '@/features/workspaces/hooks/use-create-workspace-modal';
import { WorkspaceAvatar } from '@/features/workspaces/components/workspace-avatar';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { PageLoader } from '@/components/page-loader';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  Settings,
  Trash2,
  Users,
  FolderGit2,
  CheckCircle2,
  ShieldCheck,
  Crown,
  Calendar,
  AlertTriangle,
  Globe,
  Edit3,
  RefreshCw,
  X,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const WorkspacesManagementView = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceId();
  const { data: workspacesData, isLoading, refetch } = useGetWorkspaces();
  const { open: openCreateModal } = useCreateWorkspaceModal();
  const { mutate: deleteWorkspace, isPending: isDeleting } = useDeleteWorkspace();
  const { mutate: updateWorkspace, isPending: isUpdating } = useUpdateWorkspace();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL'); // ALL, OWNED, MEMBER

  // Modal states
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [deletingWorkspace, setDeletingWorkspace] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    image: '',
  });

  const workspaces = workspacesData?.documents || [];

  const filteredWorkspaces = workspaces.filter((ws) => {
    const matchesSearch =
      ws.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ws.domainSlug?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterRole === 'OWNED') return ws.isOwner || ws.userRole === 'ADMIN' || ws.isAdmin;
    if (filterRole === 'MEMBER') return !ws.isOwner && ws.userRole !== 'ADMIN';
    return true;
  });

  const totalMembers = workspaces.reduce((acc, ws) => acc + (ws.memberCount || 1), 0);
  const totalProjects = workspaces.reduce((acc, ws) => acc + (ws.projectCount || 0), 0);
  const ownedCount = workspaces.filter((ws) => ws.isOwner || ws.isAdmin).length;

  const handleOpenEdit = (ws) => {
    setEditingWorkspace(ws);
    setEditFormData({
      name: ws.name || '',
      description: ws.description || '',
      image: ws.imageUrl || '',
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingWorkspace) return;
    if (!editFormData.name.trim()) {
      toast.error('Workspace name is required');
      return;
    }

    updateWorkspace(
      {
        form: {
          name: editFormData.name.trim(),
          image: editFormData.image instanceof File ? editFormData.image : (editFormData.image || ''),
        },
        param: { workspaceId: editingWorkspace.$id || editingWorkspace.id },
      },
      {
        onSuccess: () => {
          toast.success('Workspace updated successfully');
          queryClient.invalidateQueries({ queryKey: ['workspaces'] });
          queryClient.invalidateQueries({ queryKey: ['workspace', editingWorkspace.$id || editingWorkspace.id] });
          setEditingWorkspace(null);
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to update workspace');
        },
      }
    );
  };

  const handleConfirmDelete = () => {
    if (!deletingWorkspace) return;
    const wsId = deletingWorkspace.$id || deletingWorkspace.id;

    deleteWorkspace(
      {
        param: { workspaceId: wsId },
      },
      {
        onSuccess: () => {
          toast.success(`Workspace "${deletingWorkspace.name}" deleted successfully`);
          setDeletingWorkspace(null);
          queryClient.invalidateQueries({ queryKey: ['workspaces'] });
          if (activeWorkspaceId === wsId) {
            const remaining = workspaces.filter((w) => (w.$id || w.id) !== wsId);
            if (remaining.length > 0) {
              navigate(`/workspaces/${remaining[0].$id || remaining[0].id}`);
            } else {
              navigate('/onboarding');
            }
          }
        },
        onError: (err) => {
          toast.error(err.message || 'Failed to delete workspace');
        },
      }
    );
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="flex flex-col gap-y-6 p-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
              <Building2 className="size-4.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-neutral-900">
                Workspaces & Organizations
              </h1>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Manage, switch, edit, or delete all your Jira workspace environments.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition shadow-xs"
          >
            <RefreshCw className="size-3.5" /> Refresh
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition shadow-xs"
          >
            <Plus className="size-3.5" /> Create Workspace
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-white shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Total Workspaces</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-xl font-bold text-neutral-900">{workspaces.length}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold">Active</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-white shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Admin / Owner Access</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-xl font-bold text-neutral-900">{ownedCount}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold flex items-center gap-1">
              <Crown className="size-3" /> Full Control
            </span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-white shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Total Projects</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-xl font-bold text-neutral-900">{totalProjects}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">Tracked</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-neutral-200/80 bg-white shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Workspace Members</p>
          <div className="flex items-baseline justify-between mt-1.5">
            <span className="text-xl font-bold text-neutral-900">{totalMembers}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold flex items-center gap-1">
              <Users className="size-3" /> Total Seats
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search workspaces by name or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 text-xs bg-neutral-50/50 focus:bg-white focus:border-blue-500 focus:outline-none transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {['ALL', 'OWNED', 'MEMBER'].map((role) => (
            <button
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                filterRole === role
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {role === 'ALL' ? 'All Workspaces' : role === 'OWNED' ? 'Admin / Owned' : 'Member Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Workspaces Grid */}
      {filteredWorkspaces.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-8">
          <Building2 className="size-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-neutral-800">No workspaces found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery
              ? `No workspace matched "${searchQuery}". Try a different search term.`
              : 'You have not joined or created any workspace yet.'}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-sm hover:bg-blue-700"
          >
            <Plus className="size-4" /> Create Your First Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredWorkspaces.map((ws) => {
            const wsId = ws.$id || ws.id;
            const isCurrent = activeWorkspaceId === wsId;
            const canManage = ws.isOwner || ws.isAdmin || ws.userRole === 'ADMIN';

            return (
              <div
                key={wsId}
                className={`flex flex-col justify-between rounded-2xl border transition-all duration-200 bg-white p-5 shadow-xs hover:shadow-md ${
                  isCurrent ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-neutral-200/90 hover:border-neutral-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <WorkspaceAvatar name={ws.name} image={ws.imageUrl} className="size-12 rounded-xl shadow-xs" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-neutral-900 line-clamp-1">{ws.name}</h3>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 font-mono mt-0.5">
                          {ws.domainSlug ? `${ws.domainSlug}.jira.io` : `ID: ${wsId.slice(0, 8)}...`}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        canManage
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                      }`}
                    >
                      {ws.isOwner ? 'Owner' : ws.userRole || 'Member'}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-neutral-600 mt-3 line-clamp-2 min-h-[32px]">
                    {ws.description || 'No workspace description provided. Add one in settings.'}
                  </p>

                  {/* Stats Pill Row */}
                  <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-neutral-100 text-center">
                    <div className="bg-neutral-50 rounded-lg p-2">
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase">Members</p>
                      <p className="text-sm font-bold text-neutral-800 mt-0.5">{ws.memberCount || 1}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-2">
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase">Projects</p>
                      <p className="text-sm font-bold text-neutral-800 mt-0.5">{ws.projectCount || 0}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-2">
                      <p className="text-[10px] text-neutral-400 font-semibold uppercase">Issues</p>
                      <p className="text-sm font-bold text-neutral-800 mt-0.5">{ws.taskCount || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleOpenEdit(ws)}
                          title="Edit Workspace"
                          className="size-8 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 flex items-center justify-center transition"
                        >
                          <Edit3 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => navigate(`/workspaces/${wsId}/settings`)}
                          title="Workspace Settings"
                          className="size-8 rounded-lg border border-neutral-200 hover:bg-neutral-100 text-neutral-600 flex items-center justify-center transition"
                        >
                          <Settings className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingWorkspace(ws)}
                          title="Delete Workspace"
                          className="size-8 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 flex items-center justify-center transition"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => navigate(`/workspaces/${wsId}`)}
                    className={`flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                      isCurrent
                        ? 'bg-neutral-900 text-white hover:bg-black'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                    }`}
                  >
                    {isCurrent ? 'Open Workspace' : 'Switch To'} <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inline Edit Workspace Modal */}
      {editingWorkspace && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Edit3 className="size-4" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">Edit Workspace</h3>
              </div>
              <button
                onClick={() => setEditingWorkspace(null)}
                className="size-7 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 flex items-center justify-center transition"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 flex flex-col gap-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Workspace Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  placeholder="e.g. Acme Corp Cloud"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={3}
                  placeholder="Describe your workspace mission or department..."
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-medium focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={() => setEditingWorkspace(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Workspace Confirmation Modal */}
      {deletingWorkspace && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-red-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="size-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-red-950">Delete Workspace?</h3>
                <p className="text-xs text-red-600 font-medium">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mt-4 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-neutral-900 font-mono">"{deletingWorkspace.name}"</span>?
              All associated projects, tasks, sprints, backlog items, and members will be permanently erased.
            </p>

            <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-neutral-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingWorkspace(null)}
                className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/30 transition disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Workspace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
