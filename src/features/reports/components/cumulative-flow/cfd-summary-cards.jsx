import React from 'react';
import {
  Layers,
  Clock,
  Zap,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  Activity,
} from 'lucide-react';

export const CfdSummaryCards = ({
  summary = {},
  loading = false,
  onDrillDown = null,
}) => {
  const {
    totalTickets = 0,
    wip = 0,
    completedTickets = 0,
    throughput = { daily: 0, weekly: 0 },
    avgCycleTimeDays = 0,
    avgLeadTimeDays = 0,
    bottleneck = {
      stage: 'Optimal Flow',
      isBottleneck: false,
      severity: 'NORMAL',
      accumulatedCount: 0,
      avgDwellTimeDays: 0,
      message: 'Work is flowing evenly across all stages.',
    },
  } = summary;

  const cards = [
    {
      id: 'total',
      label: 'Total Tickets',
      value: totalTickets,
      subtext: 'In selected scope',
      icon: Layers,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
      tooltip: 'Total number of work items tracked in the selected project and date range.',
    },
    {
      id: 'wip',
      label: 'Work in Progress (WIP)',
      value: wip,
      subtext: 'Active dev & review stages',
      icon: Activity,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-100',
      tooltip: 'Tickets currently being worked on in active workflow stages (In Progress, Code Review, Testing).',
      onClick: () => onDrillDown && onDrillDown({ status: 'IN_PROGRESS' }),
    },
    {
      id: 'completed',
      label: 'Completed Tickets',
      value: completedTickets,
      subtext: 'Reached Done state',
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
      tooltip: 'Total number of tickets that reached Done / Resolved status.',
      onClick: () => onDrillDown && onDrillDown({ status: 'DONE' }),
    },
    {
      id: 'throughput',
      label: 'Throughput',
      value: `${throughput.daily || 0}/day`,
      subtext: `${throughput.weekly || 0} tickets/wk`,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-100',
      tooltip: 'Delivery rate: average number of tickets completed per day and per week.',
    },
    {
      id: 'cycleTime',
      label: 'Avg Cycle Time',
      value: `${avgCycleTimeDays}d`,
      subtext: 'Active work to Done',
      icon: Clock,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-100',
      tooltip: 'Average elapsed time from entering an active work status (In Progress) until completion (Done).',
    },
    {
      id: 'leadTime',
      label: 'Avg Lead Time',
      value: `${avgLeadTimeDays}d`,
      subtext: 'Creation to Done',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-100',
      tooltip: 'Average elapsed time from ticket creation request to final completion.',
    },
    {
      id: 'bottleneck',
      label: 'Bottleneck Stage',
      value: bottleneck.stage,
      subtext: bottleneck.isBottleneck
        ? `${bottleneck.accumulatedCount} queued (${bottleneck.avgDwellTimeDays}d avg)`
        : 'No bottlenecks detected',
      icon: AlertTriangle,
      color: bottleneck.isBottleneck ? 'text-rose-600' : 'text-emerald-600',
      bgColor: bottleneck.isBottleneck ? 'bg-rose-50' : 'bg-emerald-50',
      borderColor: bottleneck.isBottleneck ? 'border-rose-200' : 'border-emerald-100',
      tooltip: 'Identifies the workflow stage where tickets are accumulating or spending the longest time.',
      isAlert: bottleneck.isBottleneck,
      onClick: () => bottleneck.isBottleneck && onDrillDown && onDrillDown({ status: bottleneck.stage }),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={card.onClick}
            className={`rounded-xl border ${card.borderColor} bg-white p-3 shadow-2xs transition-all hover:shadow-xs relative group ${
              card.onClick ? 'cursor-pointer hover:border-blue-400' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 truncate" title={card.label}>
                {card.label}
              </span>
              <div className={`p-1 rounded ${card.bgColor} ${card.color}`}>
                <Icon className="size-3" />
              </div>
            </div>

            <div className="flex items-baseline gap-1">
              {loading ? (
                <div className="h-5 w-14 bg-neutral-200 animate-pulse rounded my-0.5" />
              ) : (
                <span className={`text-[13px] font-extrabold truncate ${card.isAlert ? 'text-rose-700' : 'text-neutral-900'}`}>
                  {card.value}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between text-[9px] text-neutral-400 mt-0.5">
              <span className="truncate">{card.subtext}</span>
              <span className="group-hover:opacity-100 opacity-0 transition-opacity text-neutral-400 ml-1" title={card.tooltip}>
                <HelpCircle className="size-2" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
