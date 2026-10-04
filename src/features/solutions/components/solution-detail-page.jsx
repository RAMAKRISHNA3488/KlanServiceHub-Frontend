import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { LandingFooter } from '@/components/landing-footer';
import {
  Kanban,
  GitFork,
  Shield,
  Bot,
  BarChart3,
  LifeBuoy,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Clock,
  Layers,
  Check,
  ChevronRight,
  Globe,
  Sliders,
  Users,
  Activity,
  Cpu,
  Lock,
  ExternalLink,
  Terminal,
  Database,
  Code2,
  Copy,
  Play,
  RefreshCw,
  AlertTriangle,
  SlidersHorizontal,
  Server,
  Key,
} from 'lucide-react';

const solutionsData = {
  'scrum-kanban-boards': {
    title: 'Visual Scrum & Kanban Boards',
    category: 'Agile Delivery',
    tagline: 'High-velocity sprint planning, drag-and-drop workflow columns, and strict QA governance.',
    icon: Kanban,
    color: 'blue',
    iconBg: 'bg-blue-50 text-blue-600 border-blue-200',
    heroGradient: 'from-blue-600 via-indigo-600 to-blue-700',
    badge: 'Enterprise Kanban & Sprints',
    overview:
      'The Scrum and Kanban system in klanservicehub gives engineering teams complete control over task lifecycles, sprint commitments, story point estimations, and delivery milestones. Built with real-time drag-and-drop state syncing and server-side RBAC validation.',
    coreCapabilities: [
      {
        title: 'Multi-Column Workflow Progression',
        desc: 'Customize project columns (Backlog, To Do, In Progress, In Review, QA, Done) with custom status color badges and transition guardrails.',
      },
      {
        title: 'Strict Delivery Governance ("Done" Gatekeeping)',
        desc: 'Task transitions into the "Done" status are restricted to Workspace Administrators and Project Leads, guaranteeing QA verification integrity before closure.',
      },
      {
        title: 'Story Point Estimation & Sprint Velocity',
        desc: 'Assign Fibonacci story points to epics, stories, and tasks. Sprint velocity and remaining commitment points recalculate dynamically in real-time.',
      },
      {
        title: 'Multi-Assignee & Live Filter Search',
        desc: 'Assign single or multiple engineers to complex tasks with quick assignee search, priority flags, deadline countdowns, and rich markdown descriptions.',
      },
    ],
    technicalArchitecture: [
      { label: 'Drag-and-Drop Library', value: '@hello-pangea/dnd with optimistic state mutations' },
      { label: 'Query Execution', value: '<10ms p99 via Cloudflare D1 / SQLite prepared statements' },
      { label: 'Role Enforcement', value: 'Server-side 403 Forbidden validation on non-admin terminal moves' },
      { label: 'Real-Time Sync', value: 'WebSocket pub/sub state broadcasting across active squads' },
    ],
    useCases: [
      'Sprint Kickoffs & Backlog Grooming with Story Points',
      'Daily Standups with Instant Column Drag & Drop',
      'QA Release Gates & Administrator Sign-off',
      'Cross-functional Bug Triage and Epic Grouping',
    ],
    sqlSchema: `-- Table: tasks (Cloudflare D1 / SQLite)
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'TODO',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  story_points INTEGER DEFAULT 0,
  position INTEGER NOT NULL,
  assignee_ids TEXT, -- JSON Array
  due_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_ws_proj_status ON tasks(workspace_id, project_id, status);`,
    apiEndpoint: 'PATCH /api/tasks/:taskId/status',
    apiCurl: `curl -X PATCH https://api.klanservicehub.dev/api/tasks/task_8921/status \\
  -H "Authorization: Bearer klan_sec_eyJhbG..." \\
  -H "Content-Type: application/json" \\
  -d '{"status": "DONE", "position": 1000, "workspaceId": "ws_123"}'`,
    apiResponse: `{
  "success": true,
  "data": {
    "id": "task_8921",
    "status": "DONE",
    "governanceCheck": "VERIFIED_BY_ADMIN",
    "updatedAt": "2026-09-11T21:42:00.000Z"
  }
}`,
  },
  'dependency-graph': {
    title: 'Cross-Project Dependency Graph',
    category: 'Architecture Topology',
    tagline: 'Visualize cross-squad blockers, repository dependencies, and critical path bottlenecks.',
    icon: GitFork,
    color: 'purple',
    iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
    heroGradient: 'from-purple-600 via-indigo-600 to-purple-800',
    badge: 'Topology & Blocker Mapping',
    overview:
      'Modern software architectures span multiple repositories, microservices, and specialized squads. The Dependency Graph provides complete topological visibility into task relationships, upstream blockers, downstream deliverables, and critical release paths.',
    coreCapabilities: [
      {
        title: 'Bi-Directional Blocker Linking',
        desc: 'Link tasks with "Blocks", "Is Blocked By", "Duplicates", or "Relates To" relationships across different projects within the workspace.',
      },
      {
        title: 'Circular Dependency Detection',
        desc: 'Automated graph cycle detection alerts squad leads when two or more tasks form an impossible dependency loop before sprint commit.',
      },
      {
        title: 'Critical Path Analysis',
        desc: 'Identifies the longest sequential chain of dependent tasks to highlight risks to sprint deadlines and product release milestones.',
      },
      {
        title: 'Multi-Project Topology Visualizer',
        desc: 'Interactive node-link graph mapping squads, issue states, and blockers with zoom, pan, and filter controls.',
      },
    ],
    technicalArchitecture: [
      { label: 'Graph Algorithm', value: "Tarjan's strongly connected components & DAG traversal" },
      { label: 'Cycle Detection', value: 'Real-time pre-save validation hook with warning toast' },
      { label: 'Index Optimization', value: 'Composite index on (source_task_id, target_task_id, rel_type)' },
      { label: 'Cross-Workspace Support', value: 'Workspace-scoped multi-project relation queries' },
    ],
    useCases: [
      'Microservice API Contract Delivery Alignment',
      'Frontend / Backend Release Synchronization',
      'Sprint Risk Mitigation & Dependency Clearing',
      'Architecture Governance & Blocker Remediation',
    ],
    sqlSchema: `-- Table: task_dependencies
CREATE TABLE task_dependencies (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  source_task_id TEXT NOT NULL,
  target_task_id TEXT NOT NULL,
  relation_type TEXT NOT NULL, -- 'BLOCKS' | 'IS_BLOCKED_BY' | 'RELATION'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (target_task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_deps_source_target ON task_dependencies(source_task_id, target_task_id);`,
    apiEndpoint: 'POST /api/dependencies/link',
    apiCurl: `curl -X POST https://api.klanservicehub.dev/api/dependencies/link \\
  -H "Authorization: Bearer klan_sec_eyJhbG..." \\
  -H "Content-Type: application/json" \\
  -d '{"sourceTaskId": "task_101", "targetTaskId": "task_202", "relationType": "BLOCKS"}'`,
    apiResponse: `{
  "success": true,
  "cycleDetected": false,
  "criticalPathImpact": "NORMAL",
  "linkId": "dep_9021"
}`,
  },
  'rbac-governance': {
    title: '72-Permission RBAC Matrix',
    category: 'Security & Governance',
    tagline: 'Granular enterprise role hierarchies, strict delivery gates, and compliance audit logging.',
    icon: Shield,
    color: 'emerald',
    iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    heroGradient: 'from-emerald-600 via-teal-600 to-emerald-800',
    badge: 'Enterprise Security & Governance',
    overview:
      'klanservicehub features a comprehensive Klanvision-grade Role-Based Access Control (RBAC) architecture. With 72+ granular permission flags across 8 distinct enterprise roles, organizations can enforce strict operational boundaries and delivery governance.',
    coreCapabilities: [
      {
        title: '8 Distinct Organizational Roles',
        desc: 'Company Owner, Workspace Admin, Project Lead, Senior Engineer, QA Specialist, Contributor, Read-Only Observer, and Guest Auditor.',
      },
      {
        title: 'Granular 72-Point Permission Matrix',
        desc: 'Fine-grained toggles for Task Creation, Edit Status, Move to Done, Sprint Initiation, Member Invite, API Token Issuance, and Billing Access.',
      },
      {
        title: 'QA Delivery Gatekeeping',
        desc: 'Enforces organizational QA rules where only authorized Admins and Project Leads can transition cards into terminal "Done" status.',
      },
      {
        title: 'Immutable Audit Trail Logging',
        desc: 'Every role modification, permission toggle, status escalation, and project alteration is recorded permanently with actor ID and IP.',
      },
    ],
    technicalArchitecture: [
      { label: 'Authorization Model', value: 'Declarative bitmask & permission matrix middleware' },
      { label: 'Enforcement Layer', value: 'Server-side Hono middleware validating JWT claims' },
      { label: 'Audit Storage', value: 'Append-only audit table with immutable cryptographic log IDs' },
      { label: 'SAML / SSO Ready', value: 'Compatible with Enterprise IdP role mapping' },
    ],
    useCases: [
      'Enterprise Compliance & SOC 2 / ISO 27001 Readiness',
      'Contractor & Vendor Isolated Access Management',
      'Engineering Delivery Governance & QA Sign-off',
      'Organization-wide Role Delegation and Hierarchy',
    ],
    sqlSchema: `-- Table: workspace_members & permissions
CREATE TABLE workspace_members (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'MEMBER', -- 'OWNER'|'ADMIN'|'LEAD'|'MEMBER'
  permission_mask INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  metadata TEXT, -- JSON
  ip_address TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);`,
    apiEndpoint: 'POST /api/governance/evaluate-action',
    apiCurl: `curl -X POST https://api.klanservicehub.dev/api/governance/evaluate-action \\
  -H "Authorization: Bearer klan_sec_eyJhbG..." \\
  -d '{"action": "TRANSITION_TO_DONE", "taskId": "task_104", "workspaceId": "ws_alpha"}'`,
    apiResponse: `{
  "allowed": true,
  "role": "ADMIN",
  "reason": "ROLE_HAS_DELIVERY_GOVERNANCE_PRIVILEGE",
  "auditId": "audit_88921"
}`,
  },
  'automations-engine': {
    title: 'No-Code Automations Engine',
    category: 'Workflow Automation',
    tagline: 'Event-driven triggers, conditional routing, auto-assignments, and webhook dispatching.',
    icon: Bot,
    color: 'amber',
    iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
    heroGradient: 'from-amber-600 via-orange-600 to-amber-800',
    badge: 'No-Code Workflow Automations',
    overview:
      'Eliminate repetitive manual tasks with our event-driven Automations Studio. Set up customizable "When Trigger -> If Condition -> Then Action" recipes to automatically reassign tickets, update priorities, notify squads, and dispatch external webhooks.',
    coreCapabilities: [
      {
        title: 'Event-Driven Triggers',
        desc: 'Trigger automations on Issue Created, Status Changed, Priority Escalated, Assignee Added, Due Date Approaching, or SLA Breached.',
      },
      {
        title: 'Conditional Branching & Filters',
        desc: 'Filter actions by project, issue type (e.g. only Bugs), priority level (e.g. Critical only), or specific custom field values.',
      },
      {
        title: 'Automated Squad Notifications & Webhooks',
        desc: 'Dispatch real-time payload webhooks to external CI/CD pipelines, Discord, Slack, or internal microservices.',
      },
      {
        title: 'Auto-Assignment & Triage Rules',
        desc: 'Round-robin assign new bugs to squad on-call engineers or route security issues directly to the compliance squad.',
      },
    ],
    technicalArchitecture: [
      { label: 'Execution Model', value: 'Asynchronous event bus with idempotent task queue' },
      { label: 'Webhook Dispatch', value: 'Signed HMAC-SHA256 payloads with automated retry backoff' },
      { label: 'Execution Logs', value: 'Comprehensive automation run history with error traces' },
      { label: 'Rate Limiting', value: 'Per-workspace execution quotas preventing infinite event loops' },
    ],
    useCases: [
      'Auto-escalating Critical Incidents to On-Call Leads',
      'Synchronizing GitHub Pull Request Merges with Jira Cards',
      'Auto-assigning QA Reviewers on "In Review" Status Changes',
      'Notifying Stakeholders on Sprint Completion',
    ],
    sqlSchema: `-- Table: automations
CREATE TABLE automations (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- 'TASK_STATUS_CHANGED'
  condition_json TEXT,         -- JSON rules
  action_json TEXT NOT NULL,   -- JSON action sequence
  is_active INTEGER DEFAULT 1,
  execution_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);`,
    apiEndpoint: 'POST /api/automations/test-trigger',
    apiCurl: `curl -X POST https://api.klanservicehub.dev/api/automations/test-trigger \\
  -H "Authorization: Bearer klan_sec_eyJhbG..." \\
  -d '{"ruleId": "rule_auto_01", "mockPayload": {"status": "IN_REVIEW"}}'`,
    apiResponse: `{
  "success": true,
  "matchedConditions": 2,
  "actionsDispatched": ["ASSIGN_QA_LEAD", "DISPATCH_WEBHOOK_SLACK"],
  "executionDurationMs": 4.2
}`,
  },
  'velocity-analytics': {
    title: 'Velocity & Burndown Analytics',
    category: 'Agile Insights',
    tagline: 'Real-time sprint velocity charts, cumulative flow diagrams, and delivery predictability.',
    icon: BarChart3,
    color: 'pink',
    iconBg: 'bg-pink-50 text-pink-600 border-pink-200',
    heroGradient: 'from-pink-600 via-rose-600 to-pink-800',
    badge: 'Agile Reporting & Metrics',
    overview:
      'Make data-driven sprint commitments and identify process bottlenecks with deep engineering analytics. Track story point velocity, scope creep, cycle times, lead times, and squad capacity in real-time.',
    coreCapabilities: [
      {
        title: 'Sprint Burndown & Burnup Graphs',
        desc: 'Track ideal guideline progress against actual completed story points hour-by-hour to predict sprint completion accurately.',
      },
      {
        title: 'Historical Squad Velocity Trends',
        desc: 'Calculate average team story points completed over the last 10 sprints to set realistic future sprint commitment targets.',
      },
      {
        title: 'Cumulative Flow & Cycle Time Tracking',
        desc: 'Visualize work in progress (WIP) across each column to immediately pinpoint bottlenecks where cards linger too long.',
      },
      {
        title: 'SLA Breach Prediction & Due Date Warnings',
        desc: 'Proactive alerts on tickets approaching SLA thresholds or sprint deadlines to prevent delivery slip.',
      },
    ],
    technicalArchitecture: [
      { label: 'Calculation Engine', value: 'Incremental time-series aggregation on task transition events' },
      { label: 'Chart Rendering', value: 'High-performance SVG vector rendering with responsive tooltips' },
      { label: 'Data Export', value: 'Export raw metrics to CSV, JSON, or Executive PDF summaries' },
      { label: 'Latency', value: 'Instant sub-15ms dashboard rendering via cached summary views' },
    ],
    useCases: [
      'Sprint Retrospective Performance Reviews',
      'Executive Roadmap & Release Date Forecasting',
      'Engineering Capacity Allocation & Workload Balancing',
      'Identifying QA and Code Review Bottlenecks',
    ],
    sqlSchema: `-- Analytics Materialized Views
CREATE VIEW view_sprint_velocity AS
SELECT 
  project_id,
  COUNT(id) as total_tasks,
  SUM(story_points) as total_points,
  SUM(CASE WHEN status = 'DONE' THEN story_points ELSE 0 END) as completed_points
FROM tasks
GROUP BY project_id;`,
    apiEndpoint: 'GET /api/reports/velocity?sprintId=sprint_12',
    apiCurl: `curl -X GET "https://api.klanservicehub.dev/api/reports/velocity?sprintId=sprint_12" \\
  -H "Authorization: Bearer klan_sec_eyJhbG..."`,
    apiResponse: `{
  "sprintId": "sprint_12",
  "committedPoints": 42,
  "completedPoints": 38,
  "velocityRating": "90.4%",
  "forecastedDaysToCompletion": 1.5
}`,
  },
  'service-desk-management': {
    title: 'JSM & Service Desk Management',
    category: 'ITSM & Service Desk',
    tagline: 'Customer support request queues, SLA targets, incident management, and CMDB asset tracking.',
    icon: LifeBuoy,
    color: 'cyan',
    iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    heroGradient: 'from-cyan-600 via-blue-600 to-indigo-700',
    badge: 'Enterprise Service Management',
    overview:
      'Bridge the gap between customer service requests and internal engineering delivery. klanservicehub includes a full-featured Jira Service Management (JSM) suite with customer request portals, tiered SLA queues, incident response protocols, and CMDB asset dependencies.',
    coreCapabilities: [
      {
        title: 'Tiered SLA Response & Resolution Queues',
        desc: 'Define custom SLA policies (e.g. 15-minute first response for P1 Critical) with live countdown timers and auto-escalation.',
      },
      {
        title: 'Customer Request Portal',
        desc: 'Dedicated external-facing portal where organization users submit change requests, incident tickets, or feature inquiries.',
      },
      {
        title: 'CMDB Hardware & Software Asset Tracking',
        desc: 'Track physical devices, cloud servers, licenses, and services linked directly to incident tickets for instant root-cause analysis.',
      },
      {
        title: 'Major Incident Protocol & Post-Mortems',
        desc: 'Command center for P1 incidents with automated squad paging, stakeholder status updates, and post-incident review logs.',
      },
    ],
    technicalArchitecture: [
      { label: 'SLA Engine', value: 'Millisecond-accurate background cron worker evaluating breach thresholds' },
      { label: 'Customer Isolation', value: 'Role-scoped public portal permissions without internal board access' },
      { label: 'CMDB Schema', value: 'Relational asset-to-ticket graph with lifecycle state attributes' },
      { label: 'Notifications', value: 'Real-time email and web push notifications on ticket updates' },
    ],
    useCases: [
      'IT Helpdesk & Employee Hardware Provisioning',
      'Customer Bug Reports & Incident Escalation to Engineering',
      'Change Management & CAB Approval Workflows',
      'CMDB IT Asset Lifecycle & Cloud Infrastructure Tracking',
    ],
    sqlSchema: `-- Table: jsm_tickets & assets
CREATE TABLE jsm_tickets (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  reporter_email TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'P3', -- P1/P2/P3/P4
  sla_breach_time DATETIME NOT NULL,
  asset_id TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN'
);

CREATE TABLE cmdb_assets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- 'SERVER'|'LAPTOP'|'LICENSE'
  status TEXT NOT NULL
);`,
    apiEndpoint: 'POST /api/jsm/tickets/create',
    apiCurl: `curl -X POST https://api.klanservicehub.dev/api/jsm/tickets/create \\
  -H "Authorization: Bearer klan_sec_eyJhbG..." \\
  -d '{"reporterEmail": "ops@client.com", "priority": "P1", "assetId": "srv_prod_01"}'`,
    apiResponse: `{
  "ticketId": "JSM-4091",
  "slaTargetMinutes": 15,
  "slaExpiresAt": "2026-09-11T21:57:00.000Z",
  "pagingDispatched": true
}`,
  },
};

