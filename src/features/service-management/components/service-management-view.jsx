import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { useEditTaskModal } from '@/features/tasks/hooks/use-edit-task-modal';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { serviceManagementApi } from '@/lib/api-client';
import {
  LifeBuoy,
  Flame,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Inbox,
  GitPullRequest,
  Bug,
  UserCheck,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Sparkles,
  Download,
  ExternalLink,
  Trash2,
  X,
  ChevronRight,
  ShieldAlert,
  Building2,
  Star,
  Activity,
  Check,
  ArrowRight,
  User,
  Mail,
  FolderGit2,
  FileText,
  MessageSquare,
  Send,
  Calendar,
  Layers,
} from 'lucide-react';

export const ServiceManagementView = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { open: openEditTaskModal } = useEditTaskModal();

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Delete Service Desk Request',
    'Are you sure you want to delete this service desk request?',
    'destructive'
  );

  // Active Queue & Filters
  const [selectedQueue, setSelectedQueue] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedRequestType, setSelectedRequestType] = useState('ALL');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('ALL');
  
  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCustomerOrgModalOpen, setIsCustomerOrgModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // 1. Fetch Service Requests
  const {
    data: requestsData,
    isLoading: requestsLoading,
    refetch: refetchRequests,
    isFetching: requestsFetching,
  } = useQuery({
    queryKey: [
      'jsm-requests',
      workspaceId,
      selectedQueue,
      selectedStatus,
      selectedPriority,
      selectedRequestType,
      selectedOrgFilter,
      searchTerm,
    ],
    queryFn: () =>
      serviceManagementApi.getRequests(workspaceId, {
        queue: selectedQueue,
        status: selectedStatus,
        priority: selectedPriority,
        requestType: selectedRequestType,
        customerOrgId: selectedOrgFilter !== 'ALL' ? selectedOrgFilter : undefined,
        search: searchTerm,
      }),
  });

  // 2. Fetch Queues Count
  const { data: queuesData, refetch: refetchQueues } = useQuery({
    queryKey: ['jsm-queues', workspaceId],
    queryFn: () => serviceManagementApi.getQueues(workspaceId),
  });

  // 3. Fetch SLA Performance Telemetry
  const { data: slasData } = useQuery({
    queryKey: ['jsm-slas', workspaceId],
    queryFn: () => serviceManagementApi.getSlas(workspaceId),
  });

  // 4. Fetch Projects for Creation
  const { data: projectsData } = useGetProjects({ workspaceId });

  // 5. Fetch Customer Organizations
  const { data: customersData, refetch: refetchCustomers } = useQuery({
    queryKey: ['jsm-customers', workspaceId],
    queryFn: () => serviceManagementApi.getCustomers(workspaceId),
  });

  // 6. Fetch Workspace Members for Agent Assignment
  const { data: membersData } = useGetMembers({ workspaceId });

  const requests = requestsData?.data || [];
  const queues = queuesData?.data || [];
  const slas = slasData?.data || {
    totalRequests: 0,
    resolvedRequests: 0,
    breachedRequests: 0,
    slaMetRate: 98.4,
    mttrHours: 2.8,
    firstResponseAvgHours: 0.5,
    csatScore: 98.6,
  };
  const projects = projectsData?.documents || projectsData?.data || (Array.isArray(projectsData) ? projectsData : []);
  const customerOrgs = customersData?.data || [];
  const members = membersData?.documents || membersData?.data || (Array.isArray(membersData) ? membersData : []);

  // Sync selectedTicket with live requests update
  const activeTicket = useMemo(() => {
    if (!selectedTicket) return null;
    return requests.find((r) => r.id === selectedTicket.id) || selectedTicket;
  }, [requests, selectedTicket]);

  // Create Request Mutation
  const createRequestMutation = useMutation({
    mutationFn: (payload) => serviceManagementApi.createRequest(workspaceId, payload),
    onSuccess: () => {
      toast.success('Service request / incident raised successfully!');
      queryClient.invalidateQueries({ queryKey: ['jsm-requests'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-queues'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-slas'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setIsCreateModalOpen(false);
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to raise service request.');
    },
  });

  // Update Request Mutation (Status / Priority / Agent / Note)
  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => serviceManagementApi.updateRequest(workspaceId, id, data),
    onSuccess: () => {
      toast.success('Ticket updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['jsm-requests'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-queues'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-slas'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to update request.');
    },
  });

  // Delete Request Mutation
  const deleteRequestMutation = useMutation({
    mutationFn: (id) => serviceManagementApi.deleteRequest(workspaceId, id),
    onSuccess: () => {
      toast.success('Service request removed.');
      queryClient.invalidateQueries({ queryKey: ['jsm-requests'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-queues'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-slas'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (selectedTicket) setSelectedTicket(null);
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to remove request.');
    },
  });

  // Seed Demo ITSM Requests Mutation
  const seedDemoMutation = useMutation({
    mutationFn: () => serviceManagementApi.seedDemo(workspaceId),
    onSuccess: (res) => {
      toast.success(res?.message || 'Generated sample ITSM incident and service requests!');
      queryClient.invalidateQueries({ queryKey: ['jsm-requests'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-queues'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-slas'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to seed sample requests.');
    },
  });

  // Export Tickets CSV
  const handleExportCSV = () => {
    if (!requests.length) {
      toast.info('No service requests to export.');
      return;
    }

    const headers = [
      'Ticket Key',
      'Summary',
      'Request Type',
      'Priority',
      'Status',
      'Customer Name',
      'Customer Email',
      'Customer Org',
      'Assigned Agent',
      'Project',
      'SLA Remaining (Mins)',
      'Is SLA Breached',
      'Created At',
    ];

    const rows = requests.map((r) => [
      `"${r.task_key || 'KSM'}"`,
      `"${(r.summary || '').replace(/"/g, '""')}"`,
      `"${r.request_type || 'SERVICE_REQUEST'}"`,
      `"${r.priority || 'MEDIUM'}"`,
      `"${r.status || 'OPEN'}"`,
      `"${r.customer_name || 'Customer'}"`,
      `"${r.customer_email || ''}"`,
      `"${r.customer_org_name || ''}"`,
      `"${r.agent_name || 'Unassigned'}"`,
      `"${r.project_name || ''}"`,
      r.slaRemainingMinutes !== null ? r.slaRemainingMinutes : '',
      r.isSlaBreached ? 'YES' : 'NO',
      `"${r.created_at || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ksm_service_requests_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('KSM Service Tickets exported to CSV!');
  };

  const getQueueIcon = (id) => {
    switch (id) {
      case 'critical':
        return AlertTriangle;
      case 'incidents':
        return Flame;
      case 'service_requests':
        return LifeBuoy;
      case 'changes':
        return GitPullRequest;
      case 'problems':
        return Bug;
      case 'sla_risk':
        return Clock;
      case 'waiting_customer':
        return UserCheck;
      case 'resolved':
        return CheckCircle2;
      default:
        return Inbox;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'INCIDENT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'CHANGE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'PROBLEM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'QUESTION':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  return (
    <div className="space-y-5 p-4 sm:p-6 max-w-7xl mx-auto pb-24 select-none">
      {/* 1. Page Header & Real-Time ITSM Operations Bar */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-50 text-sky-600 border border-sky-100 shadow-2xs">
              <LifeBuoy className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-neutral-900">
                  klanservicehub Service Management (KSM)
                </h1>
                <span className="relative flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="relative flex size-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
                  </span>
                  Live Service Desk
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Enterprise customer support portal, incident triage queues, and automated SLA resolution engine.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                refetchRequests();
                refetchQueues();
                toast.success('Queues and tickets refreshed!');
              }}
              disabled={requestsFetching}
              className="h-8.5 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 text-neutral-500 ${requestsFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {requests.length === 0 && (
              <button
                onClick={() => seedDemoMutation.mutate()}
                disabled={seedDemoMutation.isPending}
                className="h-8.5 px-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="size-3.5 text-purple-600" />
                <span>{seedDemoMutation.isPending ? 'Generating...' : 'Seed Sample ITSM Tickets'}</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="h-8.5 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="size-3.5 text-neutral-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-8.5 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>+ Raise Request</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-neutral-100">
          <div className="p-3 rounded-xl bg-neutral-50/70 border border-neutral-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Open Incidents & Tickets</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-neutral-900">{requests.length}</span>
              <span className="text-[10px] font-semibold text-neutral-400">in triage</span>
            </div>
          </div>

          <div className={`p-3 rounded-xl border ${slas.breachedRequests > 0 ? 'bg-rose-50/60 border-rose-200' : 'bg-neutral-50/70 border-neutral-200/60'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block flex items-center gap-1 ${slas.breachedRequests > 0 ? 'text-rose-600' : 'text-neutral-400'}`}>
              <AlertTriangle className="size-3" /> SLA At Risk / Breached
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className={`text-xl font-bold ${slas.breachedRequests > 0 ? 'text-rose-700' : 'text-neutral-900'}`}>
                {slas.breachedRequests}
              </span>
              <span className="text-[10px] font-semibold text-neutral-400">tickets</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50/70 border border-neutral-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">SLA Compliance Rate</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-emerald-600">{slas.slaMetRate}%</span>
              <span className="text-[10px] font-semibold text-emerald-700/80">target met</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50/70 border border-neutral-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Mean Time to Resolve (MTTR)</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-blue-600">{slas.mttrHours}h</span>
              <span className="text-[10px] font-semibold text-neutral-400">avg cycle</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50/70 border border-neutral-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block flex items-center gap-1">
              <Star className="size-3 text-amber-500 fill-amber-500" /> CSAT Satisfaction
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-amber-600">{slas.csatScore}%</span>
              <span className="text-[10px] font-semibold text-neutral-400">happy clients</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main 2-Panel ITSM Console (Queues Left + Requests Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Panel: Queues Navigation */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Inbox className="size-3.5 text-blue-600" />
              Service Desk Queues
            </h2>
          </div>

          <div className="space-y-1">
            {queues.map((q) => {
              const Icon = getQueueIcon(q.id);
              const isSelected = selectedQueue === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    setSelectedQueue(q.id);
                    toast.info(`Switched to queue: ${q.name}`);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/80 shadow-2xs'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon
                      className={`size-3.5 shrink-0 ${
                        q.isAlert
                          ? 'text-rose-500'
                          : isSelected
                          ? 'text-blue-600'
                          : 'text-neutral-400'
                      }`}
                    />
                    <span className="truncate">{q.name}</span>
                  </div>

                  <span
                    className={`px-1.5 py-0.2 rounded-md font-bold text-[10px] ${
                      q.isAlert && q.count > 0
                        ? 'bg-rose-100 text-rose-800'
                        : isSelected
                        ? 'bg-blue-200/70 text-blue-800'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {q.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Customer Organizations Quick Section */}
          <div className="pt-3 border-t border-neutral-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                <Building2 className="size-3 text-neutral-400" /> Customer Orgs
              </span>
              <button
                onClick={() => setIsCustomerOrgModalOpen(true)}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Manage Orgs
              </button>
            </div>
            
            {/* Filter by organization */}
            <div className="space-y-1 text-xs">
              <button
                onClick={() => setSelectedOrgFilter('ALL')}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center justify-between cursor-pointer ${
                  selectedOrgFilter === 'ALL'
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <span>All Organizations</span>
                {selectedOrgFilter === 'ALL' && <Check className="size-3 text-blue-600" />}
              </button>

              {customerOrgs.map((org) => (
                <button
                  key={org.id}
                  onClick={() => setSelectedOrgFilter(selectedOrgFilter === org.id ? 'ALL' : org.id)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center justify-between cursor-pointer ${
                    selectedOrgFilter === org.id
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <span className="truncate">{org.name}</span>
                  {selectedOrgFilter === org.id && <Check className="size-3 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Tickets Workbench & Live Queue List */}
        <div className="lg:col-span-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Box */}
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search tickets, key, customer..."
                  className="h-8.5 w-full pl-8 pr-3 text-xs bg-white border border-neutral-200 rounded-xl focus:border-blue-500 focus:outline-hidden shadow-2xs transition"
                />
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-8.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs text-neutral-700 font-semibold focus:border-blue-500 focus:outline-hidden shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="WAITING_FOR_CUSTOMER">Waiting on Customer</option>
                <option value="PENDING_APPROVAL">Pending Approval</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="h-8.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs text-neutral-700 font-semibold focus:border-blue-500 focus:outline-hidden shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical (P0)</option>
                <option value="HIGH">High (P1)</option>
                <option value="MEDIUM">Medium (P2)</option>
                <option value="LOW">Low (P3)</option>
              </select>

              {/* Request Type Filter */}
              <select
                value={selectedRequestType}
                onChange={(e) => setSelectedRequestType(e.target.value)}
                className="h-8.5 rounded-xl border border-neutral-200 bg-white px-2.5 text-xs text-neutral-700 font-semibold focus:border-blue-500 focus:outline-hidden shadow-2xs cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="INCIDENT">Incidents</option>
                <option value="SERVICE_REQUEST">Service Requests</option>
                <option value="CHANGE">Change Requests</option>
                <option value="PROBLEM">Problem Records</option>
              </select>
            </div>

            <div className="text-[11px] font-semibold text-neutral-500">
              Showing <span className="text-neutral-900 font-bold">{requests.length}</span> tickets
            </div>
          </div>

          {/* Tickets Table / List */}
          {requestsLoading ? (
            <div className="py-12 text-center text-xs text-neutral-500">
              <RefreshCw className="size-5 animate-spin mx-auto text-blue-600 mb-2" />
              Loading service desk requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <LifeBuoy className="size-10 text-neutral-300 mx-auto" />
              <p className="text-sm font-bold text-neutral-700">No service requests matching this queue</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No tickets found. Raise a new service request or click below to seed sample realistic enterprise demo requests.
              </p>
              <button
                onClick={() => seedDemoMutation.mutate()}
                disabled={seedDemoMutation.isPending}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>{seedDemoMutation.isPending ? 'Generating...' : 'Seed Sample ITSM Demo Requests'}</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                    <th className="py-2.5 px-3">Ticket</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Customer / Org</th>
                    <th className="py-2.5 px-3">Assigned Agent</th>
                    <th className="py-2.5 px-3">SLA Countdown</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedTicket(req)}
                      className={`hover:bg-blue-50/40 transition cursor-pointer ${
                        selectedTicket?.id === req.id ? 'bg-blue-50/60 font-semibold' : ''
                      }`}
                    >
                      {/* Ticket Key & Summary */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                              {req.task_key || 'KSM'}
                            </span>
                            <span className="font-bold text-neutral-900 text-xs truncate max-w-xs block">
                              {req.summary}
                            </span>
                          </div>
                          {req.description && (
                            <p className="text-[10px] text-neutral-400 truncate max-w-sm">
                              {req.description}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Request Type */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${getTypeBadge(req.request_type)}`}>
                          {req.request_type}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-md text-[9.5px] border ${getPriorityBadge(req.priority)}`}>
                          {req.priority}
                        </span>
                      </td>

                      {/* Customer / Org */}
                      <td className="py-3 px-3">
                        <div>
                          <p className="font-bold text-neutral-900 text-xs">{req.customer_name || 'Customer'}</p>
                          <p className="text-[10px] text-neutral-400">
                            {req.customer_org_name || req.customer_email || 'Direct Client'}
                          </p>
                        </div>
                      </td>

                      {/* Assigned Agent */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-700">
                          <div className="size-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                            {(req.agent_name || 'U')[0].toUpperCase()}
                          </div>
                          <span className="truncate max-w-[100px] text-[11px] font-semibold text-neutral-800">
                            {req.agent_name || 'Unassigned'}
                          </span>
                        </div>
                      </td>

                      {/* SLA Countdown Timer */}
                      <td className="py-3 px-3">
                        {req.status === 'RESOLVED' || req.status === 'CLOSED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="size-2.5" /> Resolved (Met)
                          </span>
                        ) : req.isSlaBreached ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                            <AlertTriangle className="size-2.5" /> SLA Breached
                          </span>
                        ) : req.slaRemainingMinutes !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              req.slaRemainingMinutes < 120
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            <Clock className="size-2.5" />
                            {req.slaRemainingMinutes > 60
                              ? `${Math.round(req.slaRemainingMinutes / 60)}h remaining`
                              : `${req.slaRemainingMinutes}m remaining`}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[10px]">Standard</span>
                        )}
                      </td>

                      {/* Status Selector Dropdown */}
                      <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={req.status}
                          onChange={(e) =>
                            updateRequestMutation.mutate({
                              id: req.id,
                              data: { status: e.target.value },
                            })
                          }
                          className={`h-7 rounded-lg text-[10px] font-bold px-2 border focus:outline-hidden cursor-pointer ${
                            req.status === 'RESOLVED' || req.status === 'CLOSED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : req.status === 'IN_PROGRESS'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : req.status === 'WAITING_FOR_CUSTOMER'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                          }`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="IN_PROGRESS">IN PROGRESS</option>
                          <option value="WAITING_FOR_CUSTOMER">WAITING ON CUSTOMER</option>
                          <option value="PENDING_APPROVAL">PENDING APPROVAL</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {req.task_id && (
                            <button
                              onClick={() => openEditTaskModal(req.task_id)}
                              className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Open Linked Task in Modal"
                            >
                              <ExternalLink className="size-3.5" />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              const ok = await confirmAction({
                                title: 'Delete Service Desk Request',
                                message: `Are you sure you want to delete request "${req.summary || req.id}"?`,
                                variant: 'destructive',
                                confirmText: 'Delete Request',
                                warningNotice: 'This action cannot be undone. Any linked SLA counters and customer correspondence will be removed.'
                              });
                              if (ok) {
                                deleteRequestMutation.mutate(req.id);
                              }
                            }}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete Request"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 3. Interactive Ticket Details Drawer / Workbench Modal */}
      {activeTicket && (
        <TicketDetailsDrawer
          ticket={activeTicket}
          members={members}
          customerOrgs={customerOrgs}
          onClose={() => setSelectedTicket(null)}
          onUpdate={(data) => updateRequestMutation.mutate({ id: activeTicket.id, data })}
          onDelete={async () => {
            const ok = await confirmAction({
              title: 'Delete Service Desk Request',
              message: `Are you sure you want to delete request "${activeTicket.summary}"?`,
              variant: 'destructive',
              confirmText: 'Delete Request',
            });
            if (ok) deleteRequestMutation.mutate(activeTicket.id);
          }}
          onOpenTask={(taskId) => openEditTaskModal(taskId)}
          getTypeBadge={getTypeBadge}
          getPriorityBadge={getPriorityBadge}
        />
      )}

      {/* 4. Raise Service Request / Incident Modal */}
      {isCreateModalOpen && (
        <CreateRequestModal
          projects={projects}
          customerOrgs={customerOrgs}
          members={members}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(payload) => createRequestMutation.mutate(payload)}
          loading={createRequestMutation.isPending}
        />
      )}

      {/* 5. Customer Organization Management Modal */}
      {isCustomerOrgModalOpen && (
        <ManageCustomerOrgsModal
          customerOrgs={customerOrgs}
          workspaceId={workspaceId}
          onClose={() => setIsCustomerOrgModalOpen(false)}
          onCreated={() => refetchCustomers()}
        />
      )}

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};

// ==========================================
// Sub-Component: Interactive Ticket Details Drawer
// ==========================================
const TicketDetailsDrawer = ({
  ticket,
  members = [],
  customerOrgs = [],
  onClose,
  onUpdate,
  onDelete,
  onOpenTask,
  getTypeBadge,
  getPriorityBadge,
}) => {
  const [resolutionNote, setResolutionNote] = useState(ticket.resolution_note || '');
  const [isEditingNote, setIsEditingNote] = useState(false);

  const isClosed = ['RESOLVED', 'CLOSED'].includes(ticket.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl h-full bg-white shadow-2xl border-l border-neutral-200 flex flex-col justify-between animate-in slide-in-from-right duration-200 text-xs text-neutral-800">
        {/* Drawer Header */}
        <div className="p-5 border-b border-neutral-200 space-y-3 bg-neutral-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                {ticket.task_key || 'KSM'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTypeBadge(ticket.request_type)}`}>
                {ticket.request_type}
              </span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] border ${getPriorityBadge(ticket.priority)}`}>
                {ticket.priority}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {ticket.task_id && (
                <button
                  onClick={() => onOpenTask(ticket.task_id)}
                  className="px-2.5 py-1 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 font-bold text-[11px] text-blue-700 flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <span>Open Task</span>
                  <ExternalLink className="size-3" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <h2 className="text-base font-bold text-neutral-900 leading-snug">
            {ticket.summary}
          </h2>

          {/* SLA Status Banner */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            isClosed
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : ticket.isSlaBreached
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <div className="flex items-center gap-2">
              {isClosed ? (
                <CheckCircle2 className="size-4 text-emerald-600" />
              ) : ticket.isSlaBreached ? (
                <AlertTriangle className="size-4 text-rose-600 animate-bounce" />
              ) : (
                <Clock className="size-4 text-blue-600" />
              )}
              <div>
                <p className="font-bold text-[11px]">
                  {isClosed
                    ? 'SLA Target Successfully Met'
                    : ticket.isSlaBreached
                    ? 'Service Level Agreement Breached'
                    : 'SLA Countdown Active'}
                </p>
                <p className="text-[10px] opacity-80">
                  {isClosed
                    ? `Resolved at ${new Date(ticket.resolved_at || ticket.updated_at).toLocaleString()}`
                    : ticket.isSlaBreached
                    ? 'Immediate escalation required under P0/P1 runbook'
                    : ticket.slaRemainingMinutes !== null
                    ? `${ticket.slaRemainingMinutes} minutes remaining before breach`
                    : 'Standard turnaround target'}
                </p>
              </div>
            </div>

            <span className="font-mono font-bold text-xs">
              {isClosed ? 'MET' : ticket.isSlaBreached ? 'BREACHED' : `${Math.max(0, Math.round((ticket.slaRemainingMinutes || 0) / 60))}h`}
            </span>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Progression Bar */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Workflow Status Progression
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'OPEN', label: '1. Open Triage' },
                { id: 'IN_PROGRESS', label: '2. In Progress' },
                { id: 'WAITING_FOR_CUSTOMER', label: '3. Waiting Client' },
                { id: 'PENDING_APPROVAL', label: '4. Pending Approval' },
                { id: 'RESOLVED', label: '5. Resolved' },
                { id: 'CLOSED', label: '6. Closed' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => onUpdate({ status: s.id })}
                  className={`py-1.5 px-2 rounded-xl text-[10.5px] font-bold border transition text-center cursor-pointer ${
                    ticket.status === s.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              Description & Reproduction Steps
            </label>
            <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-800 leading-relaxed font-normal whitespace-pre-wrap">
              {ticket.description || 'No description provided for this service request.'}
            </div>
          </div>

          {/* Two-Column Metadata (Requester & Agent) */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50/40">
            {/* Requester Information */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">Customer Requester</span>
              <p className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                <User className="size-3 text-neutral-500" />
                {ticket.customer_name || 'Customer'}
              </p>
              {ticket.customer_email && (
                <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                  <Mail className="size-3 text-neutral-400" />
                  {ticket.customer_email}
                </p>
              )}
              {ticket.customer_org_name && (
                <p className="text-[11px] text-purple-700 font-semibold flex items-center gap-1.5 pt-0.5">
                  <Building2 className="size-3 text-purple-600" />
                  {ticket.customer_org_name}
                </p>
              )}
            </div>

            {/* Assigned Agent Selector */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-neutral-400 block">Assigned Support Agent</span>
              <select
                value={ticket.assigned_agent_id || ''}
                onChange={(e) => onUpdate({ assignedAgentId: e.target.value || null })}
                className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[11px] font-semibold text-neutral-800 focus:outline-hidden"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.id || m.userId} value={m.userId || m.id}>
                    {m.name || m.email} ({m.role || 'Member'})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-neutral-400 pt-0.5">
                Agent gets notified upon assignment.
              </p>
            </div>
          </div>

          {/* Resolution Note Section */}
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                Resolution Summary & Root Cause Note
              </label>
              {!isEditingNote && (
                <button
                  onClick={() => setIsEditingNote(true)}
                  className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Edit Note
                </button>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Document the resolution, root cause, patch link, or customer instructions..."
                  className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-xs font-normal focus:border-blue-500 focus:outline-hidden"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setIsEditingNote(false)}
                    className="px-3 py-1 rounded-lg border border-neutral-200 font-semibold text-neutral-600 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onUpdate({ resolutionNote });
                      setIsEditingNote(false);
                      toast.success('Resolution note saved.');
                    }}
                    className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 text-neutral-700 text-xs italic">
                {ticket.resolution_note || 'No resolution note recorded yet. Add notes before closing ticket.'}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/60 flex items-center justify-between">
          <button
            onClick={onDelete}
            className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Request</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-neutral-300 font-bold text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// Sub-Component: Create Request Modal
// ==========================================
const CreateRequestModal = ({
  projects = [],
  customerOrgs = [],
  members = [],
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [requestType, setRequestType] = useState('SERVICE_REQUEST');
  const [priority, setPriority] = useState('MEDIUM');
  const [projectId, setProjectId] = useState(projects[0]?.$id || projects[0]?.id || '');
  const [customerOrgId, setCustomerOrgId] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [slaHours, setSlaHours] = useState('24');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!summary.trim()) {
      toast.error('Please enter a request summary.');
      return;
    }
    onSubmit({
      summary,
      description,
      requestType,
      priority,
      projectId: projectId || projects[0]?.$id || projects[0]?.id || null,
      customerOrgId: customerOrgId || null,
      assignedAgentId: assignedAgentId || null,
      customerName: customerName.trim() || undefined,
      customerEmail: customerEmail.trim() || undefined,
      slaHours: parseInt(slaHours, 10) || 24,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <LifeBuoy className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Raise Service Request / Incident</h3>
              <p className="text-[11px] text-neutral-500">Log customer issues, hardware requests, or outages.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Request Type Selector */}
          <div>
            <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
              Request Classification
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'SERVICE_REQUEST', label: 'Service Request' },
                { id: 'INCIDENT', label: 'Incident (Outage)' },
                { id: 'CHANGE', label: 'Change Request' },
                { id: 'PROBLEM', label: 'Problem Record' },
                { id: 'QUESTION', label: 'General Question' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setRequestType(t.id)}
                  className={`p-2 rounded-xl border text-[11px] font-bold text-left transition cursor-pointer ${
                    requestType === t.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div>
            <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
              Summary / Title *
            </label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Production Database High CPU Alert / Request New Laptop"
              className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Description */}
          <div>
            <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
              Description & Reproduction Details
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of the issue, affected users, error logs..."
              className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-xs font-medium focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Priority & SLA Hours */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
                Urgency Priority
              </label>
              <select
                value={priority}
                onChange={(e) => {
                  const p = e.target.value;
                  setPriority(p);
                  if (p === 'CRITICAL') setSlaHours('2');
                  else if (p === 'HIGH') setSlaHours('8');
                  else if (p === 'MEDIUM') setSlaHours('24');
                  else setSlaHours('72');
                }}
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="CRITICAL">P0 - Critical (2h SLA)</option>
                <option value="HIGH">P1 - High (8h SLA)</option>
                <option value="MEDIUM">P2 - Medium (24h SLA)</option>
                <option value="LOW">P3 - Low (72h SLA)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
                Target SLA Resolution (Hours)
              </label>
              <input
                type="number"
                value={slaHours}
                onChange={(e) => setSlaHours(e.target.value)}
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold focus:outline-hidden"
              />
            </div>
          </div>

          {/* Customer / Requester Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
                Customer Name (Optional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
                Customer Email (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="e.g. client@company.com"
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs font-semibold focus:outline-hidden"
              />
            </div>
          </div>

          {/* Project & Organization */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
                Linked Service Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                {projects.map((p) => {
                  const id = p.$id || p.id;
                  return (
                    <option key={id} value={id}>
                      {p.key || 'PROJ'} • {p.name}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
                Customer Organization
              </label>
              <select
                value={customerOrgId}
                onChange={(e) => setCustomerOrgId(e.target.value)}
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="">Direct Client (Internal)</option>
                {customerOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Agent */}
          <div>
            <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
              Assign to Support Agent
            </label>
            <select
              value={assignedAgentId}
              onChange={(e) => setAssignedAgentId(e.target.value)}
              className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="">Assign to Me (Default)</option>
              {members.map((m) => (
                <option key={m.id || m.userId} value={m.userId || m.id}>
                  {m.name || m.email} ({m.role || 'Member'})
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-4 rounded-xl border border-neutral-300 font-semibold text-neutral-700 hover:bg-neutral-50 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !summary.trim()}
              className="h-9 px-5 rounded-xl bg-blue-600 font-bold text-white shadow-2xs hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Raise Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// Sub-Component: Manage Customer Orgs Modal
// ==========================================
const ManageCustomerOrgsModal = ({ customerOrgs = [], workspaceId, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [domainStr, setDomainStr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const domains = domainStr
      .split(',')
      .map((d) => d.trim().replace('@', ''))
      .filter(Boolean);

    try {
      setLoading(true);
      await serviceManagementApi.createCustomerOrg(workspaceId, { name: name.trim(), domains });
      toast.success('Customer organization created!');
      setName('');
      setDomainStr('');
      onCreated();
    } catch (e) {
      toast.error('Failed to create customer organization.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, orgName) => {
    try {
      await serviceManagementApi.deleteCustomerOrg(workspaceId, id);
      toast.success(`Removed ${orgName}`);
      onCreated();
    } catch (e) {
      toast.error('Failed to remove organization.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95 duration-150 text-xs text-neutral-800">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Building2 className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Customer Organizations Directory</h3>
              <p className="text-[11px] text-neutral-500">Manage client accounts and associate email domains.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700">
            <X className="size-4" />
          </button>
        </div>

        {/* Existing Orgs List */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {customerOrgs.length === 0 ? (
            <p className="text-neutral-400 text-center py-4 text-[11px]">No customer organizations created yet.</p>
          ) : (
            customerOrgs.map((org) => (
              <div key={org.id} className="p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 flex items-center justify-between">
                <div>
                  <p className="font-bold text-neutral-900 text-xs">{org.name}</p>
                  <p className="text-[10px] text-neutral-500">
                    Domains: {Array.isArray(org.domains) && org.domains.length > 0 ? org.domains.join(', ') : 'All domains'}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(org.id, org.name)}
                  className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Remove organization"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add New Org Form */}
        <form onSubmit={handleCreate} className="space-y-3 pt-3 border-t border-neutral-100">
          <p className="font-bold text-[11px] text-neutral-900 uppercase tracking-wider">
            Add New Client Organization
          </p>
          <div>
            <label className="font-bold text-neutral-700 block text-[10px] uppercase mb-1">
              Organization Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Global Enterprise / FinTech Labs"
              className="h-8.5 w-full rounded-xl border border-neutral-200 bg-white px-3 font-semibold focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 block text-[10px] uppercase mb-1">
              Email Domains (Comma-separated)
            </label>
            <input
              type="text"
              value={domainStr}
              onChange={(e) => setDomainStr(e.target.value)}
              placeholder="e.g. acme.com, acmecorp.io"
              className="h-8.5 w-full rounded-xl border border-neutral-200 bg-white px-3 font-medium focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="h-8.5 px-3 rounded-xl border border-neutral-300 font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Done
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="h-8.5 px-4 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceManagementView;
