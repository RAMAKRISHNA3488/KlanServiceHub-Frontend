import React from 'react';
import {
  Briefcase,
  Layers,
  Users,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  CheckSquare,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';

export const OverviewKPIs = ({ overview = {}, loading = false, onDrillDown }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs animate-pulse space-y-2">
            <div className="h-3 w-16 bg-neutral-200 rounded" />
            <div className="h-7 w-10 bg-neutral-200 rounded" />
            <div className="h-2 w-20 bg-neutral-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const {
    totalProjects = 0,
    activeProjects = 0,
    totalTeams = 0,
    totalMembers = 0,
    totalWorkItems = 0,
    openWorkItems = 0,
    inProgress = 0,
    completed = 0,
    blocked = 0,
    overdue = 0,
    completionRate = 0,
  } = overview;

  const cards = [
    {
      label: 'Total Projects',
      value: totalProjects,
      subtitle: `${activeProjects} Active`,
      icon: Briefcase,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50/60',
      border: 'hover:border-indigo-200',
      onClick: () => onDrillDown && onDrillDown({ entityType: 'projects', title: 'Organization Projects (Total)' }),
    },
    {
      label: 'Active Projects',
      value: activeProjects,
      subtitle: 'Currently in delivery',
      icon: Flame,
      color: 'text-amber-600',
      bg: 'bg-amber-50/60',
      border: 'hover:border-amber-200',
      onClick: () => onDrillDown && onDrillDown({ entityType: 'active_projects', title: 'Active Projects (In Delivery)' }),
    },
    {
      label: 'Total Teams',
      value: totalTeams,
      subtitle: 'Cross-functional units',
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50/60',
      border: 'hover:border-purple-200',
      onClick: () => onDrillDown && onDrillDown({ entityType: 'teams', title: 'Organization Teams' }),
    },
    {
      label: 'Total Members',
      value: totalMembers,
      subtitle: 'Active collaborators',
      icon: UserCheck,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50/60',
      border: 'hover:border-cyan-200',
      onClick: () => onDrillDown && onDrillDown({ entityType: 'members', title: 'Organization Members & Collaborators' }),
    },
    {
      label: 'Total Work Items',
      value: totalWorkItems,
      subtitle: `${completionRate}% Completed`,
      icon: CheckSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-50/60',
      border: 'hover:border-blue-200',
      onClick: () => onDrillDown && onDrillDown({ title: 'Total Work Items' }),
    },
    {
      label: 'Open Work',
      value: openWorkItems,
      subtitle: 'To Do / Backlog',
      icon: Layers,
      color: 'text-neutral-600',
      bg: 'bg-neutral-100',
      border: 'hover:border-neutral-300',
      onClick: () => onDrillDown && onDrillDown({ status: 'TODO', title: 'Open Work Items' }),
    },
    {
      label: 'In Progress',
      value: inProgress,
      subtitle: 'Active execution',
      icon: Clock,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'hover:border-blue-300',
      onClick: () => onDrillDown && onDrillDown({ status: 'IN_PROGRESS', title: 'In Progress Work Items' }),
    },
    {
      label: 'Completed',
      value: completed,
      subtitle: `${completionRate}% of total`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'hover:border-emerald-300',
      onClick: () => onDrillDown && onDrillDown({ status: 'DONE', title: 'Completed Work Items' }),
    },
    {
      label: 'Blocked',
      value: blocked,
      subtitle: blocked > 0 ? 'Requires unblocking' : 'No blockers',
      icon: ShieldAlert,
      color: blocked > 0 ? 'text-rose-600' : 'text-neutral-400',
      bg: blocked > 0 ? 'bg-rose-50' : 'bg-neutral-50',
      border: blocked > 0 ? 'hover:border-rose-300' : 'hover:border-neutral-200',
      onClick: () => onDrillDown && onDrillDown({ drillType: 'BLOCKED', title: 'Blocked Work Items' }),
    },
    {
      label: 'Overdue Items',
      value: overdue,
      subtitle: overdue > 0 ? 'Action required' : 'On schedule',
      icon: AlertTriangle,
      color: overdue > 0 ? 'text-rose-600 font-black' : 'text-neutral-500',
      bg: overdue > 0 ? 'bg-rose-50/80 border-rose-200' : 'bg-neutral-50',
      border: overdue > 0 ? 'hover:border-rose-400' : 'hover:border-neutral-200',
      onClick: () => onDrillDown && onDrillDown({ drillType: 'OVERDUE', title: 'Overdue Work Items' }),
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={card.onClick}
            className={`group rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs transition-all duration-200 ${
              card.onClick ? 'cursor-pointer hover:shadow-md' : ''
            } ${card.border}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block truncate">
                {card.label}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bg}`}>
                <Icon className={`size-3.5 ${card.color}`} />
              </div>
            </div>

            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-lg font-bold text-neutral-900 tracking-tight">{card.value}</span>
              {card.onClick && (
                <ChevronRight className="size-3 text-neutral-300 opacity-0 group-hover:opacity-100 group-hover:text-blue-600 transition" />
              )}
            </div>

            <p className="mt-0.5 text-[10px] text-neutral-400 truncate">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
};
