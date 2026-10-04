import React from 'react';
import {
  AlertTriangle,
  Clock,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Flame,
} from 'lucide-react';

export const OverdueAnalyticsCard = ({ overdueData, loading = false, onDrillDown, onOpenTask }) => {
  const { totalOverdue = 0, overdueTasks = [], byProject = [], byPriority = [] } = overdueData || {};

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-4 w-44 bg-neutral-200 rounded" />
        <div className="h-32 bg-neutral-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-5 transition-all hover:shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <AlertTriangle className="size-4 text-rose-600" />
            Overdue Work Items & SLA Slippage
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Deliverables that passed their target due date and require schedule realignment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
              totalOverdue > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {totalOverdue} {totalOverdue === 1 ? 'Item' : 'Items'} Overdue
          </span>
        </div>
      </div>

      {/* Top Overdue Tasks Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs text-neutral-600">
          <thead className="border-b border-neutral-100 bg-neutral-50/60 font-bold uppercase tracking-wider text-neutral-400 text-[10px]">
            <tr>
              <th className="px-3 py-2.5">Key & Summary</th>
              <th className="px-3 py-2.5">Project</th>
              <th className="px-3 py-2.5">Assignee</th>
              <th className="px-3 py-2.5">Priority</th>
              <th className="px-3 py-2.5">Due Date</th>
              <th className="px-3 py-2.5 text-right">Days Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {overdueTasks.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-emerald-600 font-semibold text-xs">
                  🎉 Zero overdue items! All active deliverables are on schedule.
                </td>
              </tr>
            ) : (
              overdueTasks.slice(0, 10).map((t) => (
                <tr
                  key={t.id}
                  onClick={() => (onOpenTask ? onOpenTask(t.id) : onDrillDown && onDrillDown({ title: t.name }))}
                  className="hover:bg-neutral-50/80 transition cursor-pointer group"
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 max-w-[280px]">
                      <span className="font-mono text-[10px] font-bold text-neutral-400 shrink-0">
                        {t.key}
                      </span>
                      <span className="font-bold text-neutral-900 group-hover:text-blue-600 transition truncate">
                        {t.name}
                      </span>
                    </div>
                  </td>

                  <td className="px-3 py-3">
                    <span className="text-neutral-700 font-medium truncate block max-w-[120px]">
                      {t.project_name}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <span className="text-neutral-700 font-medium truncate block max-w-[120px]">
                      {t.assignee_name || 'Unassigned'}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        t.priority === 'HIGHEST' || t.priority === 'CRITICAL' || t.priority === 'P0'
                          ? 'bg-rose-100 text-rose-800'
                          : t.priority === 'HIGH' || t.priority === 'P1'
                          ? 'bg-amber-100 text-amber-800'
                          : t.priority === 'LOW' || t.priority === 'P3'
                          ? 'bg-blue-100 text-blue-700'
                          : t.priority === 'LOWEST' || t.priority === 'P4'
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {t.priority === 'CRITICAL'
                        ? 'P0 - Critical'
                        : t.priority === 'HIGH' || t.priority === 'HIGHEST'
                        ? 'P1 - High'
                        : t.priority === 'MEDIUM'
                        ? 'P2 - Medium'
                        : t.priority === 'LOW'
                        ? 'P3 - Low'
                        : t.priority === 'LOWEST'
                        ? 'P4 - Lowest'
                        : (t.priority || 'P2 - Medium')}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-neutral-500 font-mono text-[11px]">
                    {t.due_date?.slice(0, 10)}
                  </td>

                  <td className="px-3 py-3 text-right">
                    <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold">
                      {t.days_overdue} {t.days_overdue === 1 ? 'day' : 'days'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
