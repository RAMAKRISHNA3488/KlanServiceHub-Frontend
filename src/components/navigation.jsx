import React, { useState } from 'react';
import Link from 'next/link';
import { useLocation } from 'react-router-dom';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { cn } from '@/lib/utils';
import {
  Kanban,
  CheckCircle,
  FolderGit2,
  Calendar,
  LayoutDashboard,
  BarChart3,
  Building2,
  Users2,
  ShieldAlert,
  Users,
  GitMerge,
  Zap,
  Webhook,
  Key,
  Shield,
  ScrollText,
  CreditCard,
  Database,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Tag,
  ListTodo,
  Columns3,
  LifeBuoy,
} from 'lucide-react';

const planningRoutes = [
  { label: 'Summary', href: '', icon: LayoutDashboard },
  { label: 'Timeline / Roadmap', href: '/roadmap', icon: Calendar },
  { label: 'Backlog & Sprints', href: '/sprints', icon: ListTodo },
  { label: 'Boards', href: '/boards', icon: Columns3 },
  { label: 'Issues & Tasks', href: '/tasks', icon: CheckCircle },
  { label: 'Releases & Versions', href: '/releases', icon: Tag },
  { label: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
];

const insightsRoutes = [
  { label: 'Dashboards & Gadgets', href: '/dashboards', icon: LayoutDashboard },
];

const crossProjectRoutes = [
  { label: 'Dependencies & Graph', href: '/dependencies', icon: GitMerge },
  { label: 'Capacity & Workload', href: '/capacity', icon: Users2 },
  { label: 'Governance & Risks', href: '/governance', icon: ShieldAlert },
  { label: 'Service Desk (KSM)', href: '/service-desk', icon: LifeBuoy },
  { label: 'CMDB Assets', href: '/assets', icon: Database },
  { label: 'Deployments & DORA', href: '/deployments', icon: Sparkles },
  { label: 'Portfolio & Goals', href: '/portfolios', icon: Kanban },
];

const ownerAdminRoutes = [
  { label: 'Workspaces Directory', href: '/workspaces-admin', icon: Building2 },
  { label: 'Company Profile', href: '/company-profile', icon: Building2 },
  { label: 'User Directory', href: '/users-admin', icon: Users2 },
  { label: 'User Groups & Access', href: '/groups-admin', icon: Users },
  { label: 'Roles & RBAC Matrix', href: '/roles-admin', icon: ShieldAlert },
  { label: 'Teams', href: '/teams-admin', icon: Users },
  { label: 'Workflows & Types', href: '/workflows-admin', icon: GitMerge },
  { label: 'Automation Rules', href: '/automations', icon: Zap },
  { label: 'Integrations & Webhooks', href: '/integrations', icon: Webhook },
  { label: 'API & Access Tokens', href: '/api-tokens', icon: Key },
  { label: 'Security & Sessions', href: '/security', icon: Shield },
  { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
  { label: 'Billing & Seat Licenses', href: '/billing', icon: CreditCard },
  { label: 'Data & Recovery', href: '/data-management', icon: Database },
];

export const Navigation = () => {
  const workspaceId = useWorkspaceId();
  const location = useLocation();

  const [planningOpen, setPlanningOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);

  return (
    <ul className="flex flex-col gap-y-4 px-2 py-3 text-xs font-semibold select-none">
      {/* Section 1: Planning */}
      <div>
        <button
          onClick={() => setPlanningOpen(!planningOpen)}
          className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-neutral-700 transition"
        >
          <span>PLANNING</span>
          {planningOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </button>

        {planningOpen && (
          <div className="mt-1 flex flex-col gap-0.5">
            {planningRoutes.map((item) => {
              const fullHref = `/workspaces/${workspaceId}${item.href}`;
              const isActive =
                item.href === ''
                  ? location.pathname === `/workspaces/${workspaceId}` || location.pathname === `/workspaces/${workspaceId}/`
                  : location.pathname.startsWith(fullHref);
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  <Link
                    href={fullHref}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-semibold transition group text-xs',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-4 shrink-0 transition',
                        isActive ? 'text-blue-600' : 'text-neutral-400 group-hover:text-neutral-600',
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Dashboards */}
      <div>
        <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-400">
          <span>INSIGHTS</span>
        </div>
        <div className="mt-1 flex flex-col gap-0.5">
          {insightsRoutes.map((item) => {
            const fullHref = `/workspaces/${workspaceId}${item.href}`;
            const isActive = location.pathname.startsWith(fullHref);
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <Link
                  href={fullHref}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-semibold transition group text-xs',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4 shrink-0 transition',
                      isActive ? 'text-blue-600' : 'text-neutral-400 group-hover:text-neutral-600',
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </div>
      </div>

      {/* Section 3: Cross-Project & Enterprise Coordination */}
      <div>
        <div className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-400">
          <span>ENTERPRISE & PORTFOLIO</span>
        </div>
        <div className="mt-1 flex flex-col gap-0.5">
          {crossProjectRoutes.map((item) => {
            const fullHref = `/workspaces/${workspaceId}${item.href}`;
            const isActive = location.pathname.startsWith(fullHref);
            const Icon = item.icon;

            return (
              <li key={item.label}>
                <Link
                  href={fullHref}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-semibold transition group text-xs',
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-4 shrink-0 transition',
                      isActive ? 'text-blue-600' : 'text-neutral-400 group-hover:text-neutral-600',
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </div>
      </div>

      {/* Section 4: Company & Admin Hub */}
      <div>
        <button
          onClick={() => setAdminOpen(!adminOpen)}
          className="flex w-full items-center justify-between px-2 py-1 text-[10px] font-black uppercase tracking-wider text-neutral-400 hover:text-neutral-700 transition"
        >
          <span className="flex items-center gap-1">
            <span>ADMIN & OWNER HUB</span>
            <span className="rounded bg-amber-100 px-1 py-0.2 text-[9px] font-bold text-amber-800">👑</span>
          </span>
          {adminOpen ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        </button>

        {adminOpen && (
          <div className="mt-1 flex flex-col gap-0.5">
            {ownerAdminRoutes.map((item) => {
              const fullHref = `/workspaces/${workspaceId}${item.href}`;
              const isActive = location.pathname.startsWith(fullHref);
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  <Link
                    href={fullHref}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 font-semibold transition group text-xs',
                      isActive
                        ? 'bg-blue-50 text-blue-700 font-bold shadow-xs'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-4 shrink-0 transition',
                        isActive ? 'text-blue-600' : 'text-neutral-400 group-hover:text-neutral-600',
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </div>
        )}
      </div>
    </ul>
  );
};
