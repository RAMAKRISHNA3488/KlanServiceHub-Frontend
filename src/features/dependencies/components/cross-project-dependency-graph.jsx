import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { useEditTaskModal } from '@/features/tasks/hooks/use-edit-task-modal';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  GitFork,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  ExternalLink,
  ArrowRight,
  Download,
  Info,
  X,
  Sparkles,
  List,
  LayoutGrid,
  Network,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Check,
  Copy,
  Edit3,
} from 'lucide-react';

export const CrossProjectDependencyGraph = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { open: openEditTaskModal } = useEditTaskModal();

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Remove Dependency Link',
    'Are you sure you want to remove this dependency relationship?',
    'destructive'
  );

  // View States
  const [viewMode, setViewMode] = useState('graph'); // 'graph' | 'matrix' | 'table'
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [filterMode, setFilterMode] = useState('connected'); // 'all' | 'connected' | 'blockers' | 'cross-project'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalPrefills, setModalPrefills] = useState({ sourceTaskId: '', targetTaskId: '' });
  const [zoomLevel, setZoomLevel] = useState(1);

  // SVG Canvas Pan/Drag states
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);

  // Fetch Graph Telemetry
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dependencies-graph', workspaceId, selectedProjectId],
    queryFn: () =>
      apiFetch(
        `/api/dependencies/graph/${workspaceId}${
          selectedProjectId !== 'ALL' ? `?projectId=${selectedProjectId}` : ''
        }`
      ),
  });

  const graphData = data?.data || {
    nodes: [],
    edges: [],
    blockedNodes: [],
    blockingNodes: [],
    crossProjectCount: 0,
    criticalBlockersCount: 0,
    totalDependencies: 0,
    projectPairs: [],
  };

  // Create Dependency Mutation
  const createMutation = useMutation({
    mutationFn: (payload) =>
      apiFetch('/api/dependencies', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Dependency relationship linked successfully!');
      queryClient.invalidateQueries({ queryKey: ['dependencies-graph'] });
      setIsCreateModalOpen(false);
      setModalPrefills({ sourceTaskId: '', targetTaskId: '' });
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to create dependency link.');
    },
  });

  // Delete Dependency Mutation
  const deleteMutation = useMutation({
    mutationFn: (linkId) =>
      apiFetch(`/api/dependencies/${linkId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      toast.success('Dependency link removed.');
      queryClient.invalidateQueries({ queryKey: ['dependencies-graph'] });
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to remove dependency link.');
    },
  });

  // Seed Demo Sample Links Mutation
  const seedDemoMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/dependencies/seed-demo/${workspaceId}`, {
        method: 'POST',
      }),
    onSuccess: (res) => {
      toast.success(res?.message || 'Generated sample cross-project dependency links!');
      queryClient.invalidateQueries({ queryKey: ['dependencies-graph'] });
    },
    onError: (err) => {
      toast.error(err?.message || 'Could not generate sample links. Ensure tasks exist in your projects.');
    },
  });

  // Quick Task Status Change Mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: ({ taskId, status }) =>
      apiFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, vars) => {
      toast.success(`Task status updated to ${vars.status}. Blocker paths recalculated!`);
      queryClient.invalidateQueries({ queryKey: ['dependencies-graph'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => {
      toast.error(err?.message || 'Failed to update task status.');
    },
  });

  // Unique project list from nodes
  const projectsList = useMemo(() => {
    const pMap = new Map();
    (graphData.nodes || []).forEach((n) => {
      if (n.projectId && !pMap.has(n.projectId)) {
        pMap.set(n.projectId, {
          id: n.projectId,
          name: n.projectName,
          key: n.projectKey,
          color: n.projectColor,
        });
      }
    });
    return Array.from(pMap.values());
  }, [graphData.nodes]);

  // Filtered nodes and edges based on active filters
  const { filteredNodes, filteredEdges, nodePositionMap } = useMemo(() => {
    let nodes = graphData.nodes || [];
    let edges = graphData.edges || [];

    // Filter by search term
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      nodes = nodes.filter(
        (n) =>
          n.name?.toLowerCase().includes(q) ||
          n.key?.toLowerCase().includes(q) ||
          n.projectName?.toLowerCase().includes(q)
      );
      const nodeIds = new Set(nodes.map((n) => n.id));
      edges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target));
    }

    // Filter by connection type
    if (filterMode === 'connected') {
      const connectedNodeIds = new Set();
      edges.forEach((e) => {
        connectedNodeIds.add(e.source);
        connectedNodeIds.add(e.target);
      });
      nodes = nodes.filter((n) => connectedNodeIds.has(n.id));
    } else if (filterMode === 'blockers') {
      const blockerEdges = edges.filter((e) => e.isActiveBlocker);
      const blockerNodeIds = new Set();
      blockerEdges.forEach((e) => {
        blockerNodeIds.add(e.source);
        blockerNodeIds.add(e.target);
      });
      nodes = nodes.filter((n) => blockerNodeIds.has(n.id));
      edges = blockerEdges;
    } else if (filterMode === 'cross-project') {
      const crossEdges = edges.filter((e) => e.isCrossProject);
      const crossNodeIds = new Set();
      crossEdges.forEach((e) => {
        crossNodeIds.add(e.source);
        crossNodeIds.add(e.target);
      });
      nodes = nodes.filter((n) => crossNodeIds.has(n.id));
      edges = crossEdges;
    }

    // Layout Engine: Cluster nodes into project columns
    const groupedByProject = {};
    nodes.forEach((n) => {
      const pKey = n.projectId || 'unknown';
      if (!groupedByProject[pKey]) groupedByProject[pKey] = [];
      groupedByProject[pKey].push(n);
    });

    const posMap = new Map();
    const columnSpacing = 320;
    const rowSpacing = 110;
    const projectKeys = Object.keys(groupedByProject);

    projectKeys.forEach((pKey, colIdx) => {
      const colNodes = groupedByProject[pKey];
      colNodes.forEach((node, rowIdx) => {
        posMap.set(node.id, {
          x: 60 + colIdx * columnSpacing,
          y: 70 + rowIdx * rowSpacing,
          projectIndex: colIdx,
        });
      });
    });

    return {
      filteredNodes: nodes,
      filteredEdges: edges,
      nodePositionMap: posMap,
    };
  }, [graphData, searchTerm, filterMode]);

  // Highlight downstream/upstream nodes when a node is clicked
  const activeHighlightedElements = useMemo(() => {
    if (!selectedNodeId) return null;
    const upstream = new Set();
    const downstream = new Set();
    const activeEdgeIds = new Set();

    (graphData.edges || []).forEach((e) => {
      if (e.target === selectedNodeId) {
        upstream.add(e.source);
        activeEdgeIds.add(e.id);
      }
      if (e.source === selectedNodeId) {
        downstream.add(e.target);
        activeEdgeIds.add(e.id);
      }
    });

    return {
      selectedNodeId,
      upstream,
      downstream,
      activeEdgeIds,
    };
  }, [selectedNodeId, graphData.edges]);

  // Selected Node Details
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return (graphData.nodes || []).find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, graphData.nodes]);

  // Upstream blockers for selected node
  const selectedNodeUpstreamEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return (graphData.edges || []).filter((e) => e.target === selectedNodeId);
  }, [selectedNodeId, graphData.edges]);

  // Downstream dependents for selected node
  const selectedNodeDownstreamEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return (graphData.edges || []).filter((e) => e.source === selectedNodeId);
  }, [selectedNodeId, graphData.edges]);

  // Copy Task Key
  const handleCopyKey = (key) => {
    if (!key) return;
    navigator.clipboard.writeText(key);
    toast.success(`Copied "${key}" to clipboard!`);
  };

  // Export Topology CSV
  const handleExportCSV = () => {
    if (!graphData.edges.length) {
      toast.info('No dependency relationships to export.');
      return;
    }

    const headers = [
      'Relationship ID',
      'Source Project',
      'Source Issue Key',
      'Source Summary',
      'Source Status',
      'Relationship',
      'Target Project',
      'Target Issue Key',
      'Target Summary',
      'Target Status',
      'Is Active Blocker',
      'Is Cross Project',
    ];

    const rows = graphData.edges.map((e) => [
      `"${e.id}"`,
      `"${e.sourceProject?.name || ''}"`,
      `"${e.sourceKey}"`,
      `"${(e.sourceName || '').replace(/"/g, '""')}"`,
      `"${e.sourceStatus}"`,
      `"${e.relationshipType}"`,
      `"${e.targetProject?.name || ''}"`,
      `"${e.targetKey}"`,
      `"${(e.targetName || '').replace(/"/g, '""')}"`,
      `"${e.targetStatus}"`,
      e.isActiveBlocker ? 'YES' : 'NO',
      e.isCrossProject ? 'YES' : 'NO',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cross_project_dependencies_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Dependency topology CSV exported!');
  };

  // Canvas Mouse Drag Handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('.interactive-node')) return;
    setIsPanning(true);
    setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    setPanOffset({
      x: e.clientX - startPan.x,
      y: e.clientY - startPan.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    setSelectedNodeId(null);
    toast.info('Canvas view reset to default.');
  };

  const openLinkModalForNode = (nodeId, asSource = true) => {
    if (asSource) {
      setModalPrefills({ sourceTaskId: nodeId, targetTaskId: '' });
    } else {
      setModalPrefills({ sourceTaskId: '', targetTaskId: nodeId });
    }
    setIsCreateModalOpen(true);
  };

  const handleSelectNode = (node) => {
    if (selectedNodeId === node.id) {
      setSelectedNodeId(null);
    } else {
      setSelectedNodeId(node.id);
      toast.info(`Tracing dependencies for ${node.key}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Page Header & Real-Time KPI Strip */}
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
                <GitFork className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-neutral-900">Cross-Project Dependency Graph</h1>
                  <span className="relative flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                    <span className="relative flex size-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
                    </span>
                    Live Topology
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Real-time interactive network topology of cross-project blockers, issue relationships, and critical execution paths.
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                refetch().then(() => toast.success('Topology data refreshed!'));
              }}
              disabled={isFetching}
              className="h-9 px-3 rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className={`size-3.5 text-neutral-500 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh Graph</span>
            </button>

            {graphData.edges.length === 0 && (
              <button
                onClick={() => seedDemoMutation.mutate()}
                disabled={seedDemoMutation.isPending}
                className="h-9 px-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="size-3.5 text-purple-600" />
                <span>{seedDemoMutation.isPending ? 'Generating...' : 'Seed Sample Demo Links'}</span>
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
              onClick={() => {
                setModalPrefills({ sourceTaskId: '', targetTaskId: '' });
                setIsCreateModalOpen(true);
              }}
              className="h-9 px-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>+ Link Dependency</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-neutral-100">
          <div className="p-3 rounded-xl bg-neutral-50/70 border border-neutral-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Total Tracked Issues</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-neutral-900">{graphData.nodes.length}</span>
              <span className="text-[10px] font-semibold text-neutral-400">across {projectsList.length} projects</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50/70 border border-neutral-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Active Dependencies</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-blue-600">{graphData.totalDependencies || graphData.edges.length}</span>
              <span className="text-[10px] font-semibold text-blue-700/80">({graphData.crossProjectCount} Cross-Project)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block flex items-center gap-1">
              <AlertTriangle className="size-3 text-rose-500" /> Critical Blockers
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-rose-700">{graphData.criticalBlockersCount || graphData.blockedNodes.length}</span>
              <span className="text-[10px] font-semibold text-rose-600/80">issues delayed</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-neutral-50/70 border border-neutral-200/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Cross-Project Ratio</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-purple-700">
                {graphData.edges.length > 0
                  ? `${Math.round((graphData.crossProjectCount / graphData.edges.length) * 100)}%`
                  : '0%'}
              </span>
              <span className="text-[10px] font-semibold text-neutral-400">inter-team alignment</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Controls & View Mode Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Filters & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search issues or projects..."
              className="h-8.5 w-full pl-8 pr-3 text-xs bg-white border border-neutral-200 rounded-xl focus:border-blue-500 focus:outline-hidden shadow-2xs transition"
            />
          </div>

          {/* Project Filter */}
          <select
            value={selectedProjectId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedProjectId(val);
              const pObj = projectsList.find((p) => p.id === val);
              toast.info(val === 'ALL' ? 'Showing all projects' : `Filtered to project: ${pObj?.name || val}`);
            }}
            className="h-8.5 rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-700 font-semibold focus:border-blue-500 focus:outline-hidden shadow-2xs cursor-pointer"
          >
            <option value="ALL">All Projects ({projectsList.length})</option>
            {projectsList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.key} • {p.name}
              </option>
            ))}
          </select>

          {/* Filter Mode Pills */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200/80 text-xs font-semibold">
            {[
              { id: 'connected', label: 'Connected Only' },
              { id: 'blockers', label: 'Active Blockers' },
              { id: 'cross-project', label: 'Cross-Project' },
              { id: 'all', label: 'All Issues' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFilterMode(f.id);
                  toast.info(`View mode: ${f.label}`);
                }}
                className={`px-2.5 py-1 rounded-lg transition text-[11px] cursor-pointer ${
                  filterMode === f.id
                    ? 'bg-white text-blue-600 font-bold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: View Modes & Canvas Controls */}
        <div className="flex items-center gap-2">
          {viewMode === 'graph' && (
            <div className="flex items-center bg-white rounded-xl border border-neutral-200 p-0.5 shadow-2xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.15))}
                title="Zoom Out"
                className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="text-[10px] font-bold text-neutral-600 px-2 select-none">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.15))}
                title="Zoom In"
                className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg transition cursor-pointer"
              >
                <ZoomIn className="size-3.5" />
              </button>
              <button
                onClick={resetView}
                title="Reset View"
                className="p-1.5 text-neutral-600 hover:bg-neutral-100 rounded-lg transition border-l border-neutral-200 ml-0.5 cursor-pointer"
              >
                <Maximize2 className="size-3.5" />
              </button>
            </div>
          )}

          {/* View Modes */}
          <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200/80 text-xs font-semibold">
            <button
              onClick={() => setViewMode('graph')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition text-[11px] cursor-pointer ${
                viewMode === 'graph'
                  ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Network className="size-3.5 text-blue-600" />
              <span>Topology</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition text-[11px] cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <List className="size-3.5 text-purple-600" />
              <span>Links Table ({graphData.edges.length})</span>
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition text-[11px] cursor-pointer ${
                viewMode === 'matrix'
                  ? 'bg-white text-neutral-900 font-bold shadow-2xs'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <LayoutGrid className="size-3.5 text-emerald-600" />
              <span>Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Topology Viewport */}
      {viewMode === 'graph' && (
        <div className="relative rounded-2xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-md h-[600px] select-none">
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle, #60A5FA 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Project Column Headings Overlay */}
          <div className="absolute top-3 left-4 right-4 flex items-center justify-between gap-3 z-10 pointer-events-none">
            <div className="bg-neutral-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-neutral-700/80 text-[10px] font-bold text-neutral-300 flex items-center gap-2 shadow-sm">
              <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Directed Graph Topology • Click issue node to trace blocker paths & inspect details</span>
            </div>

            {selectedNode && (
              <div className="bg-blue-950/95 backdrop-blur-md px-3 py-1 rounded-xl border border-blue-500/60 text-[10px] font-bold text-blue-200 flex items-center gap-2 shadow-sm animate-in fade-in">
                <span>Selected: {selectedNode.key} ({selectedNode.name})</span>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 hover:bg-blue-800 rounded-md pointer-events-auto cursor-pointer"
                >
                  <X className="size-3" />
                </button>
              </div>
            )}
          </div>

          {/* Interactive SVG Canvas */}
          <svg
            ref={svgRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`w-full h-full cursor-${isPanning ? 'grabbing' : 'grab'}`}
          >
            <defs>
              {/* Directed Arrow Markers */}
              <marker
                id="arrow-default"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748B" />
              </marker>

              <marker
                id="arrow-blocker"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#F43F5E" />
              </marker>

              <marker
                id="arrow-active"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
              </marker>
            </defs>

            <g
              transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
              className="transition-transform duration-75"
            >
              {/* Directed Relationship Edges (Bézier Curves) */}
              {filteredEdges.map((edge) => {
                const sourcePos = nodePositionMap.get(edge.source);
                const targetPos = nodePositionMap.get(edge.target);
                if (!sourcePos || !targetPos) return null;

                const startX = sourcePos.x + 220; // Node card right edge
                const startY = sourcePos.y + 40; // Node vertical center
                const endX = targetPos.x; // Node card left edge
                const endY = targetPos.y + 40;

                const dx = Math.abs(endX - startX) * 0.5;
                const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

                const isHighlighted =
                  activeHighlightedElements?.activeEdgeIds.has(edge.id);
                const isDimmed =
                  selectedNodeId && !isHighlighted;

                return (
                  <g key={edge.id} className="transition-opacity duration-200">
                    <path
                      d={pathData}
                      fill="none"
                      stroke={
                        edge.isActiveBlocker
                          ? '#F43F5E'
                          : isHighlighted
                          ? '#3B82F6'
                          : '#475569'
                      }
                      strokeWidth={
                        isHighlighted ? 3.5 : edge.isActiveBlocker ? 2.5 : 1.5
                      }
                      strokeDasharray={
                        edge.isActiveBlocker
                          ? '5,5'
                          : edge.relationshipType === 'relates to'
                          ? '3,3'
                          : 'none'
                      }
                      markerEnd={
                        edge.isActiveBlocker
                          ? 'url(#arrow-blocker)'
                          : isHighlighted
                          ? 'url(#arrow-active)'
                          : 'url(#arrow-default)'
                      }
                      opacity={isDimmed ? 0.15 : 0.9}
                      className={edge.isActiveBlocker ? 'animate-pulse' : ''}
                    />

                    {/* Edge Label Badge on midpoint */}
                    <rect
                      x={(startX + endX) / 2 - 26}
                      y={(startY + endY) / 2 - 9}
                      width={52}
                      height={18}
                      rx={5}
                      fill={edge.isActiveBlocker ? '#881337' : '#0F172A'}
                      stroke={edge.isActiveBlocker ? '#F43F5E' : '#334155'}
                      strokeWidth={1}
                      opacity={isDimmed ? 0.15 : 0.95}
                    />
                    <text
                      x={(startX + endX) / 2}
                      y={(startY + endY) / 2 + 3.5}
                      textAnchor="middle"
                      fontSize={8.5}
                      fontWeight="bold"
                      fill={edge.isActiveBlocker ? '#FDA4AF' : '#94A3B8'}
                      opacity={isDimmed ? 0.15 : 1}
                      fontFamily="sans-serif"
                    >
                      {edge.isActiveBlocker ? 'BLOCKS' : edge.relationshipType.slice(0, 8)}
                    </text>
                  </g>
                );
              })}

              {/* Node Cards */}
              {filteredNodes.map((node) => {
                const pos = nodePositionMap.get(node.id);
                if (!pos) return null;

                const isSelected = selectedNodeId === node.id;
                const isUpstream =
                  activeHighlightedElements?.upstream.has(node.id);
                const isDownstream =
                  activeHighlightedElements?.downstream.has(node.id);
                const isDimmed =
                  selectedNodeId &&
                  !isSelected &&
                  !isUpstream &&
                  !isDownstream;

                const isDone = node.status === 'DONE';

                return (
                  <foreignObject
                    key={node.id}
                    x={pos.x}
                    y={pos.y}
                    width={220}
                    height={80}
                    className="overflow-visible interactive-node"
                    onClick={() => handleSelectNode(node)}
                  >
                    <div
                      className={`h-[78px] w-[218px] rounded-xl border p-2.5 flex flex-col justify-between transition-all duration-200 cursor-pointer shadow-md ${
                        isSelected
                          ? 'bg-neutral-900 border-blue-500 ring-2 ring-blue-500/60 shadow-blue-500/20'
                          : isUpstream
                          ? 'bg-neutral-900 border-amber-500 ring-1 ring-amber-500/50'
                          : isDownstream
                          ? 'bg-neutral-900 border-rose-500 ring-1 ring-rose-500/50'
                          : node.isBlocked
                          ? 'bg-neutral-900 border-rose-500/80 hover:border-rose-400'
                          : 'bg-neutral-900 border-neutral-700/80 hover:border-neutral-500'
                      }`}
                      style={{
                        opacity: isDimmed ? 0.25 : 1,
                      }}
                    >
                      {/* Node Header: Project Badge + Key + Status */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="size-2 rounded-full shrink-0"
                            style={{ backgroundColor: node.projectColor }}
                          />
                          <span className="font-mono text-[9px] font-bold text-neutral-200 truncate">
                            {node.key}
                          </span>
                          <span className="text-[8px] font-semibold text-neutral-400 truncate hidden sm:inline">
                            • {node.projectKey}
                          </span>
                        </div>

                        <span
                          className={`px-1.5 py-0.2 text-[8px] font-bold rounded-md uppercase shrink-0 ${
                            isDone
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : node.status === 'IN_PROGRESS'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          }`}
                        >
                          {node.status}
                        </span>
                      </div>

                      {/* Node Summary Text */}
                      <p className="text-[10.5px] font-semibold text-neutral-100 truncate mt-0.5">
                        {node.name}
                      </p>

                      {/* Node Footer: Assignee + In/Out degrees */}
                      <div className="flex items-center justify-between text-[8.5px] text-neutral-400 pt-1 border-t border-neutral-800">
                        <div className="flex items-center gap-1">
                          {node.assignee ? (
                            <span className="text-neutral-300 truncate max-w-[90px]">
                              {node.assignee.name}
                            </span>
                          ) : (
                            <span className="text-neutral-500 italic">Unassigned</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {node.isBlocked && (
                            <span className="px-1 rounded bg-rose-950 text-rose-300 font-bold border border-rose-800">
                              BLOCKED
                            </span>
                          )}
                          <span className="text-neutral-400 font-mono">
                            in:{node.inDegree} out:{node.outDegree}
                          </span>
                        </div>
                      </div>
                    </div>
                  </foreignObject>
                );
              })}
            </g>
          </svg>

          {/* Empty filtered view state inside graph */}
          {filteredNodes.length === 0 && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <GitFork className="size-10 text-neutral-600" />
              <p className="text-sm font-bold text-neutral-300">No matching dependency relationships</p>
              <p className="text-xs text-neutral-500 max-w-xs">
                Try clearing your search filters or click below to automatically generate realistic cross-project demo links.
              </p>
              {graphData.edges.length === 0 && (
                <button
                  onClick={() => seedDemoMutation.mutate()}
                  disabled={seedDemoMutation.isPending}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="size-4" />
                  <span>{seedDemoMutation.isPending ? 'Generating...' : 'Seed Sample Dependency Links'}</span>
                </button>
              )}
            </div>
          )}

          {/* Interactive Selected Node Inspector Drawer */}
          {selectedNode && (
            <div className="absolute bottom-3 left-3 right-3 bg-neutral-900/95 backdrop-blur-md rounded-xl border border-neutral-700/90 p-4 text-xs text-neutral-200 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 z-20">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-3 rounded-full shrink-0"
                    style={{ backgroundColor: selectedNode.projectColor }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-blue-400 text-xs">{selectedNode.key}</span>
                      <button
                        onClick={() => handleCopyKey(selectedNode.key)}
                        className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-200 cursor-pointer"
                        title="Copy Key"
                      >
                        <Copy className="size-3" />
                      </button>
                      <h4 className="font-bold text-neutral-100 text-xs">{selectedNode.name}</h4>
                      <span className="text-[10px] text-neutral-400">({selectedNode.projectName})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick Status Selector */}
                  <div className="flex items-center gap-1 bg-neutral-800 p-0.5 rounded-lg border border-neutral-700">
                    <span className="text-[10px] font-bold text-neutral-400 px-2">Status:</span>
                    {['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((st) => (
                      <button
                        key={st}
                        onClick={() => updateTaskStatusMutation.mutate({ taskId: selectedNode.id, status: st })}
                        className={`px-2 py-0.8 rounded text-[9px] font-bold transition cursor-pointer ${
                          selectedNode.status === st
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      toast.info(`Opening ${selectedNode.key}...`);
                      openEditTaskModal(selectedNode.id);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold border border-neutral-700 text-[11px] flex items-center gap-1 transition cursor-pointer"
                  >
                    <ExternalLink className="size-3 text-blue-400" />
                    <span>Open Details</span>
                  </button>

                  <button
                    onClick={() => openLinkModalForNode(selectedNode.id, true)}
                    className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>+ Link Blocker</span>
                  </button>

                  <button
                    onClick={() => setSelectedNodeId(null)}
                    className="p-1 text-neutral-400 hover:text-neutral-200 rounded-lg hover:bg-neutral-800 cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* Upstream & Downstream Dependency Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3">
                {/* 1. Upstream Blockers (Prerequisites for this issue) */}
                <div className="bg-neutral-950/60 rounded-lg border border-neutral-800/80 p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Clock className="size-3 text-amber-400" /> Upstream Prerequisites ({selectedNodeUpstreamEdges.length})
                    </span>
                  </div>
                  {selectedNodeUpstreamEdges.length === 0 ? (
                    <p className="text-[11px] text-neutral-500 italic">No incoming blocking issues. Ready to proceed.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                      {selectedNodeUpstreamEdges.map((e) => (
                        <div key={e.id} className="flex items-center justify-between bg-neutral-900/90 px-2 py-1 rounded border border-neutral-800">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-mono text-[9px] font-bold text-amber-300">{e.sourceKey}</span>
                            <span className="text-[10px] text-neutral-300 truncate max-w-[140px]">{e.sourceName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[8.5px] font-bold px-1.5 py-0.2 rounded ${e.sourceStatus === 'DONE' ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                              {e.sourceStatus}
                            </span>
                            <button
                              onClick={() => deleteMutation.mutate(e.id)}
                              className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer"
                              title="Unlink"
                            >
                              <Trash2 className="size-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Downstream Blocked Tasks */}
                <div className="bg-neutral-950/60 rounded-lg border border-neutral-800/80 p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="size-3 text-rose-400" /> Downstream Blocked Issues ({selectedNodeDownstreamEdges.length})
                    </span>
                  </div>
                  {selectedNodeDownstreamEdges.length === 0 ? (
                    <p className="text-[11px] text-neutral-500 italic">This issue does not block any downstream tasks.</p>
                  ) : (
                    <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                      {selectedNodeDownstreamEdges.map((e) => (
                        <div key={e.id} className="flex items-center justify-between bg-neutral-900/90 px-2 py-1 rounded border border-neutral-800">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-mono text-[9px] font-bold text-rose-300">{e.targetKey}</span>
                            <span className="text-[10px] text-neutral-300 truncate max-w-[140px]">{e.targetName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                              {e.targetStatus}
                            </span>
                            <button
                              onClick={() => deleteMutation.mutate(e.id)}
                              className="text-neutral-500 hover:text-rose-400 p-0.5 cursor-pointer"
                              title="Unlink"
                            >
                              <Trash2 className="size-2.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Table View (Granular List of all Links & Unlink Actions) */}
      {viewMode === 'table' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <List className="size-3.5 text-purple-600" />
              Active Dependency Links Matrix ({graphData.edges.length})
            </h2>
            <button
              onClick={() => {
                setModalPrefills({ sourceTaskId: '', targetTaskId: '' });
                setIsCreateModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="size-3.5" />
              <span>Add Link</span>
            </button>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-neutral-500">Loading dependency records...</div>
          ) : graphData.edges.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500 space-y-2">
              <p>No cross-project dependency links registered yet.</p>
              <button
                onClick={() => seedDemoMutation.mutate()}
                disabled={seedDemoMutation.isPending}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="size-3.5" />
                <span>Seed Sample Links</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold uppercase text-neutral-500 tracking-wider">
                    <th className="py-2.5 px-3">Source Issue (Prerequisite)</th>
                    <th className="py-2.5 px-3">Relationship</th>
                    <th className="py-2.5 px-3">Target Issue (Dependent)</th>
                    <th className="py-2.5 px-3">Cross-Project</th>
                    <th className="py-2.5 px-3">Blocker Health</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                  {graphData.edges.map((edge) => (
                    <tr key={edge.id} className="hover:bg-neutral-50/80 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              toast.info(`Opening ${edge.sourceKey}...`);
                              openEditTaskModal(edge.source);
                            }}
                            className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 hover:bg-blue-100 cursor-pointer flex items-center gap-1"
                          >
                            <span>{edge.sourceKey}</span>
                            <ExternalLink className="size-2.5" />
                          </button>
                          <span className="font-bold text-neutral-900 text-xs truncate max-w-xs">{edge.sourceName}</span>
                          <span className="text-[10px] text-neutral-400">({edge.sourceProject?.key})</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-semibold text-[10px]">
                          <ArrowRight className="size-2.5 text-neutral-400" />
                          {edge.relationshipType}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              toast.info(`Opening ${edge.targetKey}...`);
                              openEditTaskModal(edge.target);
                            }}
                            className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 hover:bg-purple-100 cursor-pointer flex items-center gap-1"
                          >
                            <span>{edge.targetKey}</span>
                            <ExternalLink className="size-2.5" />
                          </button>
                          <span className="font-bold text-neutral-900 text-xs truncate max-w-xs">{edge.targetName}</span>
                          <span className="text-[10px] text-neutral-400">({edge.targetProject?.key})</span>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {edge.isCrossProject ? (
                          <span className="rounded-md bg-purple-100 text-purple-800 px-2 py-0.5 text-[10px] font-bold">
                            {edge.sourceProject?.key} ➔ {edge.targetProject?.key}
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[10px]">Same Project</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            edge.isActiveBlocker
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {edge.isActiveBlocker ? (
                            <>
                              <AlertTriangle className="size-2.5" /> Active Blocker ({edge.sourceStatus})
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="size-2.5" /> Resolved / Unblocked
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={async () => {
                            const ok = await confirmAction({
                              title: 'Remove Dependency Relationship',
                              message: `Are you sure you want to remove this ${edge.relationship || 'blocking'} link between "${edge.sourceTaskKey || 'Source'}" and "${edge.targetTaskKey || 'Target'}"?`,
                              variant: 'destructive',
                              confirmText: 'Remove Link',
                              warningNotice: 'The blocker relationship will be severed and critical path sequencing on Gantt and timeline views will update.'
                            });
                            if (ok) {
                              deleteMutation.mutate(edge.id);
                            }
                          }}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete Dependency Link"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 5. Matrix View (Cross-Project Dependencies Grid) */}
      {viewMode === 'matrix' && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <LayoutGrid className="size-3.5 text-emerald-600" />
              Cross-Project Dependency Interaction Matrix
            </h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Identifies which squads and repositories hold critical blocking prerequisites for other teams.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-[10px] font-bold uppercase text-neutral-500">
                  <th className="py-3 px-3 text-left">Source Project (Blocking)</th>
                  {projectsList.map((p) => (
                    <th key={p.id} className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <span className="size-2 rounded-full" style={{ backgroundColor: p.color }} />
                        <span>{p.key}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium">
                {projectsList.map((sourceP) => (
                  <tr key={sourceP.id} className="hover:bg-neutral-50/70 transition">
                    <td className="py-3 px-3 text-left font-bold text-neutral-900">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: sourceP.color }} />
                        <span>{sourceP.name} ({sourceP.key})</span>
                      </div>
                    </td>

                    {projectsList.map((targetP) => {
                      const count = (graphData.edges || []).filter(
                        (e) =>
                          e.sourceProject?.id === sourceP.id &&
                          e.targetProject?.id === targetP.id
                      ).length;

                      const activeBlockerCount = (graphData.edges || []).filter(
                        (e) =>
                          e.sourceProject?.id === sourceP.id &&
                          e.targetProject?.id === targetP.id &&
                          e.isActiveBlocker
                      ).length;

                      return (
                        <td key={targetP.id} className="py-3 px-3">
                          {count > 0 ? (
                            <button
                              onClick={() => {
                                setViewMode('table');
                                toast.info(`Viewing links: ${sourceP.key} ➔ ${targetP.key}`);
                              }}
                              className={`inline-block px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer hover:opacity-85 transition ${
                                activeBlockerCount > 0
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {count} {activeBlockerCount > 0 ? `(${activeBlockerCount} blocked)` : ''}
                            </button>
                          ) : (
                            <span className="text-neutral-300 font-mono">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Interactive Link Dependency Creation Modal */}
      {isCreateModalOpen && (
        <CreateDependencyModal
          nodes={graphData.nodes || []}
          projects={projectsList}
          initialSourceTaskId={modalPrefills.sourceTaskId}
          initialTargetTaskId={modalPrefills.targetTaskId}
          onClose={() => {
            setIsCreateModalOpen(false);
            setModalPrefills({ sourceTaskId: '', targetTaskId: '' });
          }}
          onSubmit={(payload) => createMutation.mutate(payload)}
          loading={createMutation.isPending}
        />
      )}
      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};

// ==========================================
// Sub-Component: Create Dependency Modal
// ==========================================
const CreateDependencyModal = ({
  nodes = [],
  projects = [],
  initialSourceTaskId = '',
  initialTargetTaskId = '',
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [sourceProject, setSourceProject] = useState('ALL');
  const [sourceTaskId, setSourceTaskId] = useState(initialSourceTaskId);
  const [relationshipType, setRelationshipType] = useState('blocks');
  const [targetProject, setTargetProject] = useState('ALL');
  const [targetTaskId, setTargetTaskId] = useState(initialTargetTaskId);

  // If initial IDs passed, set their project dropdowns automatically
  useEffect(() => {
    if (initialSourceTaskId) {
      const src = nodes.find((n) => n.id === initialSourceTaskId);
      if (src) {
        setSourceProject(src.projectId || 'ALL');
        setSourceTaskId(initialSourceTaskId);
      }
    }
  }, [initialSourceTaskId, nodes]);

  useEffect(() => {
    if (initialTargetTaskId) {
      const tgt = nodes.find((n) => n.id === initialTargetTaskId);
      if (tgt) {
        setTargetProject(tgt.projectId || 'ALL');
        setTargetTaskId(initialTargetTaskId);
      }
    }
  }, [initialTargetTaskId, nodes]);

  const filteredSourceTasks = useMemo(() => {
    return nodes.filter(
      (n) => sourceProject === 'ALL' || n.projectId === sourceProject
    );
  }, [nodes, sourceProject]);

  const filteredTargetTasks = useMemo(() => {
    return nodes.filter(
      (n) => (targetProject === 'ALL' || n.projectId === targetProject) && n.id !== sourceTaskId
    );
  }, [nodes, targetProject, sourceTaskId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sourceTaskId || !targetTaskId) {
      toast.error('Please select both a source issue and a target issue.');
      return;
    }
    if (sourceTaskId === targetTaskId) {
      toast.error('An issue cannot depend on itself.');
      return;
    }
    onSubmit({
      sourceTaskId,
      targetTaskId,
      relationshipType,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <GitFork className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Link Cross-Project Dependency</h3>
              <p className="text-[11px] text-neutral-500">Connect blockers and prerequisites across squads.</p>
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
          {/* 1. Source Task (The Blocker / Prerequisite) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <label className="font-bold text-neutral-800 block uppercase tracking-wider text-[10px]">
              1. Source Issue (Prerequisite / Trigger)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={sourceProject}
                onChange={(e) => {
                  setSourceProject(e.target.value);
                  setSourceTaskId('');
                }}
                className="h-8.5 rounded-lg border border-neutral-200 bg-white px-2 text-xs font-semibold focus:outline-hidden"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.key}
                  </option>
                ))}
              </select>

              <select
                value={sourceTaskId}
                onChange={(e) => setSourceTaskId(e.target.value)}
                required
                className="col-span-2 h-8.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold focus:outline-hidden"
              >
                <option value="">Select source issue...</option>
                {filteredSourceTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.key} • {t.name} ({t.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 2. Relationship Type */}
          <div className="space-y-1.5 text-center">
            <label className="font-bold text-neutral-600 block uppercase tracking-wider text-[10px]">
              Relationship Type
            </label>
            <select
              value={relationshipType}
              onChange={(e) => setRelationshipType(e.target.value)}
              className="h-8.5 w-full rounded-lg border border-blue-200 bg-blue-50/60 px-3 text-xs font-bold text-blue-900 focus:outline-hidden"
            >
              <option value="blocks">blocks (Target cannot finish until Source is DONE)</option>
              <option value="is blocked by">is blocked by</option>
              <option value="relates to">relates to</option>
              <option value="duplicates">duplicates</option>
            </select>
          </div>

          {/* 3. Target Task (The Dependent) */}
          <div className="space-y-1.5 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80">
            <label className="font-bold text-neutral-800 block uppercase tracking-wider text-[10px]">
              2. Target Issue (Dependent Issue)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={targetProject}
                onChange={(e) => {
                  setTargetProject(e.target.value);
                  setTargetTaskId('');
                }}
                className="h-8.5 rounded-lg border border-neutral-200 bg-white px-2 text-xs font-semibold focus:outline-hidden"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.key}
                  </option>
                ))}
              </select>

              <select
                value={targetTaskId}
                onChange={(e) => setTargetTaskId(e.target.value)}
                required
                className="col-span-2 h-8.5 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold focus:outline-hidden"
              >
                <option value="">Select target issue...</option>
                {filteredTargetTasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.key} • {t.name} ({t.status})
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              disabled={loading || !sourceTaskId || !targetTaskId}
              className="h-9 px-4 rounded-xl bg-blue-600 font-bold text-white shadow-2xs hover:bg-blue-700 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Linking...' : 'Create Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrossProjectDependencyGraph;
