import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { reportsApi, tasksApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Download,
  Filter,
  Layers,
  Users,
  Briefcase,
  Bug,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  UserCheck,
} from 'lucide-react';

// Components
import { AnalyticsFilters } from './analytics-filters';
import { OverviewKPIs } from './overview-kpis';
import { StatusOverviewCard } from './status-overview-card';
import { WorkTypeBreakdownCard } from './work-type-breakdown-card';
import { PriorityBreakdownCard } from './priority-breakdown-card';
import { TeamWorkloadCard } from './team-workload-card';
import { EmployeeWorkloadCard } from './employee-workload-card';
import { EmployeeWiseReport } from './employee-wise-report';
import { EpicProgressCard } from './epic-progress-card';
import { AssigneeAnalyticsCard } from './assignee-analytics-card';
import { ProjectAnalyticsCard } from './project-analytics-card';
import { CreatedCompletedTrendCard } from './created-completed-trend-card';
import { SprintVelocityCard } from './sprint-velocity-card';
import { BugAnalyticsCard } from './bug-analytics-card';
import { OverdueAnalyticsCard } from './overdue-analytics-card';
import { ActivityFeedCard } from './activity-feed-card';
import { DrillDownModal } from './drill-down-modal';
import { ExportReportModal } from './export-report-modal';

// Task creation modal hook if available
import { useCreateTaskModal } from '@/features/tasks/hooks/use-create-task-modal';

