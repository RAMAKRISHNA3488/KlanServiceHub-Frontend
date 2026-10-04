import React, { useState } from 'react';
import {
  Users,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ChevronRight,
  PlusCircle,
  Zap,
} from 'lucide-react';

export const TeamWorkloadCard = ({ teamsData = [], loading = false, onDrillDown, onCreateTask }) => {
  const [viewMode, setViewMode] = useState('teams'); // 'teams' | 'members'

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

  const totalAssignedAcrossTeams = teamsData.reduce((acc, t) => acc + (t.totalAssigned || 0), 0);
  const isEmpty = teamsData.length === 0 || totalAssignedAcrossTeams === 0;

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
      {/* Card Header matching screenshot 2 */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">Team workload</h3>
          {!isEmpty && (
            <div className="flex items-center gap-1 text-[11px] font-medium bg-neutral-100 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode('teams')}
                className={`px-2 py-0.5 rounded-md transition ${
                  viewMode === 'teams' ? 'bg-white shadow-2xs font-bold text-neutral-900' : 'text-neutral-500'
                }`}
              >
                Teams
              </button>
              <button
                onClick={() => setViewMode('members')}
                className={`px-2 py-0.5 rounded-md transition ${
                  viewMode === 'members' ? 'bg-white shadow-2xs font-bold text-neutral-900' : 'text-neutral-500'
                }`}
              >
                Capacity
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          {isEmpty ? (
            <>
              To monitor the capacity of your team,{' '}
              <button
                onClick={onCreateTask}
                className="text-blue-600 hover:underline font-medium focus:outline-hidden"
              >
                create some work items
              </button>
            </>
          ) : (
            'Capacity distribution, active task allocations, and imbalance indicators.'
          )}
        </p>
      </div>

      {/* Table Body */}
      <div className="pt-4">
        <div className="grid grid-cols-12 text-[11px] font-bold text-neutral-400 pb-2 border-b border-neutral-100 uppercase tracking-wider">
          <div className="col-span-5">{viewMode === 'teams' ? 'Team / Assignee' : 'Team Capacity'}</div>
          <div className="col-span-7">Work distribution</div>
        </div>

        {isEmpty ? (
          /* Empty State matching screenshot 2 */
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
          /* Dynamic team workload records */
          <div className="divide-y divide-neutral-50 max-h-[190px] overflow-y-auto custom-scrollbar">
            {teamsData.map((team) => (
              <div
                key={team.id}
                onClick={() =>
                  onDrillDown &&
                  onDrillDown({ teamId: team.id, title: `${team.name} Work Items` })
                }
                className="grid grid-cols-12 items-center py-2.5 text-xs hover:bg-neutral-50/80 rounded-lg px-1 transition cursor-pointer group"
              >
                {/* Team Info */}
                <div className="col-span-5 flex items-center gap-2 truncate">
                  <div className="size-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 font-bold text-[10px]">
                    {team.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-neutral-900 group-hover:text-blue-600 transition block truncate">
                      {team.name}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </div>

                {/* Distribution & Balance */}
                <div className="col-span-7 flex items-center gap-2.5">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-neutral-700">
                        {team.totalAssigned} items ({team.completed} done)
                      </span>
                      <span className="font-bold text-neutral-900">{team.completionPercentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${team.completionPercentage}%` }}
                      />
                      <div
                        className="bg-blue-500 h-full transition-all duration-300"
                        style={{
                          width: `${
                            team.totalAssigned > 0
                              ? Math.round((team.inProgress / team.totalAssigned) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="shrink-0">{getBalanceBadge(team.balanceStatus)}</div>
                  <ChevronRight className="size-3.5 text-neutral-300 opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Capacity dynamically calculated from work velocity</span>
        {!isEmpty && (
          <span className="font-semibold text-neutral-600">
            {teamsData.length} {teamsData.length === 1 ? 'Team' : 'Teams'} Active
          </span>
        )}
      </div>
    </div>
  );
};
