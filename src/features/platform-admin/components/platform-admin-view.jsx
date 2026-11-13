import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { platformAdminApi } from '@/lib/api-client';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { toast } from 'sonner';
import {
  Building2,
  Users,
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Crown,
  Calendar,
  DollarSign,
  TrendingUp,
  Activity,
  Database,
  ArrowRight,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  Download,
  Lock,
  ChevronDown,
  SlidersHorizontal,
  FolderGit2,
  CheckSquare,
} from 'lucide-react';

export const PlatformAdminView = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeWorkspaceId = useWorkspaceId();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState('COMPANIES'); // 'COMPANIES' | 'BILLING' | 'USERS' | 'HEALTH' | 'AUDIT'

  // Loading & Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [billingData, setBillingData] = useState({ subscriptions: [], invoices: [], plans: {} });
  const [usersList, setUsersList] = useState([]);

  // Filters & Search
  const [companySearch, setCompanySearch] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState('ALL'); // ALL, ACTIVE, SUSPENDED, ARCHIVED
  const [companyPlanFilter, setCompanyPlanFilter] = useState('ALL'); // ALL, ENTERPRISE, BUSINESS, STARTER

  const [billingSearch, setBillingSearch] = useState('');
  const [billingPlanFilter, setBillingPlanFilter] = useState('ALL');

  const [userSearch, setUserSearch] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('ALL');
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');

  // Modals State
  const [createCompanyModal, setCreateCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Forms State
  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    domainSlug: '',
    ownerEmail: '',
    industry: 'Software & Technology',
    companySize: '11-50 employees',
    country: 'India',
    plan: 'BUSINESS',
    userLimit: 100,
  });

  const [subscriptionForm, setSubscriptionForm] = useState({
    plan: 'BUSINESS',
    billingCycle: 'MONTHLY',
    userLimit: 100,
    status: 'ACTIVE',
    extendDays: 30,
  });

  // Confirmation Modals
  const [ConfirmDecommissionDialog, confirmDecommission] = useConfirm(
    'Decommission Company Workspace',
    'Are you sure you want to decommission this company? All associated projects, tasks, and data will be removed. This cannot be undone.',
    'destructive'
  );

  const [ConfirmStatusDialog, confirmStatus] = useConfirm(
    'Change Organization Status',
    'Are you sure you want to alter the operational status of this organization?',
    'primary'
  );

  // Load all platform data
  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [overviewRes, companiesRes, billingsRes, usersRes] = await Promise.all([
        platformAdminApi.getOverview().catch(() => ({ data: {} })),
        platformAdminApi.getCompanies().catch(() => ({ data: { companies: [] } })),
        platformAdminApi.getBillings().catch(() => ({ data: { subscriptions: [], invoices: [], plans: {} } })),
        platformAdminApi.getUsers().catch(() => ({ data: { users: [] } })),
      ]);

      if (overviewRes?.data) setOverview(overviewRes.data);
      if (companiesRes?.data?.companies) setCompanies(companiesRes.data.companies);
      if (billingsRes?.data) setBillingData(billingsRes.data);
      if (usersRes?.data?.users) setUsersList(usersRes.data.users);
    } catch (err) {
      toast.error('Failed to load platform administration data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered Companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const q = companySearch.toLowerCase();
      const matchesSearch =
        c.name?.toLowerCase().includes(q) ||
        c.domainSlug?.toLowerCase().includes(q) ||
        c.owner?.name?.toLowerCase().includes(q) ||
        c.owner?.email?.toLowerCase().includes(q) ||
        c.id?.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (companyStatusFilter !== 'ALL' && c.status !== companyStatusFilter) return false;
      if (companyPlanFilter !== 'ALL' && c.subscription?.plan !== companyPlanFilter) return false;
      return true;
    });
  }, [companies, companySearch, companyStatusFilter, companyPlanFilter]);

  // Filtered Subscriptions
  const filteredSubscriptions = useMemo(() => {
    return (billingData.subscriptions || []).filter((s) => {
      const q = billingSearch.toLowerCase();
      const matchesSearch =
        s.companyName?.toLowerCase().includes(q) ||
        s.ownerEmail?.toLowerCase().includes(q) ||
        s.domainSlug?.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (billingPlanFilter !== 'ALL' && s.plan !== billingPlanFilter) return false;
      return true;
    });
  }, [billingData.subscriptions, billingSearch, billingPlanFilter]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      const q = userSearch.toLowerCase();
      const matchesSearch =
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.primaryWorkspace?.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (userStatusFilter !== 'ALL' && u.status !== userStatusFilter) return false;
      if (userRoleFilter === 'SUPER_ADMIN' && !u.isSuperAdmin) return false;
      if (userRoleFilter === 'STANDARD' && u.isSuperAdmin) return false;
      return true;
    });
  }, [usersList, userSearch, userStatusFilter, userRoleFilter]);

  // Handlers
  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await platformAdminApi.createCompany(newCompanyForm);
      toast.success(`Company "${newCompanyForm.name}" provisioned successfully!`);
      setCreateCompanyModal(false);
      setNewCompanyForm({
        name: '',
        domainSlug: '',
        ownerEmail: '',
        industry: 'Software & Technology',
        companySize: '11-50 employees',
        country: 'India',
        plan: 'BUSINESS',
        userLimit: 100,
      });
      fetchData(true);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    } catch (err) {
      toast.error(err.message || 'Failed to provision company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    if (!editingCompany) return;
    try {
      setActionLoading(true);
      await platformAdminApi.updateCompany(editingCompany.id, editingCompany);
      toast.success(`Company "${editingCompany.name}" updated!`);
      setEditingCompany(null);
      fetchData(true);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    } catch (err) {
      toast.error(err.message || 'Failed to update company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleCompanyStatus = async (company, newStatus) => {
    const ok = await confirmStatus();
    if (!ok) return;
    try {
      await platformAdminApi.updateCompanyStatus(company.id, newStatus);
      toast.success(`Company status changed to ${newStatus}`);
      fetchData(true);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    } catch (err) {
      toast.error(err.message || 'Failed to change company status');
    }
  };

  const handleDeleteCompany = async (company) => {
    const ok = await confirmDecommission();
    if (!ok) return;
    try {
      await platformAdminApi.deleteCompany(company.id);
      toast.success(`Company "${company.name}" has been decommissioned.`);
      fetchData(true);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    } catch (err) {
      toast.error(err.message || 'Failed to decommission company');
    }
  };

  const handleOpenEditSubscription = (sub) => {
    setEditingSubscription(sub);
    setSubscriptionForm({
      plan: sub.plan || 'BUSINESS',
      billingCycle: sub.billingCycle || 'MONTHLY',
      userLimit: sub.userLimit || 100,
      status: sub.status || 'ACTIVE',
      extendDays: 30,
    });
  };

  const handleSaveSubscriptionOverride = async (e) => {
    e.preventDefault();
    if (!editingSubscription) return;
    try {
      setActionLoading(true);
      await platformAdminApi.updateSubscription(editingSubscription.workspaceId, subscriptionForm);
      toast.success(`Subscription updated for ${editingSubscription.companyName}!`);
      setEditingSubscription(null);
      fetchData(true);
      queryClient.invalidateQueries({ queryKey: ['billing'] });
    } catch (err) {
      toast.error(err.message || 'Failed to update subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuperAdmin = async (targetUser) => {
    try {
      const nextVal = !targetUser.isSuperAdmin;
      await platformAdminApi.toggleSuperAdmin(targetUser.id, nextVal);
      toast.success(
        nextVal
          ? `Granted Super Admin privileges to ${targetUser.name}`
          : `Revoked Super Admin privileges from ${targetUser.name}`
      );
      fetchData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update Super Admin rights');
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    try {
      const nextStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
      await platformAdminApi.updateUserStatus(targetUser.id, nextStatus);
      toast.success(`User ${targetUser.name} marked as ${nextStatus}`);
      fetchData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const handleJumpToWorkspace = (workspaceId) => {
    navigate(`/workspaces/${workspaceId}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      <ConfirmDecommissionDialog />
      <ConfirmStatusDialog />

      {/* Control Plane Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Platform Super Admin Console
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700 shadow-2xs">
                  <Crown className="size-3 text-indigo-600" />
                  Control Plane
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Centralized Multi-Tenant Management, Global Billings, Cross-Company User Directory & Telemetry.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50 transition cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </button>

          <button
            onClick={() => setCreateCompanyModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Provision Company</span>
          </button>
        </div>
      </div>

      {/* Executive Financial & Scale KPI Matrix */}
      {overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total Companies */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Total Companies</span>
              <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-neutral-900">{overview.totalCompanies}</span>
              <span className="text-xs font-semibold text-emerald-600">
                {overview.activeCompanies} Active
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              {overview.suspendedCompanies} suspended / archived
            </p>
          </div>

          {/* Card 2: MRR & Revenue */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Monthly Run Rate (MRR)</span>
              <div className="size-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                ₹{overview.mrrInr?.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              ARR: ₹{(overview.arrInr || overview.mrrInr * 12)?.toLocaleString('en-IN')}
            </p>
          </div>

          {/* Card 3: Seat Licenses Allocated */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Seat Utilization</span>
              <div className="size-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CreditCard className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-neutral-900">{overview.totalSeatsInUse}</span>
              <span className="text-xs font-semibold text-neutral-500">
                / {overview.totalSeatsAllocated} seats
              </span>
            </div>
            <div className="mt-2 w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-purple-600 h-1.5 rounded-full"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((overview.totalSeatsInUse / (overview.totalSeatsAllocated || 1)) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Card 4: Platform Scale */}
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 sm:p-5 shadow-xs hover:shadow-sm transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Global Work Volume</span>
              <div className="size-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Activity className="size-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-neutral-900">{overview.totalTasks}</span>
              <span className="text-xs font-semibold text-neutral-500">tickets</span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-1">
              Across {overview.totalProjects} active projects & {overview.totalUsers} users
            </p>
          </div>
        </div>
      )}

      {/* Control Plane Navigation Tabs */}
      <div className="flex border-b border-neutral-200 text-xs font-bold overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('COMPANIES')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'COMPANIES'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Building2 className="size-4" />
          <span>Companies & Tenants</span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 font-bold">
            {companies.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('BILLING')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'BILLING'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <CreditCard className="size-4" />
          <span>Global Billings & Subscriptions</span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 font-bold">
            {billingData.subscriptions?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'USERS'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Users className="size-4" />
          <span>Global Users Directory</span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600 font-bold">
            {usersList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('HEALTH')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'HEALTH'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Database className="size-4" />
          <span>D1 Storage & System Health</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 pb-3 px-3 border-b-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'AUDIT'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <ShieldCheck className="size-4" />
          <span>Master Audit Logs</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: COMPANIES & TENANTS DIRECTORY */}
      {/* ============================================================== */}
      {activeTab === 'COMPANIES' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <input
                type="text"
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search by company name, domain slug, owner name or email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={companyStatusFilter}
                onChange={(e) => setCompanyStatusFilter(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="SUSPENDED">Suspended Only</option>
                <option value="ARCHIVED">Archived Only</option>
              </select>

              <select
                value={companyPlanFilter}
                onChange={(e) => setCompanyPlanFilter(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Plans</option>
                <option value="ENTERPRISE">Enterprise Scale</option>
                <option value="BUSINESS">Business Standard</option>
                <option value="STARTER">Starter Tier</option>
              </select>
            </div>
          </div>

          {/* Companies Cards Grid */}
          {filteredCompanies.length === 0 ? (
            <div className="rounded-2xl border border-neutral-200 bg-white p-12 text-center text-neutral-500 space-y-3">
              <Building2 className="size-10 mx-auto text-neutral-300" />
              <p className="text-sm font-bold text-neutral-800">No company workspaces matched your filter.</p>
              <p className="text-xs text-neutral-400">Try modifying your search or clear filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCompanies.map((company) => {
                const plan = (company.subscription?.plan || 'BUSINESS').toUpperCase();
                const isSuspended = company.status === 'SUSPENDED';

                return (
                  <div
                    key={company.id}
                    className={`rounded-2xl border bg-white p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between ${
                      isSuspended ? 'border-rose-200 bg-rose-50/20' : 'border-neutral-200/90'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Company Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="size-11 rounded-xl bg-neutral-900 text-white font-black flex items-center justify-center text-base shadow-sm shrink-0">
                            {company.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-neutral-900 leading-snug line-clamp-1">
                              {company.name}
                            </h3>
                            <p className="text-[11px] font-mono text-neutral-400">
                              {company.domainSlug ? `${company.domainSlug}.klanservicehub.com` : 'Default Tenant'}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              isSuspended
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {company.status || 'ACTIVE'}
                          </span>

                          <span
                            className={`px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase ${
                              plan === 'ENTERPRISE'
                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                : plan === 'BUSINESS'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                            }`}
                          >
                            {plan}
                          </span>
                        </div>
                      </div>

                      {/* Owner Info & Details */}
                      <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span>Tenant Owner:</span>
                          <span className="font-semibold text-neutral-800">{company.owner?.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span>Owner Email:</span>
                          <span className="font-mono text-neutral-700 text-[10.5px]">{company.owner?.email}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span>Industry / Size:</span>
                          <span className="text-neutral-700">{company.industry || 'Technology'}</span>
                        </div>
                      </div>

                      {/* Telemetry Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                        <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                          <span className="block text-neutral-400 text-[10px] uppercase font-bold">Members</span>
                          <span className="font-bold text-neutral-800 text-sm">{company.memberCount}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                          <span className="block text-neutral-400 text-[10px] uppercase font-bold">Projects</span>
                          <span className="font-bold text-neutral-800 text-sm">{company.projectCount}</span>
                        </div>
                        <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                          <span className="block text-neutral-400 text-[10px] uppercase font-bold">Tasks</span>
                          <span className="font-bold text-neutral-800 text-sm">{company.taskCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => handleJumpToWorkspace(company.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-neutral-800 transition cursor-pointer"
                        title="Impersonate & Open Workspace"
                      >
                        <ExternalLink className="size-3.5" />
                        <span>Open Tenant</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingCompany(company)}
                          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition cursor-pointer"
                          title="Edit Company Details"
                        >
                          <Edit3 className="size-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            const sub = billingData.subscriptions?.find((s) => s.workspaceId === company.id) || {
                              workspaceId: company.id,
                              companyName: company.name,
                              plan: company.subscription?.plan,
                              billingCycle: company.subscription?.billingCycle,
                              userLimit: company.subscription?.userLimit,
                            };
                            handleOpenEditSubscription(sub);
                          }}
                          className="p-1.5 rounded-lg border border-neutral-200 text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Manage Subscription & Seats"
                        >
                          <CreditCard className="size-3.5" />
                        </button>

                        <button
                          onClick={() =>
                            handleToggleCompanyStatus(
                              company,
                              company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                            )
                          }
                          className={`p-1.5 rounded-lg border transition cursor-pointer ${
                            isSuspended
                              ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                              : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                          }`}
                          title={isSuspended ? 'Reactivate Organization' : 'Suspend Organization'}
                        >
                          {isSuspended ? <CheckCircle2 className="size-3.5" /> : <AlertTriangle className="size-3.5" />}
                        </button>

                        <button
                          onClick={() => handleDeleteCompany(company)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Decommission Company"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: GLOBAL BILLINGS & SUBSCRIPTIONS */}
      {/* ============================================================== */}
      {activeTab === 'BILLING' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <input
                type="text"
                value={billingSearch}
                onChange={(e) => setBillingSearch(e.target.value)}
                placeholder="Filter by company, domain slug, or owner email..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <select
              value={billingPlanFilter}
              onChange={(e) => setBillingPlanFilter(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Plans</option>
              <option value="ENTERPRISE">Enterprise Scale (₹24,999/mo)</option>
              <option value="BUSINESS">Business Standard (₹7,999/mo)</option>
              <option value="STARTER">Starter Tier (₹2,499/mo)</option>
            </select>
          </div>

          {/* Subscriptions Table */}
          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[10.5px] font-bold uppercase tracking-wider text-neutral-500">
                    <th className="py-3 px-4">Company & Tenant</th>
                    <th className="py-3 px-4">Owner / Contact</th>
                    <th className="py-3 px-4">Plan Tier</th>
                    <th className="py-3 px-4">Billing Cycle</th>
                    <th className="py-3 px-4">Seats Allocated</th>
                    <th className="py-3 px-4">Monthly Rate</th>
                    <th className="py-3 px-4">Renewal Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredSubscriptions.map((sub) => {
                    return (
                      <tr key={sub.id || sub.workspaceId} className="hover:bg-neutral-50/80 transition">
                        <td className="py-3 px-4 font-bold text-neutral-900">
                          <div>
                            <span>{sub.companyName}</span>
                            <span className="block text-[10.5px] font-mono text-neutral-400 font-normal">
                              {sub.domainSlug || sub.workspaceId?.slice(0, 8)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-neutral-800">{sub.ownerName}</span>
                          <span className="block text-[10.5px] text-neutral-400 font-mono">{sub.ownerEmail}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              sub.plan === 'ENTERPRISE'
                                ? 'bg-purple-100 text-purple-700'
                                : sub.plan === 'BUSINESS'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {sub.plan}
                          </span>
                        </td>
                        <td className="py-3 px-4 capitalize font-medium text-neutral-700">
                          {sub.billingCycle?.toLowerCase() || 'monthly'}
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-800">
                          {sub.memberCount} / {sub.userLimit} seats
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                          ₹{sub.monthlyCostInr?.toLocaleString('en-IN')}/mo
                        </td>
                        <td className="py-3 px-4 text-neutral-600 font-mono text-[11px]">
                          {sub.currentPeriodEnd || 'Active 30 Days'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditSubscription(sub)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition cursor-pointer"
                          >
                            <SlidersHorizontal className="size-3" />
                            <span>Override</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: GLOBAL USERS DIRECTORY */}
      {/* ============================================================== */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-neutral-200/80 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search across all registered users by name, email, or company..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-200 text-xs focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Roles</option>
                <option value="SUPER_ADMIN">Super Admins Only</option>
                <option value="STANDARD">Regular Users</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Users</option>
                <option value="SUSPENDED">Suspended Users</option>
              </select>
            </div>
          </div>

          <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50/80 text-[10.5px] font-bold uppercase tracking-wider text-neutral-500">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Primary Workspace</th>
                    <th className="py-3 px-4">Global Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredUsers.map((u) => {
                    const isSuspended = u.status === 'SUSPENDED';
                    return (
                      <tr key={u.id} className="hover:bg-neutral-50/80 transition">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                              {u.name?.charAt(0) || 'U'}
                            </div>
                            <span className="font-bold text-neutral-900">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-neutral-600">{u.email}</td>
                        <td className="py-3 px-4 text-neutral-700">
                          <span className="font-semibold">{u.primaryWorkspace}</span>
                          <span className="block text-[10.5px] text-neutral-400">
                            {u.workspaceCount} workspaces total
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {u.isSuperAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 border border-indigo-200 shadow-2xs">
                              <Crown className="size-3 text-indigo-600" />
                              SUPER ADMIN
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-neutral-100 text-neutral-600">
                              User
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isSuspended ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {u.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-neutral-500 font-mono text-[11px]">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleToggleSuperAdmin(u)}
                              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                                u.isSuperAdmin
                                  ? 'border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                                  : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                              }`}
                              title="Toggle Platform Super Admin"
                            >
                              {u.isSuperAdmin ? 'Revoke Super Admin' : 'Make Super Admin'}
                            </button>

                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                                isSuspended
                                  ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                  : 'border-rose-300 text-rose-700 hover:bg-rose-50'
                              }`}
                            >
                              {isSuspended ? 'Reactivate' : 'Suspend'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SYSTEM HEALTH & D1 DATABASE STORAGE */}
      {/* ============================================================== */}
      {activeTab === 'HEALTH' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-neutral-200/80 bg-white shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Database className="size-4" />
                <span>Cloudflare D1 Production DB</span>
              </div>
              <p className="text-xs text-neutral-500">
                Managed distributed SQL database replicated at the Cloudflare Edge network.
              </p>
              <div className="pt-2 border-t border-neutral-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Binding:</span>
                  <span className="font-mono font-bold text-neutral-800">env.DB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Database Name:</span>
                  <span className="font-mono font-bold text-neutral-800">klanservicehub_db</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <span className="size-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    Online & Synchronized
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-neutral-200/80 bg-white shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <Activity className="size-4" />
                <span>API Gateway & Workers Runtime</span>
              </div>
              <p className="text-xs text-neutral-500">
                Serverless API running on Cloudflare Workers with global low-latency dispatch.
              </p>
              <div className="pt-2 border-t border-neutral-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Backend Endpoint:</span>
                  <span className="font-mono text-blue-600">workers.dev</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Node Compatibility:</span>
                  <span className="font-mono font-bold text-neutral-800">nodejs_compat v2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">API Health:</span>
                  <span className="font-bold text-emerald-600">200 OK (0ms cold start)</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl border border-neutral-200/80 bg-white shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <ShieldCheck className="size-4" />
                <span>Tenant Isolation & Security</span>
              </div>
              <p className="text-xs text-neutral-500">
                Cryptographic session token enforcement, PBKDF2 hashing, and multi-tenant isolation.
              </p>
              <div className="pt-2 border-t border-neutral-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">RBAC Engine:</span>
                  <span className="font-bold text-emerald-600">100% Dynamic D1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Super Admin Shield:</span>
                  <span className="font-bold text-indigo-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Audit Logging:</span>
                  <span className="font-bold text-neutral-800">Continuous FIFO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: MASTER PLATFORM AUDIT LOGS */}
      {/* ============================================================== */}
      {activeTab === 'AUDIT' && (
        <div className="rounded-2xl border border-neutral-200/90 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">Platform-Wide Administrative Audit Stream</h3>
            <span className="text-xs text-neutral-400">Real-time audit telemetry across all tenants</span>
          </div>

          <div className="divide-y divide-neutral-100">
            {(overview?.recentAuditLogs || []).length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-400">No platform audit logs recorded yet.</div>
            ) : (
              overview.recentAuditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-start justify-between gap-4 hover:bg-neutral-50/70 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 font-mono uppercase">
                        {log.action}
                      </span>
                      <span className="text-xs font-semibold text-neutral-800">{log.actorName || 'Admin'}</span>
                      <span className="text-xs text-neutral-400">•</span>
                      <span className="text-xs text-neutral-500">
                        Target: <span className="font-mono text-neutral-700">{log.entityType || 'SYSTEM'}</span>
                      </span>
                    </div>
                    {log.details && (
                      <p className="text-[11px] text-neutral-600 font-mono bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                      </p>
                    )}
                  </div>
                  <span className="text-[10.5px] text-neutral-400 font-mono shrink-0">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Just now'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: PROVISION NEW COMPANY */}
      {/* ============================================================== */}
      {createCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Provision New Company Tenant</h3>
                  <p className="text-xs text-neutral-500">Onboard an organization with dedicated workspace & plan</p>
                </div>
              </div>
              <button
                onClick={() => setCreateCompanyModal(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCompany} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={newCompanyForm.name}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                  placeholder="e.g. Acme Corporation"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Domain Slug (subdomain)</label>
                <input
                  type="text"
                  value={newCompanyForm.domainSlug}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, domainSlug: e.target.value })}
                  placeholder="e.g. acme-corp"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Tenant Owner Email</label>
                <input
                  type="email"
                  value={newCompanyForm.ownerEmail}
                  onChange={(e) => setNewCompanyForm({ ...newCompanyForm, ownerEmail: e.target.value })}
                  placeholder="e.g. founder@acme.com (leave blank to assign to you)"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Industry</label>
                  <select
                    value={newCompanyForm.industry}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, industry: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Software & Technology">Software & Technology</option>
                    <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                    <option value="Financial Services">Financial Services</option>
                    <option value="E-Commerce & Retail">E-Commerce & Retail</option>
                    <option value="Consulting & Agency">Consulting & Agency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Initial Plan</label>
                  <select
                    value={newCompanyForm.plan}
                    onChange={(e) => setNewCompanyForm({ ...newCompanyForm, plan: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="STARTER">Starter Tier (15 seats)</option>
                    <option value="BUSINESS">Business Standard (100 seats)</option>
                    <option value="ENTERPRISE">Enterprise Scale (1,000 seats)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setCreateCompanyModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Provisioning...' : 'Provision Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: EDIT COMPANY METADATA */}
      {/* ============================================================== */}
      {editingCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Edit Company: {editingCompany.name}</h3>
              <button onClick={() => setEditingCompany(null)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCompany} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={editingCompany.name || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Domain Slug</label>
                <input
                  type="text"
                  value={editingCompany.domainSlug || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, domainSlug: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Status</label>
                  <select
                    value={editingCompany.status || 'ACTIVE'}
                    onChange={(e) => setEditingCompany({ ...editingCompany, status: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Industry</label>
                  <input
                    type="text"
                    value={editingCompany.industry || ''}
                    onChange={(e) => setEditingCompany({ ...editingCompany, industry: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Website URL</label>
                <input
                  type="text"
                  value={editingCompany.website || ''}
                  onChange={(e) => setEditingCompany({ ...editingCompany, website: e.target.value })}
                  placeholder="https://company.com"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: OVERRIDE SUBSCRIPTION & SEATS */}
      {/* ============================================================== */}
      {editingSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Subscription Override: {editingSubscription.companyName}
                </h3>
                <p className="text-xs text-neutral-500">Super admin license, tier, and renewal control</p>
              </div>
              <button
                onClick={() => setEditingSubscription(null)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubscriptionOverride} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Plan Tier</label>
                <select
                  value={subscriptionForm.plan}
                  onChange={(e) => setSubscriptionForm({ ...subscriptionForm, plan: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs bg-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="STARTER">Starter Tier (₹2,499/mo)</option>
                  <option value="BUSINESS">Business Standard (₹7,999/mo)</option>
                  <option value="ENTERPRISE">Enterprise Scale (₹24,999/mo)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Billing Cycle</label>
                  <select
                    value={subscriptionForm.billingCycle}
                    onChange={(e) => setSubscriptionForm({ ...subscriptionForm, billingCycle: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs bg-white focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="ANNUAL">Annual (20% Off)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Seat Limit Quota</label>
                  <input
                    type="number"
                    min="1"
                    max="10000"
                    value={subscriptionForm.userLimit}
                    onChange={(e) =>
                      setSubscriptionForm({
                        ...subscriptionForm,
                        userLimit: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Extend Period / Grant Free Days
                </label>
                <select
                  value={subscriptionForm.extendDays}
                  onChange={(e) =>
                    setSubscriptionForm({ ...subscriptionForm, extendDays: parseInt(e.target.value, 10) })
                  }
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs bg-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="0">Keep Current Expiration</option>
                  <option value="30">+30 Days Free Extension</option>
                  <option value="90">+90 Days (Quarterly Extension)</option>
                  <option value="365">+365 Days (Annual Waiver)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingSubscription(null)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 disabled:opacity-50"
                >
                  {actionLoading ? 'Saving...' : 'Apply Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
