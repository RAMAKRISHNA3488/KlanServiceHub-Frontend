import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  FolderGit2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  ShieldCheck,
  TrendingUp,
  Server,
  Search,
  Filter,
  RefreshCw,
  Ban,
  Check,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  HardDrive,
  Cpu,
  FileText,
  UserCheck,
  UserX,
  Terminal,
} from 'lucide-react';
import {
  useSuperAdminOverview,
  useSuperAdminOrganizations,
  useSuperAdminUsers,
  useSuperAdminAuditLogs,
  useSuperAdminHealth,
  useUpdateOrganizationStatus,
  useUpdateUserStatus,
  useToggleSuperAdmin,
} from '../api/super-admin-api';

export const SuperAdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active view based on path
  const currentPath = location.pathname;
  let activeTab = 'overview';
  if (currentPath.includes('organizations')) activeTab = 'organizations';
  else if (currentPath.includes('users')) activeTab = 'users';
  else if (currentPath.includes('audit-logs')) activeTab = 'audit-logs';
  else if (currentPath.includes('system-health')) activeTab = 'system-health';

  const setTab = (tab) => {
    if (tab === 'overview') navigate('/super-admin/dashboard');
    else navigate(`/super-admin/${tab}`);
  };

  // Queries
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useSuperAdminOverview();
  const { data: organizations = [], isLoading: loadingOrgs, refetch: refetchOrgs } = useSuperAdminOrganizations();
  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers } = useSuperAdminUsers();
  const { data: auditLogs = [], isLoading: loadingAudits, refetch: refetchAudits } = useSuperAdminAuditLogs();
  const { data: health, isLoading: loadingHealth } = useSuperAdminHealth();

  // Mutations
  const updateOrgStatus = useUpdateOrganizationStatus();
  const updateUserStatus = useUpdateUserStatus();
  const toggleSuperAdmin = useToggleSuperAdmin();

  // Local search and filter states
  const [orgSearch, setOrgSearch] = useState('');
  const [orgStatusFilter, setOrgStatusFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);

  // Filtered Organizations
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      (org.name || '').toLowerCase().includes(orgSearch.toLowerCase()) ||
      (org.owner?.email || '').toLowerCase().includes(orgSearch.toLowerCase());
    const matchesStatus =
      orgStatusFilter === 'ALL' || (org.status || 'ACTIVE') === orgStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
    const matchesStatus =
      userStatusFilter === 'ALL' || (u.status || 'ACTIVE') === userStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Audits
  const filteredAudits = auditLogs.filter((a) => {
    const search = auditSearch.toLowerCase();
    return (
      (a.action || '').toLowerCase().includes(search) ||
      (a.actor_name || '').toLowerCase().includes(search) ||
      (a.actor_email || '').toLowerCase().includes(search) ||
      (a.target_name || '').toLowerCase().includes(search)
    );
  });

  // Handler for Toggling Organization Status
  const handleToggleOrgStatus = async (org) => {
    const newStatus = org.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    if (!window.confirm(`Are you sure you want to mark organization "${org.name}" as ${newStatus}?`)) {
      return;
    }
    setActionInProgress(org.id);
    try {
      await updateOrgStatus.mutateAsync({ id: org.id, status: newStatus });
      await refetchOrgs();
      await refetchOverview();
    } finally {
      setActionInProgress(null);
    }
  };

  // Handler for Toggling User Status
  const handleToggleUserStatus = async (user) => {
    const newStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    if (!window.confirm(`Are you sure you want to mark user "${user.name}" (${user.email}) as ${newStatus}?`)) {
      return;
    }
    setActionInProgress(user.id);
    try {
      await updateUserStatus.mutateAsync({ id: user.id, status: newStatus });
      await refetchUsers();
      await refetchOverview();
    } finally {
      setActionInProgress(null);
    }
  };

  // Handler for Toggling Super Admin Role
  const handleToggleSuperAdmin = async (user) => {
    const isPromoting = !user.isSuperAdmin;
    if (!window.confirm(`Are you sure you want to ${isPromoting ? 'GRANT' : 'REVOKE'} Super Admin authority for "${user.name}" (${user.email})?`)) {
      return;
    }
    setActionInProgress(user.id);
    try {
      await toggleSuperAdmin.mutateAsync({ id: user.id, isSuperAdmin: isPromoting });
      await refetchUsers();
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Fast Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Master Control Plane
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              Live Governance
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global multi-tenant metrics, enterprise security posture, and administrative actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchOverview();
              refetchOrgs();
              refetchUsers();
              refetchAudits();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-850 transition-all shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Sync Live Telemetry</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: EXECUTIVE OVERVIEW & TELEMETRY */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 Primary KPI Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Organizations */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Organizations</span>
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {overview?.totalOrganizations ?? (loadingOverview ? '...' : 0)}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {overview?.activeOrganizations ?? 0} Active
                </span>
                <span className="text-rose-400 flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5" />
                  {overview?.suspendedOrganizations ?? 0} Suspended
                </span>
              </div>
            </div>

            {/* Card 2: Registered Users */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Users</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {overview?.totalUsers ?? (loadingOverview ? '...' : 0)}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                <span className="text-emerald-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  {overview?.activeUsers ?? 0} Active
                </span>
                <span className="text-amber-400 flex items-center gap-1">
                  <UserX className="w-3.5 h-3.5" />
                  {overview?.suspendedUsers ?? 0} Suspended
                </span>
              </div>
            </div>

            {/* Card 3: Projects & Teams */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects & Teams</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <FolderGit2 className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
                <span>{overview?.totalProjects ?? (loadingOverview ? '...' : 0)}</span>
                <span className="text-xs font-medium text-slate-400">Projects</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                <span className="text-purple-300 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  {overview?.totalTeams ?? 0} Cross-func Teams
                </span>
                <span className="text-slate-400 font-mono text-[11px]">D1 Linked</span>
              </div>
            </div>

            {/* Card 4: Tickets & Delivery */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform Tickets</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {overview?.totalTickets ?? (loadingOverview ? '...' : 0)}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {overview?.closedIssues ?? 0} Done
                </span>
                <span className="text-amber-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {overview?.openIssues ?? 0} In Progress
                </span>
              </div>
            </div>
          </div>

          {/* Issue Telemetry & Criticality Matrix + System Health Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Issue Health & Velocity Telemetry */}
            <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Issue Health & SLA Telemetry
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Cross-tenant ticket delivery, escalations, and overdue items</p>
                </div>
                <div className="px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-mono text-slate-300 border border-slate-700">
                  Global Resolution: {overview?.totalTickets ? Math.round(((overview.closedIssues || 0) / overview.totalTickets) * 100) : 100}%
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800 mb-5">
                <div
                  className="bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${overview?.totalTickets ? Math.min(100, Math.max(5, Math.round(((overview.closedIssues || 0) / overview.totalTickets) * 100))) : 0}%`,
                  }}
                />
              </div>

              {/* 3 Metric Sub-tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Critical / Urgent</span>
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-xl font-bold text-rose-400">{overview?.criticalIssues ?? 0}</div>
                  <div className="text-[10px] text-slate-500 mt-1">High priority escalations</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Overdue Tasks</span>
                    <Clock className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold text-amber-400">{overview?.overdueTasks ?? 0}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Missed sprint target dates</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Active Work Items</span>
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-xl font-bold text-blue-400">{overview?.openIssues ?? 0}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Active backlog & in-flight</div>
                </div>
              </div>
            </div>

            {/* Column 3: Live System Health */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    System Health
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-semibold">
                    {overview?.systemHealth?.status || 'HEALTHY'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">Edge runtime infrastructure and database performance</p>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-slate-500" /> Database Engine
                    </span>
                    <span className="text-slate-200">{overview?.systemHealth?.databaseEngine || 'Cloudflare D1'}</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-slate-500" /> Edge Latency
                    </span>
                    <span className="text-emerald-400 font-semibold">{overview?.systemHealth?.queryLatencyMs || 8}ms</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-slate-500" /> Platform Plane
                    </span>
                    <span className="text-slate-200">Production Edge</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span>MFA Enforcement: <strong className="text-emerald-400">ACTIVE</strong></span>
                <button
                  onClick={() => setTab('system-health')}
                  className="text-rose-400 hover:text-rose-300 font-medium flex items-center gap-0.5"
                >
                  Diagnostics <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Activity Streams Grid: Organization Activity + Recent Admin Audits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Organization Activity */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Organization Activity Stream
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Recently provisioned tenants and status modifications</p>
                </div>
                <button
                  onClick={() => setTab('organizations')}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                >
                  View All <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {(overview?.organizationActivity || []).length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 font-mono">
                    No recent organization activity recorded.
                  </div>
                ) : (
                  (overview?.organizationActivity || []).slice(0, 6).map((org) => (
                    <div
                      key={org.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0">
                          {org.name ? org.name.slice(0, 2).toUpperCase() : 'OR'}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{org.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">{org.owner_email || 'Owner'}</div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                            (org.status || 'ACTIVE') === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {org.status || 'ACTIVE'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {org.created_at ? new Date(org.created_at).toLocaleDateString() : 'Active'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Administrative Actions */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Recent Administrative Actions
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Immutable audit trail of master governance events</p>
                </div>
                <button
                  onClick={() => setTab('audit-logs')}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                >
                  Full Trail <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {(overview?.recentAdministrativeActions || []).length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 font-mono">
                    Zero administrative audits on record. Actions will appear in real time.
                  </div>
                ) : (
                  (overview?.recentAdministrativeActions || []).slice(0, 6).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/70 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono font-semibold text-white text-[11px] truncate">
                            {log.action}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            By {log.actor_name || log.actor_email} • {log.target_name || log.target_type}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono text-slate-500 block">
                          {log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Just now'}
                        </span>
                        <span className="text-[9px] font-mono text-slate-600 block">
                          IP: {log.ip_address || '127.0.0.1'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ORGANIZATIONS DIRECTORY & MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'organizations' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={orgSearch}
                onChange={(e) => setOrgSearch(e.target.value)}
                placeholder="Search organizations or owners..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrgStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      orgStatusFilter === st
                        ? 'bg-rose-500/20 text-rose-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Organizations Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Organization Name</th>
                    <th className="py-3 px-4">Owner Contact</th>
                    <th className="py-3 px-4 text-center">Members</th>
                    <th className="py-3 px-4 text-center">Projects</th>
                    <th className="py-3 px-4 text-center">Tickets</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {loadingOrgs ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                        Loading tenant organizations...
                      </td>
                    </tr>
                  ) : filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                        No organizations found matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredOrgs.map((org) => {
                      const isSuspended = org.status === 'SUSPENDED';
                      return (
                        <tr key={org.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white">{org.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">{org.id}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-200">{org.owner?.name || 'Owner'}</div>
                            <div className="text-[11px] text-slate-400">{org.owner?.email || 'N/A'}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-300">
                            {org.userCount ?? 1}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-300">
                            {org.projectCount ?? 0}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-300">
                            {org.taskCount ?? 0}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                                isSuspended
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {isSuspended ? <Ban className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                              {org.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              disabled={actionInProgress === org.id}
                              onClick={() => handleToggleOrgStatus(org)}
                              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                                isSuspended
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-rose-600/80 hover:bg-rose-600 text-white'
                              } disabled:opacity-50`}
                            >
                              {actionInProgress === org.id ? (
                                'Updating...'
                              ) : isSuspended ? (
                                'Reactivate'
                              ) : (
                                'Suspend Organization'
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: GLOBAL USERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name, email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setUserStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      userStatusFilter === st
                        ? 'bg-rose-500/20 text-rose-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Primary Workspace</th>
                    <th className="py-3 px-4">Role / Department</th>
                    <th className="py-3 px-4">Authority Status</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                        Loading global user catalog...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                        No users found matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSuspended = u.status === 'SUSPENDED' || u.status === 'DEACTIVATED';
                      return (
                        <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white flex items-center gap-1.5">
                              {u.name}
                              {u.isSuperAdmin && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-mono">
                                  SUPER ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-300">
                            {u.primaryWorkspace || 'Independent'}
                            <span className="text-[10px] text-slate-500 block">
                              {u.workspaceCount} workspaces total
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-200">{u.jobTitle}</div>
                            <div className="text-[10px] text-slate-400">{u.department}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              disabled={actionInProgress === u.id}
                              onClick={() => handleToggleSuperAdmin(u)}
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all border ${
                                u.isSuperAdmin
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                            >
                              {u.isSuperAdmin ? 'Revoke Super Admin' : 'Grant Super Admin'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                                isSuspended
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              disabled={actionInProgress === u.id}
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                isSuspended
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-slate-800 hover:bg-rose-950/80 hover:text-rose-300 text-slate-300'
                              } disabled:opacity-50`}
                            >
                              {isSuspended ? 'Reactivate' : 'Suspend'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 4: PLATFORM AUDIT TRAIL STREAM */}
      {/* ========================================================================= */}
      {activeTab === 'audit-logs' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search audit trail by actor, action..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Total Audits Logged: <strong className="text-white">{filteredAudits.length}</strong>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Target Type & Entity</th>
                    <th className="py-3 px-4">Client IP</th>
                    <th className="py-3 px-4">Details / Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {loadingAudits ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Querying platform audit log records...
                      </td>
                    </tr>
                  ) : filteredAudits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No audit events recorded matching current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAudits.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-bold text-rose-400 whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          <div>{log.actor_name || 'System'}</div>
                          <div className="text-[10px] text-slate-500">{log.actor_email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] mr-1.5 text-slate-400">
                            {log.target_type}
                          </span>
                          {log.target_name || log.target_id || 'System Platform'}
                        </td>
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {log.ip_address || '127.0.0.1'}
                        </td>
                        <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 5: SYSTEM DIAGNOSTICS & ENGINE STATUS */}
      {/* ========================================================================= */}
      {activeTab === 'system-health' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-500" />
                  Cloudflare Distributed Architecture Diagnostics
                </h3>
                <p className="text-xs text-slate-400 mt-1">Real-time platform edge latency, memory allocation, and database connectivity</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono text-xs font-bold">
                {health?.status || 'HEALTHY'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Database Latency</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">
                  {health?.database?.latencyMs ?? 8} ms
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">D1 Edge Query Execution</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Runtime Environment</div>
                <div className="text-sm font-bold text-white mt-1">
                  Cloudflare Workers / V8
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">Distributed Anycast Edge</div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">Security Guard Active</div>
                <div className="text-sm font-bold text-rose-400 mt-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> MFA Enforced
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">Zero Public Registration</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
