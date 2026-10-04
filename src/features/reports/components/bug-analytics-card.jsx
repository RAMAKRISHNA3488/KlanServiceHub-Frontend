import React from 'react';
import {
  Bug,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  Flame,
} from 'lucide-react';

export const BugAnalyticsCard = ({ bugData, loading = false, onDrillDown }) => {
  const {
    totalBugs = 0,
    openBugs = 0,
    inProgressBugs = 0,
    resolvedBugs = 0,
    closedBugs = 0,
    criticalBugs = 0,
    overdueBugs = 0,
    byProject = [],
    byPriority = [],
  } = bugData || {};

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-4 w-44 bg-neutral-200 rounded" />
        <div className="h-32 bg-neutral-100 rounded-xl" />
      </div>
    );
  }

  const resolutionRate = totalBugs > 0 ? Math.round(((resolvedBugs + closedBugs) / totalBugs) * 100) : 100;

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-5 transition-all hover:shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Bug className="size-4 text-rose-600" />
            Quality & Defect Tracking
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Active defects, severity concentration, and project bug resolution metrics.
          </p>
        </div>

        <span className="text-[11px] font-semibold text-neutral-400">
          {totalBugs} {totalBugs === 1 ? 'Defect' : 'Defects'} Total
        </span>
      </div>

      {/* KPI metric strips */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <div
          onClick={() => onDrillDown && onDrillDown({ workType: 'Bug', title: 'All Bug Work Items' })}
          className="p-3 rounded-xl bg-neutral-50 border border-neutral-100 cursor-pointer hover:bg-neutral-100/60 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Total Bugs</span>
          <span className="text-lg font-black text-neutral-900 mt-1 block">{totalBugs}</span>
        </div>

        <div
          onClick={() => onDrillDown && onDrillDown({ workType: 'Bug', status: 'TODO', title: 'Open Bugs' })}
          className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 cursor-pointer hover:bg-blue-100/60 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Open</span>
          <span className="text-lg font-black text-blue-900 mt-1 block">{openBugs}</span>
        </div>

        <div
          onClick={() => onDrillDown && onDrillDown({ workType: 'Bug', status: 'IN_PROGRESS', title: 'In-Progress Bugs' })}
          className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 cursor-pointer hover:bg-amber-100/60 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block">In Progress</span>
          <span className="text-lg font-black text-amber-900 mt-1 block">{inProgressBugs}</span>
        </div>

        <div
          onClick={() => onDrillDown && onDrillDown({ workType: 'Bug', status: 'DONE', title: 'Resolved Bugs' })}
          className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 cursor-pointer hover:bg-emerald-100/60 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Resolved / Done</span>
          <span className="text-lg font-black text-emerald-900 mt-1 block">{resolvedBugs + closedBugs}</span>
        </div>

        <div
          onClick={() => onDrillDown && onDrillDown({ drillType: 'CRITICAL_BUGS', title: 'Critical / High Severity Bugs' })}
          className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 cursor-pointer hover:bg-rose-100/70 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block flex items-center gap-1">
            <Flame className="size-2.5" />
            Critical
          </span>
          <span className="text-lg font-black text-rose-900 mt-1 block">{criticalBugs}</span>
        </div>

        <div
          onClick={() => onDrillDown && onDrillDown({ workType: 'Bug', drillType: 'OVERDUE', title: 'Overdue Bug Items' })}
          className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 cursor-pointer hover:bg-purple-100/60 transition"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">Resolution %</span>
          <span className="text-lg font-black text-purple-900 mt-1 block">{resolutionRate}%</span>
        </div>
      </div>

      {/* Bugs by Project Grid */}
      {byProject.length > 0 && (
        <div className="pt-2">
          <span className="text-xs font-bold text-neutral-800 block mb-2.5">
            Defect Distribution by Project
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {byProject.map((p) => (
              <div
                key={p.id}
                onClick={() =>
                  onDrillDown &&
                  onDrillDown({
                    projectId: p.id,
                    workType: 'Bug',
                    title: `Bugs in ${p.name} (${p.key})`,
                  })
                }
                className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/30 hover:bg-neutral-50 transition cursor-pointer flex items-center justify-between"
              >
                <div className="truncate">
                  <span className="font-bold text-neutral-900 text-xs block truncate">{p.name}</span>
                  <span className="text-[10px] text-neutral-400 font-mono">{p.key}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-black text-rose-600">{p.open_bug_count || 0} open</span>
                  <span className="text-[10px] text-neutral-400 font-semibold">({p.bug_count} total)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
