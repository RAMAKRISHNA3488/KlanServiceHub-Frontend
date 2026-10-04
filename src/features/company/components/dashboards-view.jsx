import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { useCurrent } from '@/features/auth/api/use-current';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { dashboardsApi } from '@/lib/api-client';
import { JiraIssueDetailModal } from '@/features/tasks/components/jira-issue-detail-modal';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  FolderGit2,
  PlayCircle,
  RefreshCw,
  Sparkles,
  Plus,
  Trash2,
  Settings,
  ChevronDown,
  BarChart3,
  PieChart,
  Activity,
  ShieldAlert,
  CheckSquare,
  Zap,
  Bookmark,
  List,
  Calendar,
  ArrowRight,
  ArrowLeft,
  MoveLeft,
  MoveRight,
  Star,
  Layers,
  Filter,
  Search,
  X,
  Flame,
  UserCheck,
  Check,
  ExternalLink,
} from 'lucide-react';

const PRIORITY_CONFIG = {
  CRITICAL: { label: 'P0 - Critical', color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  HIGH: { label: 'P1 - High', color: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  MEDIUM: { label: 'P2 - Medium', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  LOW: { label: 'P3 - Low', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  LOWEST: { label: 'P4 - Lowest', color: 'bg-slate-400', text: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
};

const TYPE_CONFIG = {
  Story: { icon: Bookmark, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Task: { icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  Bug: { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
  Epic: { icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
  'Sub-task': { icon: List, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
  Improvement: { icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
};

const GADGET_CATALOG = [
  {
    type: 'PROJECT_PROGRESS',
    title: 'Project Delivery Progress',
    category: 'Operational',
    icon: FolderGit2,
    color: 'text-blue-600 bg-blue-50',
    description: 'Track overall delivery progress, completed issues vs active items, and bug counts per project.',
  },
  {
    type: 'PRIORITY_BREAKDOWN',
    title: 'Priority Distribution',
    category: 'Quality & Incident',
    icon: Flame,
    color: 'text-rose-600 bg-rose-50',
    description: 'Monitor open tickets categorized by urgency: P0 - Critical, P1 - High, Medium, Low, and Lowest.',
  },
  {
    type: 'CREATED_VS_RESOLVED',
    title: 'Created vs Resolved Trend',
    category: 'Operational',
    icon: TrendingUp,
    color: 'text-indigo-600 bg-indigo-50',
    description: 'Monthly velocity chart showing incoming vs resolved ticket volume over the last 6 months.',
  },
  {
    type: 'TYPE_BREAKDOWN',
    title: 'Issue Types Distribution',
    category: 'Operational',
    icon: PieChart,
    color: 'text-purple-600 bg-purple-50',
    description: 'Distribution of Story, Task, Bug, Epic, Sub-task, and Improvement items in your workspace.',
  },
  {
    type: 'TEAM_WORKLOAD',
    title: 'Team Workload & Capacity',
    category: 'Team & Workload',
    icon: Users,
    color: 'text-amber-600 bg-amber-50',
    description: 'Individual team capacity overview: active assignments, story points, and completed work volume.',
  },
  {
    type: 'ACTIVE_SPRINTS',
    title: 'Active Sprints Health',
    category: 'Agile & Sprints',
    icon: PlayCircle,
    color: 'text-emerald-600 bg-emerald-50',
    description: 'Real-time execution status of in-flight agile sprints, remaining story points, and time tracking.',
  },
  {
    type: 'ASSIGNED_TO_ME',
    title: 'My Work Queue',
    category: 'Team & Workload',
    icon: UserCheck,
    color: 'text-sky-600 bg-sky-50',
    description: 'Quick-access interactive queue of work items assigned directly to you with priority and due dates.',
  },
  {
    type: 'OVERDUE_WATCHLIST',
    title: 'Overdue Work Items Watchlist',
    category: 'Quality & Incident',
    icon: ShieldAlert,
    color: 'text-red-600 bg-red-50',
    description: 'Escalation watchlist highlighting overdue items, assignees, and remaining days past SLA.',
  },
  {
    type: 'ACTIVITY_STREAM',
    title: 'Recent Activity Stream',
    category: 'Operational',
    icon: Activity,
    color: 'text-teal-600 bg-teal-50',
    description: 'Audit log timeline of recent workspace actions, ticket status transitions, and team updates.',
  },
  {
    type: 'TWO_DIMENSIONAL',
    title: 'Assignee vs Status Matrix',
    category: 'Agile & Sprints',
    icon: BarChart3,
    color: 'text-violet-600 bg-violet-50',
    description: 'Two-dimensional cross-tabulation table of team members against TODO, In Progress, Review, and Done.',
  },
];

export const DashboardsView = () => {
  const workspaceId = useWorkspaceId();
  const { data: currentUser } = useCurrent();
  const { data: projectsData } = useGetProjects({ workspaceId });
  const projects = projectsData?.documents || [];

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Delete Dashboard',
    'Are you sure you want to delete this dashboard?',
    'destructive'
  );

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDashboardId, setSelectedDashboardId] = useState(null);
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [autoRefreshSecs, setAutoRefreshSecs] = useState(0); // 0 = off, 15, 30, 60, 300
  const [countdown, setCountdown] = useState(0);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddGadgetModal, setShowAddGadgetModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Create Dashboard Form
  const [newDashName, setNewDashName] = useState('');
  const [newDashDesc, setNewDashDesc] = useState('');
  const [newDashLayout, setNewDashLayout] = useState('2_COLUMN_EQUAL');
  const [newDashScope, setNewDashScope] = useState('PUBLIC');
  const [creatingDash, setCreatingDash] = useState(false);

  // Add Gadget Form
  const [gadgetSearch, setGadgetSearch] = useState('');
  const [gadgetCategory, setGadgetCategory] = useState('ALL');
  const [targetColumn, setTargetColumn] = useState(0);
  const [addingGadget, setAddingGadget] = useState(false);

  const fetchDashboard = async (dashId = selectedDashboardId, projId = selectedProject, isSilent = false) => {
    if (!workspaceId) return;
    try {
      if (!isSilent) setLoading(true);
      const params = {};
      if (dashId) params.dashboardId = dashId;
      if (projId && projId !== 'ALL') params.projectId = projId;

      const res = await dashboardsApi.getDashboardData(workspaceId, params);
      if (res?.data) {
        setData(res.data);
        if (!selectedDashboardId && res.data.activeDashboard) {
          setSelectedDashboardId(res.data.activeDashboard.id || res.data.activeDashboard.$id);
        }
      }
    } catch (e) {
      if (!isSilent) toast.error('Failed to load dashboard');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(selectedDashboardId, selectedProject);
  }, [workspaceId, selectedDashboardId, selectedProject]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshSecs <= 0) {
      setCountdown(0);
      return;
    }
    setCountdown(autoRefreshSecs);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchDashboard(selectedDashboardId, selectedProject, true);
          return autoRefreshSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefreshSecs, selectedDashboardId, selectedProject, workspaceId]);

  const handleCreateDashboard = async (e) => {
    e.preventDefault();
    if (!newDashName.trim()) {
      toast.error('Dashboard name is required');
      return;
    }
    try {
      setCreatingDash(true);
      const res = await dashboardsApi.createDashboard(workspaceId, {
        name: newDashName.trim(),
        description: newDashDesc.trim(),
        layout: newDashLayout,
        shareScope: newDashScope,
      });
      if (res?.data) {
        toast.success('Dashboard created successfully');
        setShowCreateModal(false);
        setNewDashName('');
        setNewDashDesc('');
        setSelectedDashboardId(res.data.id || res.data.$id);
      }
    } catch (e) {
      toast.error('Failed to create dashboard');
    } finally {
      setCreatingDash(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!activeDashboard) return;
    const dashId = activeDashboard.id || activeDashboard.$id;
    const newFav = !activeDashboard.is_favorite;
    try {
      await dashboardsApi.updateDashboard(workspaceId, dashId, { isFavorite: newFav });
      setData((prev) => ({
        ...prev,
        activeDashboard: { ...prev.activeDashboard, is_favorite: newFav ? 1 : 0 },
        dashboards: prev.dashboards.map((d) => (d.id === dashId || d.$id === dashId ? { ...d, is_favorite: newFav ? 1 : 0 } : d)),
      }));
      toast.success(newFav ? 'Marked as favorite' : 'Removed from favorites');
    } catch (e) {
      toast.error('Failed to update favorite status');
    }
  };

  const handleChangeLayout = async (newLayout) => {
    if (!activeDashboard) return;
    const dashId = activeDashboard.id || activeDashboard.$id;
    try {
      await dashboardsApi.updateDashboard(workspaceId, dashId, { layout: newLayout });
      setData((prev) => ({
        ...prev,
        activeDashboard: { ...prev.activeDashboard, layout: newLayout },
      }));
      toast.success(`Layout changed to ${newLayout.replace(/_/g, ' ')}`);
    } catch (e) {
      toast.error('Failed to update layout');
    }
  };

  const handleDeleteDashboard = async () => {
    if (!activeDashboard || activeDashboard.is_default) {
      toast.error('Default dashboard cannot be deleted.');
      return;
    }
    const dashId = activeDashboard.id || activeDashboard.$id;
    const ok = await confirmAction({
      title: 'Delete Custom Dashboard',
      message: `Are you sure you want to delete dashboard "${activeDashboard.name}"?`,
      variant: 'destructive',
      confirmText: 'Delete Dashboard',
      warningNotice: 'Custom gadget configurations and layout arrangements on this dashboard will be removed.'
    });
    if (!ok) return;

    try {
      await dashboardsApi.deleteDashboard(workspaceId, dashId);
      toast.success('Dashboard deleted');
      setSelectedDashboardId(null);
      fetchDashboard(null, selectedProject);
    } catch (e) {
      toast.error('Failed to delete dashboard');
    }
  };

  const handleAddGadget = async (gadgetType, title) => {
    let dashId = activeDashboard ? (activeDashboard.id || activeDashboard.$id) : selectedDashboardId;
    if (!dashId && dashboards.length > 0) {
      dashId = dashboards[0].id || dashboards[0].$id;
    }
    if (!dashId) {
      toast.error('No dashboard found. Please select or create a dashboard first.');
      return;
    }
    try {
      setAddingGadget(true);
      const res = await dashboardsApi.addGadget(workspaceId, dashId, {
        gadgetType,
        title,
        columnIndex: Number(targetColumn) || 0,
      });
      if (res?.data) {
        toast.success(`Added "${title}" to dashboard`);
        setShowAddGadgetModal(false);
        setData((prev) => ({
          ...prev,
          configuredGadgets: [...(prev?.configuredGadgets || []), res.data],
        }));
        fetchDashboard(dashId, selectedProject, true);
      }
    } catch (e) {
      console.error('Failed to add gadget:', e);
      toast.error(e.message || 'Failed to add gadget');
    } finally {
      setAddingGadget(false);
    }
  };

  const handleDeleteGadget = async (gadgetId, title) => {
    let dashId = activeDashboard ? (activeDashboard.id || activeDashboard.$id) : selectedDashboardId;
    if (!dashId) return;
    try {
      await dashboardsApi.deleteGadget(workspaceId, dashId, gadgetId);
      toast.success(`Removed "${title}"`);
      setData((prev) => ({
        ...prev,
        configuredGadgets: (prev?.configuredGadgets || []).filter((g) => g.id !== gadgetId && g.$id !== gadgetId),
      }));
    } catch (e) {
      console.error('Failed to delete gadget:', e);
      toast.error(e.message || 'Failed to remove gadget');
    }
  };

  const {
    dashboards = [],
    activeDashboard = null,
    configuredGadgets = [],
    summary = {},
    priorityBreakdown = [],
    typeBreakdown = [],
    teamWorkload = [],
    projectProgress = [],
    activeSprints = [],
    assignedToMe = [],
    overdueWatchlist = [],
    createdVsResolvedTrend = [],
    recentActivities = [],
    twoDimensionalStats = [],
  } = data || {};

  const currentLayout = activeDashboard?.layout || '2_COLUMN_EQUAL';

  // Group gadgets into columns based on layout
  const numColumns = currentLayout === '1_COLUMN' ? 1 : currentLayout === '3_COLUMN' ? 3 : 2;
  const columns = Array.from({ length: numColumns }, () => []);

  configuredGadgets.forEach((g) => {
    const rawCol = g.column_index !== undefined ? g.column_index : (g.columnIndex !== undefined ? g.columnIndex : 0);
    const colIdx = Math.max(0, Math.min(Number(rawCol) || 0, numColumns - 1));
    columns[colIdx].push(g);
  });

  // Filter Gadget Catalog
  const filteredCatalog = GADGET_CATALOG.filter((item) => {
    const matchesCat = gadgetCategory === 'ALL' || item.category === gadgetCategory;
    const matchesSearch =
      item.title.toLowerCase().includes(gadgetSearch.toLowerCase()) ||
      item.description.toLowerCase().includes(gadgetSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Render individual gadget by type
  const renderGadgetContent = (gadget) => {
    const type = gadget.gadget_type || gadget.gadgetType;
    switch (type) {
      case 'PROJECT_PROGRESS':
        return (
          <div className="space-y-4">
            {projectProgress.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-6">No projects recorded in this workspace.</p>
            ) : (
              projectProgress.map((p) => (
                <div key={p.id} className="space-y-1.5 p-2.5 rounded-xl hover:bg-neutral-50/80 transition">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                        {p.key || 'PROJ'}
                      </span>
                      <span className="font-semibold text-neutral-900">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {p.open_bugs > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          <AlertCircle className="size-3" /> {p.open_bugs} bugs
                        </span>
                      )}
                      <span className="font-bold text-neutral-800">{p.progressPercent}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${p.progressPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>{p.completed_tasks || 0} of {p.total_tasks || 0} issues resolved</span>
                    <span>{p.in_progress_tasks || 0} in progress</span>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'PRIORITY_BREAKDOWN':
        return (
          <div className="space-y-3">
            {priorityBreakdown.map((pb) => {
              const conf = PRIORITY_CONFIG[pb.priority] || PRIORITY_CONFIG.MEDIUM;
              return (
                <div key={pb.priority} className="p-2.5 rounded-xl bg-neutral-50/70 border border-neutral-100 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold flex items-center gap-2 ${conf.text}`}>
                      <span className={`size-2.5 rounded-full ${conf.color}`} />
                      {conf.label}
                    </span>
                    <span className="font-bold text-neutral-800">
                      {pb.count} items ({pb.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200/70 rounded-full h-2 overflow-hidden">
                    <div className={`${conf.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${pb.percentage}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'CREATED_VS_RESOLVED': {
        const maxVal = Math.max(...createdVsResolvedTrend.map((t) => Math.max(t.created, t.resolved, 1)), 5);
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-neutral-500 pb-1 border-b border-neutral-100">
              <span className="text-[11px]">Monthly Velocity Delta</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[11px] font-medium text-blue-600">
                  <span className="size-2 rounded-full bg-blue-600" /> Created
                </span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                  <span className="size-2 rounded-full bg-emerald-600" /> Resolved
                </span>
              </div>
            </div>

            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2">
              {createdVsResolvedTrend.map((item, idx) => {
                const createdHeight = Math.round((item.created / maxVal) * 120);
                const resolvedHeight = Math.round((item.resolved / maxVal) * 120);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="flex items-end gap-1.5 w-full justify-center">
                      {/* Created Bar */}
                      <div className="relative flex flex-col items-center">
                        <span className="opacity-0 group-hover:opacity-100 transition text-[9px] font-bold text-blue-700 mb-0.5">
                          {item.created}
                        </span>
                        <div
                          className="w-3.5 sm:w-5 bg-blue-500 rounded-t-sm transition-all duration-500 hover:bg-blue-600"
                          style={{ height: `${Math.max(createdHeight, 4)}px` }}
                        />
                      </div>
                      {/* Resolved Bar */}
                      <div className="relative flex flex-col items-center">
                        <span className="opacity-0 group-hover:opacity-100 transition text-[9px] font-bold text-emerald-700 mb-0.5">
                          {item.resolved}
                        </span>
                        <div
                          className="w-3.5 sm:w-5 bg-emerald-500 rounded-t-sm transition-all duration-500 hover:bg-emerald-600"
                          style={{ height: `${Math.max(resolvedHeight, 4)}px` }}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-neutral-500">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'TYPE_BREAKDOWN':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {typeBreakdown.map((t) => {
              const conf = TYPE_CONFIG[t.issue_type] || TYPE_CONFIG.Task;
              const IconComp = conf.icon;
              return (
                <div key={t.issue_type} className={`p-3 rounded-xl border ${conf.border} ${conf.bg} flex flex-col justify-between`}>
                  <div className="flex items-center justify-between">
                    <IconComp className={`size-4 ${conf.color}`} />
                    <span className="text-xs font-bold text-neutral-500">{t.percentage}%</span>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-bold text-neutral-900">{t.count}</p>
                    <p className="text-[11px] font-medium text-neutral-600 truncate">{t.issue_type}</p>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'TEAM_WORKLOAD':
        return (
          <div className="space-y-3">
            {teamWorkload.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-6">No members assigned to active tasks.</p>
            ) : (
              teamWorkload.map((u) => {
                const completionPct = u.task_count > 0 ? Math.round((u.done_count / u.task_count) * 100) : 0;
                return (
                  <div key={u.id} className="p-3 rounded-xl border border-neutral-100 bg-white shadow-2xs space-y-2 hover:border-neutral-200 transition">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                          {u.name ? u.name.substring(0, 2).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-900">{u.name}</p>
                          <p className="text-[10px] text-neutral-400">{u.role || 'Member'} • {u.total_story_points || 0} story pts</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-neutral-800">{u.task_count} assigned</span>
                        {u.overdue_count > 0 && (
                          <span className="block text-[10px] font-bold text-rose-600">{u.overdue_count} overdue</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-neutral-500">
                        <span>{u.done_count || 0} completed</span>
                        <span className="font-semibold text-emerald-600">{completionPct}%</span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );

      case 'ACTIVE_SPRINTS':
        return (
          <div className="space-y-3.5">
            {activeSprints.length === 0 ? (
              <div className="text-center py-6 space-y-1 text-neutral-400">
                <PlayCircle className="size-8 mx-auto stroke-1 text-neutral-300" />
                <p className="text-xs italic">No active sprints running in this workspace.</p>
              </div>
            ) : (
              activeSprints.map((s) => {
                const pct = s.total_tasks > 0 ? Math.round((s.done_tasks / s.total_tasks) * 100) : 0;
                return (
                  <div key={s.id} className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            ACTIVE SPRINT
                          </span>
                          {s.project_key && (
                            <span className="font-mono text-[10px] font-bold text-neutral-500 bg-white border border-neutral-200 px-1.5 py-0.5 rounded">
                              {s.project_key}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-neutral-900 mt-1">{s.name}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-700">{s.remaining_points || 0} pts left</span>
                        <p className="text-[10px] text-neutral-400">{s.done_tasks} / {s.total_tasks} tasks</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full bg-neutral-200/80 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-600 h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {s.goal && (
                      <p className="text-[11px] text-neutral-600 italic bg-white/80 p-2 rounded-lg border border-neutral-100">
                        Sprint Goal: "{s.goal}"
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        );

      case 'ASSIGNED_TO_ME':
        return (
          <div className="space-y-2">
            {assignedToMe.length === 0 ? (
              <div className="text-center py-6 space-y-1 text-neutral-400">
                <CheckCircle2 className="size-8 mx-auto stroke-1 text-emerald-400" />
                <p className="text-xs italic">You're all caught up! No pending issues assigned.</p>
              </div>
            ) : (
              assignedToMe.map((t) => {
                const isOverdue = t.due_date && new Date(t.due_date) < new Date();
                const pConf = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="p-2.5 rounded-xl border border-neutral-200/80 bg-white hover:border-blue-300 hover:shadow-xs transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[11px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded group-hover:bg-blue-100 transition">
                        {t.key || 'T-1'}
                      </span>
                      <span className="text-xs font-medium text-neutral-800 truncate group-hover:text-blue-600 transition">
                        {t.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pConf.bg} ${pConf.text}`}>
                        {pConf.label}
                      </span>
                      {isOverdue ? (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Clock className="size-3" /> Overdue
                        </span>
                      ) : t.due_date ? (
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <Calendar className="size-3" /> {new Date(t.due_date).toLocaleDateString()}
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );

      case 'OVERDUE_WATCHLIST':
        return (
          <div className="space-y-2">
            {overdueWatchlist.length === 0 ? (
              <div className="text-center py-6 space-y-1 text-emerald-600">
                <CheckCircle2 className="size-8 mx-auto stroke-1" />
                <p className="text-xs font-semibold">Zero overdue tickets. Excellent SLA compliance!</p>
              </div>
            ) : (
              overdueWatchlist.map((t) => {
                const daysPast = Math.max(1, Math.round((new Date() - new Date(t.due_date)) / (1000 * 60 * 60 * 24)));
                const pConf = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.MEDIUM;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="p-3 rounded-xl border border-rose-200 bg-rose-50/30 hover:bg-rose-50 hover:border-rose-300 transition cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                          {t.key || 'T-1'}
                        </span>
                        <span className="text-xs font-semibold text-neutral-900 truncate group-hover:text-rose-700 transition">
                          {t.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-500">
                        Assigned to: <span className="font-medium text-neutral-800">{t.assignee_name || 'Unassigned'}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded block">
                        {daysPast} {daysPast === 1 ? 'day' : 'days'} overdue
                      </span>
                      <span className={`text-[9px] font-bold ${pConf.text} mt-1 block`}>{pConf.label}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        );

      case 'ACTIVITY_STREAM':
        return (
          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-6">No recent activities recorded.</p>
            ) : (
              recentActivities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5 text-xs pb-2.5 border-b border-neutral-100 last:border-0 last:pb-0">
                  <div className="size-6 rounded-full bg-neutral-200 text-neutral-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {act.user_name ? act.user_name.substring(0, 2).toUpperCase() : 'SYS'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-neutral-800">
                      <span className="font-semibold text-neutral-900">{act.user_name || 'System'}</span>{' '}
                      <span className="text-neutral-500">{act.action_type || 'updated'}</span>{' '}
                      {act.task_key && (
                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                          {act.task_key}
                        </span>
                      )}
                    </p>
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      {act.created_at ? new Date(act.created_at).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'TWO_DIMENSIONAL':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase text-[10px]">
                  <th className="py-2 px-3 font-semibold">Assignee</th>
                  <th className="py-2 px-2 font-semibold text-center text-blue-600">To Do</th>
                  <th className="py-2 px-2 font-semibold text-center text-amber-600">In Progress</th>
                  <th className="py-2 px-2 font-semibold text-center text-purple-600">Review</th>
                  <th className="py-2 px-2 font-semibold text-center text-emerald-600">Done</th>
                  <th className="py-2 px-3 font-semibold text-right text-neutral-800">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {twoDimensionalStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-neutral-400 italic">
                      No assignment statistics available.
                    </td>
                  </tr>
                ) : (
                  twoDimensionalStats.map((stat, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/70 transition">
                      <td className="py-2 px-3 font-semibold text-neutral-900">{stat.name}</td>
                      <td className="py-2 px-2 text-center text-neutral-600">{stat.TODO || 0}</td>
                      <td className="py-2 px-2 text-center text-amber-600 font-medium">{stat.IN_PROGRESS || 0}</td>
                      <td className="py-2 px-2 text-center text-purple-600 font-medium">{stat.IN_REVIEW || 0}</td>
                      <td className="py-2 px-2 text-center text-emerald-600 font-bold">{stat.DONE || 0}</td>
                      <td className="py-2 px-3 text-right font-bold text-neutral-900">{stat.total || 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        );

      default:
        return <p className="text-xs text-neutral-400 italic">Gadget preview unavailable.</p>;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="size-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Top Controls Header */}
      <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                <LayoutDashboard className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-neutral-900">
                    {activeDashboard?.name || 'Enterprise Dashboard & Gadgets'}
                  </h1>
                  {activeDashboard?.is_default === 1 && (
                    <span className="text-[10px] font-bold bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full border border-neutral-200">
                      Default
                    </span>
                  )}
                  {activeDashboard && (
                    <button
                      onClick={handleToggleFavorite}
                      className={`p-1 rounded-md transition ${activeDashboard.is_favorite ? 'text-amber-500 hover:bg-amber-50' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'}`}
                      title="Star this dashboard"
                    >
                      <Star className={`size-4 ${activeDashboard.is_favorite ? 'fill-amber-500' : ''}`} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-neutral-500">
                  {activeDashboard?.description || 'Customizable operational gadgets, agile charts, and workload health.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Dashboard Selector */}
            <select
              value={selectedDashboardId || ''}
              onChange={(e) => setSelectedDashboardId(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              {dashboards.map((d) => (
                <option key={d.id || d.$id} value={d.id || d.$id}>
                  {d.is_favorite ? '★ ' : ''}{d.name} {d.is_default ? '(Default)' : ''}
                </option>
              ))}
            </select>

            {/* Project Filter */}
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-700 shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="ALL">All Projects</option>
              {projects.map((p) => (
                <option key={p.id || p.$id} value={p.id || p.$id}>
                  [{p.key || 'PROJ'}] {p.name}
                </option>
              ))}
            </select>

            {/* Auto Refresh Timer */}
            <div className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700">
              <RefreshCw className={`size-3.5 ${countdown > 0 ? 'text-blue-600' : 'text-neutral-400'}`} />
              <select
                value={autoRefreshSecs}
                onChange={(e) => setAutoRefreshSecs(Number(e.target.value))}
                className="bg-transparent text-xs font-medium focus:outline-hidden text-neutral-700"
              >
                <option value={0}>Auto: Off</option>
                <option value={15}>Auto: 15s</option>
                <option value={30}>Auto: 30s</option>
                <option value={60}>Auto: 1m</option>
                <option value={300}>Auto: 5m</option>
              </select>
              {countdown > 0 && (
                <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                  {countdown}s
                </span>
              )}
            </div>

            {/* Add Gadget Button */}
            <button
              onClick={() => setShowAddGadgetModal(true)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
            >
              <Plus className="size-3.5" />
              Add Gadget
            </button>

            {/* Create New Dashboard */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
            >
              <Layers className="size-3.5" />
              New Dashboard
            </button>
          </div>
        </div>

        {/* Sub-bar: Layout Switcher & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 text-[11px] font-semibold uppercase tracking-wider mr-1">Layout:</span>
            <button
              onClick={() => handleChangeLayout('1_COLUMN')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${currentLayout === '1_COLUMN' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              1 Column
            </button>
            <button
              onClick={() => handleChangeLayout('2_COLUMN_EQUAL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${currentLayout === '2_COLUMN_EQUAL' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              2 Column (50/50)
            </button>
            <button
              onClick={() => handleChangeLayout('2_COLUMN_WIDE_LEFT')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${currentLayout === '2_COLUMN_WIDE_LEFT' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              2 Column (70/30)
            </button>
            <button
              onClick={() => handleChangeLayout('3_COLUMN')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${currentLayout === '3_COLUMN' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-neutral-600 hover:bg-neutral-100'}`}
            >
              3 Column
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboard(selectedDashboardId, selectedProject)}
              className="flex items-center gap-1 text-neutral-500 hover:text-neutral-900 transition font-medium"
            >
              <RefreshCw className="size-3.5" /> Refresh Now
            </button>

            {activeDashboard && !activeDashboard.is_default && (
              <button
                onClick={handleDeleteDashboard}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-700 transition font-medium ml-2"
              >
                <Trash2 className="size-3.5" /> Delete Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Total Items</span>
            <FolderGit2 className="size-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-neutral-900 mt-1">{summary.totalTasks || 0}</p>
          <span className="text-[10px] text-neutral-400">All workspace items</span>
        </div>

        <div className="rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-600 mt-1">{summary.completedTasks || 0}</p>
          <span className="text-[10px] text-emerald-700 font-semibold">{summary.completionRate || 0}% Completion</span>
        </div>

        <div className="rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">In Progress</span>
            <Clock className="size-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-600 mt-1">{summary.inProgressTasks || 0}</p>
          <span className="text-[10px] text-neutral-400">Active execution</span>
        </div>

        <div className="rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Backlog & Todo</span>
            <Bookmark className="size-3.5 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-purple-600 mt-1">{summary.todoTasks || 0}</p>
          <span className="text-[10px] text-neutral-400">Queued for delivery</span>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-rose-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">P0 - Critical</span>
            <Flame className="size-3.5 text-rose-600" />
          </div>
          <p className="text-xl font-bold text-rose-700 mt-1">{summary.criticalTasks || 0}</p>
          <span className="text-[10px] text-rose-600 font-semibold">Immediate attention</span>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[10px] font-bold uppercase tracking-wider">Overdue</span>
            <AlertCircle className="size-3.5 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-700 mt-1">{summary.overdueTasks || 0}</p>
          <span className="text-[10px] text-amber-700 font-semibold">SLA breached</span>
        </div>
      </div>

      {/* Gadgets Multi-Column Layout */}
      <div
        className={`grid gap-6 ${
          currentLayout === '1_COLUMN'
            ? 'grid-cols-1'
            : currentLayout === '3_COLUMN'
            ? 'grid-cols-1 lg:grid-cols-3'
            : currentLayout === '2_COLUMN_WIDE_LEFT'
            ? 'grid-cols-1 lg:grid-cols-12'
            : 'grid-cols-1 lg:grid-cols-2'
        }`}
      >
        {columns.map((colGadgets, colIdx) => {
          let colSpanClass = '';
          if (currentLayout === '2_COLUMN_WIDE_LEFT') {
            colSpanClass = colIdx === 0 ? 'lg:col-span-8' : 'lg:col-span-4';
          }

          return (
            <div key={colIdx} className={`space-y-6 ${colSpanClass}`}>
              {colGadgets.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-8 text-center space-y-2">
                  <LayoutDashboard className="size-8 mx-auto text-neutral-300 stroke-1" />
                  <p className="text-xs font-semibold text-neutral-500">Column {colIdx + 1} is empty</p>
                  <button
                    onClick={() => {
                      setTargetColumn(colIdx);
                      setShowAddGadgetModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition pt-1"
                  >
                    <Plus className="size-3.5" /> Add Gadget Here
                  </button>
                </div>
              ) : (
                colGadgets.map((gadget) => {
                  const catItem = GADGET_CATALOG.find((g) => g.type === (gadget.gadget_type || gadget.gadgetType));
                  const IconComp = catItem?.icon || LayoutDashboard;

                  return (
                    <div
                      key={gadget.id || gadget.$id}
                      className="rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-xs space-y-4 hover:shadow-sm transition"
                    >
                      {/* Gadget Card Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg ${catItem?.color || 'bg-neutral-100 text-neutral-600'}`}>
                            <IconComp className="size-4" />
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-neutral-900">{gadget.title}</h3>
                            <span className="text-[10px] text-neutral-400">{catItem?.category || 'General'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteGadget(gadget.id || gadget.$id, gadget.title)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove gadget"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Gadget Body */}
                      <div>{renderGadgetContent(gadget)}</div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      {/* Gadget Directory / Add Gadget Modal */}
      {showAddGadgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-neutral-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Gadget Directory & Library</h3>
                  <p className="text-xs text-neutral-500">Add interactive operational and agile gadgets to your dashboard</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddGadgetModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Search & Placement Controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="size-4 text-neutral-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search gadget catalog..."
                  value={gadgetSearch}
                  onChange={(e) => setGadgetSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 font-medium">Add to:</span>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(Number(e.target.value))}
                  className="rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700"
                >
                  {Array.from({ length: numColumns }).map((_, i) => (
                    <option key={i} value={i}>
                      Column {i + 1}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {['ALL', 'Agile & Sprints', 'Quality & Incident', 'Team & Workload', 'Operational'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setGadgetCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${gadgetCategory === cat ? 'bg-blue-600 text-white shadow-xs' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredCatalog.map((item) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={item.type}
                    className="p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-blue-300 hover:shadow-xs transition flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${item.color}`}>
                            <IconComp className="size-4" />
                          </div>
                          <span className="text-xs font-bold text-neutral-900">{item.title}</span>
                        </div>
                        <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500 leading-relaxed">{item.description}</p>
                    </div>

                    <button
                      disabled={addingGadget}
                      onClick={() => handleAddGadget(item.type, item.title)}
                      className="w-full flex items-center justify-center gap-1 rounded-lg bg-neutral-100 hover:bg-blue-600 hover:text-white text-neutral-700 py-1.5 text-xs font-bold transition group-hover:bg-blue-600 group-hover:text-white"
                    >
                      <Plus className="size-3.5" /> Add Gadget
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Create Dashboard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-neutral-200 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Create New Dashboard</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-lg hover:bg-neutral-100 transition"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDashboard} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Dashboard Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Q3 Growth & Release Operations"
                  value={newDashName}
                  onChange={(e) => setNewDashName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="Operational purpose and scope of this dashboard..."
                  value={newDashDesc}
                  onChange={(e) => setNewDashDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Starting Layout</label>
                <select
                  value={newDashLayout}
                  onChange={(e) => setNewDashLayout(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-700 bg-white"
                >
                  <option value="2_COLUMN_EQUAL">2 Columns (50/50 Equal)</option>
                  <option value="2_COLUMN_WIDE_LEFT">2 Columns (70/30 Split)</option>
                  <option value="1_COLUMN">1 Full-Width Column</option>
                  <option value="3_COLUMN">3 Columns (33/33/33)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Sharing Scope</label>
                <select
                  value={newDashScope}
                  onChange={(e) => setNewDashScope(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs font-medium text-neutral-700 bg-white"
                >
                  <option value="PUBLIC">Public to All Workspace Members</option>
                  <option value="PRIVATE">Private to Me Only</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDash}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {creatingDash ? 'Creating...' : 'Create Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Issue Detail Modal */}
      {selectedTaskId && (
        <JiraIssueDetailModal
          taskId={selectedTaskId}
          open={!!selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onUpdated={() => fetchDashboard(selectedDashboardId, selectedProject, true)}
        />
      )}
      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};

export default DashboardsView;
