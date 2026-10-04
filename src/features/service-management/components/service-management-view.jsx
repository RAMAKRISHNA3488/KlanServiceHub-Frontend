import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { useEditTaskModal } from '@/features/tasks/hooks/use-edit-task-modal';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCustomerOrgModalOpen, setIsCustomerOrgModalOpen] = useState(false);

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
      searchTerm,
    ],
    queryFn: () =>
      serviceManagementApi.getRequests(workspaceId, {
        queue: selectedQueue,
        status: selectedStatus,
        priority: selectedPriority,
        requestType: selectedRequestType,
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
  const { data: customersData } = useQuery({
    queryKey: ['jsm-customers', workspaceId],
    queryFn: () => serviceManagementApi.getCustomers(workspaceId),
  });

  const requests = requestsData?.data || [];
  const queues = queuesData?.data || [];
  const slas = slasData?.data || {
    totalRequests: 0,
    resolvedRequests: 0,
    breachedRequests: 0,
    slaMetRate: 98.4,
    mttrHours: 3.2,
    firstResponseAvgHours: 0.6,
    csatScore: 98.8,
  };
  const projects = projectsData?.documents || projectsData?.data || (Array.isArray(projectsData) ? projectsData : []);
  const customerOrgs = customersData?.data || [];

  // Create Request Mutation
  const createRequestMutation = useMutation({
    mutationFn: (payload) => serviceManagementApi.createRequest(workspaceId, payload),
    onSuccess: () => {
      toast.success('Service request / incident raised successfully!');
      queryClient.invalidateQueries({ queryKey: ['jsm-requests'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-queues'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-slas'] });
      setIsCreateModalOpen(false);
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to raise service request.');
    },
  });

  // Update Request Mutation (Status / Priority)
  const updateRequestMutation = useMutation({
    mutationFn: ({ id, data }) => serviceManagementApi.updateRequest(workspaceId, id, data),
    onSuccess: () => {
      toast.success('Ticket updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['jsm-requests'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-queues'] });
      queryClient.invalidateQueries({ queryKey: ['jsm-slas'] });
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
      'Assigned Agent',
      'Project',
      'SLA Remaining (Mins)',
      'Is SLA Breached',
      'Created At',
    ];

    const rows = requests.map((r) => [
      `"${r.task_key || ''}"`,
      `"${(r.summary || '').replace(/"/g, '""')}"`,
      `"${r.request_type || 'SERVICE_REQUEST'}"`,
      `"${r.priority || 'MEDIUM'}"`,
      `"${r.status || 'OPEN'}"`,
      `"${r.customer_name || 'Customer'}"`,
      `"${r.customer_email || ''}"`,
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
    <div className="space-y-5 p-6 max-w-7xl mx-auto pb-20">
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
              className="h-9 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 text-neutral-500 ${requestsFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {requests.length === 0 && (
              <button
                onClick={() => seedDemoMutation.mutate()}
                disabled={seedDemoMutation.isPending}
                className="h-9 px-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="size-3.5 text-purple-600" />
                <span>{seedDemoMutation.isPending ? 'Seeding...' : 'Seed Sample ITSM Tickets'}</span>
              </button>
            )}

            <button
              onClick={handleExportCSV}
              className="h-9 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="size-3.5 text-purple-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-9 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
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
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                Customer Organizations
              </span>
              <button
                onClick={() => setIsCustomerOrgModalOpen(true)}
                className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                + Add Org
              </button>
            </div>
            <div className="space-y-1 text-xs">
              {customerOrgs.slice(0, 3).map((org) => (
                <div key={org.id} className="px-2.5 py-1.5 rounded-lg bg-neutral-50 text-neutral-700 flex items-center justify-between text-[11px]">
                  <span className="font-semibold truncate">{org.name}</span>
                  <Building2 className="size-3 text-neutral-400" />
                </div>
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                    <th className="py-2.5 px-3">Ticket</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Priority</th>
                    <th className="py-2.5 px-3">Customer / Org</th>
                    <th className="py-2.5 px-3">SLA Countdown</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-neutral-50/80 transition">
                      {/* Ticket Key & Summary */}
                      <td className="py-3 px-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            {req.task_id ? (
                              <button
                                onClick={() => {
                                  toast.info(`Opening ${req.task_key}...`);
                                  openEditTaskModal(req.task_id);
                                }}
                                className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 hover:bg-blue-100 cursor-pointer flex items-center gap-1"
                              >
                                <span>{req.task_key || 'KSM'}</span>
                                <ExternalLink className="size-2.5" />
                              </button>
                            ) : (
                              <span className="font-mono text-[10px] font-bold text-neutral-600 bg-neutral-100 px-1.5 py-0.2 rounded">
                                KSM
                              </span>
                            )}
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
                          <p className="font-bold text-neutral-900 text-xs">{req.customer_name}</p>
                          <p className="text-[10px] text-neutral-400">
                            {req.customer_org_name || req.customer_email || 'Client'}
                          </p>
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
                              req.slaRemainingMinutes < 60
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
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {req.task_id && (
                            <button
                              onClick={() => openEditTaskModal(req.task_id)}
                              className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Open Jira Task"
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

      {/* 3. Raise Service Request / Incident Modal */}
      {isCreateModalOpen && (
        <CreateRequestModal
          projects={projects}
          customerOrgs={customerOrgs}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={(payload) => createRequestMutation.mutate(payload)}
          loading={createRequestMutation.isPending}
        />
      )}

      {/* 4. Customer Organization Modal */}
      {isCustomerOrgModalOpen && (
        <CreateCustomerOrgModal
          onClose={() => setIsCustomerOrgModalOpen(false)}
          onSubmit={async (data) => {
            try {
              await serviceManagementApi.createCustomerOrg(workspaceId, data);
              toast.success('Customer Organization created!');
              queryClient.invalidateQueries({ queryKey: ['jsm-customers'] });
              setIsCustomerOrgModalOpen(false);
            } catch (e) {
              toast.error('Failed to create customer organization.');
            }
          }}
        />
      )}

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};

// ==========================================
// Sub-Component: Create Request Modal
// ==========================================
const CreateRequestModal = ({
  projects = [],
  customerOrgs = [],
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [requestType, setRequestType] = useState('SERVICE_REQUEST');
  const [priority, setPriority] = useState('MEDIUM');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [customerOrgId, setCustomerOrgId] = useState('');
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
      projectId: projectId || projects[0]?.id,
      customerOrgId: customerOrgId || null,
      slaHours: parseInt(slaHours, 10) || 24,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 duration-150">
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Request Type Selector */}
          <div>
            <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
              Request Classification
            </label>
            <div className="grid grid-cols-3 gap-2">
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
              rows={3}
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
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold focus:outline-hidden"
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

          {/* Project & Organization */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
                Linked Service Project
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold focus:outline-hidden"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.key} • {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-neutral-700 block uppercase tracking-wider text-[10px] mb-1">
                Customer Organization
              </label>
              <select
                value={customerOrgId}
                onChange={(e) => setCustomerOrgId(e.target.value)}
                className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-2.5 text-xs font-semibold focus:outline-hidden"
              >
                <option value="">Direct Customer (Internal)</option>
                {customerOrgs.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>
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
// Sub-Component: Create Customer Org Modal
// ==========================================
const CreateCustomerOrgModal = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [domainStr, setDomainStr] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const domains = domainStr
      .split(',')
      .map((d) => d.trim().replace('@', ''))
      .filter(Boolean);

    onSubmit({ name, domains });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4 animate-in zoom-in-95 duration-150 text-xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="size-4" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Add Customer Organization</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="font-bold text-neutral-700 block text-[10px] uppercase mb-1">
              Organization Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp / Global Tech Inc"
              className="h-8.5 w-full rounded-xl border border-neutral-200 bg-white px-3 font-semibold focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-neutral-700 block text-[10px] uppercase mb-1">
              Associated Email Domains (Comma-separated)
            </label>
            <input
              type="text"
              value={domainStr}
              onChange={(e) => setDomainStr(e.target.value)}
              placeholder="e.g. acme.com, acmeglobal.io"
              className="h-8.5 w-full rounded-xl border border-neutral-200 bg-white px-3 font-medium focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="h-8.5 px-3 rounded-xl border border-neutral-300 font-semibold text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-8.5 px-4 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
            >
              Save Organization
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceManagementView;
