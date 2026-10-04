import React from 'react';
import {
  Briefcase,
  Bug,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const ProjectAnalyticsCard = ({ projectsData = [], loading = false, onDrillDown, onSelectProject }) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-4 w-44 bg-neutral-200 rounded" />
        <div className="h-32 bg-neutral-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-4 transition-all hover:shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Briefcase className="size-4 text-indigo-600" />
            Project Performance & Delivery Health
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Cross-project visibility into progress, active bugs, overdue items, and team alignments.
          </p>
        </div>

        <span className="text-[11px] font-semibold text-neutral-400">
          {projectsData.length} {projectsData.length === 1 ? 'Project' : 'Projects'} Active
        </span>
      </div>

      {/* Grid of Projects or Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs text-neutral-600">
          <thead className="border-b border-neutral-100 bg-neutral-50/60 font-bold uppercase tracking-wider text-neutral-400 text-[10px]">
            <tr>
              <th className="px-3 py-2.5">Project</th>
              <th className="px-3 py-2.5">Lead</th>
              <th className="px-3 py-2.5 text-center">Total Work</th>
              <th className="px-3 py-2.5 text-center">Open</th>
              <th className="px-3 py-2.5 text-center">In Progress</th>
              <th className="px-3 py-2.5 text-center">Completed</th>
              <th className="px-3 py-2.5 text-center">Bugs</th>
              <th className="px-3 py-2.5 text-center">Overdue</th>
              <th className="px-3 py-2.5 text-right">Completion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {projectsData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-neutral-400 text-xs">
                  No projects found in this workspace.
                </td>
              </tr>
            ) : (
              projectsData.map((p) => (
                <tr
                  key={p.id}
                  onClick={() =>
                    onDrillDown &&
                    onDrillDown({ projectId: p.id, title: `${p.name} (${p.key}) Work Items` })
                  }
                  className="hover:bg-neutral-50/80 transition cursor-pointer group"
                >
                  {/* Project Name + Key */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-lg bg-indigo-100/70 text-indigo-700 flex items-center justify-center font-bold text-[10px] shrink-0 border border-indigo-200">
                        {p.key?.slice(0, 3) || 'PRJ'}
                      </div>
                      <div className="truncate max-w-[180px]">
                        <span className="font-bold text-neutral-900 group-hover:text-blue-600 transition block truncate">
                          {p.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400">
                          {p.key} • {p.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Lead */}
                  <td className="px-3 py-3">
                    <span className="text-neutral-700 font-medium truncate block max-w-[120px]">
                      {p.lead?.name || 'Unassigned'}
                    </span>
                  </td>

                  {/* Total Work */}
                  <td className="px-3 py-3 text-center font-bold text-neutral-900">
                    {p.totalWork}
                  </td>

                  {/* Open */}
                  <td className="px-3 py-3 text-center font-medium text-neutral-600">
                    {p.open}
                  </td>

                  {/* In Progress */}
                  <td className="px-3 py-3 text-center font-medium text-blue-600">
                    {p.inProgress}
                  </td>

                  {/* Completed */}
                  <td className="px-3 py-3 text-center font-bold text-emerald-600">
                    {p.completed}
                  </td>

                  {/* Bugs */}
                  <td className="px-3 py-3 text-center">
                    {p.bugs > 0 ? (
                      <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 justify-center mx-auto w-fit">
                        <Bug className="size-2.5" />
                        {p.bugs}
                      </span>
                    ) : (
                      <span className="text-neutral-300">0</span>
                    )}
                  </td>

                  {/* Overdue */}
                  <td className="px-3 py-3 text-center">
                    {p.overdue > 0 ? (
                      <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
                        {p.overdue}
                      </span>
                    ) : (
                      <span className="text-neutral-300">0</span>
                    )}
                  </td>

                  {/* Completion Rate Progress */}
                  <td className="px-3 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${p.completionPercentage}%` }}
                        />
                      </div>
                      <span className="font-bold text-neutral-900 text-[11px] min-w-[28px]">
                        {p.completionPercentage}%
                      </span>
                      <ChevronRight className="size-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition" />
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