export const SolutionDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Helper to resolve current slug from param or pathname fallback
  const getSlugFromLocation = () => {
    if (slug && solutionsData[slug]) return slug;
    const path = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
    const parts = path.split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart && solutionsData[lastPart]) return lastPart;
    return 'scrum-kanban-boards';
  };

  const [activeSlug, setActiveSlug] = useState(getSlugFromLocation);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'advance' | 'simulator'
  const [selectedRole, setSelectedRole] = useState('ADMIN');
  const [copiedKey, setCopiedKey] = useState(null);
  const [simTaskStatus, setSimTaskStatus] = useState('IN_PROGRESS');
  const [simAlert, setSimAlert] = useState(null);

  // Sync state whenever URL slug or location changes (e.g. browser back/forward or navigation)
  useEffect(() => {
    const nextSlug = getSlugFromLocation();
    if (nextSlug && nextSlug !== activeSlug) {
      setActiveSlug(nextSlug);
    }
  }, [slug, location.pathname]);

  // Find solution or fallback
  const currentSlug = activeSlug || 'scrum-kanban-boards';
  const solution = solutionsData[currentSlug] || solutionsData['scrum-kanban-boards'];
  const Icon = solution.icon;
  const allSlugs = Object.keys(solutionsData);

  const handleCopy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const testTransition = (targetStatus) => {
    if (targetStatus === 'DONE' && selectedRole !== 'OWNER' && selectedRole !== 'ADMIN') {
      setSimAlert({
        type: 'error',
        msg: `403 Forbidden: Delivery Governance blocked action. Only Workspace Administrators or Company Owners can move tasks to "Done". Current role is ${selectedRole}.`,
      });
    } else {
      setSimTaskStatus(targetStatus);
      setSimAlert({
        type: 'success',
        msg: `Task successfully transitioned to "${targetStatus}" as ${selectedRole}. Audit log generated.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-neutral-200 bg-white/90 backdrop-blur-md px-6 sm:px-12 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              K
            </div>
            <span className="font-black text-lg tracking-tight text-neutral-950">klanservicehub</span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
              Solutions & Advance Architecture
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Home</span>
          </Link>
          <Link
            href="/sign-up"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
          >
            <span>Launch Free</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Header */}
      <section className="bg-neutral-950 text-white py-14 px-6 sm:px-12 border-b border-neutral-800 relative overflow-hidden">
        <div className="max-w-5xl mx-auto space-y-6 relative z-10">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-neutral-400 font-medium">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <span className="text-neutral-300">Solutions</span>
            <span>/</span>
            <span className="text-blue-400 font-semibold">{solution.title}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3.5 py-1 text-xs font-bold text-blue-400">
                  <Icon className="size-3.5" />
                  <span>{solution.badge}</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                  <Terminal className="size-3" /> Advance View Enabled
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                {solution.title}
              </h1>
              <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
                {solution.tagline}
              </p>
            </div>

            {/* Top Quick CTA */}
            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
              <Link
                href="/sign-up"
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition text-center flex items-center justify-center gap-1.5"
              >
                <span>Launch in Workspace</span>
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href="/sign-in"
                className="px-6 py-3 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-xs transition text-center"
              >
                Sign In to Test
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Module Selector Pill Bar */}
      <div className="bg-white border-b border-neutral-200 sticky top-16 z-40 px-6 sm:px-12 py-3 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mr-2 shrink-0">
            Lifecycle Modules:
          </span>
          {allSlugs.map((s) => {
            const isCurrent = s === activeSlug;
            const item = solutionsData[s];
            const ItemIcon = item.icon;
            return (
              <button
                key={s}
                onClick={() => {
                  setActiveSlug(s);
                  navigate(`/solutions/${s}`);
                  setSimAlert(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isCurrent
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200/80'
                }`}
              >
                <ItemIcon className="size-3.5" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🌟 ADVANCE VIEW MODE CONTROLLER TABS 🌟 */}
      <div className="bg-neutral-100/80 border-b border-neutral-200/90 px-6 sm:px-12 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
              <SlidersHorizontal className="size-3.5 text-blue-600" />
              <span>Inspection Mode:</span>
            </span>
            <div className="flex bg-white p-1 rounded-xl border border-neutral-200 shadow-2xs gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                Overview & Features
              </button>
              <button
                onClick={() => setActiveTab('advance')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'advance'
                    ? 'bg-neutral-900 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Terminal className="size-3.5 text-emerald-400" />
                <span>Advance Architecture Specs</span>
              </button>
              <button
                onClick={() => setActiveTab('simulator')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'simulator'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                }`}
              >
                <Play className="size-3.5" />
                <span>Live Role & QA Simulator</span>
              </button>
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 font-mono hidden sm:inline">
            Module ID: <span className="text-blue-600 font-bold">{currentSlug}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto w-full px-6 py-10 space-y-10 flex-1">
        {/* ========================================================
            TAB 1: OVERVIEW & FEATURES
        ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-10 animate-in fade-in duration-200">
            {/* Overview Section */}
            <section className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-2xl flex items-center justify-center ${solution.iconBg}`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-neutral-950">Module Overview</h2>
                  <p className="text-xs text-neutral-500 font-semibold">{solution.category}</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-neutral-700 leading-relaxed">
                {solution.overview}
              </p>
            </section>

            {/* Core Capabilities Grid */}
            <section className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-neutral-950">Key Engineering Capabilities</h3>
                <p className="text-xs text-neutral-600">
                  Built for modern agile teams, squad leads, QA specialists, and software companies.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solution.coreCapabilities.map((cap, idx) => (
                  <div
                    key={idx}
                    className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-2 hover:border-blue-400/80 hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {idx + 1}
                      </div>
                      <h4 className="font-bold text-neutral-950 text-sm">{cap.title}</h4>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed pl-8">
                      {cap.desc}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Specs & Use Cases Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Technical Specs */}
              <div className="lg:col-span-7 bg-neutral-950 text-neutral-300 border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                    <Terminal className="size-4" />
                    <span>Technical Architecture Highlights</span>
                  </span>
                  <button
                    onClick={() => setActiveTab('advance')}
                    className="text-[10px] text-emerald-400 hover:underline font-mono cursor-pointer flex items-center gap-1"
                  >
                    <span>Full Advance View ↗</span>
                  </button>
                </div>

                <div className="space-y-3 font-mono text-xs">
                  {solution.technicalArchitecture.map((spec, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <span className="text-neutral-400 text-[11px]">{spec.label}:</span>
                      <span className="text-white font-semibold text-[11px] sm:text-right">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Primary Use Cases */}
              <div className="lg:col-span-5 bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs flex flex-col justify-between">
                <div className="space-y-3">
                  <h4 className="font-bold text-neutral-950 text-sm flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span>Primary Team Use Cases</span>
                  </h4>
                  <ul className="space-y-2.5 text-xs text-neutral-700">
                    {solution.useCases.map((uc, uIdx) => (
                      <li key={uIdx} className="flex items-start gap-2">
                        <span className="size-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                        <span>{uc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-4 border-t border-neutral-100">
                  <p className="text-[11px] text-neutral-500">
                    Engineered under Klanvision IT Solutions delivery specifications by Ramakrishna (RK).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: ADVANCE ARCHITECTURE SPECS
        ======================================================== */}
        {activeTab === 'advance' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Advance Header */}
            <div className="p-6 rounded-3xl bg-neutral-950 text-white border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="size-5 text-emerald-400" />
                  <h3 className="text-lg font-black">Deep Architecture & Database Specifications</h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-mono text-[10px] font-bold">
                  Cloudflare D1 / SQLite Edge
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Detailed relational schema definitions, index structures, REST API endpoints, and cURL commands for {solution.title}.
              </p>
            </div>

            {/* SQL DDL Schema */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl text-neutral-300">
              <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-900/90 text-xs">
                <div className="flex items-center gap-2 font-mono font-bold text-emerald-400">
                  <Database className="size-4" />
                  <span>DDL Table Schema & Indexes (Cloudflare D1)</span>
                </div>
                <button
                  onClick={() => handleCopy('sql', solution.sqlSchema)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-mono text-white transition cursor-pointer"
                >
                  {copiedKey === 'sql' ? (
                    <>
                      <Check className="size-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copy SQL</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-6 text-xs font-mono text-neutral-200 overflow-x-auto leading-relaxed">
                <code>{solution.sqlSchema}</code>
              </pre>
            </div>

            {/* REST API & Payload Studio */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* cURL Request */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl text-neutral-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-900/90 text-xs">
                    <div className="flex items-center gap-2 font-mono font-bold text-blue-400">
                      <Code2 className="size-4" />
                      <span>REST API cURL Request</span>
                    </div>
                    <button
                      onClick={() => handleCopy('curl', solution.apiCurl)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-white transition cursor-pointer"
                    >
                      {copiedKey === 'curl' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-5 text-[11px] font-mono text-neutral-200 overflow-x-auto leading-relaxed">
                    <code>{solution.apiCurl}</code>
                  </pre>
                </div>
                <div className="p-3 bg-neutral-900/50 border-t border-neutral-800/80 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                  <span>Endpoint:</span>
                  <span className="text-blue-400 font-bold">{solution.apiEndpoint}</span>
                </div>
              </div>

              {/* JSON Response */}
              <div className="bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl text-neutral-300 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-800 bg-neutral-900/90 text-xs">
                    <div className="flex items-center gap-2 font-mono font-bold text-purple-400">
                      <Server className="size-4" />
                      <span>Expected Server Response (200 OK)</span>
                    </div>
                    <button
                      onClick={() => handleCopy('res', solution.apiResponse)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-[10px] font-mono text-white transition cursor-pointer"
                    >
                      {copiedKey === 'res' ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-5 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                    <code>{solution.apiResponse}</code>
                  </pre>
                </div>
                <div className="p-3 bg-neutral-900/50 border-t border-neutral-800/80 text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                  <span>Status:</span>
                  <span className="text-emerald-400 font-bold">200 OK • sub-10ms latency</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: LIVE SIMULATOR & ROLE INSPECTOR
        ======================================================== */}
        {activeTab === 'simulator' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Simulator Intro */}
            <div className="p-6 rounded-3xl bg-white border border-neutral-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Play className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-neutral-950">Interactive QA & Role Transition Simulator</h3>
                    <p className="text-xs text-neutral-500">
                      Simulate delivery governance rules, role changes, and terminal "Done" status gatekeeping live in your browser.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-600">Simulated Role:</span>
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                      setSelectedRole(e.target.value);
                      setSimAlert(null);
                    }}
                    className="px-3 py-1.5 rounded-xl border border-neutral-300 bg-white font-bold text-xs text-neutral-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OWNER">Company Owner (Full Access)</option>
                    <option value="ADMIN">Workspace Admin (QA Gatekeeper)</option>
                    <option value="LEAD">Project Lead</option>
                    <option value="ENGINEER">Senior Engineer</option>
                    <option value="QA">QA Specialist</option>
                    <option value="OBSERVER">Observer (Read-Only)</option>
                  </select>
                </div>
              </div>

              {/* Status Alert Message */}
              {simAlert && (
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-2.5 animate-in fade-in duration-150 ${
                    simAlert.type === 'error'
                      ? 'bg-red-50 border-red-200 text-red-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  {simAlert.type === 'error' ? (
                    <AlertTriangle className="size-4 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <p>{simAlert.msg}</p>
                </div>
              )}

              {/* Interactive Kanban Transition Board */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Simulate Task Status Move:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['BACKLOG', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map((st) => {
                    const isSelected = simTaskStatus === st;
                    return (
                      <button
                        key={st}
                        onClick={() => testTransition(st)}
                        className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-3 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              st === 'DONE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : st === 'IN_REVIEW'
                                ? 'bg-purple-100 text-purple-800'
                                : st === 'IN_PROGRESS'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-neutral-200 text-neutral-800'
                            }`}
                          >
                            {st}
                          </span>
                          {isSelected && <Check className="size-3.5 text-blue-600" />}
                        </div>
                        <p className="text-xs font-bold text-neutral-800">
                          {st === 'DONE' ? 'Move to Done (QA Gate)' : `Transition to ${st}`}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role Permissions Matrix Quick Inspector */}
              <div className="p-4 rounded-2xl bg-neutral-900 text-neutral-300 border border-neutral-800 space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-neutral-800 pb-2 font-bold uppercase">
                  <span>Current Role Capabilities: {selectedRole}</span>
                  <span className="text-blue-400">RBAC Matrix Evaluator</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <Check className="size-3 text-emerald-400" />
                    <span>Create & Edit Tasks</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="size-3 text-emerald-400" />
                    <span>Manage Sprints</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selectedRole === 'OWNER' || selectedRole === 'ADMIN' ? (
                      <>
                        <Check className="size-3 text-emerald-400" />
                        <span className="text-emerald-300 font-bold">Move to "Done" (Allowed)</span>
                      </>
                    ) : (
                      <>
                        <Lock className="size-3 text-red-400" />
                        <span className="text-red-400 font-bold">Move to "Done" (Blocked)</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA Banner */}
        <div className="rounded-3xl bg-blue-600 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 sm:p-12 text-center text-white space-y-4 shadow-xl shadow-blue-600/20">
          <h3 className="text-2xl sm:text-3xl font-black">
            Ready to experience {solution.title}?
          </h3>
          <p className="text-xs sm:text-sm text-blue-50 max-w-xl mx-auto">
            Create an organization workspace in seconds with zero credit card required.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-neutral-900 font-bold text-xs shadow-md hover:bg-neutral-100 transition"
            >
              Create Free Workspace
            </Link>
            <Link
              href="/sign-in"
              className="w-full sm:w-auto px-6 py-3 rounded-xl border border-white/40 text-white font-bold text-xs hover:bg-white/10 transition"
            >
              Sign In to Existing Account
            </Link>
          </div>
        </div>
      </main>

      {/* Landing Footer */}
      <LandingFooter />
    </div>
  );
};
