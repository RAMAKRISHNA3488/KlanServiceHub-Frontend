import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Calendar,
  Filter,
  RefreshCw,
  Download,
  Printer,
  ChevronDown,
  Sparkles,
  Users,
  Briefcase,
  Zap,
} from 'lucide-react';
import { reportsApi } from '@/lib/api-client';
import { toast } from 'sonner';

// Child components
import { CfdSummaryCards } from './cfd-summary-cards';
import { CumulativeFlowChart } from './cumulative-flow-chart';
import { BottleneckDiagnosticsCard } from './bottleneck-diagnostics-card';
import { CfdTicketDrilldownModal } from './cfd-ticket-drilldown-modal';
import { CfdSkeleton } from './cfd-skeleton';

export const CumulativeFlowSection = ({
  workspaceId,
  projects = [],
  teams = [],
  sprints = [],
  onOpenTask = null,
}) => {
  // Query Filter State
  const [filters, setFilters] = useState({
    projectId: 'ALL',
    teamId: 'ALL',
    sprintId: 'ALL',
    dateRange: '30d', // '7d' | '14d' | '30d' | '90d' | 'custom'
    startDate: '',
    endDate: '',
    interval: 'daily', // 'daily' | 'weekly' | 'monthly'
  });

  // Data States
  const [loading, setLoading] = useState(true);
  const [cfdData, setCfdData] = useState({
    timeline: [],
    statuses: [],
    dateRange: {},
    totalTickets: 0,
  });
  const [summary, setSummary] = useState({
    totalTickets: 0,
    wip: 0,
    completedTickets: 0,
    throughput: { daily: 0, weekly: 0 },
    avgCycleTimeDays: 0,
    avgLeadTimeDays: 0,
    bottleneck: {
      stage: 'Optimal Flow',
      isBottleneck: false,
      severity: 'NORMAL',
      accumulatedCount: 0,
      avgDwellTimeDays: 0,
      message: 'Work is flowing evenly across all stages.',
    },
  });
  const [bottlenecks, setBottlenecks] = useState({
    primary: {},
    stages: [],
  });

  // Drill-down Modal State
  const [drillDownState, setDrillDownState] = useState({
    isOpen: false,
    params: {},
  });

  // Fetch CFD Data from API
  const fetchCFD = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);

      const params = {
        ...filters,
      };

      const getCfdFn = reportsApi.getCFD || reportsApi.getCumulativeFlow;
      const getSummaryFn = reportsApi.getCFDSummary || reportsApi.getCumulativeFlowSummary;
      const getBottlenecksFn = reportsApi.getCFDBottlenecks || reportsApi.getCumulativeFlowBottlenecks;

      const [chartRes, summaryRes, bottleneckRes] = await Promise.allSettled([
        getCfdFn ? getCfdFn(workspaceId, params) : Promise.reject('API not available'),
        getSummaryFn ? getSummaryFn(workspaceId, params) : Promise.reject('API not available'),
        getBottlenecksFn ? getBottlenecksFn(workspaceId, params) : Promise.reject('API not available'),
      ]);

      if (chartRes.status === 'fulfilled' && chartRes.value?.data) {
        setCfdData(chartRes.value.data);
      }
      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
        setSummary(summaryRes.value.data);
      }
      if (bottleneckRes.status === 'fulfilled' && bottleneckRes.value?.data) {
        setBottlenecks(bottleneckRes.value.data);
      }
    } catch (e) {
      console.error('Failed to load CFD analytics', e);
      toast.error('Failed to load Cumulative Flow analytics');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, filters]);

  useEffect(() => {
    fetchCFD();
  }, [fetchCFD]);

  // Synchronize when tasks are updated or transitioned in the workspace
  useEffect(() => {
    const handleTaskUpdated = () => {
      fetchCFD();
    };
    window.addEventListener('klanservicehub-task-updated', handleTaskUpdated);
    return () => window.removeEventListener('klanservicehub-task-updated', handleTaskUpdated);
  }, [fetchCFD]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDrillDown = (params) => {
    setDrillDownState({
      isOpen: true,
      params: {
        ...filters,
        ...params,
      },
    });
  };

  const handleCloseDrillDown = () => {
    setDrillDownState({ isOpen: false, params: {} });
  };

  // Export CFD Timeline Matrix to CSV
  const exportCfdCsv = () => {
    const { timeline = [], statuses = [] } = cfdData;
    if (timeline.length === 0) return;

    const headers = ['Date', ...statuses.map((s) => s.label), 'Cumulative Total'];
    const rows = timeline.map((bucket) => {
      const counts = statuses.map((s) => bucket.statuses?.[s.key] || 0);
      return [bucket.date, ...counts, bucket.total || 0];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cumulative-flow-diagram-${filters.dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CFD timeline exported to CSV');
  };

  // Export / Print CFD to PDF
  const handlePrintPdf = () => {
    window.print();
  };

  const dateRangePills = [
    { id: '7d', label: 'Last 7 days' },
    { id: '14d', label: 'Last 14 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: '90d', label: 'Last 90 days' },
    { id: 'custom', label: 'Custom' },
  ];

  if (loading && (!cfdData.timeline || cfdData.timeline.length === 0)) {
    return <CfdSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* CFD Section Header & Filter Toolbar */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="size-5 text-blue-600" />
              <h2 className="text-base font-bold text-neutral-900">Cumulative Flow Diagram</h2>
              <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.2 text-[9px] font-bold">
                Kanban Flow Telemetry
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Reconstructed historical ticket distributions across workflow statuses to reveal Work In Progress (WIP), cycle times, and process bottlenecks.
            </p>
          </div>

          {/* Action Buttons: Refresh, CSV Export, PDF Export */}
          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
            <button
              onClick={fetchCFD}
              disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition"
              title="Refresh CFD data"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={exportCfdCsv}
              disabled={loading || cfdData.timeline?.length === 0}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition disabled:opacity-50"
              title="Export Cumulative Flow data to CSV"
            >
              <Download className="size-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition"
              title="Print or save as PDF"
            >
              <Printer className="size-3.5" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Filters Controls Row */}
        <div className="pt-3 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Range Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mr-1">Time Range:</span>
            {dateRangePills.map((p) => (
              <button
                key={p.id}
                onClick={() => handleFilterChange('dateRange', p.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  filters.dateRange === p.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {p.label}
              </button>
            ))}

            {/* Custom Date Inputs */}
            {filters.dateRange === 'custom' && (
              <div className="flex items-center gap-1.5 ml-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-xs text-neutral-400">to</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="rounded-lg border border-neutral-300 px-2 py-1 text-xs text-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          {/* Project, Team, and Sprint Dropdown Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Selector */}
            <div className="relative">
              <select
                value={filters.projectId}
                onChange={(e) => handleFilterChange('projectId', e.target.value)}
                className="appearance-none rounded-lg border border-neutral-300 bg-white pl-2.5 pr-7 py-1 text-xs font-semibold text-neutral-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2 size-3 text-neutral-400" />
            </div>

            {/* Team Selector */}
            <div className="relative">
              <select
                value={filters.teamId}
                onChange={(e) => handleFilterChange('teamId', e.target.value)}
                className="appearance-none rounded-lg border border-neutral-300 bg-white pl-2.5 pr-7 py-1 text-xs font-semibold text-neutral-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="ALL">All Teams</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2 size-3 text-neutral-400" />
            </div>

            {/* Sprint Selector */}
            {sprints && sprints.length > 0 && (
              <div className="relative">
                <select
                  value={filters.sprintId}
                  onChange={(e) => handleFilterChange('sprintId', e.target.value)}
                  className="appearance-none rounded-lg border border-neutral-300 bg-white pl-2.5 pr-7 py-1 text-xs font-semibold text-neutral-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Sprints</option>
                  {sprints.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-2 size-3 text-neutral-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 1. Analytics Summary Cards (7 KPIs) */}
      <CfdSummaryCards
        summary={summary}
        loading={loading}
        onDrillDown={handleDrillDown}
      />

      {/* 2. Interactive Cumulative Flow Chart */}
      <CumulativeFlowChart
        data={cfdData}
        loading={loading}
        interval={filters.interval}
        onIntervalChange={(intv) => handleFilterChange('interval', intv)}
        onDrillDown={handleDrillDown}
      />

      {/* 3. Automated Bottleneck Detection & Process Diagnostics */}
      <BottleneckDiagnosticsCard
        bottlenecks={bottlenecks}
        loading={loading}
        onDrillDown={handleDrillDown}
        onOpenTask={onOpenTask}
      />

      {/* 4. Ticket-Level Drill-Down Modal */}
      <CfdTicketDrilldownModal
        isOpen={drillDownState.isOpen}
        onClose={handleCloseDrillDown}
        workspaceId={workspaceId}
        drillParams={drillDownState.params}
        onOpenTask={onOpenTask}
      />
    </div>
  );
};
