import React from 'react';
import {
  Sparkles,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronRight,
  Flame,
} from 'lucide-react';

export const SprintVelocityCard = ({ sprintsData, loading = false, onDrillDown }) => {
  const { sprints = [], currentSprint = null, previousSprint = null, averageVelocity = 0 } = sprintsData || {};

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
            <Sparkles className="size-4 text-purple-600" />
            Sprint Velocity & Execution
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Story points committed vs. delivered across Scrum iterations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-purple-50 border border-purple-100 px-3 py-1.5 flex items-center gap-2">
            <Flame className="size-3.5 text-purple-600" />
            <span className="text-xs font-bold text-purple-900">
              Avg Velocity: {averageVelocity} pts
            </span>
          </div>
        </div>
      </div>

      {/* Sprints Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs text-neutral-600">
          <thead className="border-b border-neutral-100 bg-neutral-50/60 font-bold uppercase tracking-wider text-neutral-400 text-[10px]">
            <tr>
              <th className="px-3 py-2.5">Sprint</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-center">Planned Work</th>
              <th className="px-3 py-2.5 text-center">Completed Work</th>
              <th className="px-3 py-2.5 text-center">Committed Pts</th>
              <th className="px-3 py-2.5 text-center">Velocity (Pts)</th>
              <th className="px-3 py-2.5 text-right">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sprints.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-neutral-400 text-xs">
                  No active or closed sprints in this workspace yet.
                </td>
              </tr>
            ) : (
              sprints.map((s) => (
                <tr
                  key={s.id}
                  onClick={() =>
                    onDrillDown &&
                    onDrillDown({ sprintId: s.id, title: `Sprint: ${s.name} Work Items` })
                  }
                  className="hover:bg-neutral-50/80 transition cursor-pointer group"
                >
                  <td className="px-3 py-3">
                    <span className="font-bold text-neutral-900 group-hover:text-blue-600 transition block">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {s.projectName}
                    </span>
                  </td>

                  <td className="px-3 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-[9px] font-bold ${
                        s.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.status === 'CLOSED'
                          ? 'bg-neutral-100 text-neutral-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>

                  <td className="px-3 py-3 text-center font-semibold text-neutral-700">
                    {s.plannedWork}
                  </td>

                  <td className="px-3 py-3 text-center font-bold text-emerald-600">
                    {s.completedWork}
                  </td>

                  <td className="px-3 py-3 text-center font-semibold text-neutral-700">
                    {s.storyPointsCommitted} pts
                  </td>

                  <td className="px-3 py-3 text-center font-black text-purple-700">
                    {s.velocity} pts
                  </td>

                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${s.completionPercentage}%` }}
                        />
                      </div>
                      <span className="font-bold text-neutral-900 text-[11px] min-w-[28px]">
                        {s.completionPercentage}%
                      </span>
                    </div>
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
