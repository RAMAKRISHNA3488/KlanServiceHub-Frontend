import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { teamsAdminApi, usersAdminApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Crown,
  FolderGit2,
  MoreVertical,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  UserCheck,
} from 'lucide-react';

export const TeamsAdminView = () => {
  const workspaceId = useWorkspaceId();
  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Delete Team',
    'Are you sure you want to delete this team?',
    'destructive'
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    leadId: '',
    memberIds: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, usersRes] = await Promise.all([
        teamsAdminApi.getTeams(workspaceId),
        usersAdminApi.getUsers(workspaceId),
      ]);
      if (teamsRes?.data) setTeams(teamsRes.data);
      if (usersRes?.data) setUsers(usersRes.data);
    } catch (e) {
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await teamsAdminApi.updateTeam(workspaceId, editingTeam.id, teamForm);
        toast.success('Team updated successfully!');
      } else {
        await teamsAdminApi.createTeam(workspaceId, teamForm);
        toast.success(`Team ${teamForm.name} created!`);
      }
      setModalOpen(false);
      setEditingTeam(null);
      setTeamForm({ name: '', description: '', leadId: '', memberIds: [] });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save team');
    }
  };

  const handleDeleteTeam = async (teamId, teamName = 'this team') => {
    const ok = await confirmAction({
      title: 'Delete Team',
      message: `Are you sure you want to delete team "${teamName}"?`,
      variant: 'destructive',
      confirmText: 'Delete Team',
      warningNotice: 'Assigned projects and issues will remain intact, but squad alignment associations will be removed.'
    });
    if (!ok) return;

    try {
      await teamsAdminApi.deleteTeam(workspaceId, teamId);
      toast.success('Team deleted.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete team');
    }
  };

  const handleOpenEdit = (t) => {
    setEditingTeam(t);
    setTeamForm({
      name: t.name,
      description: t.description || '',
      leadId: t.lead?.id || '',
      memberIds: (t.members || []).map((m) => m.id),
    });
    setModalOpen(true);
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
          <h1 className="text-lg font-bold text-neutral-900">Teams Management</h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Organize engineering, QA, design, and product units with assigned team leads and cross-project tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingTeam(null);
              setTeamForm({ name: '', description: '', leadId: '', memberIds: [] });
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
          >
            <Plus className="size-3.5" />
            Create Team
          </button>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {teams.map((t) => (
          <div
            key={t.id}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {t.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">{t.name}</h3>
                    <span className="text-[11px] text-neutral-400">{t.members?.length || 0} members</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(t)}
                    className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(t.id, t.name)}
                    className="p-1 text-neutral-400 hover:text-red-600 rounded transition"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-neutral-600 mt-3 line-clamp-2">{t.description || 'No description provided.'}</p>

              {/* Lead Information */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700">
                    <Crown className="size-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block">Team Lead</span>
                    <span className="text-xs font-semibold text-neutral-800">{t.lead?.name || 'Unassigned'}</span>
                  </div>
                </div>
              </div>

              {/* Members Avatars */}
              <div className="mt-4">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-2">Members</span>
                <div className="flex items-center -space-x-2 overflow-hidden">
                  {(t.members || []).slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      title={`${m.name} (${m.email})`}
                      className="size-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                    >
                      {m.name.substring(0, 2).toUpperCase()}
                    </div>
                  ))}
                  {(t.members || []).length > 5 && (
                    <div className="size-7 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-neutral-600 shadow-sm">
                      +{t.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <FolderGit2 className="size-3.5 text-neutral-400" />
                {t.projects?.length || 0} assigned projects
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Team Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">{editingTeam ? 'Edit Team' : 'Create New Team'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  placeholder="e.g. Frontend & Design Unit"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  rows={2}
                  placeholder="Mission and core responsibility of this team..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Team Lead</label>
                <select
                  value={teamForm.leadId}
                  onChange={(e) => setTeamForm({ ...teamForm, leadId: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Team Lead (Optional)</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  {editingTeam ? 'Save Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};
