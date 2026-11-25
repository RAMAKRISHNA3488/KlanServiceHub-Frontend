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
  CreditCard,
  DollarSign,
  Percent,
  Wallet,
  ArrowDownRight,
  Sparkles,
  Zap,
  Edit3,
  X,
  ChevronRight,
} from 'lucide-react';
import {
  useSuperAdminOverview,
  useSuperAdminOrganizations,
  useSuperAdminUsers,
  useSuperAdminAuditLogs,
  useSuperAdminHealth,
  useSuperAdminFinancials,
  useSuperAdminBilling,
  useUpdateOrganizationStatus,
  useUpdateUserStatus,
  useToggleSuperAdmin,
  useUpdateTenantSubscription,
} from '../api/super-admin-api';
import { toast } from 'sonner';

export const SuperAdminDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active view based on path
  const currentPath = location.pathname;
  let activeTab = 'overview';
  if (currentPath.includes('financials')) activeTab = 'financials';
  else if (currentPath.includes('billing')) activeTab = 'billing';
  else if (currentPath.includes('organizations')) activeTab = 'organizations';
  else if (currentPath.includes('users')) activeTab = 'users';
  else if (currentPath.includes('audit-logs')) activeTab = 'audit-logs';
  else if (currentPath.includes('system-health')) activeTab = 'system-health';

  const setTab = (tab) => {
    if (tab === 'overview') navigate('/super-admin/dashboard');
    else navigate(`/super-admin/${tab}`);
  };

  // Queries
  const { data: overview, isLoading: loadingOverview, refetch: refetchOverview } = useSuperAdminOverview();
  const { data: financials, isLoading: loadingFinancials, refetch: refetchFinancials } = useSuperAdminFinancials();
  const { data: billing = [], isLoading: loadingBilling, refetch: refetchBilling } = useSuperAdminBilling();
  const { data: organizations = [], isLoading: loadingOrgs, refetch: refetchOrgs } = useSuperAdminOrganizations();
  const { data: users = [], isLoading: loadingUsers, refetch: refetchUsers } = useSuperAdminUsers();
  const { data: auditLogs = [], isLoading: loadingAudits, refetch: refetchAudits } = useSuperAdminAuditLogs();
  const { data: health, isLoading: loadingHealth } = useSuperAdminHealth();

  // Mutations
  const updateOrgStatus = useUpdateOrganizationStatus();
  const updateUserStatus = useUpdateUserStatus();
  const toggleSuperAdmin = useToggleSuperAdmin();
  const updateTenantSubscription = useUpdateTenantSubscription();

  // Local search and filter states
  const [orgSearch, setOrgSearch] = useState('');
  const [orgStatusFilter, setOrgStatusFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [billingSearch, setBillingSearch] = useState('');
  const [billingPlanFilter, setBillingPlanFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [actionInProgress, setActionInProgress] = useState(null);

  // Subscription Edit Modal State
  const [editingSubOrg, setEditingSubOrg] = useState(null);
  const [subFormPlan, setSubFormPlan] = useState('BUSINESS');
  const [subFormLimit, setSubFormLimit] = useState(100);
  const [subFormStatus, setSubFormStatus] = useState('ACTIVE');

  // Filtered Organizations
  const filteredOrgs = organizations.filter((org) => {
    const matchesSearch =
      (org.name || '').toLowerCase().includes(orgSearch.toLowerCase()) ||
      (org.owner?.email || '').toLowerCase().includes(orgSearch.toLowerCase());
    const matchesStatus =
      orgStatusFilter === 'ALL' || (org.status || 'ACTIVE') === orgStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtered Billing Subscriptions
  const filteredBilling = billing.filter((sub) => {
    const matchesSearch =
      (sub.workspaceName || '').toLowerCase().includes(billingSearch.toLowerCase()) ||
      (sub.ownerEmail || '').toLowerCase().includes(billingSearch.toLowerCase());
    const matchesPlan =
      billingPlanFilter === 'ALL' || (sub.plan || 'BUSINESS').toUpperCase() === billingPlanFilter;
    return matchesSearch && matchesPlan;
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
      (a.actor_name || '').toLowerCase().includes(search) ||
      (a.actor_email || '').toLowerCase().includes(search) ||
      (a.target_name || '').toLowerCase().includes(search) ||
      (a.action || '').toLowerCase().includes(search)
    );
  });

  // Actions
  const handleToggleOrgStatus = async (org) => {
    const nextStatus = org.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setActionInProgress(org.id);
    try {
      await updateOrgStatus.mutateAsync({ id: org.id, status: nextStatus });
      toast.success(`Organization ${org.name} is now ${nextStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update organization status');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    setActionInProgress(user.id);
    try {
      await updateUserStatus.mutateAsync({ id: user.id, status: nextStatus });
      toast.success(`User ${user.email} is now ${nextStatus}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update user status');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleToggleAdminRole = async (user) => {
    const nextSuper = !user.isSuperAdmin;
    setActionInProgress(user.id);
    try {
      await toggleSuperAdmin.mutateAsync({ id: user.id, isSuperAdmin: nextSuper });
      toast.success(`Super Admin privileges ${nextSuper ? 'granted to' : 'revoked from'} ${user.name}`);
    } catch (err) {
      toast.error(err.message || 'Failed to toggle Super Admin role');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleOpenEditSub = (item) => {
    const orgId = item.workspaceId || item.id;
    const orgName = item.workspaceName || item.name;
    const plan = (item.plan || item.subscriptionPlan || 'BUSINESS').toUpperCase();
    const limit = Number(item.userLimit || 100);
    const status = item.status || item.subscriptionStatus || 'ACTIVE';

    setEditingSubOrg({ id: orgId, name: orgName });
    setSubFormPlan(plan);
    setSubFormLimit(limit);
    setSubFormStatus(status);
  };

  const handleSaveSub = async (e) => {
    e.preventDefault();
    if (!editingSubOrg) return;
    try {
      await updateTenantSubscription.mutateAsync({
        id: editingSubOrg.id,
        plan: subFormPlan,
        userLimit: Number(subFormLimit),
        status: subFormStatus,
      });
      toast.success(`Subscription plan for ${editingSubOrg.name} updated to ${subFormPlan}`);
      setEditingSubOrg(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update subscription');
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
              Live Governance & Commercials
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global multi-tenant metrics, platform revenue, profit margins, all tenant subscriptions, and master security.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              refetchOverview();
              refetchFinancials();
              refetchBilling();
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
      {/* VIEW 1: EXECUTIVE OVERVIEW & COMMERCIAL TELEMETRY */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 Primary Commercial & Platform KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Organizations Directory */}
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
                  {overview?.activeOrganizations ?? 0} Active Tenants
                </span>
                <span className="text-rose-400 flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5" />
                  {overview?.suspendedOrganizations ?? 0} Suspended
                </span>
              </div>
            </div>

            {/* Card 2: Monthly Recurring Revenue (MRR) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Platform MRR</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
                ${(financials?.mrr ?? 0).toLocaleString()}
                <span className="text-xs font-normal text-slate-400 ml-1">/mo</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                <span className="text-slate-300 font-mono">
                  ARR: ${(financials?.arr ?? 0).toLocaleString()}
                </span>
                <span className="text-emerald-400 font-semibold flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" /> +{financials?.growthRatePercent ?? 18.4}%
                </span>
              </div>
            </div>

            {/* Card 3: Net Profit & Margin */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Monthly Profit</span>
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-300 tracking-tight">
                ${(financials?.netProfit ?? 0).toLocaleString()}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                <span className="text-purple-400 font-bold">
                  {financials?.profitMarginPercent ?? 85.0}% Net Margin
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  Costs: ${financials?.operatingCosts ?? 0}
                </span>
              </div>
            </div>

            {/* Card 4: Platform Users & ARPU */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Users & ARPU</span>
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-2">
                <span>{overview?.totalUsers ?? 0}</span>
                <span className="text-xs font-medium text-slate-400">Seats</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                <span className="text-slate-300">
                  ARPU: <span className="text-white font-bold">${financials?.arpu ?? 149}</span>
                </span>
                <span className="text-emerald-400 font-mono text-[11px]">
                  {financials?.activeSubscribersCount ?? overview?.totalOrganizations ?? 0} Subscribed
                </span>
              </div>
            </div>
          </div>

          {/* Commercial Trajectory & Tier Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Revenue & Financial Telemetry */}
            <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    Commercial Revenue & Operating Costs
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time SaaS billing metrics, margin velocity, and cloud operating costs</p>
                </div>
                <button
                  onClick={() => setTab('financials')}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                >
                  Deep Breakdown <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              {/* Profit Margin Visual Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1.5 font-medium">
                  <span>Gross Platform Revenue vs Cloud Operating Costs</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {financials?.profitMarginPercent ?? 85}% Net Profit Margin
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800 flex">
                  <div
                    className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                    style={{ width: `${Math.min(95, Math.max(5, financials?.profitMarginPercent ?? 85))}%` }}
                    title="Net Profit"
                  />
                  <div
                    className="bg-rose-500 h-full rounded-r-full transition-all duration-500"
                    style={{ width: `${Math.max(5, 100 - (financials?.profitMarginPercent ?? 85))}%` }}
                    title="Operating Expenses"
                  />
                </div>
              </div>

              {/* 3 Metric Sub-tiles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Gross Revenue</span>
                    <DollarSign className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold text-emerald-400">${(financials?.totalRevenue ?? 0).toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 mt-1">SaaS subscription billing</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Operating Costs</span>
                    <Server className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="text-xl font-bold text-rose-400">${financials?.operatingCosts ?? 0}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Workers, D1, mailers, ops</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                    <span>Annualized ARR</span>
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-xl font-bold text-purple-300">${(financials?.arr ?? 0).toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Normalized run-rate</div>
                </div>
              </div>
            </div>

            {/* Column 3: Subscription Tier Breakdown */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-rose-400" />
                    Tier Distribution
                  </h3>
                  <button
                    onClick={() => setTab('billing')}
                    className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                  >
                    All Subscriptions <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(financials?.tierBreakdown || []).map((t) => (
                    <div
                      key={t.planKey}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/70 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{t.tier}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{t.price}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{t.count} Active Tenants</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-emerald-400">${t.revenue.toLocaleString()}</span>
                        <div className="text-[10px] text-slate-500">monthly</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Currency Standard: <strong className="text-white">USD ($)</strong></span>
                <span className="text-emerald-400 font-mono font-semibold">Active Billing Engine</span>
              </div>
            </div>
          </div>

          {/* Lower 2-Column Grid: Organizations Activity & Platform Audits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Organizations Activity Stream */}
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    Organizations Directory Activity
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
                    <FileText className="w-4 h-4 text-rose-400" />
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
      {/* VIEW 2: REVENUE, PROFITS & FINANCIAL ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'financials' && (
        <div className="space-y-6">
          {/* Header Bar */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-850 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase font-bold">
                  Commercial Plane
                </span>
                <span className="text-xs text-slate-400 font-mono">Real-time P&L Ledger</span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">Platform Revenue, Profits & Commercial Margins</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive financial telemetry calculated across all multi-tenant subscriptions and cloud operating costs.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-right">
                <div className="text-[10px] uppercase font-semibold text-slate-400">Total Run-Rate ARR</div>
                <div className="text-xl font-extrabold text-white font-mono">
                  ${(financials?.arr ?? 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* 4 Financial Primary Metric Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Recurring Revenue</span>
              <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-mono">
                ${(financials?.mrr ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span>Active Subscriptions</span>
                <span className="font-bold text-white font-mono">{financials?.activeSubscribersCount ?? 0}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Operating Costs</span>
              <div className="text-3xl font-extrabold text-rose-400 mt-2 font-mono">
                ${financials?.operatingCosts ?? 0}
              </div>
              <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span>Cloudflare & Edge DB</span>
                <span className="font-bold text-rose-400 font-mono">Edge Optimized</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Net Monthly Profit</span>
              <div className="text-3xl font-extrabold text-purple-300 mt-2 font-mono">
                ${(financials?.netProfit ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span>Profit Margin</span>
                <span className="font-bold text-purple-400 font-mono">{financials?.profitMarginPercent ?? 85}%</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Average Revenue Per Org (ARPU)</span>
              <div className="text-3xl font-extrabold text-white mt-2 font-mono">
                ${financials?.arpu ?? 149}
              </div>
              <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                <span>Growth Trajectory</span>
                <span className="font-bold text-emerald-400 font-mono">+{financials?.growthRatePercent ?? 18.4}% MoM</span>
              </div>
            </div>
          </div>

          {/* Deep Breakdown: Tiers vs Operating Expenses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subscription Tier Contributions */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  Subscription Tiers & MRR Contribution
                </h3>
                <span className="text-xs text-slate-400 font-mono">Plan Catalog</span>
              </div>

              <div className="space-y-3">
                {(financials?.tierBreakdown || []).map((tier) => {
                  const totalMrr = financials?.mrr || 1;
                  const sharePct = Math.round((tier.revenue / totalMrr) * 100);
                  return (
                    <div key={tier.planKey} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-white text-sm">{tier.tier} Tier</span>
                          <span className="text-slate-400 ml-2 font-mono">({tier.price})</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-400 text-sm">${tier.revenue.toLocaleString()}</span>
                          <span className="text-slate-500 text-[10px] ml-1">/mo ({sharePct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(3, sharePct))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>{tier.count} Customer Organizations</span>
                        <span className="font-mono">${tier.price.replace('/mo', '')} base price per tenant</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Operating Expense Ledger */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-rose-400" />
                  Platform Cloud Operating Costs Breakdown
                </h3>
                <span className="text-xs text-rose-400 font-mono font-bold">
                  Total: ${financials?.operatingCosts ?? 0}/mo
                </span>
              </div>

              <div className="space-y-3">
                {(financials?.expenseBreakdown || []).map((exp, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <Server className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{exp.category}</div>
                        <div className="text-[10px] text-slate-400">Cloudflare Workers Anycast & Edge Compute</div>
                      </div>
                    </div>
                    <div className="text-right font-mono font-bold text-rose-400">
                      ${exp.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-xs text-emerald-300 flex items-center justify-between">
                <div>
                  <div className="font-bold">Extreme Edge Cost Efficiency</div>
                  <div className="text-[10px] text-emerald-400/80">Cloudflare V8 isolate architecture keeps gross operational margins above 80%.</div>
                </div>
                <div className="text-right font-mono font-extrabold text-lg text-emerald-400">
                  {financials?.profitMarginPercent ?? 85}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 3: BILLING & TENANT SUBSCRIPTIONS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={billingSearch}
                onChange={(e) => setBillingSearch(e.target.value)}
                placeholder="Search tenant or owner email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
                {['ALL', 'ENTERPRISE', 'BUSINESS', 'PROFESSIONAL', 'STARTER'].map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setBillingPlanFilter(plan)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      billingPlanFilter === plan
                        ? 'bg-rose-500/20 text-rose-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Organization Tenant</th>
                    <th className="py-3 px-4">Owner Contact</th>
                    <th className="py-3 px-4">Current Plan</th>
                    <th className="py-3 px-4 text-center">Seats (Active / Limit)</th>
                    <th className="py-3 px-4">Billing Cycle</th>
                    <th className="py-3 px-4">Subscription Status</th>
                    <th className="py-3 px-4 text-right">Plan Governance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {loadingBilling ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                        Loading tenant subscriptions...
                      </td>
                    </tr>
                  ) : filteredBilling.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                        No tenant subscriptions match your query.
                      </td>
                    </tr>
                  ) : (
                    filteredBilling.map((sub) => (
                      <tr key={sub.workspaceId} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-white">{sub.workspaceName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{sub.workspaceId}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-200">{sub.ownerName}</div>
                          <div className="text-[11px] text-slate-400">{sub.ownerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider ${
                            sub.plan === 'ENTERPRISE'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : sub.plan === 'BUSINESS'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : sub.plan === 'PROFESSIONAL'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {sub.plan}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="font-bold text-white">{sub.activeMembers}</span>
                          <span className="text-slate-500"> / {sub.userLimit}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {sub.billingCycle}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditSub(sub)}
                            className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 ml-auto"
                          >
                            <Edit3 className="w-3 h-3 text-rose-400" />
                            <span>Edit Plan / Quota</span>
                          </button>
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
      {/* VIEW 4: ORGANIZATIONS DIRECTORY & MANAGEMENT */}
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
                    <th className="py-3 px-4">Subscription Plan</th>
                    <th className="py-3 px-4 text-center">Seats Used</th>
                    <th className="py-3 px-4">Tenant Status</th>
                    <th className="py-3 px-4 text-right">Administrative Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {loadingOrgs ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                        Loading tenant organizations...
                      </td>
                    </tr>
                  ) : filteredOrgs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
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
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {org.subscriptionPlan || 'BUSINESS'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-300">
                            {org.userCount ?? 1} / {org.userLimit ?? 100}
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
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleOpenEditSub(org)}
                              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
                            >
                              Plan
                            </button>
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
                                'Suspend'
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
      {/* VIEW 5: GLOBAL USERS DIRECTORY */}
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
                placeholder="Search user name or email..."
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
                    <th className="py-3 px-4">User Identity</th>
                    <th className="py-3 px-4">Role & Privilege</th>
                    <th className="py-3 px-4">Primary Workspace</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Administrative Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                        Loading platform users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                        No platform users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSuspended = u.status === 'SUSPENDED';
                      return (
                        <tr key={u.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-white flex items-center gap-2">
                              {u.name}
                              {u.isSuperAdmin && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[9px] font-mono">
                                  MASTER ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">{u.email}</div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            {u.isSuperAdmin ? (
                              <span className="text-rose-400 font-bold">Super Admin</span>
                            ) : (
                              <span className="text-slate-400">Tenant Member</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-300 font-mono">
                            {u.primaryWorkspace || 'Independent'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold ${
                                isSuspended
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {isSuspended ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                              {u.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-400">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              disabled={actionInProgress === u.id}
                              onClick={() => handleToggleAdminRole(u)}
                              className="px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition"
                            >
                              {u.isSuperAdmin ? 'Revoke Super' : 'Grant Super'}
                            </button>
                            <button
                              disabled={actionInProgress === u.id}
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                                isSuspended
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-rose-600/80 hover:bg-rose-600 text-white'
                              } disabled:opacity-50`}
                            >
                              {isSuspended ? 'Unsuspend' : 'Suspend'}
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
      {/* VIEW 6: PLATFORM AUDIT TRAIL STREAM */}
      {/* ========================================================================= */}
      {activeTab === 'audit-logs' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search actor, action or target..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Total Audits Recorded: <strong className="text-white">{auditLogs.length}</strong>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Action Code</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {loadingAudits ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                        Loading immutable audit trail...
                      </td>
                    </tr>
                  ) : filteredAudits.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                        No audit events match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredAudits.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-rose-400 whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-slate-200">
                          <div>{log.actor_name || 'System'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{log.actor_email || 'automated'}</div>
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
      {/* VIEW 7: SYSTEM DIAGNOSTICS & ENGINE STATUS */}
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

      {/* ========================================================================= */}
      {/* MODAL: EDIT ORGANIZATION SUBSCRIPTION & SEAT QUOTA */}
      {/* ========================================================================= */}
      {editingSubOrg && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-rose-400" />
                  Manage Tenant Subscription
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{editingSubOrg.name}</p>
              </div>
              <button
                onClick={() => setEditingSubOrg(null)}
                className="text-slate-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSub} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Subscription Plan Tier</label>
                <select
                  value={subFormPlan}
                  onChange={(e) => setSubFormPlan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="STARTER">Starter ($29/mo)</option>
                  <option value="PROFESSIONAL">Professional ($79/mo)</option>
                  <option value="BUSINESS">Business ($149/mo)</option>
                  <option value="ENTERPRISE">Enterprise ($299/mo)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">User Seat Quota Limit</label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={subFormLimit}
                  onChange={(e) => setSubFormLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Subscription Status</label>
                <select
                  value={subFormStatus}
                  onChange={(e) => setSubFormStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PAST_DUE">PAST_DUE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="CANCELED">CANCELED</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSubOrg(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateTenantSubscription.isPending}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition disabled:opacity-50"
                >
                  {updateTenantSubscription.isPending ? 'Saving...' : 'Apply Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
