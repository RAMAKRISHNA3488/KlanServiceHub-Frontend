import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Rocket, Clock, ShieldAlert, Activity, RefreshCw, Plus, 
  GitCommit, GitBranch, ArrowUpRight, RotateCcw, Search, 
  Filter, CheckCircle2, XCircle, AlertTriangle, PlayCircle, 
  Zap, Info, ExternalLink, ChevronRight, X, Sparkles, TrendingUp
} from 'lucide-react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// DORA Badge Styling Helper
const DORA_TIER_CONFIG = {
  ELITE: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'Elite Performer', dot: 'bg-emerald-500' },
  HIGH: { badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'High Performer', dot: 'bg-blue-500' },
  MEDIUM: { badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'Medium Performer', dot: 'bg-amber-500' },
  LOW: { badge: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Low Performer', dot: 'bg-rose-500' },
};

const STATUS_CONFIG = {
  SUCCESS: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, text: 'Success' },
  FAILED: { badge: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle, text: 'Failed' },
  RUNNING: { badge: 'bg-blue-50 text-blue-700 border-blue-200', icon: PlayCircle, text: 'Running' },
  ROLLED_BACK: { badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: RotateCcw, text: 'Rolled Back' },
};

const ENV_CONFIG = {
  PRODUCTION: 'bg-purple-50 text-purple-700 border-purple-200 font-bold',
  STAGING: 'bg-blue-50 text-blue-700 border-blue-200 font-medium',
  QA: 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
  DEVELOPMENT: 'bg-neutral-100 text-neutral-700 border-neutral-200 font-medium',
};

