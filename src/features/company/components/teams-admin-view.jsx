import React, { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { teamsAdminApi, usersAdminApi, apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import { AdminTableSkeleton } from './skeletons/admin-table-skeleton';
import {
  Users,
  Plus,
  Crown,
  FolderGit2,
  Trash2,
  Edit2,
  X,
  Search,
  Check,
  ExternalLink,
  Layers,
  Sparkles,
  Shield,
  Briefcase,
  UserCheck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const TeamsAdminView = () => {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Delete Team',
    'Are you sure you want to delete this team?',
    'destructive'
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('details'); // 'details' | 'members' | 'projects'
  const [editingTeam, setEditingTeam] = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [projectSearch, setProjectSearch] = useState('');

  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    leadId: '',
    memberIds: [],
    projectIds: [],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, usersRes, projectsRes] = await Promise.all([
        teamsAdminApi.getTeams(workspaceId).catch(() => ({ data: [] })),
        usersAdminApi.getUsers(workspaceId).catch(() => ({ data: [] })),
        apiFetch(`/api/projects?workspaceId=${workspaceId}`).catch(() => ({ data: [] })),
      ]);

      if (teamsRes?.data) setTeams(teamsRes.data);
      if (usersRes?.data) setUsers(usersRes.data);

      const projList = projectsRes?.data?.documents || (Array.isArray(projectsRes?.data) ? projectsRes.data : []);
      setProjects(projList);

      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team-workload'] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
    } catch (e) {
      toast.error('Failed to load teams data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId]);

  // Handle Team Create / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamForm.name.trim()) {
      toast.error('Team name is required');
      return;
    }

    try {
      if (editingTeam) {
        await teamsAdminApi.updateTeam(workspaceId, editingTeam.id, teamForm);
        toast.success(`Team "${teamForm.name}" updated successfully!`);
      } else {
        await teamsAdminApi.createTeam(workspaceId, teamForm);
        toast.success(`Team "${teamForm.name}" created successfully!`);
      }
      setModalOpen(false);
      setEditingTeam(null);
      setTeamForm({ name: '', description: '', leadId: '', memberIds: [], projectIds: [] });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save team');
    }
  };

  const handleDeleteTeam = async (teamId, teamName = 'this team') => {
    const ok = await confirmAction({
      title: 'Delete Team',
      subtitle: 'Team alignment removal',
      targetName: teamName,
      message: `Are you sure you want to delete squad "${teamName}"?`,
      variant: 'destructive',
      confirmText: 'Delete Team',
      impactTitle: 'Squad Alignment Impact',
      impactNotice: 'Assigned projects and issues will remain intact, but team associations and member alignments will be removed.',
    });
    if (!ok) return;

    try {
      await teamsAdminApi.deleteTeam(workspaceId, teamId);
      toast.success('Team deleted successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete team');
    }
  };

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setTeamForm({
      name: '',
      description: '',
      leadId: '',
      memberIds: [],
      projectIds: [],
    });
    setMemberSearch('');
    setProjectSearch('');
    setModalTab('details');
    setModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTeam(t);
    setTeamForm({
      name: t.name,
      description: t.description || '',
      leadId: t.lead?.id || t.lead_id || '',
      memberIds: (t.members || []).map((m) => m.id),
      projectIds: (t.projects || []).map((p) => p.id),
    });
    setMemberSearch('');
    setProjectSearch('');
    setModalTab('details');
    setModalOpen(true);
  };

  // Member toggle helper
  const toggleMember = (userId) => {
    setTeamForm((prev) => {
      const isSelected = prev.memberIds.includes(userId);
      const nextMemberIds = isSelected
        ? prev.memberIds.filter((id) => id !== userId)
        : [...prev.memberIds, userId];
      
      // If removed member was the lead, clear lead
      const nextLeadId = isSelected && prev.leadId === userId ? '' : prev.leadId;
      return { ...prev, memberIds: nextMemberIds, leadId: nextLeadId };
    });
  };

  // Project toggle helper
  const toggleProject = (projectId) => {
    setTeamForm((prev) => {
      const isSelected = prev.projectIds.includes(projectId);
      const nextProjectIds = isSelected
        ? prev.projectIds.filter((id) => id !== projectId)
        : [...prev.projectIds, projectId];
      return { ...prev, projectIds: nextProjectIds };
    });
  };

  // Filtered members in modal picker
  const filteredModalUsers = useMemo(() => {
    if (!memberSearch.trim()) return users;
    const q = memberSearch.toLowerCase();
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.job_title || '').toLowerCase().includes(q)
    );
  }, [users, memberSearch]);

  // Filtered projects in modal picker
  const filteredModalProjects = useMemo(() => {
    if (!projectSearch.trim()) return projects;
    const q = projectSearch.toLowerCase();
    return projects.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.key || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    );
  }, [projects, projectSearch]);

  // Filtered teams list based on main search input
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const q = searchQuery.toLowerCase().trim();
    return teams.filter((t) => {
      const nameMatch = (t.name || '').toLowerCase().includes(q);
      const descMatch = (t.description || '').toLowerCase().includes(q);
      const leadMatch = (t.lead?.name || '').toLowerCase().includes(q);
      const memberMatch = (t.members || []).some((m) =>
        (m.name || '').toLowerCase().includes(q) || (m.email || '').toLowerCase().includes(q)
      );
      const projectMatch = (t.projects || []).some((p) =>
        (p.name || '').toLowerCase().includes(q) || (p.key || '').toLowerCase().includes(q)
      );
      return nameMatch || descMatch || leadMatch || memberMatch || projectMatch;
    });
  }, [teams, searchQuery]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalTeams = teams.length;
    const uniqueMemberIds = new Set();
    const uniqueProjectIds = new Set();

    teams.forEach((t) => {
      (t.members || []).forEach((m) => uniqueMemberIds.add(m.id));
      (t.projects || []).forEach((p) => uniqueProjectIds.add(p.id));
    });

    const totalUsers = users.length || 1;
    const coveragePercent = Math.min(100, Math.round((uniqueMemberIds.size / totalUsers) * 100));

    return {
      totalTeams,
      assignedMembers: uniqueMemberIds.size,
      connectedProjects: uniqueProjectIds.size,
      coveragePercent,
    };
  }, [teams, users]);

  if (loading && teams.length === 0) {
    return (
      <div className="w-full pb-16">
        <AdminTableSkeleton
          title="Teams & Squads"
          subtitle="Organize engineers, designers, and contributors into high-performing squads."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5 w-full pb-20">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <Users className="size-4 text-blue-600" />
            <span>Teams & Squads Management</span>
          </h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Organize engineering, QA, design, and product units with assigned team leads, dedicated team members, and linked projects.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Create Squad / Team</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-[11px] font-semibold">
            <span>Total Squads</span>
            <Layers className="size-3.5 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-neutral-900 mt-1">{stats.totalTeams}</p>
          <span className="text-[10px] text-neutral-400">Active functional units</span>
        </div>

        <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-[11px] font-semibold">
            <span>Assigned Members</span>
            <Users className="size-3.5 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-neutral-900 mt-1">{stats.assignedMembers}</p>
          <span className="text-[10px] text-neutral-400">Engineers & contributors</span>
        </div>

        <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-[11px] font-semibold">
            <span>Connected Projects</span>
            <FolderGit2 className="size-3.5 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-neutral-900 mt-1">{stats.connectedProjects}</p>
          <span className="text-[10px] text-neutral-400">Active project boards</span>
        </div>

        <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-[11px] font-semibold">
            <span>Squad Coverage</span>
            <Shield className="size-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-neutral-900 mt-1">{stats.coveragePercent}%</p>
          <span className="text-[10px] text-neutral-400">Of workspace members in teams</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-neutral-200/90 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="size-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter teams by name, member, team lead, or project..."
            className="w-full pl-8 pr-7 py-1 text-xs border border-neutral-200 rounded-md focus:outline-none focus:border-blue-500 bg-neutral-50/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="size-3" />
            </button>
          )}
        </div>

        <span className="text-[11px] text-neutral-500 font-medium">
          Showing <span className="font-bold text-neutral-800">{filteredTeams.length}</span> of {teams.length} squads
        </span>
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center shadow-2xs">
          <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Users className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-neutral-900">
            {searchQuery ? 'No squads match your search' : 'No squads created yet'}
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'Try adjusting your search query to find matching squads or members.'
              : 'Create your first squad to assign team leads, organize engineers, and track linked projects.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition"
            >
              <Plus className="size-3.5" />
              <span>Create First Squad</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((t) => {
            const memberCount = (t.members || []).length;
            const projectCount = (t.projects || []).length;

            return (
              <div
                key={t.id}
                className="rounded-xl border border-neutral-200/90 bg-white p-4 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Squad Avatar & Actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-xs shadow-2xs shrink-0">
                        {t.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-neutral-900 truncate" title={t.name}>
                          {t.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mt-0.5">
                          <span>{memberCount} member{memberCount === 1 ? '' : 's'}</span>
                          <span>•</span>
                          <span>{projectCount} project{projectCount === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenEdit(t)}
                        title="Edit Squad Details, Members & Projects"
                        className="p-1 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition cursor-pointer"
                      >
                        <Edit2 className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(t.id, t.name)}
                        title="Delete Team"
                        className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-neutral-600 mt-2.5 line-clamp-2 min-h-[30px] leading-relaxed">
                    {t.description || 'No description provided for this squad.'}
                  </p>

                  {/* Team Lead Card */}
                  <div className="mt-3.5 rounded-lg border border-neutral-100 bg-neutral-50/70 p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                        <Crown className="size-3" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block leading-tight">
                          Team Lead
                        </span>
                        <span className="text-xs font-semibold text-neutral-800 truncate block">
                          {t.lead?.name || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    {t.lead?.email && (
                      <span className="text-[10px] text-neutral-400 truncate max-w-[120px]" title={t.lead.email}>
                        {t.lead.email}
                      </span>
                    )}
                  </div>

                  {/* Members Section */}
                  <div className="mt-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                        Squad Members ({memberCount})
                      </span>
                      {memberCount === 0 && (
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="text-[10px] text-blue-600 font-semibold hover:underline"
                        >
                          + Assign people
                        </button>
                      )}
                    </div>

                    {memberCount > 0 ? (
                      <div className="flex items-center -space-x-1.5 overflow-hidden py-0.5">
                        {(t.members || []).slice(0, 6).map((m) => (
                          <div
                            key={m.id}
                            title={`${m.name} (${m.email})`}
                            className="size-6 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[9px] font-bold text-white shadow-2xs select-none"
                          >
                            {m.name.substring(0, 2).toUpperCase()}
                          </div>
                        ))}
                        {memberCount > 6 && (
                          <div
                            title={`${memberCount - 6} more members`}
                            className="size-6 rounded-full bg-neutral-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-neutral-700 shadow-2xs"
                          >
                            +{memberCount - 6}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-neutral-400 italic">No members assigned yet.</p>
                    )}
                  </div>
                </div>

                {/* Assigned Projects Section (Footer) */}
                <div className="mt-4 pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold flex items-center gap-1">
                      <FolderGit2 className="size-3 text-neutral-400" />
                      Assigned Projects ({projectCount})
                    </span>
                    {projectCount === 0 && (
                      <button
                        onClick={() => handleOpenEdit(t)}
                        className="text-[10px] text-blue-600 font-semibold hover:underline"
                      >
                        + Link project
                      </button>
                    )}
                  </div>

                  {projectCount > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(t.projects || []).slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => navigate(`/workspaces/${workspaceId}/projects/${p.id}`)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 hover:bg-blue-50 hover:text-blue-700 text-neutral-700 border border-neutral-200/80 rounded text-[10px] font-semibold transition cursor-pointer"
                          title={`Open ${p.name}`}
                        >
                          {p.key && (
                            <span className="font-mono text-[9px] bg-white border border-neutral-200 px-1 rounded text-neutral-600">
                              {p.key}
                            </span>
                          )}
                          <span className="truncate max-w-[110px]">{p.name}</span>
                          <ExternalLink className="size-2 text-neutral-400" />
                        </button>
                      ))}
                      {projectCount > 3 && (
                        <span className="text-[9px] font-semibold text-neutral-400 px-1 py-0.5 bg-neutral-50 rounded">
                          +{projectCount - 3} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-neutral-400 italic">No projects assigned.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Squad Modal with Advanced Member & Project Pickers */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-white shadow-2xl border border-neutral-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 shrink-0 bg-neutral-50/50">
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  {editingTeam ? `Edit Squad: ${editingTeam.name}` : 'Create New Squad / Team'}
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Configure squad identity, assign engineering members, and connect projects.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100 transition"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Tab Selector */}
            <div className="flex items-center border-b border-neutral-200 px-6 gap-6 bg-white shrink-0 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`py-3 border-b-2 transition ${
                  modalTab === 'details'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                1. General Info
              </button>
              <button
                type="button"
                onClick={() => setModalTab('members')}
                className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                  modalTab === 'members'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>2. Assign People</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    teamForm.memberIds.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {teamForm.memberIds.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setModalTab('projects')}
                className={`py-3 border-b-2 transition flex items-center gap-1.5 ${
                  modalTab === 'projects'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <span>3. Assign Projects</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    teamForm.projectIds.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  {teamForm.projectIds.length}
                </span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Squad / Team Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={teamForm.name}
                      onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                      placeholder="e.g. Core Platform & Infrastructure"
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">Squad Mission / Description</label>
                    <textarea
                      value={teamForm.description}
                      onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                      rows={3}
                      placeholder="Describe the primary responsibility, deliverables, and focus area of this squad..."
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                      <Crown className="size-3 text-amber-600" />
                      <span>Designated Team Lead</span>
                    </label>
                    <select
                      value={teamForm.leadId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTeamForm((prev) => ({
                          ...prev,
                          leadId: val,
                          // Automatically ensure the lead is also an assigned member
                          memberIds: val && !prev.memberIds.includes(val) ? [...prev.memberIds, val] : prev.memberIds,
                        }));
                      }}
                      className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">No Team Lead (Optional)</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Selecting a Team Lead will automatically include them in the squad's member roster.
                    </p>
                  </div>

                  {/* Summary preview */}
                  <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-neutral-700 block">Roster Snapshot:</span>
                      <span className="text-[11px] text-neutral-500">
                        {teamForm.memberIds.length} members assigned, {teamForm.projectIds.length} projects linked
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModalTab('members')}
                      className="text-blue-600 text-[11px] font-bold hover:underline"
                    >
                      Manage Roster →
                    </button>
                  </div>
                </div>
              )}

              {modalTab === 'members' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="size-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                        placeholder="Search members by name, email, or role..."
                        className="w-full pl-8 pr-7 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      {memberSearch && (
                        <button
                          type="button"
                          onClick={() => setMemberSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() =>
                          setTeamForm((prev) => ({
                            ...prev,
                            memberIds: users.map((u) => u.id),
                          }))
                        }
                        className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded font-semibold transition"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTeamForm((prev) => ({
                            ...prev,
                            memberIds: [],
                            leadId: '',
                          }))
                        }
                        className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded font-semibold transition"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Selected Members Chips Tray */}
                  {teamForm.memberIds.length > 0 && (
                    <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1.5">
                        Selected Members ({teamForm.memberIds.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {teamForm.memberIds.map((uid) => {
                          const userObj = users.find((u) => u.id === uid);
                          if (!userObj) return null;
                          const isLead = teamForm.leadId === uid;

                          return (
                            <span
                              key={uid}
                              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold border ${
                                isLead
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-white text-neutral-800 border-neutral-200'
                              }`}
                            >
                              {isLead && <Crown className="size-2.5 text-amber-600" />}
                              <span>{userObj.name}</span>
                              <button
                                type="button"
                                onClick={() => toggleMember(uid)}
                                className="text-neutral-400 hover:text-red-600 ml-0.5"
                              >
                                <X className="size-2.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Scrollable Members List */}
                  <div className="border border-neutral-200 rounded-lg max-h-[300px] overflow-y-auto divide-y divide-neutral-100">
                    {filteredModalUsers.length === 0 ? (
                      <p className="p-4 text-center text-xs text-neutral-400">No members found matching search.</p>
                    ) : (
                      filteredModalUsers.map((u) => {
                        const isSelected = teamForm.memberIds.includes(u.id);
                        const isLead = teamForm.leadId === u.id;

                        return (
                          <div
                            key={u.id}
                            onClick={() => toggleMember(u.id)}
                            className={`p-2.5 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer select-none ${
                              isSelected ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`size-4 rounded flex items-center justify-center border transition ${
                                  isSelected
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'border-neutral-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="size-3 stroke-[3]" />}
                              </div>

                              <div className="size-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                                {u.name.substring(0, 2).toUpperCase()}
                              </div>

                              <div className="min-w-0">
                                <span className="text-xs font-semibold text-neutral-800 block truncate">
                                  {u.name}
                                </span>
                                <span className="text-[10px] text-neutral-400 block truncate">
                                  {u.email} {u.job_title ? `• ${u.job_title}` : ''}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              {isSelected && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTeamForm((prev) => ({
                                      ...prev,
                                      leadId: isLead ? '' : u.id,
                                    }))
                                  }
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 border transition ${
                                    isLead
                                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                                      : 'bg-neutral-100 hover:bg-amber-50 text-neutral-500 hover:text-amber-800 border-neutral-200'
                                  }`}
                                  title={isLead ? 'Current Team Lead (Click to remove)' : 'Designate as Team Lead'}
                                >
                                  <Crown className="size-2.5" />
                                  <span>{isLead ? 'Lead' : 'Set Lead'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {modalTab === 'projects' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="size-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={projectSearch}
                        onChange={(e) => setProjectSearch(e.target.value)}
                        placeholder="Search workspace projects by name, key, or category..."
                        className="w-full pl-8 pr-7 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      {projectSearch && (
                        <button
                          type="button"
                          onClick={() => setProjectSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() =>
                          setTeamForm((prev) => ({
                            ...prev,
                            projectIds: projects.map((p) => p.id),
                          }))
                        }
                        className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded font-semibold transition"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setTeamForm((prev) => ({
                            ...prev,
                            projectIds: [],
                          }))
                        }
                        className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded font-semibold transition"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  {/* Selected Projects Chips Tray */}
                  {teamForm.projectIds.length > 0 && (
                    <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1.5">
                        Selected Projects ({teamForm.projectIds.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {teamForm.projectIds.map((pid) => {
                          const projObj = projects.find((p) => p.id === pid);
                          if (!projObj) return null;

                          return (
                            <span
                              key={pid}
                              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold bg-white text-neutral-800 border border-neutral-200 shadow-2xs"
                            >
                              {projObj.key && (
                                <span className="font-mono text-[9px] bg-neutral-100 px-1 rounded text-neutral-600 font-bold">
                                  {projObj.key}
                                </span>
                              )}
                              <span>{projObj.name}</span>
                              <button
                                type="button"
                                onClick={() => toggleProject(pid)}
                                className="text-neutral-400 hover:text-red-600 ml-0.5"
                              >
                                <X className="size-2.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Scrollable Projects List */}
                  <div className="border border-neutral-200 rounded-lg max-h-[300px] overflow-y-auto divide-y divide-neutral-100">
                    {filteredModalProjects.length === 0 ? (
                      <p className="p-4 text-center text-xs text-neutral-400">No projects found matching search.</p>
                    ) : (
                      filteredModalProjects.map((p) => {
                        const isSelected = teamForm.projectIds.includes(p.id);

                        return (
                          <div
                            key={p.id}
                            onClick={() => toggleProject(p.id)}
                            className={`p-2.5 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer select-none ${
                              isSelected ? 'bg-emerald-50/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`size-4 rounded flex items-center justify-center border transition ${
                                  isSelected
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-neutral-300 bg-white'
                                }`}
                              >
                                {isSelected && <Check className="size-3 stroke-[3]" />}
                              </div>

                              <div className="size-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                                <FolderGit2 className="size-3.5" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {p.key && (
                                    <span className="font-mono text-[9px] bg-neutral-100 text-neutral-600 font-bold px-1 rounded">
                                      {p.key}
                                    </span>
                                  )}
                                  <span className="text-xs font-semibold text-neutral-800 truncate">
                                    {p.name}
                                  </span>
                                </div>
                                <span className="text-[10px] text-neutral-400 block truncate">
                                  {p.category || 'Software Project'}
                                </span>
                              </div>
                            </div>

                            <span className="text-[10px] font-medium text-neutral-400 shrink-0">
                              {isSelected ? 'Assigned' : 'Click to add'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                <span className="text-[11px] text-neutral-400 font-medium">
                  {modalTab === 'details'
                    ? 'Fill in squad details, then proceed to assign members & projects.'
                    : `${teamForm.memberIds.length} members & ${teamForm.projectIds.length} projects queued.`}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-lg px-3.5 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-1.5 text-xs font-bold text-white shadow-xs transition"
                  >
                    {editingTeam ? 'Save Squad Changes' : 'Create Squad'}
                  </button>
                </div>
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
