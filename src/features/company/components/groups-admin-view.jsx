import React, { useState, useEffect, useMemo } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { groupsApi, usersAdminApi, rolesAdminApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Users,
  Plus,
  Trash2,
  UserPlus,
  Shield,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  Globe,
  UserCheck,
  Sparkles,
  Code2,
  Headphones,
  Compass,
  Edit3,
  ShieldCheck,
  LayoutGrid,
  List,
} from 'lucide-react';

const PRESET_TEMPLATES = [
  {
    name: 'core-engineers',
    description: 'Software engineers, architects, and technical contributors across squads.',
    type: 'SECURITY',
    role: 'Developer',
    isDefault: true,
  },
  {
    name: 'product-and-design',
    description: 'Product managers, UX designers, and backlog roadmap planners.',
    type: 'CUSTOM',
    role: 'Project Manager',
    isDefault: false,
  },
  {
    name: 'qa-release-gatekeepers',
    description: 'Quality assurance specialists and automation test engineers.',
    type: 'CUSTOM',
    role: 'Tester',
    isDefault: false,
  },
  {
    name: 'support-and-ops',
    description: 'Customer support agents, operations, and triage responders.',
    type: 'CUSTOM',
    role: 'Member',
    isDefault: false,
  },
  {
    name: 'external-contractors',
    description: 'Restricted external partners and contract specialists.',
    type: 'SECURITY',
    role: 'Viewer',
    isDefault: false,
  },
];

