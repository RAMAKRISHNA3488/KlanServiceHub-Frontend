import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  Layers,
  Users,
  Briefcase,
  Flag,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  ChevronDown,
  X,
} from 'lucide-react';

export const AnalyticsFilters = ({
  filters,
  onFilterChange,
  onResetFilters,
  projects = [],
  teams = [],
  members = [],
  sprints = [],
  epics = [],
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const datePresets = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'This Year', value: 'thisYear' },
    { label: 'Custom', value: 'custom' },
  ];

  const workTypes = ['Epic', 'Feature', 'Story', 'Task', 'Bug', 'Subtask'];
  const statuses = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED', 'CANCELLED'];
  const priorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'LOWEST'];

  const hasActiveFilters =
    filters.projectId ||
    filters.teamId ||
    filters.assigneeId ||
    filters.workType ||
    filters.status ||
    filters.priority ||
    filters.sprintId ||
    filters.epicId ||
    (filters.dateRange && filters.dateRange !== '30d');

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3.5 transition-all">
      {/* Top Row: Primary Quick Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Date Presets Pill Group */}
        <div className="flex items-center gap-1.5 bg-neutral-100/80 p-1 rounded-xl text-xs font-semibold select-none overflow-x-auto custom-scrollbar">
          <Calendar className="size-3.5 text-neutral-400 ml-1.5 mr-0.5" />
          {datePresets.map((preset) => {
            const isActive = (filters.dateRange || '30d') === preset.value;
            return (
              <button
                key={preset.value}
                onClick={() => onFilterChange('dateRange', preset.value)}
                className={`rounded-lg px-2.5 py-1 transition text-[11px] font-medium whitespace-nowrap ${
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

        {/* Action buttons: Reset & Advanced toggle */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition"
            >
              <RotateCcw className="size-3" />
              Reset Filters
            </button>
          )}

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition shadow-xs ${
              showAdvanced || hasActiveFilters
                ? 'border-blue-200 bg-blue-50/50 text-blue-700'
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <Filter className="size-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="size-2 rounded-full bg-blue-600 inline-block ml-0.5" />
            )}
            <ChevronDown className={`size-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom Date Inputs if 'custom' is active */}
      {filters.dateRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 font-medium text-[11px]">From:</span>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-800 shadow-2xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-500 font-medium text-[11px]">To:</span>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-800 shadow-2xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>
        </div>
      )}

      {/* Advanced Filter Selectors Bar */}
      {showAdvanced && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-3 border-t border-neutral-100">
          {/* Project Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Briefcase className="size-3" />
              Project
            </label>
            <select
              value={filters.projectId || ''}
              onChange={(e) => onFilterChange('projectId', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/60 px-2 py-1.5 text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id || p.$id} value={p.id || p.$id}>
                  {p.name} ({p.key || 'PROJ'})
                </option>
              ))}
            </select>
          </div>

          {/* Team Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Users className="size-3" />
              Team
            </label>
            <select
              value={filters.teamId || ''}
              onChange={(e) => onFilterChange('teamId', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/60 px-2 py-1.5 text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="">All Teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Assignee Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Users className="size-3" />
              Assignee
            </label>
            <select
              value={filters.assigneeId || ''}
              onChange={(e) => onFilterChange('assigneeId', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/60 px-2 py-1.5 text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="">All Assignees</option>
              <option value="UNASSIGNED">Unassigned</option>
              {members.map((m) => (
                <option key={m.memberId || m.id} value={m.memberId || m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Work Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Layers className="size-3" />
              Work Type
            </label>
            <select
              value={filters.workType || ''}
              onChange={(e) => onFilterChange('workType', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/60 px-2 py-1.5 text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="">All Types</option>
              {workTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <CheckCircle2 className="size-3" />
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/60 px-2 py-1.5 text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="">All Statuses</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Flag className="size-3" />
              Priority
            </label>
            <select
              value={filters.priority || ''}
              onChange={(e) => onFilterChange('priority', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/60 px-2 py-1.5 text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="">All Priorities</option>
              {priorities.map((p) => {
                const labelMap = {
                  CRITICAL: 'P0 - Critical',
                  HIGH: 'P1 - High',
                  MEDIUM: 'P2 - Medium',
                  LOW: 'P3 - Low',
                  LOWEST: 'P4 - Lowest',
                };
                return (
                  <option key={p} value={p}>
                    {labelMap[p] || p}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Sprint */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
              <Sparkles className="size-3" />
              Sprint
            </label>
            <select
              value={filters.sprintId || ''}
              onChange={(e) => onFilterChange('sprintId', e.target.value)}
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/60 px-2 py-1.5 text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-hidden"
            >
              <option value="">All Sprints</option>
              {sprints.map((sp) => (
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
