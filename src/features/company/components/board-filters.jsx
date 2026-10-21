import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  Layers,
  Users,
  Briefcase,
  Flag,
  CheckCircle2,
  Sparkles,
  RotateCcw,
  ChevronDown,
  Search,
  X,
} from 'lucide-react';

export const BoardFilters = ({
  filters = {},
  onFilterChange,
  onResetFilters,
  searchQuery = '',
  onSearchChange,
  projects = [],
  teams = [],
  members = [],
  sprints = [],
  statuses = [],
  issueTypes = [],
}) => {
  const [showAdvanced, setShowAdvanced] = useState(true);

  // Defensively ensure all lists are guaranteed arrays regardless of backend payload shape
  const safeProjects = Array.isArray(projects)
    ? projects
    : (Array.isArray(projects?.documents) ? projects.documents : []);
  const safeTeams = Array.isArray(teams)
    ? teams
    : (Array.isArray(teams?.teams) ? teams.teams : (Array.isArray(teams?.data) ? teams.data : []));
  const safeMembers = Array.isArray(members)
    ? members
    : (Array.isArray(members?.documents) ? members.documents : []);
  const safeSprints = Array.isArray(sprints)
    ? sprints
    : (Array.isArray(sprints?.sprints) ? sprints.sprints : (Array.isArray(sprints?.data) ? sprints.data : []));
  const safeStatuses = Array.isArray(statuses) ? statuses : [];
  const safeIssueTypes = Array.isArray(issueTypes)
    ? issueTypes
    : (Array.isArray(issueTypes?.data) ? issueTypes.data : []);

  const datePresets = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'Custom', value: 'custom' },
  ];

  // Derive work types from available issueTypes or fallback list
  const defaultWorkTypes = ['Epic', 'Feature', 'Story', 'Task', 'Bug', 'Sub-task', 'Subtask', 'Improvement'];
  const availableWorkTypes = Array.from(
    new Set([
      ...defaultWorkTypes,
      ...safeIssueTypes.map((t) => t.name || t.id).filter(Boolean),
    ])
  );

  const defaultStatuses = [
    { id: 'BACKLOG', label: 'Backlog' },
    { id: 'TODO', label: 'To Do' },
    { id: 'IN_PROGRESS', label: 'In Progress' },
    { id: 'IN_REVIEW', label: 'In Review' },
    { id: 'DONE', label: 'Done' },
  ];

  const availableStatuses = (safeStatuses && safeStatuses.length > 0)
    ? safeStatuses.map((s) => ({
        id: s.id || s.rawName || s.name,
        label: s.label || s.name || s.id,
      }))
    : defaultStatuses;

  const priorities = [
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' },
    { value: 'LOWEST', label: 'Lowest' },
  ];

  const hasActiveFilters =
    Boolean(filters.projectId && filters.projectId !== 'ALL') ||
    Boolean(filters.teamId && filters.teamId !== 'ALL') ||
    Boolean(filters.assigneeId && filters.assigneeId !== 'ALL') ||
    Boolean(filters.workType && filters.workType !== 'ALL') ||
    Boolean(filters.status && filters.status !== 'ALL') ||
    Boolean(filters.priority && filters.priority !== 'ALL') ||
    Boolean(filters.sprintId && filters.sprintId !== 'ALL') ||
    Boolean(filters.dateRange) ||
    Boolean(searchQuery);

  const handleDatePresetClick = (val) => {
    // If clicking the active preset, toggle it off to show all dates
    if (filters.dateRange === val) {
      onFilterChange('dateRange', null);
    } else {
      onFilterChange('dateRange', val);
    }
  };

  return (
    <div className="rounded-xl sm:rounded-2xl border border-neutral-200 bg-white p-2.5 sm:p-4 shadow-xs space-y-2.5 sm:space-y-3 transition-all">
      {/* Top Row: Date Range Pills, Search, Reset & Filter Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
        {/* Date Presets Pill Group */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-neutral-100/90 p-0.5 sm:p-1 rounded-xl text-[10px] sm:text-xs font-semibold select-none overflow-x-auto max-w-full">
          <Calendar className="size-3 sm:size-3.5 text-neutral-400 ml-1 sm:ml-1.5 mr-0.5 shrink-0" />
          {datePresets.map((preset) => {
            const isActive = filters.dateRange === preset.value;
            return (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleDatePresetClick(preset.value)}
                className={`rounded-lg px-2 sm:px-2.5 py-0.5 sm:py-1 transition text-[10px] sm:text-[11px] font-medium whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-white text-blue-600 shadow-xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/50'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Right side: Search, Reset & Filters Toggle Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
          {/* Quick Search */}
          {onSearchChange && (
            <div className="relative flex-1 sm:flex-initial sm:min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-2 size-3 sm:size-3.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Filter board by summary or key..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50/70 pl-7 sm:pl-8 pr-7 py-1 text-[11px] sm:text-xs text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-blue-500 focus:outline-none transition shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-600"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          )}

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="flex items-center gap-1 text-[11px] sm:text-xs text-rose-600 hover:text-rose-700 font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
            >
              <RotateCcw className="size-2.5 sm:size-3" />
              <span>Reset</span>
            </button>
          )}

          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1 sm:gap-1.5 rounded-lg border px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold transition shadow-xs cursor-pointer ${
              showAdvanced || hasActiveFilters
                ? 'border-blue-200 bg-blue-50/60 text-blue-700'
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <Filter className="size-3 sm:size-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="size-1.5 sm:size-2 rounded-full bg-blue-600 inline-block ml-0.5" />
            )}
            <ChevronDown
              className={`size-2.5 sm:size-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Custom Date Range Pickers (if 'custom' selected) */}
      {filters.dateRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1.5 sm:pt-2 border-t border-neutral-100 text-[11px] sm:text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-neutral-500 font-medium text-[10px] sm:text-[11px]">From:</span>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs text-neutral-800 shadow-2xs focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-neutral-500 font-medium text-[10px] sm:text-[11px]">To:</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs text-neutral-800 shadow-2xs focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* 7 Filter Selectors Grid Matching Reference Image Exactly */}
      {showAdvanced && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-2.5 pt-2.5 sm:pt-3 border-t border-neutral-100">
          {/* 1. PROJECT */}
          <div className="space-y-0.5 sm:space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Briefcase className="size-2.5 sm:size-3 text-neutral-400" />
              <span>PROJECT</span>
            </label>
            <select
              value={filters.projectId || 'ALL'}
              onChange={(e) => onFilterChange('projectId', e.target.value)}
              className="w-full rounded-md sm:rounded-lg border border-neutral-200 bg-neutral-50/70 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10.5px] sm:text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            >
              <option value="ALL">All Projects</option>
              {safeProjects.map((p) => {
                const id = p.$id || p.id;
                return (
                  <option key={id} value={id}>
                    {p.name}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. TEAM */}
          <div className="space-y-0.5 sm:space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Users className="size-2.5 sm:size-3 text-neutral-400" />
              <span>TEAM</span>
            </label>
            <select
              value={filters.teamId || 'ALL'}
              onChange={(e) => onFilterChange('teamId', e.target.value)}
              className="w-full rounded-md sm:rounded-lg border border-neutral-200 bg-neutral-50/70 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10.5px] sm:text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            >
              <option value="ALL">All Teams</option>
              {safeTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. ASSIGNEE */}
          <div className="space-y-0.5 sm:space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Users className="size-2.5 sm:size-3 text-neutral-400" />
              <span>ASSIGNEE</span>
            </label>
            <select
              value={filters.assigneeId || 'ALL'}
              onChange={(e) => onFilterChange('assigneeId', e.target.value)}
              className="w-full rounded-md sm:rounded-lg border border-neutral-200 bg-neutral-50/70 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10.5px] sm:text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            >
              <option value="ALL">All Assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {safeMembers.map((m) => {
                const id = m.memberId || m.id || m.$id;
                return (
                  <option key={id} value={id}>
                    {m.name || m.userName || m.email}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 4. WORK TYPE */}
          <div className="space-y-0.5 sm:space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Layers className="size-2.5 sm:size-3 text-neutral-400" />
              <span>WORK TYPE</span>
            </label>
            <select
              value={filters.workType || 'ALL'}
              onChange={(e) => onFilterChange('workType', e.target.value)}
              className="w-full rounded-md sm:rounded-lg border border-neutral-200 bg-neutral-50/70 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10.5px] sm:text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            >
              <option value="ALL">All Types</option>
              {availableWorkTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* 5. STATUS */}
          <div className="space-y-0.5 sm:space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <CheckCircle2 className="size-2.5 sm:size-3 text-neutral-400" />
              <span>STATUS</span>
            </label>
            <select
              value={filters.status || 'ALL'}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full rounded-md sm:rounded-lg border border-neutral-200 bg-neutral-50/70 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10.5px] sm:text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            >
              <option value="ALL">All Statuses</option>
              {availableStatuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* 6. PRIORITY */}
          <div className="space-y-0.5 sm:space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Flag className="size-2.5 sm:size-3 text-neutral-400" />
              <span>PRIORITY</span>
            </label>
            <select
              value={filters.priority || 'ALL'}
              onChange={(e) => onFilterChange('priority', e.target.value)}
              className="w-full rounded-md sm:rounded-lg border border-neutral-200 bg-neutral-50/70 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10.5px] sm:text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            >
              <option value="ALL">All Priorities</option>
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* 7. SPRINT */}
          <div className="space-y-0.5 sm:space-y-1">
            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Sparkles className="size-2.5 sm:size-3 text-neutral-400" />
              <span>SPRINT</span>
            </label>
            <select
              value={filters.sprintId || 'ALL'}
              onChange={(e) => onFilterChange('sprintId', e.target.value)}
              className="w-full rounded-md sm:rounded-lg border border-neutral-200 bg-neutral-50/70 px-1.5 sm:px-2 py-1 sm:py-1.5 text-[10.5px] sm:text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
            >
              <option value="ALL">All Sprints</option>
              {safeSprints.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