export const GroupsAdminView = () => {
  const workspaceId = useWorkspaceId();

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Delete Access Group',
    'Are you sure you want to delete this access group?',
    'destructive'
  );

  // Navigation & View State
  const [activeTab, setActiveTab] = useState('GROUPS'); // 'GROUPS' | 'DIRECTORY' | 'PERMISSIONS'
  const [viewMode, setViewMode] = useState('GRID'); // 'GRID' | 'TABLE'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic Data State
  const [groups, setGroups] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stats, setStats] = useState({
    workspaceName: '',
    domainSlug: '',
    totalGroups: 0,
    defaultGroups: 0,
    systemGroups: 0,
    assignedUsers: 0,
    totalMembers: 0,
    domainRulesCount: 0,
    directoryStatus: 'ACTIVE_SYNCED',
    directoryType: 'Cloud Identity Directory (SCIM / SSO Ready)',
  });
  const [allUsers, setAllUsers] = useState([]);
  const [domainRules, setDomainRules] = useState([]);

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [membersModal, setMembersModal] = useState(false);

  // Forms
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    group_type: 'CUSTOM',
    is_default: false,
    role_mapping: 'Developer',
    memberIds: [],
  });

  const [editingGroup, setEditingGroup] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [selectedUserIdsToAdd, setSelectedUserIdsToAdd] = useState([]);

  // Domain Rule Form
  const [newDomain, setNewDomain] = useState('');
  const [newDomainGroupId, setNewDomainGroupId] = useState('');

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [groupsRes, statsRes, usersRes, rolesRes, rulesRes] = await Promise.all([
        groupsApi.getGroups(workspaceId),
        groupsApi.getDirectoryStats(workspaceId).catch(() => ({ data: null })),
        usersAdminApi.getUsers(workspaceId).catch(() => ({ data: [] })),
        rolesAdminApi.getRoles(workspaceId).catch(() => ({ data: [] })),
        groupsApi.getDomainRules(workspaceId).catch(() => ({ data: [] })),
      ]);

      if (groupsRes?.data) {
        setGroups(groupsRes.data);
        if (!newDomainGroupId && groupsRes.data.length > 0) {
          setNewDomainGroupId(groupsRes.data[0].id);
        }
      }
      if (statsRes?.data) setStats(statsRes.data);
      if (usersRes?.data) setAllUsers(usersRes.data);
      if (rolesRes?.data) setRoles(rolesRes.data);
      if (rulesRes?.data) setDomainRules(rulesRes.data);
    } catch (err) {
      toast.error('Failed to load user groups and directory data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId]);

  // Filtered Groups
  const filteredGroups = useMemo(() => {
    return groups.filter((g) => {
      const matchesSearch =
        (g.name && g.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedFilter === 'SYSTEM') return g.is_system === 1;
      if (selectedFilter === 'SECURITY') return g.group_type === 'SECURITY';
      if (selectedFilter === 'DEFAULT') return g.is_default === 1;
      if (selectedFilter === 'CUSTOM') return g.is_system === 0 && g.group_type !== 'SECURITY';
      return true;
    });
  }, [groups, searchQuery, selectedFilter]);

  // Group Icon Helper
  const getGroupIcon = (name = '', type = '') => {
    const n = (name || '').toLowerCase();
    if (n.includes('admin') || type === 'SYSTEM') return <ShieldCheck className="size-4.5 text-red-600" />;
    if (n.includes('engineer') || n.includes('dev')) return <Code2 className="size-4.5 text-blue-600" />;
    if (n.includes('service') || n.includes('support')) return <Headphones className="size-4.5 text-emerald-600" />;
    if (n.includes('product') || n.includes('design')) return <Compass className="size-4.5 text-purple-600" />;
    if (n.includes('qa') || n.includes('test')) return <CheckCircle2 className="size-4.5 text-cyan-600" />;
    return <Users className="size-4.5 text-indigo-600" />;
  };

  const getGroupIconBg = (name = '', type = '') => {
    const n = (name || '').toLowerCase();
    if (n.includes('admin') || type === 'SYSTEM') return 'bg-red-50 text-red-700 border-red-200';
    if (n.includes('engineer') || n.includes('dev')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (n.includes('service') || n.includes('support')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (n.includes('product') || n.includes('design')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (n.includes('qa') || n.includes('test')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  // Actions
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    try {
      await groupsApi.createGroup(workspaceId, {
        name: groupForm.name,
        description: groupForm.description,
        group_type: groupForm.group_type,
        is_default: groupForm.is_default ? 1 : 0,
        role_mapping: groupForm.role_mapping,
        memberIds: groupForm.memberIds,
      });
      toast.success(`Access Group "${groupForm.name}" created successfully`);
      setCreateModal(false);
      setGroupForm({
        name: '',
        description: '',
        group_type: 'CUSTOM',
        is_default: false,
        role_mapping: roles[0]?.name || 'Developer',
        memberIds: [],
      });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create group');
    }
  };

  const handleOpenEdit = (group) => {
    setEditingGroup(group);
    setGroupForm({
      name: group.name,
      description: group.description || '',
      group_type: group.group_type || 'CUSTOM',
      is_default: Boolean(group.is_default),
      role_mapping: group.role_mapping || 'Developer',
      memberIds: [],
    });
    setEditModal(true);
  };

  const handleUpdateGroup = async (e) => {
    e.preventDefault();
    if (!editingGroup) return;
    try {
      await groupsApi.updateGroup(workspaceId, editingGroup.id, {
        name: groupForm.name,
        description: groupForm.description,
        group_type: groupForm.group_type,
        is_default: groupForm.is_default ? 1 : 0,
        role_mapping: groupForm.role_mapping,
      });
      toast.success('Group settings updated');
      setEditModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update group');
    }
  };

  const handleToggleDefault = async (group) => {
    const updatedVal = group.is_default ? 0 : 1;
    try {
      await groupsApi.updateGroup(workspaceId, group.id, { is_default: updatedVal });
      toast.success(
        updatedVal ? `Group "${group.name}" is now auto-assigned to new users` : `Group "${group.name}" removed from auto-assignment`,
      );
      fetchData();
    } catch (err) {
      toast.error('Failed to update group default state');
    }
  };

  const handleOpenMembers = async (group) => {
    setSelectedGroup(group);
    setSelectedUserIdsToAdd([]);
    setMemberSearchQuery('');
    try {
      const [membersRes, usersRes] = await Promise.all([
        groupsApi.getGroupMembers(workspaceId, group.id),
        usersAdminApi.getUsers(workspaceId),
      ]);
      if (membersRes?.data) setGroupMembers(membersRes.data);
      if (usersRes?.data) setAllUsers(usersRes.data);
      setMembersModal(true);
    } catch (err) {
      toast.error('Failed to load group members');
    }
  };

  const handleAddMembersBatch = async (e) => {
    e.preventDefault();
    if (selectedUserIdsToAdd.length === 0 || !selectedGroup) return;
    try {
      await groupsApi.addMultipleMembers(workspaceId, selectedGroup.id, selectedUserIdsToAdd);
      toast.success(`Added member to "${selectedGroup.name}"`);
      setSelectedUserIdsToAdd([]);
      const membersRes = await groupsApi.getGroupMembers(workspaceId, selectedGroup.id);
      if (membersRes?.data) setGroupMembers(membersRes.data);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId, memberName) => {
    if (!selectedGroup) return;
    try {
      await groupsApi.removeGroupMember(workspaceId, selectedGroup.id, userId);
      toast.success(`Removed ${memberName || 'member'} from group`);
      setGroupMembers((prev) => prev.filter((m) => m.id !== userId));
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleDeleteGroup = async (group) => {
    if (group.is_system === 1 && group.name === 'jira-administrators') {
      toast.error('The core system group "jira-administrators" cannot be deleted');
      return;
    }
    const ok = await confirmAction({
      title: 'Delete Access Group',
      message: `Are you sure you want to delete access group "${group.name}"?`,
      variant: 'destructive',
      confirmText: 'Delete Group',
      warningNotice: 'Group members will lose all permission grants and access rights associated with this group.'
    });
    if (!ok) return;

    try {
      await groupsApi.deleteGroup(workspaceId, group.id);
      toast.success(`Group "${group.name}" deleted`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete group');
    }
  };

  const handleApplyTemplate = (tpl) => {
    setGroupForm({
      name: tpl.name,
      description: tpl.description,
      group_type: tpl.type,
      is_default: tpl.isDefault,
      role_mapping: tpl.role,
      memberIds: [],
    });
  };

  const handleAddDomainRule = async (e) => {
    e.preventDefault();
    if (!newDomain.trim() || !newDomainGroupId) return;
    const cleanDomain = newDomain.trim().toLowerCase().replace(/^@/, '');
    try {
      await groupsApi.createDomainRule(workspaceId, {
        domain: cleanDomain,
        groupId: newDomainGroupId,
      });
      toast.success(`Added auto-join rule for domain @${cleanDomain}`);
      setNewDomain('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to add domain rule');
    }
  };

  const handleRemoveDomainRule = async (id) => {
    try {
      await groupsApi.deleteDomainRule(workspaceId, id);
      toast.success('Domain auto-join rule removed');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete domain rule');
    }
  };

  const filteredGroupMembers = groupMembers.filter((m) => {
    if (!memberSearchQuery) return true;
    const q = memberSearchQuery.toLowerCase();
    return (
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.job_title && m.job_title.toLowerCase().includes(q)) ||
      (m.department && m.department.toLowerCase().includes(q))
    );
  });

  const availableUsersToAdd = allUsers.filter(
    (u) => !groupMembers.some((gm) => gm.id === (u.user_id || u.id)),
  );

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw className="size-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-neutral-500">Loading Directory & User Groups...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 select-none">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-neutral-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-600">
            <Shield className="size-3.5" />
            <span>Enterprise Security & Directory</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 mt-1">
            User Groups & Directory Access
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5 max-w-2xl">
            Configure role-based access groups, automate user provisioning via directory rules, and manage permissions at scale.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition active:scale-95 disabled:opacity-50"
            title="Refresh groups and directory stats"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={() => {
              setGroupForm({
                name: '',
                description: '',
                group_type: 'CUSTOM',
                is_default: false,
                role_mapping: roles[0]?.name || 'Developer',
                memberIds: [],
              });
              setCreateModal(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition active:scale-95"
          >
            <Plus className="size-4" />
            <span>Create Access Group</span>
          </button>
        </div>
      </div>

      {/* Dynamic Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Total Groups</p>
            <p className="text-2xl font-black text-neutral-900 mt-0.5">{groups.length}</p>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              {groups.filter((g) => g.is_system === 1).length} system standard
            </p>
          </div>
          <div className="size-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Directory Users</p>
            <p className="text-2xl font-black text-neutral-900 mt-0.5">{allUsers.length || stats.totalMembers}</p>
            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
              ✓ {stats.assignedUsers || allUsers.length} assigned to groups
            </p>
          </div>
          <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Auto-Join Default</p>
            <p className="text-2xl font-black text-neutral-900 mt-0.5">
              {groups.filter((g) => g.is_default === 1).length}
            </p>
            <p className="text-[10px] text-blue-600 font-semibold mt-0.5">Auto-granted to new joiners</p>
          </div>
          <div className="size-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Sparkles className="size-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Domain Rules</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
              </span>
              <p className="text-sm font-black text-neutral-900">{domainRules.length} Active</p>
            </div>
            <p className="text-[10px] text-neutral-500 mt-0.5">Automated provisioning</p>
          </div>
          <div className="size-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Globe className="size-5" />
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-200">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('GROUPS')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'GROUPS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Users className="size-4" />
            <span>Access Groups ({groups.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DIRECTORY')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'DIRECTORY'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Globe className="size-4" />
            <span>Directory & Domain Rules ({domainRules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PERMISSIONS')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition ${
              activeTab === 'PERMISSIONS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Shield className="size-4" />
            <span>Group Role Mappings</span>
          </button>
        </div>

        {activeTab === 'GROUPS' && (
          <div className="hidden sm:flex items-center gap-1 rounded-lg bg-neutral-100 p-0.5">
            <button
              onClick={() => setViewMode('GRID')}
              className={`rounded-md p-1.5 transition ${
                viewMode === 'GRID' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="size-3.5" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`rounded-md p-1.5 transition ${
                viewMode === 'TABLE' ? 'bg-white shadow-xs text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'
              }`}
              title="Table List View"
            >
              <List className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: ACCESS GROUPS */}
      {activeTab === 'GROUPS' && (
        <div className="space-y-4">
          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-neutral-50/80 p-3 rounded-2xl border border-neutral-200">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search groups by name or purpose..."
                className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-4 py-1.5 text-xs font-medium placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'All Groups' },
                { id: 'SYSTEM', label: 'System' },
                { id: 'SECURITY', label: 'Security' },
                { id: 'DEFAULT', label: 'Default Auto-Join' },
                { id: 'CUSTOM', label: 'Custom' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                    selectedFilter === f.id
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
              <Users className="mx-auto size-10 text-neutral-300" />
              <h3 className="mt-3 text-sm font-bold text-neutral-900">No matching user groups found</h3>
              <p className="mt-1 text-xs text-neutral-500">
                {searchQuery ? 'Try adjusting your search query or filter.' : 'Create your first organizational group to get started.'}
              </p>
              <button
                onClick={() => setCreateModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-blue-700"
              >
                <Plus className="size-3.5" />
                Create Group
              </button>
            </div>
          ) : viewMode === 'GRID' ? (
            /* Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGroups.map((g) => {
                const isSys = g.is_system === 1;
                const isDefault = g.is_default === 1;

                return (
                  <div
                    key={g.id}
                    className="group relative rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-neutral-300 transition flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`size-10 rounded-xl border flex items-center justify-center font-bold shrink-0 ${getGroupIconBg(
                              g.name,
                              g.group_type,
                            )}`}
                          >
                            {getGroupIcon(g.name, g.group_type)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="font-bold text-sm text-neutral-900 tracking-tight">{g.name}</h3>
                              {isSys && (
                                <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[9px] font-extrabold text-neutral-600 border border-neutral-200">
                                  SYSTEM
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-semibold text-neutral-400 capitalize">
                              {g.group_type ? g.group_type.toLowerCase() : 'custom'} group
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(g)}
                            className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                            title="Edit group configuration"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          {!isSys && (
                            <button
                              onClick={() => handleDeleteGroup(g)}
                              className="rounded-lg p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                              title="Delete group"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="mt-3 text-xs text-neutral-600 leading-relaxed min-h-[36px]">
                        {g.description || 'Organizational access group for project and permission assignments.'}
                      </p>

                      {/* Attributes */}
                      <div className="mt-4 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                          <Users className="size-3" />
                          {g.member_count || 0} members
                        </span>

                        {isDefault ? (
                          <span
                            onClick={() => handleToggleDefault(g)}
                            className="cursor-pointer inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                            title="Click to toggle default assignment"
                          >
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Default Auto-Join
                          </span>
                        ) : (
                          <button
                            onClick={() => handleToggleDefault(g)}
                            className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 hover:bg-neutral-200 transition"
                            title="Make this group default for new users"
                          >
                            + Set Default
                          </button>
                        )}

                        {g.role_mapping && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-100">
                            Role: {g.role_mapping}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-5 pt-3.5 border-t border-neutral-100 flex items-center justify-between">
                      <button
                        onClick={() => handleOpenMembers(g)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                      >
                        <UserPlus className="size-3.5" />
                        <span>Manage Members ({g.member_count || 0})</span>
                      </button>

                      <span className="text-[10px] text-neutral-400 font-medium">
                        ID: {g.id ? g.id.slice(0, 8) : 'sys'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[10px] font-black uppercase tracking-wider text-neutral-500">
                    <th className="py-3 px-4">Group Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Members</th>
                    <th className="py-3 px-4">Default Auto-Join</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-xs">
                  {filteredGroups.map((g) => (
                    <tr key={g.id} className="hover:bg-neutral-50/60 transition">
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`size-7 rounded-lg border flex items-center justify-center font-bold ${getGroupIconBg(
                              g.name,
                              g.group_type,
                            )}`}
                          >
                            {getGroupIcon(g.name, g.group_type)}
                          </div>
                          <span>{g.name}</span>
                          {g.is_system === 1 && (
                            <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-[9px] font-extrabold text-neutral-600">
                              SYS
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600 capitalize">
                          {g.group_type || 'custom'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-neutral-600 max-w-xs truncate">
                        {g.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-900">
                        <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-extrabold border border-blue-100">
                          {g.member_count || 0} users
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {g.is_default ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                            <CheckCircle2 className="size-3" /> Enabled
                          </span>
                        ) : (
                          <span className="text-[10px] text-neutral-400 font-medium">Off</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenMembers(g)}
                            className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
                          >
                            Members
                          </button>
                          <button
                            onClick={() => handleOpenEdit(g)}
                            className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
                          >
                            <Edit3 className="size-3.5" />
                          </button>
                          {g.is_system !== 1 && (
                            <button
                              onClick={() => handleDeleteGroup(g)}
                              className="rounded-lg p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DIRECTORY & AUTO-JOIN RULES */}
      {activeTab === 'DIRECTORY' && (
        <div className="space-y-6">
          {/* Domain-based Auto-Join Rules */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-5">
            <div>
              <h3 className="text-base font-black text-neutral-900">Email Domain Auto-Assignment Rules</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Automatically allocate newly invited or registered users into specific access groups based on their corporate email domain.
              </p>
            </div>

            {/* Add Rule Form */}
            <form onSubmit={handleAddDomainRule} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-neutral-400">@</span>
                <input
                  type="text"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="e.g. acme-corp.com or mycompany.io"
                  className="w-full rounded-xl border border-neutral-300 pl-7 pr-3 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <select
                value={newDomainGroupId}
                onChange={(e) => setNewDomainGroupId(e.target.value)}
                className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-none bg-white min-w-[200px]"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    Assign to: {g.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                disabled={!newDomain.trim() || !newDomainGroupId}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
              >
                Add Rule
              </button>
            </form>

            {/* Rules List */}
            {domainRules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center bg-neutral-50/50">
                <Globe className="mx-auto size-8 text-neutral-300" />
                <p className="mt-2 text-xs font-semibold text-neutral-700">No domain auto-join rules defined yet</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Add an email domain above to automatically route new users to designated access groups.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200 overflow-hidden bg-white">
                {domainRules.map((r) => (
                  <div key={r.id} className="p-3.5 flex items-center justify-between hover:bg-neutral-50 transition">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        @
                      </div>
                      <div>
                        <p className="text-xs font-bold text-neutral-900">@{r.domain}</p>
                        <p className="text-[10px] text-neutral-500">
                          Automatically assign to group <span className="font-bold text-blue-600">{r.group_name || 'Assigned Group'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleRemoveDomainRule(r.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                        title="Delete rule"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PERMISSIONS & ROLE MAPPINGS */}
      {activeTab === 'PERMISSIONS' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-neutral-900">Group Role & Permission Mappings</h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Overview of workspace roles and privilege levels linked to each user group.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {groups.map((g) => {
                const linkedRole = roles.find((r) => r.name.toLowerCase() === (g.role_mapping || '').toLowerCase()) ||
                                   roles.find((r) => r.name.toLowerCase().includes((g.role_mapping || '').toLowerCase()));

                return (
                  <div key={g.id} className="rounded-2xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`size-7 rounded-lg border flex items-center justify-center ${getGroupIconBg(g.name, g.group_type)}`}>
                          {getGroupIcon(g.name, g.group_type)}
                        </div>
                        <h4 className="font-bold text-xs text-neutral-900">{g.name}</h4>
                      </div>
                      <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[9px] font-black text-neutral-700">
                        {g.role_mapping || 'Member'}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-600 min-h-[30px]">
                      {g.description || 'Standard access group'}
                    </p>

                    <div className="border-t border-neutral-200/70 pt-2.5 space-y-1.5 text-[10px]">
                      <div className="flex items-center justify-between text-neutral-600">
                        <span>Assigned Base Role</span>
                        <span className="font-bold text-neutral-900">{linkedRole?.name || g.role_mapping || 'Member'}</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-600">
                        <span>Role Type</span>
                        <span className="font-bold">{linkedRole?.is_system ? 'System Role' : 'Workspace Role'}</span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-600">
                        <span>Active Group Members</span>
                        <span className="font-bold text-blue-600">{g.member_count || 0} users</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-5 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <UserPlus className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-neutral-900">Create Access Group</h3>
                  <p className="text-[11px] text-neutral-500">Define a new security or organizational group</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModal(false)}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Preset Templates */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Quick Preset Templates
              </label>
              <div className="flex gap-1.5 flex-wrap">
                {PRESET_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.name}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-[10px] font-bold text-neutral-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
                  >
                    + {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Group Name *</label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="e.g. backend-developers or qa-team"
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Unique identifier used in access control rules (auto-formatted with hyphens).
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="What is the purpose of this group..."
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Group Category</label>
                  <select
                    value={groupForm.group_type}
                    onChange={(e) => setGroupForm({ ...groupForm, group_type: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-none bg-white"
                  >
                    <option value="CUSTOM">Custom Organization</option>
                    <option value="SECURITY">Security Group</option>
                    <option value="DIRECTORY_SYNC">Directory Sync</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Role Privilege Mapping</label>
                  <select
                    value={groupForm.role_mapping}
                    onChange={(e) => setGroupForm({ ...groupForm, role_mapping: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-none bg-white"
                  >
                    {roles.length > 0 ? (
                      roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Admin">Admin</option>
                        <option value="Developer">Developer</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Tester">Tester</option>
                        <option value="Member">Member</option>
                        <option value="Viewer">Viewer</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Default Auto-Join Toggle */}
              <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 border border-neutral-200">
                <div>
                  <p className="text-xs font-bold text-neutral-900">Default Auto-Join Group</p>
                  <p className="text-[10px] text-neutral-500">
                    Automatically add newly invited and onboarding users to this group
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={groupForm.is_default}
                  onChange={(e) => setGroupForm({ ...groupForm, is_default: e.target.checked })}
                  className="size-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT GROUP MODAL */}
      {editModal && editingGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Edit3 className="size-4 text-blue-600" />
                <h3 className="text-base font-black text-neutral-900">Edit Group Settings</h3>
              </div>
              <button onClick={() => setEditModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={groupForm.description}
                  onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                  className="w-full rounded-xl border border-neutral-300 px-3.5 py-2 text-xs font-medium focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Role Privilege Mapping</label>
                <select
                  value={groupForm.role_mapping}
                  onChange={(e) => setGroupForm({ ...groupForm, role_mapping: e.target.value })}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-none bg-white"
                >
                  {roles.length > 0 ? (
                    roles.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Admin">Admin</option>
                      <option value="Developer">Developer</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Tester">Tester</option>
                      <option value="Member">Member</option>
                      <option value="Viewer">Viewer</option>
                    </>
                  )}
                </select>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 border border-neutral-200">
                <div>
                  <p className="text-xs font-bold text-neutral-900">Default Auto-Join Group</p>
                  <p className="text-[10px] text-neutral-500">
                    Automatically add all new workspace joiners to this group
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={groupForm.is_default}
                  onChange={(e) => setGroupForm({ ...groupForm, is_default: e.target.checked })}
                  className="size-4 rounded text-blue-600 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE GROUP MEMBERS MODAL */}
      {membersModal && selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 max-h-[90vh] flex flex-col my-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-xl border flex items-center justify-center font-bold ${getGroupIconBg(selectedGroup.name, selectedGroup.group_type)}`}>
                  {getGroupIcon(selectedGroup.name, selectedGroup.group_type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-neutral-900">{selectedGroup.name}</h3>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-100">
                      {groupMembers.length} Members
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500">{selectedGroup.description || 'Directory access group'}</p>
                </div>
              </div>

              <button
                onClick={() => setMembersModal(false)}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Add User Section */}
            <div className="mt-4 p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-200">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Add Users from Workspace Directory
              </label>
              <form onSubmit={handleAddMembersBatch} className="flex gap-2">
                <select
                  value={selectedUserIdsToAdd[0] || ''}
                  onChange={(e) => setSelectedUserIdsToAdd(e.target.value ? [e.target.value] : [])}
                  className="flex-1 rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="">Select a user from directory...</option>
                  {availableUsersToAdd.map((u) => (
                    <option key={u.user_id || u.id} value={u.user_id || u.id}>
                      {u.name} ({u.email}) — {u.job_title || u.role || 'Member'}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={selectedUserIdsToAdd.length === 0}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  <UserPlus className="size-3.5" />
                  <span>Add Member</span>
                </button>
              </form>
            </div>

            {/* Search Filter for Members */}
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-2.5 size-3.5 text-neutral-400" />
              <input
                type="text"
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                placeholder="Search group members by name, email, department..."
                className="w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-4 py-1.5 text-xs font-medium placeholder-neutral-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Members Table */}
            <div className="mt-3 flex-1 overflow-y-auto divide-y divide-neutral-100 rounded-xl border border-neutral-200">
              {filteredGroupMembers.length === 0 ? (
                <div className="py-12 text-center text-neutral-400">
                  <Users className="mx-auto size-8 text-neutral-300" />
                  <p className="mt-2 text-xs font-semibold">
                    {memberSearchQuery ? 'No members match the search filter.' : 'No members assigned to this group yet.'}
                  </p>
                </div>
              ) : (
                filteredGroupMembers.map((m) => (
                  <div key={m.id} className="p-3 flex items-center justify-between hover:bg-neutral-50/70 transition">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                        {m.name ? m.name.substring(0, 2).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-xs text-neutral-900">{m.name}</p>
                          {m.organization_role && (
                            <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-[9px] font-extrabold text-neutral-600">
                              {m.organization_role}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          {m.email} {m.job_title ? `• ${m.job_title}` : ''} {m.department ? `(${m.department})` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveMember(m.id, m.name)}
                      className="rounded-lg p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                      title="Remove from group"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                Total: <strong className="text-neutral-900">{filteredGroupMembers.length}</strong> user(s)
              </span>
              <button
                onClick={() => setMembersModal(false)}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-black transition"
              >
                Done
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