export const OrganizationAnalyticsPage = () => {
  const workspaceId = useWorkspaceId();
  const [searchParams, setSearchParams] = useSearchParams();
  const { open: openCreateTaskModal } = useCreateTaskModal();

  // Active Tab View
  const [activeTab, setActiveTab] = useState('executive'); // 'executive' | 'workload' | 'projects' | 'quality' | 'activity'

  // Global Filter State (Initialized from URL query params)
  const [filters, setFilters] = useState({
    projectId: searchParams.get('projectId') || '',
    teamId: searchParams.get('teamId') || '',
    assigneeId: searchParams.get('assigneeId') || '',
    workType: searchParams.get('workType') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    sprintId: searchParams.get('sprintId') || '',
    epicId: searchParams.get('epicId') || '',
    dateRange: searchParams.get('dateRange') || '30d',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
  });

  // Trend Chart Interval
  const [trendInterval, setTrendInterval] = useState('daily');
  // Assignee Table Sort
  const [assigneeSort, setAssigneeSort] = useState('workload');

  // Modals state
  const [drillDownState, setDrillDownState] = useState({ isOpen: false, params: {} });
  const [exportModalOpen, setExportModalOpen] = useState(false);

  // Data States
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [statusData, setStatusData] = useState(null);
  const [workTypeData, setWorkTypeData] = useState(null);
  const [priorityData, setPriorityData] = useState(null);
  const [teamsData, setTeamsData] = useState([]);
  const [membersData, setMembersData] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [epicsData, setEpicsData] = useState([]);
  const [trendsData, setTrendsData] = useState(null);
  const [sprintsData, setSprintsData] = useState(null);
  const [bugData, setBugData] = useState(null);
  const [overdueData, setOverdueData] = useState(null);
  const [activities, setActivities] = useState([]);

  // Sync filters with URL query parameters
  const updateUrlParams = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, val]) => {
      if (val && val !== 'ALL') params.set(key, val);
    });
    setSearchParams(params, { replace: true });
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateUrlParams(newFilters);
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      projectId: '',
      teamId: '',
      assigneeId: '',
      workType: '',
      status: '',
      priority: '',
      sprintId: '',
      epicId: '',
      dateRange: '30d',
      startDate: '',
      endDate: '',
    };
    setFilters(defaultFilters);
    updateUrlParams(defaultFilters);
  };

  // Fetch all analytics datasets concurrently
  const fetchAllAnalytics = useCallback(async () => {
    if (!workspaceId) return;

    try {
      setLoading(true);

      const params = {
        ...filters,
        interval: trendInterval,
        sortBy: assigneeSort,
      };

      const [
        overviewRes,
        statusRes,
        workTypesRes,
        prioritiesRes,
        teamsRes,
        membersRes,
        projectsRes,
        epicsRes,
        trendsRes,
        sprintsRes,
        bugsRes,
        overdueRes,
        activityRes,
      ] = await Promise.allSettled([
        reportsApi.getOverview(workspaceId, params),
        reportsApi.getStatus(workspaceId, params),
        reportsApi.getWorkTypes(workspaceId, params),
        reportsApi.getPriorities(workspaceId, params),
        reportsApi.getTeams(workspaceId, params),
        reportsApi.getMembers(workspaceId, params),
        reportsApi.getProjects(workspaceId, params),
        reportsApi.getEpics(workspaceId, params),
        reportsApi.getTrends(workspaceId, params),
        reportsApi.getSprints(workspaceId, params),
        reportsApi.getBugs(workspaceId, params),
        reportsApi.getOverdue(workspaceId, params),
        reportsApi.getActivity(workspaceId, { limit: 20 }),
      ]);

      if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value?.data || {});
      if (statusRes.status === 'fulfilled') setStatusData(statusRes.value?.data || {});
      if (workTypesRes.status === 'fulfilled') setWorkTypeData(workTypesRes.value?.data || {});
      if (prioritiesRes.status === 'fulfilled') setPriorityData(prioritiesRes.value?.data || {});
      if (teamsRes.status === 'fulfilled') setTeamsData(teamsRes.value?.data || []);
      if (membersRes.status === 'fulfilled') setMembersData(membersRes.value?.data || []);
      if (projectsRes.status === 'fulfilled') setProjectsData(projectsRes.value?.data || []);
      if (epicsRes.status === 'fulfilled') setEpicsData(epicsRes.value?.data || []);
      if (trendsRes.status === 'fulfilled') setTrendsData(trendsRes.value?.data || {});
      if (sprintsRes.status === 'fulfilled') setSprintsData(sprintsRes.value?.data || {});
      if (bugsRes.status === 'fulfilled') setBugData(bugsRes.value?.data || {});
      if (overdueRes.status === 'fulfilled') setOverdueData(overdueRes.value?.data || {});
      if (activityRes.status === 'fulfilled') setActivities(activityRes.value?.data || []);
    } catch (e) {
      toast.error('Failed to load organization reports');
    } finally {
      setLoading(false);
    }
  }, [workspaceId, filters, trendInterval, assigneeSort]);

  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  // Drill-down handler
  const handleOpenDrillDown = (extraParams = {}) => {
    setDrillDownState({
      isOpen: true,
      params: {
        ...filters,
        ...extraParams,
      },
    });
  };

  const handleCloseDrillDown = () => {
    setDrillDownState({ isOpen: false, params: {} });
  };

  const tabs = [
    { id: 'executive', label: 'Executive Dashboard', icon: BarChart3 },
    { id: 'workload', label: 'Teams & Workload', icon: Users },
    { id: 'employee', label: 'Employee-Wise Report', icon: UserCheck },
    { id: 'projects', label: 'Projects & Epics', icon: Briefcase },
    { id: 'quality', label: 'Quality & Velocity', icon: Bug },
    { id: 'activity', label: 'Activity Audit', icon: Activity },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-neutral-900">Reports & Organization Analytics</h1>
            <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.2 text-[9px] font-bold">
              Live Telemetry
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Real-time organization-wide analytics into delivery velocity, team capacity, project health, and defect tracking.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition"
          >
            <Download className="size-3.5" />
            Export Report
          </button>

          <button
            onClick={fetchAllAnalytics}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={openCreateTaskModal}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="size-3.5" />
            Create Work Item
          </button>
        </div>
      </div>

      {/* Global Filter Bar */}
      <AnalyticsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        projects={projectsData}
        teams={teamsData}
        members={membersData}
        sprints={sprintsData?.sprints || []}
        epics={epicsData}
      />

      {/* 1. High-Level KPI Summary (Section 1) */}
      <OverviewKPIs
        overview={overview || {}}
        loading={loading}
        onDrillDown={handleOpenDrillDown}
      />

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="flex space-x-2 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2.5 px-3.5 text-xs font-bold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-300'
                }`}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab 1: Executive Dashboard (Matching Reference Screenshots 1 & 2 Layout) */}
      {activeTab === 'executive' && (
        <div className="space-y-6">
          {/* Reference Screenshot 1: 2x2 Clean Dashboard Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Overview Card */}
            <StatusOverviewCard
              statusData={statusData}
              loading={loading}
              onDrillDown={handleOpenDrillDown}
              onCreateTask={openCreateTaskModal}
            />

            {/* Organization Activity Feed Card */}
            <ActivityFeedCard
              activities={activities}
              loading={loading}
              onOpenActivityDetails={handleOpenDrillDown}
            />

            {/* Priority Breakdown Card */}
            <PriorityBreakdownCard
              priorityData={priorityData}
              loading={loading}
              onDrillDown={handleOpenDrillDown}
              onManagePriorities={() => setActiveTab('projects')}
            />

            {/* Types of Work Card */}
            <WorkTypeBreakdownCard
              workTypeData={workTypeData}
              loading={loading}
              onDrillDown={handleOpenDrillDown}
              onOpenHelp={() => handleOpenDrillDown({ title: 'Standard Issue Types' })}
            />
          </div>

          {/* Reference Screenshot 2: Team Workload & Employee Workload Grid Beside Each Other */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team Workload Card */}
            <TeamWorkloadCard
              teamsData={teamsData}
              loading={loading}
              onDrillDown={handleOpenDrillDown}
              onCreateTask={openCreateTaskModal}
            />

            {/* Employee Workload Card Beside Team Workload */}
            <EmployeeWorkloadCard
              membersData={membersData}
              loading={loading}
              onDrillDown={handleOpenDrillDown}
              onViewAll={() => setActiveTab('employee')}
              onCreateTask={openCreateTaskModal}
            />
          </div>

          {/* Epic Progress Card & Created vs Completed Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <EpicProgressCard
              epicsData={epicsData}
              loading={loading}
              onDrillDown={handleOpenDrillDown}
              onOpenHelp={() => handleOpenDrillDown({ workType: 'Epic', title: 'Epics & Large Initiatives' })}
              onCreateEpic={openCreateTaskModal}
              onRefresh={fetchAllAnalytics}
            />

            <CreatedCompletedTrendCard
              trendsData={trendsData}
              loading={loading}
              onIntervalChange={(intv) => setTrendInterval(intv)}
              currentInterval={trendInterval}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Teams & Workload */}
      {activeTab === 'workload' && (
        <div className="space-y-6">
          {/* Side-by-side Team and Employee Workload Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TeamWorkloadCard
              teamsData={teamsData}
              loading={loading}
              onDrillDown={handleOpenDrillDown}
              onCreateTask={openCreateTaskModal}
            />

            <EmployeeWorkloadCard
              membersData={membersData}
              loading={loading}
              onDrillDown={handleOpenDrillDown}
              onViewAll={() => setActiveTab('employee')}
              onCreateTask={openCreateTaskModal}
            />
          </div>

          <AssigneeAnalyticsCard
            membersData={membersData}
            loading={loading}
            onDrillDown={handleOpenDrillDown}
            onSortChange={(s) => setAssigneeSort(s)}
            currentSort={assigneeSort}
          />
        </div>
      )}

      {/* Tab 3: Employee-Wise Report */}
      {activeTab === 'employee' && (
        <EmployeeWiseReport
          membersData={membersData}
          teamsData={teamsData}
          loading={loading}
          filters={filters}
          onFilterChange={handleFilterChange}
          onRefresh={fetchAllAnalytics}
          onDrillDown={handleOpenDrillDown}
          onCreateTask={openCreateTaskModal}
        />
      )}

      {/* Tab 3: Projects & Epics */}
      {activeTab === 'projects' && (
        <div className="space-y-6">
          <ProjectAnalyticsCard
            projectsData={projectsData}
            loading={loading}
            onDrillDown={handleOpenDrillDown}
          />

          <EpicProgressCard
            epicsData={epicsData}
            loading={loading}
            onDrillDown={handleOpenDrillDown}
            onOpenHelp={() => handleOpenDrillDown({ workType: 'Epic', title: 'Epics' })}
            onCreateEpic={openCreateTaskModal}
            onRefresh={fetchAllAnalytics}
          />
        </div>
      )}

      {/* Tab 4: Quality & Sprints */}
      {activeTab === 'quality' && (
        <div className="space-y-6">
          <BugAnalyticsCard
            bugData={bugData}
            loading={loading}
            onDrillDown={handleOpenDrillDown}
          />

          <SprintVelocityCard
            sprintsData={sprintsData}
            loading={loading}
            onDrillDown={handleOpenDrillDown}
          />

          <OverdueAnalyticsCard
            overdueData={overdueData}
            loading={loading}
            onDrillDown={handleOpenDrillDown}
          />
        </div>
      )}

      {/* Tab 5: Activity Audit Stream */}
      {activeTab === 'activity' && (
        <div className="space-y-6">
          <ActivityFeedCard
            activities={activities}
            loading={loading}
            onOpenActivityDetails={handleOpenDrillDown}
          />
        </div>
      )}

      {/* Interactive Drill-Down Drawer / Modal */}
      <DrillDownModal
        isOpen={drillDownState.isOpen}
        onClose={handleCloseDrillDown}
        workspaceId={workspaceId}
        drillParams={drillDownState.params}
      />

      {/* Export Report Modal */}
      <ExportReportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        workspaceId={workspaceId}
        activeFilters={filters}
        overview={overview}
        statusData={statusData}
        workTypeData={workTypeData}
        priorityData={priorityData}
        teamsData={teamsData}
        membersData={membersData}
        projectsData={projectsData}
        epicsData={epicsData}
        trendsData={trendsData}
        sprintsData={sprintsData}
        bugData={bugData}
        overdueData={overdueData}
      />
    </div>
  );
};
