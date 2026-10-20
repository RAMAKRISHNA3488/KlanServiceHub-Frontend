import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Server, Database, Cloud, Activity, Cpu, Network, RefreshCw, 
  Plus, Link2, ArrowRight, Layers, Search, Filter, Trash2, 
  ExternalLink, ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle2,
  HardDrive, Zap, Info, Shield, Boxes, Globe, X, Edit3, ArrowUpRight,
  TrendingUp, Radio
} from 'lucide-react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Helper to map CI types to icons and colors
const TYPE_CONFIG = {
  SERVER: { icon: Server, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Compute Server' },
  DATABASE: { icon: Database, color: 'text-indigo-600 bg-indigo-50 border-indigo-200', label: 'Database Cluster' },
  APPLICATION: { icon: Cpu, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: 'Microservice' },
  CLOUD_RESOURCE: { icon: Cloud, color: 'text-cyan-600 bg-cyan-50 border-cyan-200', label: 'Cloud Resource' },
  API_GATEWAY: { icon: Network, color: 'text-violet-600 bg-violet-50 border-violet-200', label: 'API Gateway' },
  CACHE: { icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200', label: 'Cache Store' },
  QUEUE: { icon: Boxes, color: 'text-orange-600 bg-orange-50 border-orange-200', label: 'Message Queue' },
  NETWORK: { icon: Globe, color: 'text-teal-600 bg-teal-50 border-teal-200', label: 'Network Ingress' },
};

const STATUS_CONFIG = {
  ACTIVE: { label: 'Healthy & Active', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  MAINTENANCE: { label: 'In Maintenance', badge: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  DEGRADED: { label: 'Degraded Performance', badge: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  OFFLINE: { label: 'Critical Outage', badge: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

export const CmdbView = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('topology'); // 'topology' | 'inventory'
  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterEnv, setFilterEnv] = useState('ALL');

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // 1. Fetch Topology Graph data
  const { data: topologyRes, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['cmdb-topology', workspaceId],
    queryFn: () => apiFetch(`/api/assets/${workspaceId}/topology`),
    refetchInterval: 15000, // 15s real-time polling
  });

  const topology = topologyRes?.data || { nodes: [], edges: [], stats: {} };
  const nodes = topology.nodes || [];
  const edges = topology.edges || [];
  const stats = topology.stats || {};

  // Selected asset
  const selectedAsset = useMemo(() => {
    return nodes.find(n => n.id === selectedAssetId) || null;
  }, [nodes, selectedAssetId]);

  // Blast radius calculation for selected asset
  const blastRadius = useMemo(() => {
    if (!selectedAssetId) return { upstream: [], downstream: [], riskLevel: 'LOW' };

    // Upstream: services that depend on selected node (callers that will fail if selected goes down)
    const upstreamIds = edges
      .filter(e => e.target_asset_id === selectedAssetId)
      .map(e => e.source_asset_id);
    const upstream = nodes.filter(n => upstreamIds.includes(n.id));

    // Downstream: services that selected node depends on
    const downstreamIds = edges
      .filter(e => e.source_asset_id === selectedAssetId)
      .map(e => e.target_asset_id);
    const downstream = nodes.filter(n => downstreamIds.includes(n.id));

    let riskLevel = 'LOW';
    if (upstream.length >= 3 || selectedAsset?.type === 'DATABASE' || selectedAsset?.type === 'API_GATEWAY') {
      riskLevel = 'HIGH';
    } else if (upstream.length > 0) {
      riskLevel = 'MEDIUM';
    }

    return { upstream, downstream, riskLevel };
  }, [selectedAssetId, edges, nodes, selectedAsset]);

  // Seed Sample Topology Mutation
  const seedMutation = useMutation({
    mutationFn: () => apiFetch(`/api/assets/${workspaceId}/seed-sample`, { method: 'POST' }),
    onSuccess: (data) => {
      toast.success(data?.message || 'Sample Enterprise Infrastructure Topology seeded!');
      queryClient.invalidateQueries({ queryKey: ['cmdb-topology', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['assets', workspaceId] });
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to seed sample topology.');
    }
  });

  // Update Asset Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ assetId, status }) => apiFetch(`/api/assets/${workspaceId}/${assetId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
    onSuccess: () => {
      toast.success('Asset status updated');
      queryClient.invalidateQueries({ queryKey: ['cmdb-topology', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['assets', workspaceId] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to update asset status')
  });

  // Delete Asset Mutation
  const deleteAssetMutation = useMutation({
    mutationFn: (assetId) => apiFetch(`/api/assets/${workspaceId}/${assetId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Configuration item decommissioned');
      setSelectedAssetId(null);
      queryClient.invalidateQueries({ queryKey: ['cmdb-topology', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['assets', workspaceId] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to decommission asset')
  });

  // Delete Dependency Edge Mutation
  const deleteDependencyMutation = useMutation({
    mutationFn: (depId) => apiFetch(`/api/assets/${workspaceId}/dependencies/${depId}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Dependency link removed');
      queryClient.invalidateQueries({ queryKey: ['cmdb-topology', workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['assets', workspaceId] });
    },
    onError: (err) => toast.error(err?.message || 'Failed to remove dependency')
  });

  // Filtered nodes for Inventory tab
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      const matchSearch = searchTerm === '' || 
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.ip_address && n.ip_address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (n.location && n.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = filterType === 'ALL' || n.type === filterType;
      const matchStatus = filterStatus === 'ALL' || n.status === filterStatus;
      const matchEnv = filterEnv === 'ALL' || n.environment === filterEnv;
      return matchSearch && matchType && matchStatus && matchEnv;
    });
  }, [nodes, searchTerm, filterType, filterStatus, filterEnv]);

  // Topology node positioning by architectural tiers
  const tieredTopology = useMemo(() => {
    const tiers = {
      1: { name: 'Tier 1: Edge & Ingress', nodes: [] },
      2: { name: 'Tier 2: Gateways & Proxies', nodes: [] },
      3: { name: 'Tier 3: Microservices & Logic', nodes: [] },
      4: { name: 'Tier 4: Caching & Event Queues', nodes: [] },
      5: { name: 'Tier 5: Databases & Persistence', nodes: [] },
    };

    nodes.forEach(n => {
      if (n.type === 'API_GATEWAY') {
        tiers[2].nodes.push(n);
      } else if (n.type === 'CACHE' || n.type === 'QUEUE') {
        tiers[4].nodes.push(n);
      } else if (n.type === 'DATABASE') {
        tiers[5].nodes.push(n);
      } else if (n.type === 'CLOUD_RESOURCE' && (n.name.includes('CDN') || n.name.includes('WAF') || n.name.includes('Edge'))) {
        tiers[1].nodes.push(n);
      } else if (n.type === 'APPLICATION' || n.type === 'SERVER') {
        tiers[3].nodes.push(n);
      } else {
        tiers[5].nodes.push(n);
      }
    });

    return tiers;
  }, [nodes]);

  return (
    <div className="flex flex-col gap-y-4 p-5 min-h-[calc(100vh-4rem)] bg-neutral-50/50 text-[11px]">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3.5 bg-white p-4 rounded-xl shadow-xs border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
              <Server className="size-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                CMDB Assets & Infrastructure Topology
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE TELEMETRY
                </span>
              </h1>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                Real-time configuration items (CIs), multi-tier dependency mapping, and automated blast radius modeling.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-[11px] h-8 gap-1.5 font-medium text-neutral-600 hover:text-neutral-900"
          >
            <RefreshCw className={cn('size-3', isFetching && 'animate-spin text-indigo-600')} />
            Sync Telemetry
          </Button>

          {nodes.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="text-[11px] h-8 gap-1.5 font-medium bg-indigo-50/60 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            >
              <Zap className="size-3 text-indigo-600" />
              {seedMutation.isPending ? 'Seeding...' : 'Load Sample Blueprint'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLinkModalOpen(true)}
            disabled={nodes.length < 2}
            className="text-[11px] h-8 gap-1.5 font-medium text-neutral-700"
          >
            <Link2 className="size-3 text-neutral-500" />
            Link Dependency
          </Button>

          <Button
            size="sm"
            onClick={() => setIsRegisterModalOpen(true)}
            className="text-[11px] h-8 gap-1.5 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus className="size-3" />
            Register CI
          </Button>
        </div>
      </div>

      {/* Real-time Infrastructure KPI Health Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Total CIs</span>
            <Boxes className="size-3.5 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-neutral-900">{stats.totalNodes || 0}</span>
            <span className="text-[10px] text-neutral-400 font-medium">assets</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Health Status</span>
            <Activity className="size-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-emerald-600">{stats.healthyPercent || 100}%</span>
            <span className="text-[10px] text-emerald-700 font-semibold">{stats.healthyCount || 0} Active</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Degraded CIs</span>
            <AlertTriangle className="size-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn('text-lg font-bold', (stats.degradedCount || 0) > 0 ? 'text-amber-600' : 'text-neutral-900')}>
              {stats.degradedCount || 0}
            </span>
            <span className="text-[10px] text-amber-700 font-medium">investigation</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Critical Outages</span>
            <AlertOctagon className="size-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={cn('text-lg font-bold', (stats.offlineCount || 0) > 0 ? 'text-rose-600' : 'text-neutral-900')}>
              {stats.offlineCount || 0}
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">offline</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Topology Edges</span>
            <Network className="size-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-indigo-600">{stats.totalEdges || 0}</span>
            <span className="text-[10px] text-neutral-400 font-medium">links</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('topology')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all',
              activeTab === 'topology'
                ? 'bg-white text-indigo-600 border border-neutral-200 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            )}
          >
            <Layers className="size-3.5" />
            Infrastructure Topology Map
            <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-neutral-100 font-bold">
              {nodes.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all',
              activeTab === 'inventory'
                ? 'bg-white text-indigo-600 border border-neutral-200 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            )}
          >
            <Server className="size-3.5" />
            Asset Inventory & Telemetry
            <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-neutral-100 font-bold">
              {filteredNodes.length}
            </Badge>
          </button>
        </div>

        {activeTab === 'topology' && (
          <div className="hidden md:flex items-center gap-3 text-[10px] text-neutral-500">
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Healthy
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-amber-500" /> Degraded
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-blue-500" /> Maintenance
            </span>
            <span className="flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-rose-500" /> Offline
            </span>
          </div>
        )}
      </div>

      {/* TAB 1: VISUAL TOPOLOGY GRAPH */}
      {activeTab === 'topology' && (
        <div className="flex flex-col gap-3">
          {nodes.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-white p-8 text-center flex flex-col items-center justify-center">
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-3">
                <Network className="size-6" />
              </div>
              <h3 className="text-xs font-bold text-neutral-900">No Infrastructure Assets Registered</h3>
              <p className="text-[10px] text-neutral-500 max-w-md mt-1 mb-4">
                Register your configuration items (APIs, databases, microservices, caches) or load the standard enterprise architecture blueprint.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => seedMutation.mutate()}
                  disabled={seedMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] h-8 gap-1.5 font-semibold shadow-xs"
                >
                  <Zap className="size-3" />
                  {seedMutation.isPending ? 'Provisioning...' : 'Provision Enterprise Blueprint (10 CIs)'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="text-[11px] h-8"
                >
                  <Plus className="size-3 mr-1" />
                  Add First CI Manually
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col xl:flex-row gap-4 items-start">
              {/* Interactive Topology Board */}
              <div className="flex-1 w-full bg-white rounded-xl border border-neutral-200 p-4 shadow-xs relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider">Multi-Tier Architecture Layout</span>
                    <span className="text-[10px] text-neutral-400">Click any CI to inspect blast radius</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => seedMutation.mutate()}
                      className="text-[10px] h-6 px-2 text-neutral-500 hover:text-indigo-600"
                    >
                      Reset / Reseed Blueprint
                    </Button>
                  </div>
                </div>

                {/* 5 Architectural Tiers */}
                <div className="flex flex-col gap-4 relative">
                  {[1, 2, 3, 4, 5].map((tierNum) => {
                    const tier = tieredTopology[tierNum];
                    if (!tier || tier.nodes.length === 0) return null;

                    return (
                      <div key={tierNum} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            {tier.name}
                          </span>
                          <div className="h-px bg-neutral-100 flex-1" />
                        </div>

                        {/* Nodes in this tier */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {tier.nodes.map((node) => {
                            const typeCfg = TYPE_CONFIG[node.type] || TYPE_CONFIG.SERVER;
                            const statusCfg = STATUS_CONFIG[node.status] || STATUS_CONFIG.ACTIVE;
                            const Icon = typeCfg.icon;
                            const isSelected = selectedAssetId === node.id;
                            const isBlastRisk = blastRadius.upstream.some(u => u.id === node.id);

                            return (
                              <div
                                key={node.id}
                                onClick={() => setSelectedAssetId(node.id)}
                                className={cn(
                                  'group cursor-pointer rounded-lg border p-2.5 transition-all relative select-none',
                                  isSelected
                                    ? 'bg-indigo-50/50 border-indigo-500 ring-1 ring-indigo-500/20 shadow-xs'
                                    : isBlastRisk
                                    ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-400/30'
                                    : 'bg-white hover:bg-neutral-50 border-neutral-200 hover:border-neutral-300 shadow-xs'
                                )}
                              >
                                {isBlastRisk && (
                                  <div className="absolute -top-1.5 right-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[8px] uppercase tracking-wider shadow-xs flex items-center gap-1">
                                    <AlertTriangle className="size-2" /> Blast Impact
                                  </div>
                                )}

                                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={cn('p-1.5 rounded-md border shrink-0', typeCfg.color)}>
                                      <Icon className="size-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                      <h4 className="text-[11px] font-bold text-neutral-900 truncate group-hover:text-indigo-600 transition">
                                        {node.name}
                                      </h4>
                                      <p className="text-[9px] text-neutral-500 font-mono truncate">
                                        {node.ip_address || node.location || 'Cluster Host'}
                                      </p>
                                    </div>
                                  </div>

                                  <span className={cn('size-1.5 rounded-full shrink-0 mt-1', statusCfg.dot, node.status === 'OFFLINE' && 'animate-ping')} />
                                </div>

                                <div className="flex items-center justify-between text-[9px] pt-1.5 border-t border-neutral-100">
                                  <span className="font-mono text-neutral-400">
                                    {node.uptime_percent || 99.98}% uptime
                                  </span>
                                  <span className={cn('px-1.5 py-0.5 rounded font-bold border text-[8px]', statusCfg.badge)}>
                                    {node.status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Relationship Links Sub-view */}
                {edges.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-neutral-200">
                    <h4 className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Link2 className="size-3 text-indigo-500" />
                      Active Dependency Routing ({edges.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 text-[10px]">
                      {edges.map((e) => (
                        <div key={e.id} className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-neutral-50 border border-neutral-200">
                          <div className="flex items-center gap-1.5 text-[10px] truncate">
                            <span className="font-bold text-neutral-800 truncate">{e.source_name}</span>
                            <span className="text-[9px] text-indigo-600 font-semibold px-1 rounded bg-indigo-50 border border-indigo-100">
                              {e.relationship}
                            </span>
                            <span className="font-bold text-neutral-800 truncate">{e.target_name}</span>
                          </div>
                          <button
                            onClick={(ev) => {
                              ev.stopPropagation();
                              deleteDependencyMutation.mutate(e.id);
                            }}
                            className="text-neutral-400 hover:text-rose-600 p-0.5"
                            title="Unlink dependency"
                          >
                            <Trash2 className="size-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Side Drawer / Inspector for Selected Asset */}
              {selectedAsset ? (
                <div className="w-full xl:w-72 shrink-0 bg-white rounded-xl border border-neutral-200 p-4 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-neutral-900">CI Telemetry Inspector</span>
                    </div>
                    <button
                      onClick={() => setSelectedAssetId(null)}
                      className="p-1 rounded-md text-neutral-400 hover:text-neutral-700"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>

                  {/* Header of Inspector */}
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-neutral-900">{selectedAsset.name}</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 font-medium">
                      {selectedAsset.type} • {selectedAsset.environment}
                    </p>
                  </div>

                  {/* Quick Status Control */}
                  <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 flex flex-col gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
                      Live Telemetry State
                    </span>
                    <div className="grid grid-cols-2 gap-1">
                      {['ACTIVE', 'MAINTENANCE', 'DEGRADED', 'OFFLINE'].map((st) => (
                        <button
                          key={st}
                          onClick={() => updateStatusMutation.mutate({ assetId: selectedAsset.id, status: st })}
                          disabled={updateStatusMutation.isPending}
                          className={cn(
                            'px-1.5 py-1 rounded text-[9px] font-bold border transition text-center',
                            selectedAsset.status === st
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                              : 'bg-white text-neutral-600 hover:bg-neutral-100 border-neutral-200'
                          )}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Blast Radius Analysis Card */}
                  <div className="p-2.5 rounded-lg border border-neutral-200 bg-white flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-neutral-800 flex items-center gap-1">
                        <AlertTriangle className={cn('size-3', blastRadius.riskLevel === 'HIGH' ? 'text-rose-500' : 'text-amber-500')} />
                        Blast Radius Impact
                      </span>
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border',
                        blastRadius.riskLevel === 'HIGH' 
                          ? 'bg-rose-50 text-rose-700 border-rose-200' 
                          : blastRadius.riskLevel === 'MEDIUM' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      )}>
                        {blastRadius.riskLevel} RISK
                      </span>
                    </div>

                    <div className="text-[10px] text-neutral-600">
                      <p className="font-semibold text-neutral-700 mb-0.5">
                        Upstream at Risk ({blastRadius.upstream.length}):
                      </p>
                      {blastRadius.upstream.length === 0 ? (
                        <p className="text-[9px] text-neutral-400 italic">No upstream service failure.</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {blastRadius.upstream.map(u => (
                            <div key={u.id} className="flex items-center justify-between text-[9px] bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200">
                              <span className="font-bold text-neutral-800 truncate">{u.name}</span>
                              <span className="text-rose-600 font-semibold shrink-0">Affected</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-neutral-600 mt-0.5">
                      <p className="font-semibold text-neutral-700 mb-0.5">
                        Downstream Deps ({blastRadius.downstream.length}):
                      </p>
                      {blastRadius.downstream.length === 0 ? (
                        <p className="text-[9px] text-neutral-400 italic">Operates independently.</p>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {blastRadius.downstream.map(d => (
                            <div key={d.id} className="flex items-center justify-between text-[9px] bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200">
                              <span className="font-bold text-neutral-800 truncate">{d.name}</span>
                              <span className="text-neutral-500 shrink-0">{d.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Metadata Specs */}
                  <div className="text-[10px] space-y-1.5 border-t pt-2.5">
                    <div className="flex justify-between">
                      <span className="text-neutral-400 text-[10px]">Provider:</span>
                      <span className="font-bold text-neutral-800">{selectedAsset.provider || 'AWS'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 text-[10px]">Region:</span>
                      <span className="font-bold text-neutral-800">{selectedAsset.location || 'us-east-1'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 text-[10px]">IP / Endpoint:</span>
                      <span className="font-mono text-[9px] text-neutral-800">{selectedAsset.ip_address || '10.0.1.10'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400 text-[10px]">Uptime SLA:</span>
                      <span className="font-bold text-emerald-600">{selectedAsset.uptime_percent || 99.98}%</span>
                    </div>
                  </div>

                  {/* Decommission Button */}
                  <div className="pt-2 border-t flex flex-col gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteAssetMutation.mutate(selectedAsset.id)}
                      disabled={deleteAssetMutation.isPending}
                      className="text-[10px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 h-7 font-semibold gap-1"
                    >
                      <Trash2 className="size-3" />
                      Decommission CI
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full xl:w-72 shrink-0 bg-neutral-50/70 rounded-xl border border-dashed border-neutral-200 p-6 text-center flex flex-col items-center justify-center">
                  <Info className="size-5 text-neutral-400 mb-1.5" />
                  <h4 className="text-[11px] font-bold text-neutral-700">CI Telemetry Inspector</h4>
                  <p className="text-[10px] text-neutral-400 mt-1">
                    Select any node on the topology canvas to inspect live metrics, upstream blast radius, and dependencies.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVENTORY & TELEMETRY TABLE */}
      {activeTab === 'inventory' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs flex flex-col gap-3">
          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-sm">
              <Search className="size-3 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search by name, IP, region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-[11px] rounded-lg"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="ALL">All Types</option>
                <option value="SERVER">Server</option>
                <option value="DATABASE">Database</option>
                <option value="APPLICATION">Microservice</option>
                <option value="API_GATEWAY">API Gateway</option>
                <option value="CACHE">Cache</option>
                <option value="QUEUE">Queue</option>
                <option value="CLOUD_RESOURCE">Cloud Resource</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="DEGRADED">Degraded</option>
                <option value="OFFLINE">Offline</option>
              </select>

              <select
                value={filterEnv}
                onChange={(e) => setFilterEnv(e.target.value)}
                className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="ALL">All Environments</option>
                <option value="PRODUCTION">Production</option>
                <option value="STAGING">Staging</option>
                <option value="DEVELOPMENT">Development</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredNodes.length === 0 ? (
            <div className="py-8 text-center text-[11px] text-neutral-500">
              No configuration items matched your search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Configuration Item</th>
                    <th className="py-2 px-2.5">Type</th>
                    <th className="py-2 px-2.5">Environment</th>
                    <th className="py-2 px-2.5">Status</th>
                    <th className="py-2 px-2.5">Endpoint / IP</th>
                    <th className="py-2 px-2.5">Location</th>
                    <th className="py-2 px-2.5">Uptime</th>
                    <th className="py-2 px-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredNodes.map((n) => {
                    const typeCfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SERVER;
                    const statusCfg = STATUS_CONFIG[n.status] || STATUS_CONFIG.ACTIVE;
                    const Icon = typeCfg.icon;

                    return (
                      <tr key={n.id} className="hover:bg-neutral-50/80 transition">
                        <td className="py-2 px-3 font-bold text-neutral-900 flex items-center gap-2">
                          <div className={cn('p-1 rounded-md border shrink-0', typeCfg.color)}>
                            <Icon className="size-3" />
                          </div>
                          <span className="truncate max-w-[200px]">{n.name}</span>
                        </td>
                        <td className="py-2 px-2.5 text-neutral-600 font-medium">{typeCfg.label}</td>
                        <td className="py-2 px-2.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-100 text-neutral-700">
                            {n.environment}
                          </span>
                        </td>
                        <td className="py-2 px-2.5">
                          <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold border', statusCfg.badge)}>
                            {n.status}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 font-mono text-[10px] text-neutral-600">{n.ip_address || '—'}</td>
                        <td className="py-2 px-2.5 text-neutral-600">{n.location || '—'}</td>
                        <td className="py-2 px-2.5 font-bold text-emerald-600">{n.uptime_percent || 99.98}%</td>
                        <td className="py-2 px-2.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedAssetId(n.id);
                                setActiveTab('topology');
                              }}
                              className="h-6 px-1.5 text-[10px] text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium"
                            >
                              Inspect
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAssetMutation.mutate(n.id)}
                              className="h-6 px-1.5 text-[10px] text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="size-2.5" />
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
      )}

      {/* MODAL 1: REGISTER CONFIGURATION ITEM */}
      {isRegisterModalOpen && (
        <CreateAssetModal
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)}
          workspaceId={workspaceId}
          onCreated={() => {
            setIsRegisterModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['cmdb-topology', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['assets', workspaceId] });
          }}
        />
      )}

      {/* MODAL 2: LINK DEPENDENCY */}
      {isLinkModalOpen && (
        <CreateDependencyModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          workspaceId={workspaceId}
          nodes={nodes}
          onCreated={() => {
            setIsLinkModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['cmdb-topology', workspaceId] });
            queryClient.invalidateQueries({ queryKey: ['assets', workspaceId] });
          }}
        />
      )}
    </div>
  );
};

// Modal: Register Configuration Item
const CreateAssetModal = ({ isOpen, onClose, workspaceId, onCreated }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('APPLICATION');
  const [environment, setEnvironment] = useState('PRODUCTION');
  const [location, setLocation] = useState('AWS us-east-1');
  const [ipAddress, setIpAddress] = useState('10.0.1.20');
  const [provider, setProvider] = useState('AWS');
  const [uptimePercent, setUptimePercent] = useState('99.99');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Configuration item name is required');

    setIsSubmitting(true);
    try {
      await apiFetch(`/api/assets/${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          type,
          environment,
          location,
          ip_address: ipAddress,
          provider,
          uptime_percent: parseFloat(uptimePercent) || 99.98,
        })
      });
      toast.success('Configuration item registered successfully');
      onCreated();
    } catch (err) {
      toast.error(err?.message || 'Failed to register asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-neutral-200 text-[11px]">
        <div className="flex items-center justify-between pb-2.5 border-b mb-3">
          <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Plus className="size-3.5 text-indigo-600" /> Register CI
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-neutral-700">
            <X className="size-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">CI Name / Identifier</label>
            <Input
              required
              placeholder="e.g. Auth & Identity Service, Postgres Replica"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-[11px] h-8 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">CI Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="APPLICATION">Microservice</option>
                <option value="API_GATEWAY">API Gateway</option>
                <option value="DATABASE">Database</option>
                <option value="CACHE">Cache (Redis)</option>
                <option value="QUEUE">Queue (Kafka)</option>
                <option value="SERVER">Server / Compute</option>
                <option value="CLOUD_RESOURCE">Cloud Resource</option>
                <option value="NETWORK">Network / Ingress</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Environment</label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="PRODUCTION">Production</option>
                <option value="STAGING">Staging</option>
                <option value="DEVELOPMENT">Development</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Provider</label>
              <Input
                placeholder="AWS, Cloudflare"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="text-[11px] h-8 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">IP / Host</label>
              <Input
                placeholder="10.0.1.20"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                className="text-[11px] h-8 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Location / Region</label>
              <Input
                placeholder="AWS us-east-1"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="text-[11px] h-8 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Target Uptime (%)</label>
              <Input
                placeholder="99.99"
                value={uptimePercent}
                onChange={(e) => setUptimePercent(e.target.value)}
                className="text-[11px] h-8 rounded-lg font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2.5 border-t mt-1">
            <Button variant="outline" type="button" onClick={onClose} className="text-[10px] h-7 px-2.5">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] h-7 px-3 font-semibold">
              {isSubmitting ? 'Registering...' : 'Register CI'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal: Link Service Dependency
const CreateDependencyModal = ({ isOpen, onClose, workspaceId, nodes, onCreated }) => {
  const [sourceId, setSourceId] = useState(nodes[0]?.id || '');
  const [targetId, setTargetId] = useState(nodes[1]?.id || '');
  const [relationship, setRelationship] = useState('routes traffic to');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sourceId || !targetId) return toast.error('Please choose both source and target assets');
    if (sourceId === targetId) return toast.error('An asset cannot depend on itself');

    setIsSubmitting(true);
    try {
      await apiFetch(`/api/assets/${workspaceId}/dependencies`, {
        method: 'POST',
        body: JSON.stringify({
          sourceAssetId: sourceId,
          targetAssetId: targetId,
          relationship
        })
      });
      toast.success('Dependency link established');
      onCreated();
    } catch (err) {
      toast.error(err?.message || 'Failed to link dependency');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-neutral-200 text-[11px]">
        <div className="flex items-center justify-between pb-2.5 border-b mb-3">
          <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Link2 className="size-3.5 text-indigo-600" /> Link Service Dependency
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-neutral-700">
            <X className="size-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Source Asset (Origin / Caller)</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Relationship Type</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
            >
              <option value="routes traffic to">routes traffic to</option>
              <option value="depends on">depends on</option>
              <option value="reads from">reads from</option>
              <option value="writes to">writes to</option>
              <option value="replicates to">replicates to</option>
              <option value="monitors">monitors</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Target Asset (Destination / Service)</label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
            >
              {nodes.map(n => (
                <option key={n.id} value={n.id}>{n.name} ({n.type})</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2.5 border-t mt-1">
            <Button variant="outline" type="button" onClick={onClose} className="text-[10px] h-7 px-2.5">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] h-7 px-3 font-semibold">
              {isSubmitting ? 'Linking...' : 'Establish Link'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
