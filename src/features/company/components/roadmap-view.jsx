import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { tasksApi } from '@/lib/api-client';
import { useCreateTaskModal } from '@/features/tasks/hooks/use-create-task-modal';
import { RoadmapTaskModal } from './roadmap-task-modal';
import { toast } from 'sonner';
import {
  Calendar,
  Zap,
  Plus,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Sparkles,
  RefreshCw,
  CheckSquare,
  Clock,
  Search,
  Filter,
  Layers,
  Users,
  Briefcase,
  Bug,
  Bookmark,
  GitCommit,
  CalendarDays,
  Target,
  Info,
} from 'lucide-react';
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  eachWeekOfInterval,
  differenceInDays,
} from 'date-fns';

export const RoadmapView = () => {
  const workspaceId = useWorkspaceId();
  const { open: openCreateTask } = useCreateTaskModal();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeScale, setTimeScale] = useState('months'); // 'weeks' | 'months' | 'quarters'
  const [viewDate, setViewDate] = useState(new Date()); // Base anchor date for Previous / Next paging
  const [groupBy, setGroupBy] = useState('epic'); // 'epic' | 'status' | 'none'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expandedGroups, setExpandedGroups] = useState({});

  // Task Details Modal (Read Mode default -> Edit Mode on explicit edit -> Update)
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleOpenTaskDetails = (taskItem) => {
    setSelectedTask(taskItem);
    setIsDetailModalOpen(true);
  };

  const handleTaskUpdated = (updatedTask) => {
    if (!updatedTask) return;
    setTasks((prev) =>
      prev.map((t) =>
        (t.$id || t.id) === (updatedTask.$id || updatedTask.id) ? { ...t, ...updatedTask } : t
      )
    );
    fetchTasks();
  };

  const timelineContainerRef = useRef(null);

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await tasksApi.getTasks({ workspaceId });
      if (res?.data?.documents) {
        setTasks(res.data.documents);
      }
    } catch (e) {
      toast.error('Failed to load roadmap tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchTasks();
  }, [workspaceId]);

  // Previous & Next navigation handlers
  const handlePrevious = () => {
    if (timeScale === 'weeks') {
      setViewDate((prev) => subWeeks(prev, 3));
    } else if (timeScale === 'quarters') {
      setViewDate((prev) => subMonths(prev, 6));
    } else {
      setViewDate((prev) => subMonths(prev, 2));
    }
  };

  const handleNext = () => {
    if (timeScale === 'weeks') {
      setViewDate((prev) => addWeeks(prev, 3));
    } else if (timeScale === 'quarters') {
      setViewDate((prev) => addMonths(prev, 6));
    } else {
      setViewDate((prev) => addMonths(prev, 2));
    }
  };

  const handleGoToToday = () => {
    setViewDate(new Date());
  };

  // Focused time window based on selected scale and viewDate
  const timelineStart = useMemo(() => {
    if (timeScale === 'weeks') return startOfWeek(subWeeks(viewDate, 1));
    if (timeScale === 'quarters') return startOfMonth(subMonths(viewDate, 3));
    return startOfMonth(subMonths(viewDate, 1)); // 4 months window: 1 past, current, 2 future
  }, [timeScale, viewDate]);

  const timelineEnd = useMemo(() => {
    if (timeScale === 'weeks') return endOfWeek(addWeeks(viewDate, 4)); // 6 weeks
    if (timeScale === 'quarters') return endOfMonth(addMonths(viewDate, 8)); // 4 quarters
    return endOfMonth(addMonths(viewDate, 2)); // 4 months
  }, [timeScale, viewDate]);

  // Visible Time Range Display Label
  const rangeTitle = useMemo(() => {
    return `${format(timelineStart, 'MMM yyyy')} – ${format(timelineEnd, 'MMM yyyy')}`;
  }, [timelineStart, timelineEnd]);

  // Compact grid columns
  const gridColumns = useMemo(() => {
    if (timeScale === 'weeks') {
      const weeks = eachWeekOfInterval({ start: timelineStart, end: timelineEnd });
      return weeks.map((w) => ({
        id: format(w, 'yyyy-MM-dd'),
        label: `Week ${format(w, 'w')}`,
        subLabel: `${format(w, 'MMM d')} - ${format(endOfWeek(w), 'MMM d')}`,
        startDate: startOfWeek(w),
        endDate: endOfWeek(w),
      }));
    }

    if (timeScale === 'quarters') {
      const months = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
      const quarters = [];
      for (let i = 0; i < months.length; i += 3) {
        const m = months[i];
        const qNum = Math.floor(m.getMonth() / 3) + 1;
        quarters.push({
          id: `${m.getFullYear()}-Q${qNum}`,
          label: `Q${qNum} ${m.getFullYear()}`,
          subLabel: `${format(m, 'MMM')} - ${format(addMonths(m, 2), 'MMM')}`,
          startDate: startOfMonth(m),
          endDate: endOfMonth(addMonths(m, 2)),
        });
      }
      return quarters;
    }

    // Default: 4 clean Month Columns
    const months = eachMonthOfInterval({ start: timelineStart, end: timelineEnd });
    return months.map((m) => ({
      id: format(m, 'yyyy-MM'),
      label: format(m, 'MMMM'),
      subLabel: format(m, 'yyyy'),
      startDate: startOfMonth(m),
      endDate: endOfMonth(m),
    }));
  }, [timeScale, timelineStart, timelineEnd]);

  const totalTimelineDays = Math.max(1, differenceInDays(timelineEnd, timelineStart));
  const now = new Date();

  // Calculate percentage start & width on the timeline
  const getTimelinePosition = (item) => {
    const itemCreated = item.created_at || item.$createdAt ? new Date(item.created_at || item.$createdAt) : now;
    const itemDue = item.dueDate || item.due_date ? new Date(item.dueDate || item.due_date) : addWeeks(itemCreated, 3);

    const startDiff = differenceInDays(itemCreated, timelineStart);
    const duration = Math.max(5, differenceInDays(itemDue, itemCreated));

    let startPercent = (startDiff / totalTimelineDays) * 100;
    let widthPercent = (duration / totalTimelineDays) * 100;

    startPercent = Math.max(0, Math.min(95, startPercent));
    widthPercent = Math.max(5, Math.min(100 - startPercent, widthPercent));

    return {
      left: `${startPercent.toFixed(2)}%`,
      width: `${widthPercent.toFixed(2)}%`,
      startDate: itemCreated,
      dueDate: itemDue,
      durationDays: duration,
    };
  };

  // Today indicator
  const todayPositionPercent = useMemo(() => {
    const diff = differenceInDays(now, timelineStart);
    const percent = (diff / totalTimelineDays) * 100;
    return percent;
  }, [timelineStart, totalTimelineDays]);

  const isTodayVisible = todayPositionPercent >= 0 && todayPositionPercent <= 100;

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = t.name?.toLowerCase().includes(q) || t.key?.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'DONE' && t.status !== 'DONE') return false;
        if (statusFilter === 'IN_PROGRESS' && t.status !== 'IN_PROGRESS' && t.status !== 'IN_REVIEW') return false;
        if (statusFilter === 'TODO' && t.status !== 'TODO' && t.status !== 'BACKLOG') return false;
      }

      if (typeFilter !== 'ALL') {
        const issueType = t.issueType || 'Task';
        if (issueType.toLowerCase() !== typeFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [tasks, searchQuery, statusFilter, typeFilter]);

  // Grouping structures
  const groupedData = useMemo(() => {
    if (groupBy === 'none') {
      return [{ id: 'all', title: 'All Work Items', items: filteredTasks, isExpanded: true }];
    }

    if (groupBy === 'epic') {
      const epics = filteredTasks.filter((t) => (t.issueType || '').toLowerCase() === 'epic');
      const nonEpics = filteredTasks.filter((t) => (t.issueType || '').toLowerCase() !== 'epic');

      const groups = epics.map((epic) => {
        const children = nonEpics.filter((t) => t.epicId === (epic.$id || epic.id));
        const isExp = expandedGroups[epic.$id || epic.id] !== false;
        return {
          id: epic.$id || epic.id,
          title: epic.name,
          key: epic.key || 'EPIC',
          isEpic: true,
          epicData: epic,
          items: children,
          isExpanded: isExp,
        };
      });

      const unassignedToEpic = nonEpics.filter(
        (t) => !t.epicId || !epics.some((e) => (e.$id || e.id) === t.epicId)
      );

      if (unassignedToEpic.length > 0 || groups.length === 0) {
        groups.push({
          id: 'unassigned-epic',
          title: 'Unassigned to Epic',
          key: 'STANDALONE',
          isEpic: false,
          items: unassignedToEpic,
          isExpanded: expandedGroups['unassigned-epic'] !== false,
        });
      }

      return groups;
    }

    if (groupBy === 'status') {
      const statusCategories = [
        { id: 'TODO', title: 'To Do & Backlog', match: ['TODO', 'BACKLOG'] },
        { id: 'IN_PROGRESS', title: 'In Progress & Review', match: ['IN_PROGRESS', 'IN_REVIEW'] },
        { id: 'DONE', title: 'Completed', match: ['DONE'] },
      ];

      return statusCategories.map((cat) => ({
        id: cat.id,
        title: cat.title,
        items: filteredTasks.filter((t) => cat.match.includes(t.status || 'TODO')),
        isExpanded: expandedGroups[cat.id] !== false,
      }));
    }

    return [{ id: 'all', title: 'Timeline Work Items', items: filteredTasks, isExpanded: true }];
  }, [filteredTasks, groupBy, expandedGroups]);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === undefined ? false : !prev[groupId],
    }));
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'epic':
        return <Zap className="size-3.5 text-purple-600 shrink-0" />;
      case 'bug':
        return <Bug className="size-3.5 text-rose-600 shrink-0" />;
      case 'feature':
      case 'story':
        return <Bookmark className="size-3.5 text-emerald-600 shrink-0" />;
      case 'subtask':
        return <GitCommit className="size-3.5 text-cyan-600 shrink-0" />;
      default:
        return <CheckSquare className="size-3.5 text-blue-600 shrink-0" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'DONE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'IN_REVIEW':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'BLOCKED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-neutral-100 text-neutral-700 border-neutral-200';
    }
  };

  const getBarGradient = (item) => {
    const isDone = item.status === 'DONE';
    const type = (item.issueType || '').toLowerCase();

    if (type === 'epic') {
      return 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 border-purple-400';
    }
    if (type === 'bug') {
      return 'bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 border-rose-300';
    }
    if (type === 'story' || type === 'feature') {
      return 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 border-emerald-300';
    }
    if (isDone) {
      return 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 border-emerald-400 opacity-90';
    }
    return 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 border-blue-300';
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-3.5 max-w-7xl mx-auto select-none overflow-hidden">
      {/* 1. Header Toolbar */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-neutral-900">Timeline & Product Roadmap</h1>
            <span className="rounded-full bg-purple-100 text-purple-800 px-2 py-0.2 text-[10px] font-bold">
              {filteredTasks.length} {filteredTasks.length === 1 ? 'Work Item' : 'Work Items'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Gantt scheduling, multi-quarter epics, delivery projections, and work breakdowns.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Previous / Next Paging Navigation */}
          <div className="flex items-center gap-1.5 bg-neutral-50 border border-neutral-300 rounded-xl p-1 shadow-2xs">
            <button
              onClick={handlePrevious}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 transition shadow-2xs"
              title="Previous Time Period"
            >
              <ChevronLeft className="size-4 text-neutral-600" />
              <span>Previous</span>
            </button>

            <div className="px-3.5 py-1.5 bg-white rounded-lg text-xs font-bold text-neutral-800 whitespace-nowrap min-w-[150px] text-center border border-neutral-200/80 shadow-2xs">
              {rangeTitle}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 transition shadow-2xs"
              title="Next Time Period"
            >
              <span>Next</span>
              <ChevronRight className="size-4 text-neutral-600" />
            </button>
          </div>

          <button
            onClick={handleGoToToday}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition"
          >
            <Target className="size-3.5 text-blue-600" />
            Today
          </button>

          <button
            onClick={fetchTasks}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-700 shadow-2xs hover:bg-neutral-50 transition"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={openCreateTask}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="size-4" />
            Create Work Item
          </button>
        </div>
      </div>

      {/* 2. Roadmap Filters & View Controls Bar */}
      <div className="shrink-0 rounded-2xl border border-neutral-200 bg-white p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Search & Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative">
            <Search className="size-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search roadmap..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-neutral-50/70 pl-8 pr-3 py-1.5 text-xs text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-blue-500 focus:outline-hidden w-44 sm:w-56 transition"
            />
          </div>

          {/* Group By Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Layers className="size-3" />
              Group:
            </span>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 focus:border-blue-500 focus:outline-hidden shadow-2xs"
            >
              <option value="epic">By Epic</option>
              <option value="status">By Status</option>
              <option value="none">Flat List</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 focus:border-blue-500 focus:outline-hidden shadow-2xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="TODO">To Do</option>
            <option value="DONE">Done</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-700 focus:border-blue-500 focus:outline-hidden shadow-2xs"
          >
            <option value="ALL">All Types</option>
            <option value="Epic">Epics Only</option>
            <option value="Story">Stories</option>
            <option value="Task">Tasks</option>
            <option value="Bug">Bugs</option>
          </select>
        </div>

        {/* Right Side: Scale Switcher */}
        <div className="flex items-center gap-1 bg-neutral-100/90 p-1 rounded-xl text-xs font-bold">
          <CalendarDays className="size-3.5 text-neutral-400 ml-1.5 mr-0.5" />
          {[
            { id: 'weeks', label: 'Weeks' },
            { id: 'months', label: 'Months' },
            { id: 'quarters', label: 'Quarters' },
          ].map((scale) => (
            <button
              key={scale.id}
              onClick={() => setTimeScale(scale.id)}
              className={`rounded-lg px-3 py-1 transition text-[11px] ${
                timeScale === scale.id
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {scale.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Gantt Timeline Container (Inside Scrolling) */}
      <div
        ref={timelineContainerRef}
        className="flex-1 min-h-0 flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-xs overflow-hidden relative"
      >
        <div className="w-full flex flex-col h-full">
          {/* Header Row (Focused Columns) - Pinned */}
          <div className="shrink-0 flex border-b border-neutral-200 bg-neutral-50/95 text-xs font-bold text-neutral-600 sticky top-0 z-20 shadow-2xs">
            {/* Left Column Header (Work Items Title) */}
            <div className="w-72 sm:w-80 shrink-0 px-4 py-2.5 border-r border-neutral-200 flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-400 bg-neutral-50/95">
              <span>Work Item / Hierarchy</span>
              <span>Status</span>
            </div>

            {/* Time Grid Header */}
            <div className="flex-1 flex divide-x divide-neutral-200 text-center">
              {gridColumns.map((col) => (
                <div key={col.id} className="flex-1 py-2 px-1 flex flex-col items-center justify-center">
                  <span className="font-bold text-neutral-900 text-[11px] truncate w-full">
                    {col.label}
                  </span>
                  <span className="text-[9px] text-neutral-400 font-medium">
                    {col.subLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Grid Content - Inside Scrollable Work Items */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative divide-y divide-neutral-100">
            {/* Vertical Today Line Marker (if visible in current window) */}
            {isTodayVisible && (
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-10 flex flex-col items-center"
                style={{
                  left: `calc(320px + (100% - 320px) * ${todayPositionPercent / 100})`,
                }}
              >
                <div className="bg-rose-500 text-white font-bold text-[9px] uppercase px-1.5 py-0.5 rounded-full shadow-xs -mt-1 whitespace-nowrap">
                  Today
                </div>
                <div className="w-[1.5px] h-full bg-rose-400/80 border-dashed" />
              </div>
            )}

            {/* Empty State */}
            {filteredTasks.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="size-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-xs">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">No roadmap items found</h3>
                  <p className="text-xs text-neutral-500 mt-0.5 max-w-sm">
                    Schedule tasks or create epics to plan initiatives across your project timeline.
                  </p>
                </div>
                <button
                  onClick={openCreateTask}
                  className="rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                >
                  + Create First Work Item
                </button>
              </div>
            ) : (
              /* Grouped Rows */
              groupedData.map((group) => (
                <div key={group.id} className="divide-y divide-neutral-50">
                  {/* Group Header Row */}
                  {groupBy !== 'none' && (
                    <div
                      onClick={() => toggleGroup(group.id)}
                      className="flex items-center bg-neutral-50/50 hover:bg-neutral-100/60 transition cursor-pointer border-y border-neutral-100 text-xs py-2 px-3 font-bold text-neutral-800"
                    >
                      <button className="p-0.5 mr-1.5 text-neutral-500">
                        {group.isExpanded ? (
                          <ChevronDown className="size-4" />
                        ) : (
                          <ChevronRight className="size-4" />
                        )}
                      </button>

                      <div className="flex items-center gap-2 truncate">
                        {group.isEpic ? (
                          <Zap className="size-3.5 text-purple-600" />
                        ) : (
                          <Layers className="size-3.5 text-neutral-500" />
                        )}
                        <span className="truncate">{group.title}</span>
                        <span className="rounded-full bg-neutral-200/80 text-neutral-700 px-2 py-0.2 text-[9px] font-bold">
                          {group.items.length}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Group Epic Row if applicable */}
                  {group.isEpic && group.epicData && group.isExpanded && (
                    <div className="flex items-center hover:bg-neutral-50/70 transition group text-xs min-h-[46px] bg-purple-50/20">
                      {/* Left Cell */}
                      <div className="w-72 sm:w-80 shrink-0 px-4 py-2.5 border-r border-neutral-200 flex items-center justify-between gap-2 pl-7">
                        <div
                          onClick={() => handleOpenTaskDetails(group.epicData)}
                          className="flex items-center gap-2 truncate cursor-pointer hover:text-purple-600"
                        >
                          <Zap className="size-3.5 text-purple-600 shrink-0" />
                          <span className="font-mono text-[10px] text-purple-600 font-bold">
                            {group.epicData.key || 'EPIC'}
                          </span>
                          <span className="font-bold text-neutral-900 truncate">
                            {group.epicData.name}
                          </span>
                        </div>

                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold shrink-0 border ${getStatusColor(
                            group.epicData.status
                          )}`}
                        >
                          {group.epicData.status}
                        </span>
                      </div>

                      {/* Gantt Bar Area */}
                      <div className="flex-1 relative h-full py-2 px-1 flex items-center">
                        {(() => {
                          const pos = getTimelinePosition(group.epicData);
                          return (
                            <div
                              onClick={() => handleOpenTaskDetails(group.epicData)}
                              className={`absolute h-7 rounded-lg shadow-xs flex items-center px-2.5 text-white text-[11px] font-bold truncate transition-all cursor-pointer border ${getBarGradient(
                                group.epicData
                              )}`}
                              style={{
                                left: pos.left,
                                width: pos.width,
                              }}
                              title={`${group.epicData.name} (${format(pos.startDate, 'MMM d')} - ${format(
                                pos.dueDate,
                                'MMM d'
                              )})`}
                            >
                              <Zap className="size-3 mr-1.5 shrink-0 opacity-80" />
                              <span className="truncate">{group.epicData.name}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Child Items Rows */}
                  {group.isExpanded &&
                    group.items.map((item) => {
                      const pos = getTimelinePosition(item);

                      return (
                        <div
                          key={item.$id || item.id}
                          className="flex items-center hover:bg-neutral-50/60 transition group text-xs min-h-[44px]"
                        >
                          {/* Left Title & Status Cell */}
                          <div
                            className={`w-72 sm:w-80 shrink-0 px-4 py-2 border-r border-neutral-200 flex items-center justify-between gap-2 ${
                              group.isEpic ? 'pl-8' : ''
                            }`}
                          >
                            <div
                              onClick={() => handleOpenTaskDetails(item)}
                              className="flex items-center gap-2 truncate cursor-pointer hover:text-blue-600"
                            >
                              {getTypeIcon(item.issueType)}
                              <span className="font-mono text-[10px] text-neutral-400">
                                {item.key || 'TASK'}
                              </span>
                              <span className="font-semibold text-neutral-800 truncate">
                                {item.name}
                              </span>
                            </div>

                            <span
                              className={`rounded px-1.5 py-0.2 text-[9px] font-bold shrink-0 border ${getStatusColor(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </div>

                          {/* Gantt Bar Cell */}
                          <div className="flex-1 relative h-full py-2 px-1 flex items-center">
                            <div
                              onClick={() => handleOpenTaskDetails(item)}
                              className={`absolute h-6 rounded-md shadow-2xs flex items-center px-2 text-white text-[10px] font-semibold truncate transition-all cursor-pointer border ${getBarGradient(
                                item
                              )}`}
                              style={{
                                left: pos.left,
                                width: pos.width,
                              }}
                              title={`${item.name} • ${format(pos.startDate, 'MMM d, yyyy')} → ${format(
                                pos.dueDate,
                                'MMM d, yyyy'
                              )} (${pos.durationDays}d)`}
                            >
                              <span className="truncate">{item.name}</span>
                              {item.storyPoints && (
                                <span className="ml-1.5 rounded bg-black/20 px-1 text-[8px] font-bold">
                                  {item.storyPoints}p
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Footer Legend & Helper */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2.5 text-xs text-neutral-500 bg-neutral-50/80 px-3.5 py-2.5 rounded-xl border border-neutral-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-purple-600 inline-block" />
            <span>Epics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-blue-500 inline-block" />
            <span>Tasks / Stories</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-rose-500 inline-block" />
            <span>Bugs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-emerald-500 inline-block" />
            <span>Completed</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-neutral-400">
          <Info className="size-3.5" />
          <span>Click any work item to view read-only details or click Edit to update</span>
        </div>
      </div>

      {/* 5. Interactive Task Detail / Read-Only & Edit Modal */}
      <RoadmapTaskModal
        open={isDetailModalOpen}
        taskId={selectedTask?.$id || selectedTask?.id}
        initialTask={selectedTask}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTask(null);
        }}
        onUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default RoadmapView;
