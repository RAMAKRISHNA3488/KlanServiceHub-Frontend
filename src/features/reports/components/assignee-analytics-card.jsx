import React, { useState } from 'react';
import {
  Users,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const AssigneeAnalyticsCard = ({ membersData = [], loading = false, onDrillDown, onSortChange, currentSort = 'workload' }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-4 w-44 bg-neutral-200 rounded" />
        <div className="h-32 bg-neutral-100 rounded-xl" />
      </div>
    );
  }

  const filteredMembers = membersData.filter(
    (m) =>
      m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-4 transition-all hover:shadow-sm">
      {/* Header with Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Users className="size-4 text-blue-600" />
            Assignee Workload & Performance
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Individual task throughput, completion efficiency, and workload balance across members.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <input
            type="text"
            placeholder="Search member..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-neutral-50/50 px-2.5 py-1 text-xs text-neutral-800 focus:bg-white focus:border-blue-500 focus:outline-hidden w-36 sm:w-44"
          />

          {/* Sort Selector */}
          <select
            value={currentSort}
            onChange={(e) => onSortChange && onSortChange(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-700 font-medium focus:border-blue-500 focus:outline-hidden shadow-2xs"
          >
            <option value="workload">Highest Workload</option>
            <option value="completionRate">Highest Completion Rate</option>
            <option value="overdue">Most Overdue</option>
            <option value="blocked">Most Blocked</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-xs text-neutral-600">
          <thead className="border-b border-neutral-100 bg-neutral-50/60 font-bold uppercase tracking-wider text-neutral-400 text-[10px]">
            <tr>
              <th className="px-3 py-2.5">Member</th>
              <th className="px-3 py-2.5">Teams</th>
              <th className="px-3 py-2.5 text-center">Assigned</th>
              <th className="px-3 py-2.5 text-center">Open</th>
              <th className="px-3 py-2.5 text-center">In Progress</th>
              <th className="px-3 py-2.5 text-center">Completed</th>
              <th className="px-3 py-2.5 text-center">Overdue</th>
              <th className="px-3 py-2.5 text-center">Completion Rate</th>
              <th className="px-3 py-2.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-neutral-400 text-xs">
                  No members found matching active filters.
                </td>
              </tr>
            ) : (
              filteredMembers.map((m) => (
                <tr
                  key={m.memberId || m.userId}
                  onClick={() =>
                    onDrillDown &&
                    onDrillDown({
                      assigneeId: m.memberId,
                      title: `${m.name}'s Assigned Work Items`,
                    })
                  }
                  className="hover:bg-neutral-50/80 transition cursor-pointer group"
                >
                  {/* Member Name + Avatar */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[11px] shrink-0 border border-blue-200">
                        {m.avatarUrl ? (
                          <img src={m.avatarUrl} alt="" className="size-full rounded-full object-cover" />
                        ) : (
                          (m.name || 'U').slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="truncate">
                        <span className="font-bold text-neutral-900 group-hover:text-blue-600 transition block truncate">
                          {m.name}
                        </span>
                        <span className="text-[10px] text-neutral-400 truncate block">
                          {m.jobTitle || m.email}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Teams */}
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[140px]">
                      {(m.teams || []).length === 0 ? (
                        <span className="text-neutral-400 text-[10px]">General</span>
                      ) : (
                        m.teams.map((t) => (
                          <span
                            key={t.id}
                            className="rounded bg-neutral-100 px-1.5 py-0.2 text-[9px] font-semibold text-neutral-600 truncate"
                          >
                            {t.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>

                  {/* Assigned Count */}
                  <td className="px-3 py-3 text-center font-bold text-neutral-900">
                    {m.totalAssigned}
                  </td>

                  {/* Open Count */}
                  <td className="px-3 py-3 text-center font-semibold text-neutral-600">
                    {m.open}
                  </td>

                  {/* In Progress Count */}
                  <td className="px-3 py-3 text-center font-semibold text-blue-600">
                    {m.inProgress}
                  </td>

                  {/* Completed Count */}
                  <td className="px-3 py-3 text-center font-bold text-emerald-600">
                    {m.completed}
                  </td>

                  {/* Overdue Count */}
                  <td className="px-3 py-3 text-center">
                    {m.overdue > 0 ? (
                      <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[10px] font-bold">
                        {m.overdue}
                      </span>
                    ) : (
                      <span className="text-neutral-300">0</span>
                    )}
                  </td>

                  {/* Completion Rate Bar */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${m.completionRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-neutral-800 text-[11px] min-w-[28px]">
                        {m.completionRate}%
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="px-3 py-3 text-right">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        m.workloadStatus === 'Overloaded'
                          ? 'bg-rose-100 text-rose-800'
                          : m.workloadStatus === 'Underutilized'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {m.workloadStatus}
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
