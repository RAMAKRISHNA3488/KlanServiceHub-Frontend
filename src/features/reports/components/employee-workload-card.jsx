import React, { useState } from 'react';
import {
  UserCheck,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  ArrowRight,
  PieChart as PieChartIcon,
  List,
} from 'lucide-react';
import { PieChart } from './charts/pie-chart';

export const EmployeeWorkloadCard = ({
  membersData = [],
  loading = false,
  onDrillDown,
  onViewAll,
  onCreateTask,
}) => {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'overloaded' | 'top'
  const [cardView, setCardView] = useState('list'); // 'list' | 'chart'

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs animate-pulse space-y-4 h-[340px]">
        <div className="h-4 w-36 bg-neutral-200 rounded" />
        <div className="h-3 w-56 bg-neutral-100 rounded" />
        <div className="space-y-3 pt-4">
          <div className="h-8 bg-neutral-100 rounded-lg" />
          <div className="h-8 bg-neutral-100 rounded-lg" />
          <div className="h-8 bg-neutral-100 rounded-lg" />
        </div>
      </div>
    );
  }

  const totalAssignedAcrossMembers = membersData.reduce((acc, m) => acc + (m.totalAssigned || 0), 0);
  const isEmpty = membersData.length === 0 || totalAssignedAcrossMembers === 0;

  const filteredMembers = membersData.filter((m) => {
    if (filterMode === 'overloaded') return m.workloadStatus === 'Overloaded';
    if (filterMode === 'top') return m.completionRate >= 75 && m.completed > 0;
    return true;
  });

  const getBalanceBadge = (status) => {
    switch (status) {
      case 'Overloaded':
        return (
          <span className="rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 flex items-center gap-1">
            <AlertTriangle className="size-2.5" />
            Overloaded
          </span>
        );
      case 'Underutilized':
        return (
          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            Underutilized
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between min-h-[340px] transition-all hover:shadow-sm">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <UserCheck className="size-4 text-blue-600" />
            Employee workload
          </h3>
          {!isEmpty && (
            <div className="flex items-center gap-2">
              {/* Chart / List Toggle */}
              <div className="flex items-center bg-neutral-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setCardView('list')}
                  title="List View"
                  className={`p-1 rounded-md transition ${
                    cardView === 'list' ? 'bg-white shadow-2xs text-neutral-900' : 'text-neutral-400'
                  }`}
                >
                  <List className="size-3" />
                </button>
                <button
                  onClick={() => setCardView('chart')}
                  title="Pie Chart View"
                  className={`p-1 rounded-md transition ${
                    cardView === 'chart' ? 'bg-white shadow-2xs text-neutral-900' : 'text-neutral-400'
                  }`}
                >
                  <PieChartIcon className="size-3" />
                </button>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 text-[11px] font-medium bg-neutral-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setFilterMode('all')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    filterMode === 'all' ? 'bg-white shadow-2xs font-bold text-neutral-900' : 'text-neutral-500'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterMode('overloaded')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    filterMode === 'overloaded' ? 'bg-white shadow-2xs font-bold text-rose-700' : 'text-neutral-500'
                  }`}
                >
                  At Risk
                </button>
                <button
                  onClick={() => setFilterMode('top')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    filterMode === 'top' ? 'bg-white shadow-2xs font-bold text-emerald-700' : 'text-neutral-500'
                  }`}
                >
                  High Velocity
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          {isEmpty ? (
            <>
              To track employee throughput and balance,{' '}
              <button
                onClick={onCreateTask}
                className="text-blue-600 hover:underline font-medium focus:outline-hidden"
              >
                assign some work items
              </button>
            </>
          ) : (
            'Individual member allocations, completion metrics, and burnout indicators.'
          )}
        </p>
      </div>

      {/* Body Content: List or Pie Chart */}
      {cardView === 'chart' && !isEmpty ? (
        <div className="py-2 flex items-center justify-around">
          <PieChart
            data={[
              {
                label: 'Optimal',
                value: membersData.filter((m) => m.workloadStatus === 'Normal' || !m.workloadStatus).length,
                color: '#10B981',
              },
              {
                label: 'Overloaded',
                value: membersData.filter((m) => m.workloadStatus === 'Overloaded').length,
                color: '#E11D48',
              },
              {
                label: 'Underutilized',
                value: membersData.filter((m) => m.workloadStatus === 'Underutilized').length,
                color: '#F59E0B',
              },
            ]}
            size={140}
            innerRadius={42}
            showLegend={true}
            onSliceClick={(slice) => {
              if (slice.label === 'Overloaded') setFilterMode('overloaded');
              else if (slice.label === 'Optimal') setFilterMode('top');
              else setFilterMode('all');
            }}
          />
        </div>
      ) : (
        <div className="pt-3">
          <div className="grid grid-cols-12 text-[11px] font-bold text-neutral-400 pb-2 border-b border-neutral-100 uppercase tracking-wider">
            <div className="col-span-5">Employee / Role</div>
            <div className="col-span-7">Workload & Completion</div>
          </div>

        {isEmpty ? (
          <div className="py-4 divide-y divide-neutral-50">
            <div className="grid grid-cols-12 items-center py-3 text-xs">
              <div className="col-span-5 flex items-center gap-2 text-neutral-600 font-medium">
                <div className="size-6 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                  <User className="size-3.5" />
                </div>
                <span>Unassigned</span>
              </div>
              <div className="col-span-7">
                <div className="w-full h-5 bg-neutral-200/70 rounded-md" />
              </div>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50 max-h-[190px] overflow-y-auto custom-scrollbar">
            {filteredMembers.map((member) => (
              <div
                key={member.memberId || member.userId}
                onClick={() =>
                  onDrillDown &&
                  onDrillDown({
                    assigneeId: member.memberId,
                    title: `${member.name}'s Assigned Tasks`,
                  })
                }
                className="grid grid-cols-12 items-center py-2.5 text-xs hover:bg-neutral-50/80 rounded-lg px-1 transition cursor-pointer group"
              >
                {/* Member Info */}
                <div className="col-span-5 flex items-center gap-2 truncate">
                  <div className="size-7 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 font-bold text-[10px]">
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt="" className="size-full rounded-full object-cover" />
                    ) : (
                      (member.name || 'U').slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-neutral-900 group-hover:text-blue-600 transition block truncate">
                      {member.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 block truncate">
                      {member.jobTitle || member.department || 'Staff'}
                    </span>
                  </div>
                </div>

                {/* Distribution & Balance */}
                <div className="col-span-7 flex items-center gap-2.5">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-neutral-700">
                        {member.totalAssigned} items ({member.completed} done)
                      </span>
                      <span className="font-bold text-neutral-900">{member.completionRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${member.completionRate}%` }}
                      />
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{
                          width: `${
                            member.totalAssigned > 0
                              ? Math.round((member.inProgress / member.totalAssigned) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="shrink-0">{getBalanceBadge(member.workloadStatus)}</div>
                  <ChevronRight className="size-3.5 text-neutral-300 opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
        <span>{membersData.length} active employee profiles</span>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
          >
            Full Employee Report <ArrowRight className="size-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default EmployeeWorkloadCard;
