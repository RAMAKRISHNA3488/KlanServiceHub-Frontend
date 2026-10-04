import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  PlusSquare,
  Search,
  RefreshCw,
  Radio,
  SlidersHorizontal,
  ExternalLink,
  Users,
  Target,
  Download,
  Calendar,
  Sparkles,
  ShieldAlert,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

export const EpicProgressCard = ({
  epicsData = [],
  loading = false,
  onDrillDown,
  onOpenHelp,
  onCreateEpic,
  onRefresh,
}) => {
  // Real-time states
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState('ALL'); // 'ALL' | 'On track' | 'At risk' | 'Overdue' | 'Completed' | 'Blocked'
  const [sortBy, setSortBy] = useState('completionPercentage'); // 'completionPercentage' | 'dueDate' | 'totalChildItems' | 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [expandedEpicId, setExpandedEpicId] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh interval (every 20 seconds if active)
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;
    const interval = setInterval(() => {
      onRefresh();
      setLastRefreshedAt(new Date());
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefreshedAt(new Date());
      toast.success('Epic telemetry updated in real time');
    } catch (e) {
      toast.error('Failed to refresh epics');
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  // Health Badge styling helper
  const getHealthBadge = (health) => {
    switch (health) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
            <AlertTriangle className="size-2.5" />
            Overdue
          </span>
        );
      case 'Blocked':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-200">
            <ShieldAlert className="size-2.5" />
            Blocked
          </span>
        );
      case 'At risk':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
            <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
            At risk
          </span>
        );
      case 'On track':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
            <span className="size-1.5 rounded-full bg-blue-500" />
            On track
          </span>
        );
    }
  };

  // Aggregated calculations across all Epics
  const summaryStats = useMemo(() => {
    if (!epicsData.length) return null;
    const totalEpics = epicsData.length;
    const completedEpics = epicsData.filter((e) => e.healthStatus === 'Completed').length;
    const onTrackEpics = epicsData.filter((e) => e.healthStatus === 'On track').length;
    const atRiskEpics = epicsData.filter((e) => e.healthStatus === 'At risk').length;
    const overdueEpics = epicsData.filter((e) => e.healthStatus === 'Overdue').length;

    const totalChildTasks = epicsData.reduce((acc, e) => acc + (e.totalChildItems || 0), 0);
    const completedChildTasks = epicsData.reduce((acc, e) => acc + (e.completedChildItems || 0), 0);
    const inProgressChildTasks = epicsData.reduce((acc, e) => acc + (e.inProgressChildItems || 0), 0);
    const totalPoints = epicsData.reduce((acc, e) => acc + (e.totalStoryPoints || 0), 0);
    const completedPoints = epicsData.reduce((acc, e) => acc + (e.completedStoryPoints || 0), 0);

    const overallPercentage =
      totalChildTasks > 0 ? Math.round((completedChildTasks / totalChildTasks) * 100) : 0;

    return {
      totalEpics,
      completedEpics,
      onTrackEpics,
      atRiskEpics,
      overdueEpics,
      totalChildTasks,
      completedChildTasks,
      inProgressChildTasks,
      totalPoints,
      completedPoints,
      overallPercentage,
    };
  }, [epicsData]);

  // Filter and sort epics list
  const filteredEpics = useMemo(() => {
    let list = epicsData.filter((epic) => {
      const matchSearch =
        !searchTerm ||
        epic.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        epic.key?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        epic.projectName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchHealth =
        healthFilter === 'ALL' || epic.healthStatus === healthFilter;

      return matchSearch && matchHealth;
    });

    list.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === 'dueDate') {
        valA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        valB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });

    return list;
  }, [epicsData, searchTerm, healthFilter, sortBy, sortOrder]);

  // Export Epics CSV
  const handleExportCSV = () => {
    if (!epicsData.length) return;
    const headers = [
      'Epic Key',
      'Epic Name',
      'Project',
      'Status',
      'Health Status',
      'Total Child Items',
      'Completed Items',
      'In Progress Items',
      'Open Items',
      'Overdue Items',
      'Completion Rate',
      'Total Story Points',
      'Due Date',
    ];

    const rows = epicsData.map((e) => [
      `"${e.key}"`,
      `"${e.name}"`,
      `"${e.projectName || ''}"`,
      `"${e.status || ''}"`,
      `"${e.healthStatus || 'On track'}"`,
      e.totalChildItems || 0,
      e.completedChildItems || 0,
      e.inProgressChildItems || 0,
      e.openChildItems || 0,
      e.overdueChildItems || 0,
      `${e.completionPercentage || 0}%`,
      e.totalStoryPoints || 0,
      `"${e.dueDate || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `epics_progress_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Epics progress CSV exported successfully!');
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs animate-pulse space-y-4 min-h-[380px]">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 bg-neutral-200 rounded-lg" />
          <div className="h-4 w-20 bg-neutral-100 rounded-full" />
        </div>
        <div className="h-3 w-64 bg-neutral-100 rounded" />
        <div className="grid grid-cols-4 gap-2 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-neutral-100 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3 pt-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-neutral-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = epicsData.length === 0;

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-5 transition-all hover:shadow-sm">
      {/* 1. Header & Live Telemetry Pulse Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Zap className="size-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-neutral-900">Epic Progress & Delivery Telemetry</h3>
                <span className="relative flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                  <span className="relative flex size-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full size-1.5 bg-emerald-500"></span>
                  </span>
                  Real-time
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Live child task tracking, story point burndown, and health diagnostics across initiatives.
              </p>
            </div>
          </div>
        </div>

        {/* Live Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Auto-refresh active (every 20s)' : 'Auto-refresh paused'}
            className={`h-8 px-2.5 rounded-lg text-[10px] font-semibold border transition flex items-center gap-1.5 ${
              autoRefresh
                ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800'
                : 'border-neutral-200 bg-neutral-50 text-neutral-500 hover:text-neutral-700'
            }`}
          >
            <span className={`size-1.5 rounded-full ${autoRefresh ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
            <span>{autoRefresh ? 'Live Sync' : 'Sync Paused'}</span>
          </button>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            title="Refresh Epics Telemetry Now"
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 shadow-2xs transition"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {!isEmpty && (
            <button
              onClick={handleExportCSV}
              title="Download Epics CSV Report"
              className="h-8 px-2.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 text-xs font-semibold shadow-2xs transition flex items-center gap-1.5"
            >
              <Download className="size-3 text-purple-600" />
              <span className="text-[11px] hidden sm:inline">Export</span>
            </button>
          )}

          {onCreateEpic && (
            <button
              onClick={onCreateEpic}
              className="h-8 px-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 text-xs font-bold shadow-2xs transition flex items-center gap-1.5"
            >
              <PlusSquare className="size-3.5" />
              <span>+ Create Epic</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Real-Time Aggregate KPI Bar */}
      {summaryStats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3 rounded-xl bg-neutral-50/80 border border-neutral-200/80 text-xs">
          <div className="p-2 rounded-lg bg-white border border-neutral-200/60 text-center">
            <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">Total Epics</span>
            <span className="text-base font-bold text-neutral-900">{summaryStats.totalEpics}</span>
          </div>

          <div className="p-2 rounded-lg bg-white border border-neutral-200/60 text-center">
            <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">Overall Delivery</span>
            <span className="text-base font-bold text-emerald-600">{summaryStats.overallPercentage}%</span>
          </div>

          <div className="p-2 rounded-lg bg-white border border-neutral-200/60 text-center">
            <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">Child Tasks</span>
            <span className="text-base font-bold text-blue-600">
              {summaryStats.completedChildTasks}/{summaryStats.totalChildTasks}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-white border border-neutral-200/60 text-center">
            <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">Velocity Points</span>
            <span className="text-base font-bold text-purple-700">
              {summaryStats.completedPoints}/{summaryStats.totalPoints} pts
            </span>
          </div>

          <div className="p-2 rounded-lg bg-white border border-neutral-200/60 text-center col-span-2 sm:col-span-1">
            <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-wider">Health Status</span>
            <div className="flex items-center justify-center gap-1.5 mt-0.5">
              <span className="text-emerald-700 font-bold text-xs">{summaryStats.onTrackEpics + summaryStats.completedEpics} OK</span>
              {(summaryStats.atRiskEpics > 0 || summaryStats.overdueEpics > 0) && (
                <span className="text-rose-600 font-bold text-xs">
                  • {summaryStats.atRiskEpics + summaryStats.overdueEpics} Risk
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Search, Health Filter & Sort Bar */}
      {!isEmpty && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search epics or projects..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-neutral-50/70 border border-neutral-200 rounded-lg focus:bg-white focus:border-purple-500 focus:outline-hidden transition"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {['ALL', 'On track', 'At risk', 'Overdue', 'Completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setHealthFilter(tab)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                  healthFilter === tab
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200/70'
                }`}
              >
                {tab === 'ALL' ? 'All Epics' : tab}
              </button>
            ))}

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sorting: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              className="h-7 px-2 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 text-[10px] font-semibold flex items-center gap-1 shadow-2xs transition ml-1"
            >
              <ArrowUpDown className="size-3" />
              <span>{sortOrder.toUpperCase()}</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Epics List / Real-Time Progress Rows */}
      {isEmpty ? (
        /* Empty State with Jira Epic illustration */
        <div className="my-auto flex flex-col items-center justify-center py-10 text-center select-none space-y-3">
          <div className="relative size-14 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-1.5 size-12">
              <div className="bg-neutral-200 rounded-md" />
              <div className="bg-neutral-200 rounded-md" />
              <div className="bg-neutral-200 rounded-md" />
              <div className="bg-purple-600 rounded-md flex items-center justify-center shadow-xs">
                <span className="text-white font-bold text-sm">+</span>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm font-bold text-neutral-900 block">No Active Epics Found</span>
            <p className="text-xs text-neutral-500 max-w-sm">
              Use epics to organize large initiatives and monitor real-time child work item delivery.{' '}
              <button
                onClick={onOpenHelp}
                className="text-purple-600 hover:underline font-semibold"
              >
                Learn more
              </button>
            </p>
          </div>
          {onCreateEpic && (
            <button
              onClick={onCreateEpic}
              className="h-8.5 px-4 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 shadow-2xs transition"
            >
              + Create First Epic
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-neutral-100 max-h-[380px] overflow-y-auto custom-scrollbar space-y-1 pr-1">
          {filteredEpics.map((epic) => {
            const isExpanded = expandedEpicId === epic.id;
            const completedCount = epic.completedChildItems || 0;
            const inProgressCount = epic.inProgressChildItems || 0;
            const openCount = epic.openChildItems || 0;
            const overdueCount = epic.overdueChildItems || 0;
            const totalCount = epic.totalChildItems || 0;

            const completedPct = totalCount > 0 ? (completedCount / totalCount) * 100 : epic.completionPercentage || 0;
            const inProgressPct = totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0;
            const openPct = totalCount > 0 ? (openCount / totalCount) * 100 : 0;

            return (
              <div
                key={epic.id}
                className="py-3 px-2.5 rounded-xl hover:bg-neutral-50/80 transition group space-y-2 border border-transparent hover:border-neutral-200/70"
              >
                {/* Top Row: Title, Key, Project, Health Badge, Expand */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      onClick={() => setExpandedEpicId(isExpanded ? null : epic.id)}
                      title={isExpanded ? 'Collapse child tasks' : 'Expand child tasks'}
                      className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 transition shrink-0"
                    >
                      {isExpanded ? <ChevronDown className="size-3.5 text-purple-600" /> : <ChevronRight className="size-3.5" />}
                    </button>

                    <div className="p-1.5 rounded-lg bg-purple-100/70 text-purple-700 shrink-0">
                      <Zap className="size-3.5" />
                    </div>

                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100 shrink-0">
                      {epic.key}
                    </span>

                    <span
                      onClick={() =>
                        onDrillDown &&
                        onDrillDown({ epicId: epic.id, title: `Epic: ${epic.name}` })
                      }
                      title={epic.name}
                      className="font-bold text-xs text-neutral-900 hover:text-purple-700 transition truncate cursor-pointer"
                    >
                      {epic.name}
                    </span>

                    {epic.projectName && (
                      <span className="text-[10px] text-neutral-400 hidden md:inline truncate">
                        • {epic.projectName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {epic.daysRemaining !== null && (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          epic.daysRemaining < 0
                            ? 'bg-rose-50 text-rose-700 font-bold border border-rose-200'
                            : epic.daysRemaining <= 3
                            ? 'bg-amber-50 text-amber-800 font-bold border border-amber-200'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {epic.daysRemaining < 0
                          ? `Overdue by ${Math.abs(epic.daysRemaining)}d`
                          : epic.daysRemaining === 0
                          ? 'Due today'
                          : `${epic.daysRemaining}d left`}
                      </span>
                    )}

                    {getHealthBadge(epic.healthStatus)}

                    <button
                      onClick={() =>
                        onDrillDown &&
                        onDrillDown({ epicId: epic.id, title: `Epic: ${epic.name} Work Items` })
                      }
                      title="Drill down into child items"
                      className="p-1 rounded text-neutral-300 hover:text-purple-600 transition"
                    >
                      <ExternalLink className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Real-Time Multi-Segment Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-800">{epic.completionPercentage}% delivered</span>
                      <span className="text-neutral-400 font-medium text-[10px]">
                        ({completedCount}/{totalCount} child tasks)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-neutral-500 font-semibold">
                      {epic.totalStoryPoints > 0 && (
                        <span className="text-purple-700">
                          {epic.completedStoryPoints}/{epic.totalStoryPoints} pts
                        </span>
                      )}
                      <span className="text-emerald-600">{completedCount} done</span>
                      <span className="text-blue-600">{inProgressCount} active</span>
                      <span className="text-neutral-400">{openCount} open</span>
                      {overdueCount > 0 && <span className="text-rose-600 font-bold">{overdueCount} overdue</span>}
                    </div>
                  </div>

                  {/* Segmented Bar */}
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden flex">
                    <div
                      title={`Completed: ${completedCount} tasks (${Math.round(completedPct)}%)`}
                      style={{ width: `${completedPct}%` }}
                      className="h-full bg-emerald-500 transition-all duration-300"
                    />
                    <div
                      title={`In Progress: ${inProgressCount} tasks (${Math.round(inProgressPct)}%)`}
                      style={{ width: `${inProgressPct}%` }}
                      className="h-full bg-blue-500 transition-all duration-300"
                    />
                    <div
                      title={`Open / Backlog: ${openCount} tasks (${Math.round(openPct)}%)`}
                      style={{ width: `${openPct}%` }}
                      className="h-full bg-slate-300 transition-all duration-300"
                    />
                  </div>
                </div>

                {/* 5. Expandable Real-Time Child Work Items Drawer */}
                {isExpanded && (
                  <div className="mt-2.5 p-3 rounded-xl bg-neutral-50/90 border border-neutral-200/70 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-neutral-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Layers className="size-3 text-purple-600" />
                        Live Child Tasks ({totalCount})
                      </span>
                      <button
                        onClick={() =>
                          onDrillDown &&
                          onDrillDown({ epicId: epic.id, title: `All Child Items for ${epic.name}` })
                        }
                        className="text-purple-700 hover:underline font-bold text-[10px] flex items-center gap-1"
                      >
                        <span>View all in drill-down</span>
                        <ChevronRight className="size-3" />
                      </button>
                    </div>

                    {(epic.childTasks || []).length === 0 ? (
                      <div className="text-center py-3 text-neutral-400 text-xs font-medium">
                        No child work items linked to this epic yet.
                      </div>
                    ) : (
                      <div className="divide-y divide-neutral-200/50">
                        {epic.childTasks.map((ct) => (
                          <div
                            key={ct.id}
                            onClick={() =>
                              onDrillDown &&
                              onDrillDown({ taskId: ct.id, title: `Task: ${ct.name}` })
                            }
                            className="py-1.5 flex items-center justify-between gap-2 hover:bg-white/80 px-2 rounded-lg transition cursor-pointer text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="font-mono text-[9px] font-bold text-neutral-400">{ct.key}</span>
                              <span className="font-semibold text-neutral-800 truncate text-[11px]">{ct.name}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 text-[10px]">
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${
                                  ct.status === 'DONE'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : ct.status === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-neutral-200 text-neutral-700'
                                }`}
                              >
                                {ct.status}
                              </span>

                              {ct.storyPoints > 0 && (
                                <span className="text-neutral-500 font-semibold">{ct.storyPoints}pt</span>
                              )}

                              {ct.assignee && (
                                <div
                                  title={ct.assignee.name}
                                  className="size-4.5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold"
                                >
                                  {ct.assignee.avatarUrl ? (
                                    <img src={ct.assignee.avatarUrl} alt="" className="size-full rounded-full object-cover" />
                                  ) : (
                                    (ct.assignee.name || 'U').slice(0, 1)
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Footer */}
      <div className="pt-2 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-neutral-400 gap-2">
        <div className="flex items-center gap-1.5">
          <span>Telemetry synced live</span>
          <span>•</span>
          <span>Last refresh: {lastRefreshedAt.toLocaleTimeString()}</span>
        </div>

        <button
          onClick={onOpenHelp}
          className="text-purple-600 hover:underline font-semibold text-left sm:text-right"
        >
          What is an Epic in Jira?
        </button>
      </div>
    </div>
  );
};

export default EpicProgressCard;
