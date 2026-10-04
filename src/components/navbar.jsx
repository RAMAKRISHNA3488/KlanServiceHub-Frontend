'use client';
import { usePathname } from 'next/navigation';
import { UserButton } from '@/features/auth/components/user-button';
import { MobileSidebar } from './mobile-sidebar';
import { NotificationCenter } from './notification-center';
import { ShieldCheck, Crown } from 'lucide-react';

const pathnameMap = {
  tasks: {
    title: 'My Tasks',
    description: 'View and track all tasks assigned to you across projects.',
  },
  projects: {
    title: 'Projects',
    description: 'Manage development projects, sprints, and roadmaps.',
  },
  'company-profile': {
    title: 'Company Profile & Settings',
    description: 'Manage company branding, contact details, localization, and lifecycle.',
  },
  'users-admin': {
    title: 'User Management',
    description: 'Directory, invitations, suspensions, and user role allocations.',
  },
  'roles-admin': {
    title: 'Roles & Permission Matrix',
    description: 'Granular Role-Based Access Control (RBAC) across Company, Project, and Issue scopes.',
  },
  'teams-admin': {
    title: 'Teams & Organizational Units',
    description: 'Manage cross-functional teams, leads, and project assignments.',
  },
  'workflows-admin': {
    title: 'Workflows & Issue Types',
    description: 'Design custom workflow statuses, transitions, and issue schemas.',
  },
  sprints: {
    title: 'Sprints & Agile Backlog',
    description: 'Scrum sprint planning, active sprint board, and backlog prioritization.',
  },
  boards: {
    title: 'Boards & Kanban Views',
    description: 'Visual workflow boards with custom columns, filters, and drag-and-drop.',
  },
  dashboards: {
    title: 'Dashboards & Gadgets',
    description: 'Real-time project gadgets, sprint burndown, and team workload metrics.',
  },
  reports: {
    title: 'Reports & Analytics',
    description: 'Velocity trends, resolution times, cycle time, and company-wide health.',
  },
  automations: {
    title: 'Automation Rules Engine',
    description: 'Trigger-condition-action automation rules and execution audit.',
  },
  integrations: {
    title: 'Integrations & Webhooks',
    description: 'Connect GitHub, GitLab, Bitbucket, Slack, and external HTTP webhooks.',
  },
  'api-tokens': {
    title: 'API & Access Tokens',
    description: 'Generate scoped API tokens for CI/CD and programmatic service access.',
  },
  security: {
    title: 'Security & Session Management',
    description: 'Password policies, two-factor authentication, and active session termination.',
  },
  'audit-logs': {
    title: 'Enterprise Audit Trail',
    description: 'Immutable record of organization activities, timestamps, and IP addresses.',
  },
  billing: {
    title: 'Billing & Subscription',
    description: 'SaaS plan tiers, seat licenses, storage gauges, and invoice history.',
  },
  'data-management': {
    title: 'Data Management & Backups',
    description: 'One-click company JSON/CSV exports, snapshot backups, and data retention.',
  },
};

const defaultMap = {
  title: 'Company Dashboard',
  description: 'Full accessibility overview for organization owner and administrators.',
};

export const Navbar = () => {
  const pathname = usePathname();
  const pathnameParts = pathname.split('/');
  const pathnameKey = pathnameParts[3] || pathnameParts[2];
  const { title, description } = pathnameMap[pathnameKey] || defaultMap;

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/80 bg-white/70 backdrop-blur-md sticky top-0 z-30">
      <div className="hidden flex-col lg:flex">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">{title}</h1>
          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-700 border border-amber-500/20">
            <Crown className="size-3 text-amber-600" /> Owner Suite
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>

      <MobileSidebar />

      <div className="flex items-center gap-x-3">
        <NotificationCenter />
        <div className="h-6 w-px bg-neutral-200" />
        <UserButton />
      </div>
    </nav>
  );
};