export const DeploymentsView = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnv, setFilterEnv] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterService, setFilterService] = useState('ALL');

  // Modals state
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [rollbackItem, setRollbackItem] = useState(null);
  const [selectedDeployment, setSelectedDeployment] = useState(null);

  // 1. Fetch DORA 4-Key Metrics
  const { data: doraRes, isFetching: isDoraFetching, refetch: refetchDora } = useQuery({
    queryKey: ['dora-metrics', workspaceId],
    queryFn: () => apiFetch(`/api/deployments/dora/${workspaceId}`),
    refetchInterval: 15000,
  });

  // 2. Fetch Workspace Deployments Stream
  const { data: deploymentsRes, isLoading, isFetching: isDepsFetching, refetch: refetchDeployments } = useQuery({
    queryKey: ['deployments-stream', workspaceId],
    queryFn: () => apiFetch(`/api/deployments/workspace/${workspaceId}`),
    refetchInterval: 15000,
  });

  const metrics = doraRes?.data || {
    deploymentFrequency: '0 deploys / week',
    deploymentFrequencyRating: 'LOW',
    leadTimeForChanges: 'N/A',
    leadTimeRating: 'LOW',
    changeFailureRate: '0.0%',
    changeFailureRating: 'ELITE',
    meanTimeToRecovery: 'Zero Incidents',
    meanTimeToRecoveryRating: 'ELITE',
    doraRating: 'MEDIUM',
    totalDeployments: 0,
    prodDeployments: 0,
    successRate: 100,
  };

  const deployments = deploymentsRes?.data || [];

  // Unique services list for filter dropdown
  const uniqueServices = useMemo(() => {
    const set = new Set(deployments.map(d => d.service_name || 'Core Application'));
    return Array.from(set);
  }, [deployments]);

  // Filtered deployment feed
  const filteredDeployments = useMemo(() => {
    return deployments.filter(d => {
      const matchSearch = searchTerm === '' ||
        (d.service_name && d.service_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.commit_hash && d.commit_hash.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.commit_message && d.commit_message.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.branch && d.branch.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (d.deployer_name && d.deployer_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchEnv = filterEnv === 'ALL' || d.environment === filterEnv;
      const matchStatus = filterStatus === 'ALL' || d.status === filterStatus;
      const matchService = filterService === 'ALL' || d.service_name === filterService;

      return matchSearch && matchEnv && matchStatus && matchService;
    });
  }, [deployments, searchTerm, filterEnv, filterStatus, filterService]);

  // Seed Sample Telemetry Mutation
  const seedMutation = useMutation({
    mutationFn: () => apiFetch(`/api/deployments/workspace/${workspaceId}/seed-sample`, { method: 'POST' }),
    onSuccess: (data) => {
      toast.success(data?.message || 'Sample 14-day deployment telemetry seeded!');
      queryClient.invalidateQueries({ queryKey: ['dora-metrics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deployments-stream', workspaceId] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to seed deployments.'),
  });

  // Rollback mutation
  const rollbackMutation = useMutation({
    mutationFn: (deploymentId) => apiFetch(`/api/deployments/workspace/${workspaceId}/${deploymentId}/rollback`, {
      method: 'POST'
    }),
    onSuccess: () => {
      toast.success('Rollback deployment initiated successfully');
      setRollbackItem(null);
      queryClient.invalidateQueries({ queryKey: ['dora-metrics', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['deployments-stream', workspaceId] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to initiate rollback'),
  });

  const doraCfg = DORA_TIER_CONFIG[metrics.doraRating] || DORA_TIER_CONFIG.ELITE;

  return (
    <div className="flex flex-col gap-y-4 p-5 min-h-[calc(100vh-4rem)] bg-neutral-50/50 text-[11px]">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3.5 bg-white p-4 rounded-xl shadow-xs border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 shadow-xs">
              <Rocket className="size-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                Deployments & DORA Engineering Metrics
                <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border', doraCfg.badge)}>
                  <span className={cn('size-1.5 rounded-full animate-pulse', doraCfg.dot)} />
                  {doraCfg.text.toUpperCase()}
                </span>
              </h1>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                Google Cloud DORA 4-Key performance indicators, continuous delivery streams, and automated rollback tracking.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchDora();
              refetchDeployments();
            }}
            disabled={isDoraFetching || isDepsFetching}
            className="text-[11px] h-8 gap-1.5 font-medium text-neutral-600 hover:text-neutral-900"
          >
            <RefreshCw className={cn('size-3', (isDoraFetching || isDepsFetching) && 'animate-spin text-rose-600')} />
            Sync Metrics
          </Button>

          {deployments.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="text-[11px] h-8 gap-1.5 font-medium bg-rose-50/60 border-rose-200 text-rose-700 hover:bg-rose-100"
            >
              <Zap className="size-3 text-rose-600" />
              {seedMutation.isPending ? 'Seeding...' : 'Load Sample 14-Day History'}
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsDeployModalOpen(true)}
            className="text-[11px] h-8 gap-1.5 font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
          >
            <Plus className="size-3" />
            Trigger Deployment
          </Button>
        </div>
      </div>

      {/* DORA 4-Key Metrics Benchmark Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* 1. Deployment Frequency */}
        <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Deployment Frequency
            </span>
            <Rocket className="size-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-neutral-900">{metrics.deploymentFrequency}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[10px]">
            <span className="text-neutral-400">Target: &gt; 1 / day</span>
            <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border', DORA_TIER_CONFIG[metrics.deploymentFrequencyRating]?.badge || DORA_TIER_CONFIG.ELITE.badge)}>
              {metrics.deploymentFrequencyRating}
            </span>
          </div>
        </div>

        {/* 2. Lead Time for Changes */}
        <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Lead Time for Changes
            </span>
            <Clock className="size-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-neutral-900">{metrics.leadTimeForChanges}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[10px]">
            <span className="text-neutral-400">Target: &lt; 1 day</span>
            <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border', DORA_TIER_CONFIG[metrics.leadTimeRating]?.badge || DORA_TIER_CONFIG.ELITE.badge)}>
              {metrics.leadTimeRating}
            </span>
          </div>
        </div>

        {/* 3. Change Failure Rate */}
        <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Change Failure Rate
            </span>
            <ShieldAlert className="size-3.5 text-violet-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-neutral-900">{metrics.changeFailureRate}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[10px]">
            <span className="text-neutral-400">Target: &lt; 15%</span>
            <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border', DORA_TIER_CONFIG[metrics.changeFailureRating]?.badge || DORA_TIER_CONFIG.ELITE.badge)}>
              {metrics.changeFailureRating}
            </span>
          </div>
        </div>

        {/* 4. Mean Time to Recovery (MTTR) */}
        <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Mean Time to Restore
            </span>
            <Activity className="size-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-neutral-900">{metrics.meanTimeToRecovery}</span>
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 text-[10px]">
            <span className="text-neutral-400">Target: &lt; 1 hour</span>
            <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border', DORA_TIER_CONFIG[metrics.meanTimeToRecoveryRating]?.badge || DORA_TIER_CONFIG.ELITE.badge)}>
              {metrics.meanTimeToRecoveryRating}
            </span>
          </div>
        </div>
      </div>

      {/* Deployment Velocity Bar & KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <span className="text-[10px] text-neutral-500 font-semibold uppercase">Total Releases</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-neutral-900">{metrics.totalDeployments}</span>
            <span className="text-[10px] text-neutral-400 font-medium">recorded</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <span className="text-[10px] text-neutral-500 font-semibold uppercase">Production Deploys</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-purple-700">{metrics.prodDeployments || 0}</span>
            <span className="text-[10px] text-purple-600 font-medium">live runs</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <span className="text-[10px] text-neutral-500 font-semibold uppercase">Deployment Success Rate</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-base font-bold text-emerald-600">{metrics.successRate}%</span>
            <span className="text-[10px] text-emerald-700 font-medium">reliability</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <span className="text-[10px] text-neutral-500 font-semibold uppercase">Failed / Rollbacks</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className={cn('text-base font-bold', (metrics.failedDeployments || 0) > 0 ? 'text-rose-600' : 'text-neutral-900')}>
              {metrics.failedDeployments || 0}
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">incidents</span>
          </div>
        </div>
      </div>

      {/* Main Continuous Deployment Feed */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs flex flex-col gap-3">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="size-3 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search commit hash, service, branch, or deployer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-[11px] rounded-lg"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <select
              value={filterEnv}
              onChange={(e) => setFilterEnv(e.target.value)}
              className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
            >
              <option value="ALL">All Environments</option>
              <option value="PRODUCTION">Production</option>
              <option value="STAGING">Staging</option>
              <option value="QA">QA</option>
              <option value="DEVELOPMENT">Development</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="RUNNING">Running</option>
              <option value="ROLLED_BACK">Rolled Back</option>
            </select>

            {uniqueServices.length > 0 && (
              <select
                value={filterService}
                onChange={(e) => setFilterService(e.target.value)}
                className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="ALL">All Services</option>
                {uniqueServices.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Deployments Stream Table */}
        {filteredDeployments.length === 0 ? (
          <div className="py-10 text-center text-[11px] text-neutral-500">
            {deployments.length === 0 ? (
              <div className="flex flex-col items-center justify-center">
                <Rocket className="size-6 text-neutral-400 mb-2" />
                <p className="font-bold text-neutral-800">No Deployment Activity Recorded</p>
                <p className="text-[10px] text-neutral-400 mt-0.5 mb-3">
                  Log your first release or load the realistic 14-day delivery blueprint.
                </p>
                <Button
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] h-7 px-3 font-semibold gap-1.5"
                >
                  <Zap className="size-3" />
                  {seedMutation.isPending ? 'Seeding...' : 'Load Sample 14-Day Blueprint'}
                </Button>
              </div>
            ) : (
              'No deployments matched your current search filters.'
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold text-[10px]">
                <tr>
                  <th className="py-2 px-3">Service & Branch</th>
                  <th className="py-2 px-2.5">Environment</th>
                  <th className="py-2 px-2.5">Commit Details</th>
                  <th className="py-2 px-2.5">Status</th>
                  <th className="py-2 px-2.5">Duration</th>
                  <th className="py-2 px-2.5">Deployed By</th>
                  <th className="py-2 px-2.5">Timestamp</th>
                  <th className="py-2 px-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredDeployments.map((d) => {
                  const statusCfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.SUCCESS;
                  const StatusIcon = statusCfg.icon;
                  const envStyle = ENV_CONFIG[d.environment] || ENV_CONFIG.PRODUCTION;

                  return (
                    <tr key={d.id} className="hover:bg-neutral-50/80 transition">
                      {/* Service & Branch */}
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-neutral-900 truncate max-w-[180px]">
                          {d.service_name || 'Core Application'}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-neutral-400 font-mono mt-0.5">
                          <GitBranch className="size-2.5 text-neutral-500 shrink-0" />
                          <span className="truncate">{d.branch || 'main'}</span>
                        </div>
                      </td>

                      {/* Environment */}
                      <td className="py-2.5 px-2.5">
                        <span className={cn('px-1.5 py-0.5 rounded text-[9px] border', envStyle)}>
                          {d.environment}
                        </span>
                      </td>

                      {/* Commit details */}
                      <td className="py-2.5 px-2.5 max-w-[220px]">
                        <div className="flex items-center gap-1 font-mono text-[9px] text-neutral-600 font-bold">
                          <GitCommit className="size-2.5 text-neutral-400 shrink-0" />
                          <span>{d.commit_hash || '7f8a3b1'}</span>
                        </div>
                        <p className="text-[10px] text-neutral-600 truncate mt-0.5" title={d.commit_message}>
                          {d.commit_message || 'Feature release deployment'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-2.5">
                        <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border', statusCfg.badge)}>
                          <StatusIcon className={cn('size-2.5 shrink-0', d.status === 'RUNNING' && 'animate-spin')} />
                          {statusCfg.text}
                        </span>
                      </td>

                      {/* Duration */}
                      <td className="py-2.5 px-2.5 font-mono text-[10px] text-neutral-600">
                        {d.duration_seconds ? `${Math.floor(d.duration_seconds / 60)}m ${d.duration_seconds % 60}s` : '1m 45s'}
                      </td>

                      {/* Deployed By */}
                      <td className="py-2.5 px-2.5">
                        <span className="font-semibold text-neutral-800">{d.deployer_name || 'Engineer'}</span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-2.5 px-2.5 text-[10px] text-neutral-500 whitespace-nowrap">
                        {d.started_at ? new Date(d.started_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {d.status !== 'ROLLED_BACK' && d.environment === 'PRODUCTION' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRollbackItem(d)}
                              className="h-6 px-1.5 text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-medium gap-1"
                              title="Rollback deployment"
                            >
                              <RotateCcw className="size-2.5" />
                              Rollback
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedDeployment(d)}
                            className="h-6 px-1.5 text-[10px] text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                          >
                            Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: TRIGGER NEW DEPLOYMENT */}
      {isDeployModalOpen && (
        <CreateDeploymentModal
          isOpen={isDeployModalOpen}
          onClose={() => setIsDeployModalOpen(false)}
          workspaceId={workspaceId}
          onCreated={() => {
            setIsDeployModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['dora-metrics', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['deployments-stream', workspaceId] });
          }}
        />
      )}

      {/* MODAL 2: CONFIRM ROLLBACK */}
      {rollbackItem && (
        <RollbackConfirmationModal
          deployment={rollbackItem}
          onClose={() => setRollbackItem(null)}
          onConfirm={() => rollbackMutation.mutate(rollbackItem.id)}
          isPending={rollbackMutation.isPending}
        />
      )}

      {/* DRAWER 3: DEPLOYMENT DETAILS */}
      {selectedDeployment && (
        <DeploymentDetailsDrawer
          deployment={selectedDeployment}
          onClose={() => setSelectedDeployment(null)}
          onRollback={() => {
            setRollbackItem(selectedDeployment);
            setSelectedDeployment(null);
          }}
        />
      )}
    </div>
  );
};

// Modal: Trigger / Record New Deployment
const CreateDeploymentModal = ({ isOpen, onClose, workspaceId, onCreated }) => {
  const [serviceName, setServiceName] = useState('Core Application API');
  const [environment, setEnvironment] = useState('PRODUCTION');
  const [branch, setBranch] = useState('main');
  const [commitHash, setCommitHash] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [status, setStatus] = useState('SUCCESS');
  const [durationSeconds, setDurationSeconds] = useState('110');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceName.trim()) return toast.error('Service name is required');

    setIsSubmitting(true);
    try {
      await apiFetch(`/api/deployments/workspace/${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({
          service_name: serviceName.trim(),
          environment,
          branch: branch.trim() || 'main',
          commit_hash: commitHash.trim() || 'a1b2c3d',
          commit_message: commitMessage.trim() || 'Production release deployment',
          status,
          duration_seconds: parseInt(durationSeconds) || 120
        })
      });
      toast.success('Deployment logged and executed successfully');
      onCreated();
    } catch (err) {
      toast.error(err?.message || 'Failed to trigger deployment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-neutral-200 text-[11px]">
        <div className="flex items-center justify-between pb-2.5 border-b mb-3">
          <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Rocket className="size-3.5 text-rose-600" /> Trigger / Log Deployment
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-neutral-700">
            <X className="size-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Service Name</label>
            <Input
              required
              placeholder="e.g. Core Application API, Auth Service"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              className="text-[11px] h-8 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Target Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="PRODUCTION">Production</option>
                <option value="STAGING">Staging</option>
                <option value="QA">QA</option>
                <option value="DEVELOPMENT">Development</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="RUNNING">Running</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Git Branch</label>
              <Input
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="text-[11px] h-8 rounded-lg font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Commit Hash</label>
              <Input
                placeholder="7f8a3b1"
                value={commitHash}
                onChange={(e) => setCommitHash(e.target.value)}
                className="text-[11px] h-8 rounded-lg font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Commit Message</label>
            <Input
              placeholder="e.g. Fix payment webhook idempotency"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="text-[11px] h-8 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Duration (Seconds)</label>
            <Input
              type="number"
              placeholder="120"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value)}
              className="text-[11px] h-8 rounded-lg font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2.5 border-t mt-1">
            <Button variant="outline" type="button" onClick={onClose} className="text-[10px] h-7 px-2.5">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] h-7 px-3 font-semibold">
              {isSubmitting ? 'Deploying...' : 'Deploy Release'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal: Confirm Rollback
const RollbackConfirmationModal = ({ deployment, onClose, onConfirm, isPending }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-neutral-200 text-[11px]">
        <div className="flex items-center gap-2 text-amber-600 mb-2">
          <AlertTriangle className="size-4" />
          <h3 className="text-xs font-bold text-neutral-900">Initiate Service Rollback</h3>
        </div>
        <p className="text-[10px] text-neutral-500 mb-3">
          Are you sure you want to rollback deployment <span className="font-mono font-bold text-neutral-800">#{deployment.id.slice(0, 8)}</span> for{' '}
          <span className="font-bold text-neutral-800">{deployment.service_name}</span> on <span className="font-bold text-purple-700">{deployment.environment}</span>?
        </p>

        <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1 mb-3 text-[10px]">
          <div className="flex justify-between">
            <span className="text-neutral-400">Current Commit:</span>
            <span className="font-mono font-bold text-neutral-800">{deployment.commit_hash}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Branch:</span>
            <span className="font-mono text-neutral-800">{deployment.branch}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Impact:</span>
            <span className="text-amber-700 font-bold">Revert to prior stable release</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={isPending} className="text-[10px] h-7 px-2.5">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] h-7 px-3 font-semibold gap-1"
          >
            <RotateCcw className="size-3" />
            {isPending ? 'Rolling back...' : 'Confirm Rollback'}
          </Button>
        </div>
      </div>
    </div>
  );
};

// Drawer: Deployment Details Inspector
const DeploymentDetailsDrawer = ({ deployment, onClose, onRollback }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs">
      <div className="h-full w-full max-w-sm bg-white shadow-2xl border-l border-neutral-200 p-5 flex flex-col justify-between overflow-y-auto text-[11px]">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center gap-1.5">
              <Rocket className="size-3.5 text-rose-600" />
              <span className="text-xs font-bold text-neutral-900">Deployment Inspector</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-neutral-700">
              <X className="size-3.5" />
            </button>
          </div>

          <div>
            <span className="text-xs font-bold text-neutral-900">{deployment.service_name}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={cn('px-1.5 py-0.5 rounded text-[9px] border', ENV_CONFIG[deployment.environment] || ENV_CONFIG.PRODUCTION)}>
                {deployment.environment}
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">#{deployment.id.slice(0, 8)}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2 text-[10px]">
            <div className="flex justify-between">
              <span className="text-neutral-400">Git Commit:</span>
              <span className="font-mono font-bold text-neutral-800">{deployment.commit_hash}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Git Branch:</span>
              <span className="font-mono text-neutral-800">{deployment.branch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Execution Duration:</span>
              <span className="font-mono text-neutral-800">{deployment.duration_seconds}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Deployed By:</span>
              <span className="font-semibold text-neutral-800">{deployment.deployer_name || 'Engineer'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Completed At:</span>
              <span className="text-neutral-700">{deployment.started_at ? new Date(deployment.started_at).toLocaleString() : 'N/A'}</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 block">
              Commit Message / Changelog
            </span>
            <div className="p-2.5 rounded-lg border border-neutral-200 bg-white font-mono text-[10px] text-neutral-700">
              {deployment.commit_message || 'Standard release deployment'}
            </div>
          </div>

          {deployment.rollback_target_id && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[10px] flex items-center gap-1.5">
              <RotateCcw className="size-3.5 shrink-0 text-amber-600" />
              <span>This release is an automated rollback of deployment #{deployment.rollback_target_id.slice(0, 8)}.</span>
            </div>
          )}
        </div>

        <div className="pt-3 border-t flex flex-col gap-2">
          {deployment.status !== 'ROLLED_BACK' && deployment.environment === 'PRODUCTION' && (
            <Button
              variant="outline"
              onClick={onRollback}
              className="text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-50 border-amber-200 h-8 font-semibold gap-1"
            >
              <RotateCcw className="size-3" />
              Trigger Rollback for this Release
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="text-[10px] h-8">
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
};
