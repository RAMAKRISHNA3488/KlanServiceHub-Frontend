import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LandingFooter } from '@/components/landing-footer';
import {
  Sparkles,
  Zap,
  Kanban,
  Calendar,
  CheckCircle2,
  Shield,
  Users,
  ArrowRight,
  BarChart3,
  Bot,
  Layers,
  ChevronRight,
  Globe,
  Lock,
  Code2,
  Heart,
  GitFork,
  Check,
  HelpCircle,
  Activity,
  FileText,
  Sliders,
  Cpu,
  Award,
  Clock,
  LifeBuoy,
  Star,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  User,
  X,
  Share2,
  Search,
  SlidersHorizontal,
  Terminal,
  Settings2,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const LandingPageView = () => {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [billingCycle, setBillingCycle] = useState('MONTHLY');

  const handleCopyLink = (id, url) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    const startTime = Date.now();
    const duration = 3000; // 3 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(Math.round((elapsed / duration) * 100), 100);
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 30);

    return () => clearInterval(interval);
  }, []);

  const [openFaqs, setOpenFaqs] = useState({});
  const [faqCategory, setFaqCategory] = useState('all');
  const [faqSearch, setFaqSearch] = useState('');
  const [advancedFaqMode, setAdvancedFaqMode] = useState(false);

  const toggleFaq = (id) => {
    setOpenFaqs((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleToggleExpandAll = () => {
    const allExpanded = Object.keys(openFaqs).length === faqs.length && Object.values(openFaqs).every(Boolean);
    if (allExpanded) {
      setOpenFaqs({});
    } else {
      const next = {};
      faqs.forEach((f) => {
        next[f.id] = true;
      });
      setOpenFaqs(next);
    }
  };

  const faqCategories = [
    { id: 'all', label: 'All Topics', count: 8 },
    { id: 'architecture', label: 'Architecture & Stack', count: 2 },
    { id: 'governance', label: 'RBAC & QA Governance', count: 2 },
    { id: 'workspaces', label: 'Workspaces & Orgs', count: 1 },
    { id: 'security', label: 'Security & Auth', count: 2 },
    { id: 'servicedesk', label: 'JSM & Assets', count: 1 },
  ];

  const faqs = [
    {
      id: 'dev-arch',
      category: 'architecture',
      badge: 'Platform Engineering',
      q: 'Who developed klanservicehub and what is the underlying architecture?',
      a: 'klanservicehub was engineered and developed by Ramakrishna (RK) under Klanvision IT Solutions. Built on React 19, TailwindCSS, Hono, Node.js, and Cloudflare D1 / SQLite distributed edge databases for ultra-fast query execution and real-time state synchronization.',
      advanced: 'Query execution runs through compiled prepared statements with connection reuse (<10ms p99 latency). State mutations are broadcast over optimistic WebSocket channels with automatic conflict resolution.',
      specs: ['React 19 & Next-style routing', 'Hono micro-framework', 'Cloudflare D1 / SQLite', '<10ms query execution'],
    },
    {
      id: 'delivery-governance',
      category: 'governance',
      badge: 'RBAC & Delivery Governance',
      q: 'Who can move issues and tasks to the "Done" status?',
      a: 'To guarantee delivery governance and QA review integrity, task transitions into the "Done" status are restricted to Workspace Administrators and Company Owners.',
      advanced: 'The workflow transition engine enforces strict role-based permission verification (RBAC) at the server layer. Non-admin transition attempts return 403 Forbidden and record an audit log event.',
      specs: ['Strict QA Gatekeeping', 'Admin-only completion', 'Server-side enforcement', 'Audit trail logged'],
    },
    {
      id: 'multi-tenancy',
      category: 'workspaces',
      badge: 'Multi-Tenant Isolation',
      q: 'How does the Multi-Organization and Workspace switcher work?',
      a: 'A single user account can create or join multiple isolated company workspaces. Each workspace features its own distinct project directory, team memberships, role hierarchy, custom workflows, and billing plans.',
      advanced: 'Each workspace is completely isolated with tenant-scoped indexes, dedicated ACL matrix, and foreign key boundaries, preventing cross-tenant data leakage or permission cross-talk.',
      specs: ['Tenant Isolation', 'Custom Member Roles', 'Project Directories', 'Multi-Workspace Switcher'],
    },
    {
      id: 'workflows-custom',
      category: 'architecture',
      badge: 'Workflow Customization',
      q: 'Can I customize project workflows, issue types, and statuses?',
      a: 'Yes! The platform includes a complete Workflow Studio where you can configure custom issue types (Epics, Stories, Bugs, Tasks), custom statuses with colors, and transition rules.',
      advanced: 'Supports dynamic state transition graphs, custom status color tokens, automated assignment rules on status changes, and schema validation.',
      specs: ['Epics, Stories, Bugs, Tasks', 'Custom Status Colors', 'State Transition Rules', 'Custom Field Schemas'],
    },
    {
      id: 'auth-security',
      category: 'security',
      badge: 'Zero-Trust Authentication',
      q: 'How does the Authentication, OTP verification, and Social SSO work?',
      a: 'Users can authenticate via secure Password, One-Time Password (OTP) sent directly to their work email, or OAuth SSO (Google, Microsoft, GitHub). OTP login automatically verifies user existence.',
      advanced: 'Email OTPs are 6-digit cryptographically generated tokens with 10-minute expiry and brute-force rate limiting. Sessions utilize HTTP-only secure JWT cookies.',
      specs: ['Email OTP Verification', 'Google & Microsoft SSO', 'bcrypt Hash Security', 'Rate-limited Dispatches'],
    },
    {
      id: 'jsm-assets',
      category: 'servicedesk',
      badge: 'ITSM & CMDB Assets',
      q: 'Does klanservicehub support JSM Service Desk Queues and CMDB Asset Management?',
      a: 'Yes! Features dedicated IT service management (ITSM) ticketing queues, customizable SLA response targets, automated escalation rules, and hardware/software CMDB asset dependency tracking.',
      advanced: 'Includes SLA countdown timers with breach alert hooks, asset lifecycle status tracking, and dependency graph visualization across squads.',
      specs: ['SLA Target Queues', 'CMDB Hardware/Software', 'Escalation Workflows', 'Incident Prioritization'],
    },
    {
      id: 'audit-logging',
      category: 'security',
      badge: 'Audit & Compliance',
      q: 'Are all workspace actions logged in the immutable Audit Trail?',
      a: 'Yes. Every user role change, task deletion, project creation, API key generation, and permission elevation is permanently logged in the workspace Audit Logs with timestamp and actor IP.',
      advanced: 'Audit records are append-only and queryable by workspace administrators with CSV export and date range filters.',
      specs: ['Append-only Logs', 'Actor & IP Tracking', 'Role Elevation Records', 'CSV Export Available'],
    },
    {
      id: 'dependencies-capacity',
      category: 'governance',
      badge: 'Sprint Capacity & Blockers',
      q: 'How do Cross-Project Dependencies and Squad Capacity Planning work?',
      a: 'Teams can link blockers, dependencies, and duplicate tasks across projects. Sprint capacity views calculate squad story points against team member working hours in real-time.',
      advanced: 'Interactive dependency graphs detect circular blocking relationships and highlight critical path bottlenecks before sprint kickoff.',
      specs: ['Blocker Linkage', 'Story Point Tracking', 'Circular Ref Detection', 'Critical Path Mapping'],
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = faqCategory === 'all' || faq.category === faqCategory;
    const matchesSearch =
      faqSearch.trim() === '' ||
      faq.q.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.a.toLowerCase().includes(faqSearch.toLowerCase()) ||
      faq.badge.toLowerCase().includes(faqSearch.toLowerCase()) ||
      (faq.advanced && faq.advanced.toLowerCase().includes(faqSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const isAllExpanded =
    filteredFaqs.length > 0 &&
    filteredFaqs.every((f) => openFaqs[f.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-neutral-900 flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="flex flex-col items-center max-w-sm w-full space-y-6 text-center animate-in fade-in zoom-in duration-300">
          {/* Logo with pulse */}
          <div className="relative">
            <div className="size-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-blue-500/30 animate-pulse">
              K
            </div>
            <div className="absolute -inset-2 rounded-3xl bg-blue-500/20 -z-10 animate-ping" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-neutral-950 tracking-tight">klanservicehub</h2>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-0.5 text-xs font-bold text-emerald-800">
              <Code2 className="size-3.5 text-emerald-600" />
              <span>Developed by RK</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full space-y-2 pt-2">
            <div className="h-2.5 w-full bg-neutral-100 rounded-full overflow-hidden border border-neutral-200 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-75 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-neutral-500 font-mono">
              <span>
                {progress < 35
                  ? 'Initializing workspace...'
                  : progress < 75
                  ? 'Loading agile enterprise modules...'
                  : 'Preparing experience...'}
              </span>
              <span className="font-bold text-blue-600">{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 flex flex-col selection:bg-blue-600 selection:text-white font-sans scroll-smooth">
      {/* Top SaaS Header */}
      <header className="h-16 border-b border-neutral-200/80 px-6 sm:px-12 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-50">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
              K
            </div>
            <span className="font-black text-lg tracking-tight text-neutral-950">klanservicehub</span>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
              <Code2 className="size-3" /> Developed by RK
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-600">
            <a href="#features" className="hover:text-blue-600 transition">Product</a>
            <a href="#solutions" className="hover:text-blue-600 transition">Solutions</a>
            <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
            <a href="#faq" className="hover:text-blue-600 transition">FAQ</a>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-dev-modal'))}
              className="text-neutral-600 hover:text-blue-600 transition font-semibold flex items-center gap-1 cursor-pointer"
            >
              <User className="size-3.5 text-emerald-600" />
              <span>Developer Details</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="rounded-xl px-4 py-2 text-xs font-bold text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100 transition"
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition flex items-center gap-1.5"
          >
            <span>Get Started Free</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6 max-w-6xl mx-auto text-center space-y-6 relative">
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 shadow-xs">
            <Sparkles className="size-3.5" />
            <span>New: Klanvision Enterprise Organization & Roles Architecture</span>
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-dev-modal'))}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/80 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-xs transition cursor-pointer"
          >
            <Code2 className="size-3.5 text-emerald-600" />
            <span>Application Developed by RK</span>
          </button>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-neutral-950 max-w-4xl mx-auto leading-tight">
          Move fast, stay aligned, and build better — <span className="text-blue-600">together</span>.
        </h1>

        <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto font-normal">
          The ultimate agile software development and enterprise project management platform. Designed from the ground up for engineering squads, agile teams, and modern software companies.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/sign-up"
            className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
          >
            <span>Get Started — Free forever</span>
            <ArrowRight className="size-4" />
          </Link>

          <Link
            href="/sign-in"
            className="w-full sm:w-auto rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 px-8 py-3.5 text-sm font-bold text-neutral-800 shadow-xs transition"
          >
            Sign in with Work Email
          </Link>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Unlimited free projects</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Email OTP Verification</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <span>Role-Based Permissions</span>
          </div>
        </div>
      </section>

      {/* Metrics Counter Bar */}
      <section className="px-6 max-w-6xl mx-auto pb-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-neutral-50 border border-neutral-200/90 shadow-xs text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-black text-blue-600">72+</p>
            <p className="text-xs text-neutral-500 mt-1 font-bold uppercase tracking-wider">RBAC Permissions</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-emerald-600">8</p>
            <p className="text-xs text-neutral-500 mt-1 font-bold uppercase tracking-wider">Enterprise Roles</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-purple-600">&lt;10ms</p>
            <p className="text-xs text-neutral-500 mt-1 font-bold uppercase tracking-wider">Database Query Speed</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-black text-amber-600">100%</p>
            <p className="text-xs text-neutral-500 mt-1 font-bold uppercase tracking-wider">Agile Scrum / Kanban</p>
          </div>
        </div>
      </section>

      {/* Interactive Jira Board Preview Graphic */}
      <section className="px-6 max-w-6xl mx-auto pb-20">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 sm:p-6 shadow-2xl text-white overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-red-500 inline-block" />
              <span className="size-3 rounded-full bg-amber-500 inline-block" />
              <span className="size-3 rounded-full bg-emerald-500 inline-block" />
              <span className="ml-2 font-mono text-neutral-400 font-bold">Acme Technologies / ECOM Project</span>
            </div>
            <span className="rounded bg-blue-600/30 px-2.5 py-0.5 font-bold text-blue-400 text-[10px]">
              Active Sprint 1 (Scrum)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 text-xs">
            {/* Column 1 */}
            <div className="rounded-xl bg-white/5 p-3 space-y-3 border border-white/5">
              <div className="flex justify-between font-bold text-neutral-400 text-[11px]">
                <span>TO DO</span>
                <span className="bg-white/10 px-1.5 rounded">3</span>
              </div>
              <div className="rounded-lg bg-white/10 p-3 space-y-2 border border-white/10">
                <span className="text-[10px] font-mono text-blue-400 font-bold">ECOM-101</span>
                <p className="font-semibold text-white">OAuth2 Google & Microsoft SSO Integration</p>
                <div className="flex justify-between items-center pt-1 text-[10px] text-neutral-400">
                  <span className="bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-bold">Story</span>
                  <span className="size-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[9px]">JD</span>
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="rounded-xl bg-white/5 p-3 space-y-3 border border-white/5">
              <div className="flex justify-between font-bold text-amber-400 text-[11px]">
                <span>IN PROGRESS</span>
                <span className="bg-white/10 px-1.5 rounded">2</span>
              </div>
              <div className="rounded-lg bg-white/10 p-3 space-y-2 border border-white/10">
                <span className="text-[10px] font-mono text-blue-400 font-bold">ECOM-102</span>
                <p className="font-semibold text-white">Payment gateway webhook listeners</p>
                <div className="flex justify-between items-center pt-1 text-[10px] text-neutral-400">
                  <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">Task</span>
                  <span className="size-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[9px]">AL</span>
                </div>
              </div>
            </div>

            {/* Column 3 */}
            <div className="rounded-xl bg-white/5 p-3 space-y-3 border border-white/5">
              <div className="flex justify-between font-bold text-purple-400 text-[11px]">
                <span>CODE REVIEW</span>
                <span className="bg-white/10 px-1.5 rounded">1</span>
              </div>
              <div className="rounded-lg bg-white/10 p-3 space-y-2 border border-white/10">
                <span className="text-[10px] font-mono text-blue-400 font-bold">ECOM-103</span>
                <p className="font-semibold text-white">Real-time SSE event broadcaster</p>
                <div className="flex justify-between items-center pt-1 text-[10px] text-neutral-400">
                  <span className="bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-bold">Task</span>
                  <span className="size-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[9px]">RK</span>
                </div>
              </div>
            </div>

            {/* Column 4 */}
            <div className="rounded-xl bg-white/5 p-3 space-y-3 border border-white/5">
              <div className="flex justify-between font-bold text-emerald-400 text-[11px]">
                <span>DONE</span>
                <span className="bg-white/10 px-1.5 rounded">4</span>
              </div>
              <div className="rounded-lg bg-white/10 p-3 space-y-2 border border-white/10 opacity-70">
                <span className="text-[10px] font-mono text-blue-400 font-bold">ECOM-100</span>
                <p className="font-semibold text-white line-through">Database schema & RBAC migration</p>
                <div className="flex justify-between items-center pt-1 text-[10px] text-neutral-400">
                  <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Done</span>
                  <span className="size-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[9px]">OW</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions & Core Architecture Modules */}
      <section id="solutions" className="py-16 px-6 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-0.5 text-xs font-bold text-blue-700">
            <Layers className="size-3.5" /> Comprehensive Agile Suite
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-neutral-950">Built for Complete Product Lifecycle</h2>
          <p className="text-sm text-neutral-600 max-w-2xl mx-auto">
            Everything your technology team needs from sprint planning and backlog grooming to releases, incident management, and security governance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Visual Scrum & Kanban */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-blue-500 hover:shadow-xl transition duration-200 flex flex-col justify-between space-y-4 shadow-xs group">
            <div className="space-y-3">
              <div className="size-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-xs">
                <Kanban className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 group-hover:text-blue-600 transition">
                Visual Scrum & Kanban Boards
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Drag-and-drop workflow columns, story point poker, epic grouping, sprint management, and admin-governed status transitions to Done.
              </p>
            </div>
            <Link
              href="/solutions/scrum-kanban-boards"
              className="pt-2 text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group/btn"
            >
              <span>Read More & Specifications</span>
              <ChevronRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 2: Cross-Project Dependencies */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-purple-500 hover:shadow-xl transition duration-200 flex flex-col justify-between space-y-4 shadow-xs group">
            <div className="space-y-3">
              <div className="size-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-xs">
                <GitFork className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 group-hover:text-purple-600 transition">
                Cross-Project Dependency Graph
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Map cross-team blockers and dependencies in real-time. Uncover critical paths across multiple repositories and squad roadmaps.
              </p>
            </div>
            <Link
              href="/solutions/dependency-graph"
              className="pt-2 text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 group/btn"
            >
              <span>Read More & Specifications</span>
              <ChevronRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 3: RBAC Matrix */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-emerald-500 hover:shadow-xl transition duration-200 flex flex-col justify-between space-y-4 shadow-xs group">
            <div className="space-y-3">
              <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
                <Shield className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 group-hover:text-emerald-600 transition">
                72-Permission RBAC Matrix
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Granular control over organization settings, project management, issue modification, sprint controls, and team allocation.
              </p>
            </div>
            <Link
              href="/solutions/rbac-governance"
              className="pt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group/btn"
            >
              <span>Read More & Specifications</span>
              <ChevronRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 4: Automations */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-amber-500 hover:shadow-xl transition duration-200 flex flex-col justify-between space-y-4 shadow-xs group">
            <div className="space-y-3">
              <div className="size-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-xs">
                <Bot className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 group-hover:text-amber-600 transition">
                No-Code Automations Engine
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Create event triggers on ticket creation, status changes, priority escalations, auto-notifications, and webhook event dispatching.
              </p>
            </div>
            <Link
              href="/solutions/automations-engine"
              className="pt-2 text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 group/btn"
            >
              <span>Read More & Specifications</span>
              <ChevronRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 5: Analytics */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-pink-500 hover:shadow-xl transition duration-200 flex flex-col justify-between space-y-4 shadow-xs group">
            <div className="space-y-3">
              <div className="size-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center font-bold shadow-xs">
                <BarChart3 className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 group-hover:text-pink-600 transition">
                Velocity & Burndown Analytics
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Live team velocity charts, cumulative flow diagrams, SLA breach countdowns, and sprint completion predictability metrics.
              </p>
            </div>
            <Link
              href="/solutions/velocity-analytics"
              className="pt-2 text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 group/btn"
            >
              <span>Read More & Specifications</span>
              <ChevronRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Card 6: Service Desk */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 hover:border-cyan-500 hover:shadow-xl transition duration-200 flex flex-col justify-between space-y-4 shadow-xs group">
            <div className="space-y-3">
              <div className="size-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold shadow-xs">
                <LifeBuoy className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 group-hover:text-cyan-600 transition">
                JSM & Service Desk Management
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Customer support request queues, incident management, change requests, customer organization portals, and automated SLA tracking.
              </p>
            </div>
            <Link
              href="/solutions/service-desk-management"
              className="pt-2 text-xs font-bold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 group/btn"
            >
              <span>Read More & Specifications</span>
              <ChevronRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Value Props Grid */}
      <section id="features" className="py-16 px-6 max-w-6xl mx-auto space-y-12 border-t border-neutral-200/80">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-4xl font-bold text-neutral-950">Why Engineering Teams Choose This Platform</h2>
          <p className="text-sm text-neutral-600 max-w-xl mx-auto">
            Engineered by RK for developer delight, maximum responsiveness, and enterprise-grade reliability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-6 space-y-4 hover:border-blue-500/40 hover:bg-white transition shadow-xs">
            <div className="size-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Shield className="size-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">8-Tier Role-Based Access Control</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Klanvision-grade RBAC separation with Company Owner, Company Admin, User Access Admin, Project Admin, PM, Developers, Viewers, and Guests.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-6 space-y-4 hover:border-purple-500/40 hover:bg-white transition shadow-xs">
            <div className="size-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Layers className="size-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Multi-Organization Switcher</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              One user account can participate across multiple enterprise companies with isolated memberships, project scopes, and security boundaries.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/70 p-6 space-y-4 hover:border-emerald-500/40 hover:bg-white transition shadow-xs">
            <div className="size-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Bot className="size-5" />
            </div>
            <h3 className="text-base font-bold text-neutral-900">Automations & Webhooks Engine</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Trigger-condition-action workflow automations with automated email notifications, GitHub/GitLab integration, and event streaming.
            </p>
          </div>
        </div>
      </section>

      {/* Transparent Pricing Plans */}
      <section id="pricing" className="py-20 px-6 max-w-6xl mx-auto space-y-12 border-t border-neutral-200/80">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
            <Star className="size-3.5 text-emerald-600" />
            <span>SaaS Enterprise Subscription Plans</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-neutral-950 tracking-tight">
            Plans for Every Scale of Software Team
          </h2>
          <p className="text-sm text-neutral-600 max-w-xl mx-auto">
            Official Indian GST-compliant SaaS subscriptions for startups, mid-market agile squads, and enterprise corporations.
          </p>

          {/* Billing Cycle Switcher */}
          <div className="flex items-center justify-center gap-3 pt-3">
            <span className={`text-xs font-bold transition ${billingCycle === 'MONTHLY' ? 'text-neutral-900' : 'text-neutral-400'}`}>
              Monthly Billing
            </span>
            <button
              type="button"
              onClick={() => setBillingCycle(billingCycle === 'MONTHLY' ? 'ANNUAL' : 'MONTHLY')}
              className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-neutral-900 transition-colors duration-200 ease-in-out focus:outline-none"
              aria-label="Toggle billing cycle"
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  billingCycle === 'ANNUAL' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-xs font-bold flex items-center gap-1.5 transition ${billingCycle === 'ANNUAL' ? 'text-neutral-900' : 'text-neutral-400'}`}>
              <span>Annual Billing</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                Save 20%
              </span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Plan 1 - Starter Tier */}
          <div className="p-8 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between space-y-6 hover:border-neutral-300 transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Starter Tier</span>
                <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">15 Seats</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-neutral-950">
                  {billingCycle === 'ANNUAL' ? '₹1,999' : '₹2,499'}
                </span>
                <span className="text-xs text-neutral-500">/ month</span>
              </div>
              <p className="text-xs text-neutral-600">
                {billingCycle === 'ANNUAL' ? 'Billed annually at ₹23,990 / year (Save 20%)' : 'Essential agile capabilities for fast-moving early squads.'}
              </p>
              <ul className="space-y-2.5 text-xs text-neutral-600 pt-4 border-t border-neutral-100">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Up to 15 Team Members</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>10 Active Projects & Sprints</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>50 GB Secure Cloud Storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Visual Scrum & Kanban Boards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-emerald-600 shrink-0" />
                  <span>Community & Email OTP Support</span>
                </li>
              </ul>
            </div>
            <Link
              href="/sign-up"
              className="w-full py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-center text-xs font-bold text-neutral-800 transition block shadow-xs"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Plan 2 - Business Standard (Highlighted) */}
          <div className="p-8 rounded-2xl bg-blue-50/40 border-2 border-blue-600 relative flex flex-col justify-between space-y-6 shadow-xl shadow-blue-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-blue-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Sparkles className="size-3" />
              <span>Most Popular</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Business Standard</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">100 Seats</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-neutral-950">
                  {billingCycle === 'ANNUAL' ? '₹6,399' : '₹7,999'}
                </span>
                <span className="text-xs text-neutral-500">/ month</span>
              </div>
              <p className="text-xs text-neutral-700">
                {billingCycle === 'ANNUAL' ? 'Billed annually at ₹76,790 / year (Save 20%)' : 'Complete enterprise power for high-growth software engineering departments.'}
              </p>
              <ul className="space-y-2.5 text-xs text-neutral-700 pt-4 border-t border-blue-100">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-blue-600 shrink-0" />
                  <span>Up to 100 Team Members</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-blue-600 shrink-0" />
                  <span>Unlimited Projects & Multi-Team Roadmaps</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-blue-600 shrink-0" />
                  <span>500 GB Secure Cloud Storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-blue-600 shrink-0" />
                  <span>Automations Engine (10,000 runs/mo)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-blue-600 shrink-0" />
                  <span>JSM Service Desk & SLA Queues</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-blue-600 shrink-0" />
                  <span>72 Granular RBAC Permissions Matrix</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-blue-600 shrink-0" />
                  <span>Priority 24/7 Technical Support</span>
                </li>
              </ul>
            </div>
            <Link
              href="/sign-up"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-center text-xs font-bold text-white shadow-md shadow-blue-600/30 transition block"
            >
              Start 14-Day Free Trial
            </Link>
          </div>

          {/* Plan 3 - Enterprise Scale */}
          <div className="p-8 rounded-2xl bg-white border border-neutral-200 shadow-xs flex flex-col justify-between space-y-6 hover:border-neutral-300 transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700">Enterprise Scale</span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">1,000 Seats</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-neutral-950">
                  {billingCycle === 'ANNUAL' ? '₹19,999' : '₹24,999'}
                </span>
                <span className="text-xs text-neutral-500">/ month</span>
              </div>
              <p className="text-xs text-neutral-600">
                {billingCycle === 'ANNUAL' ? 'Billed annually at ₹2,39,990 / year (Save 20%)' : 'For global engineering organizations demanding maximum security & compliance.'}
              </p>
              <ul className="space-y-2.5 text-xs text-neutral-600 pt-4 border-t border-neutral-100">
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-purple-600 shrink-0" />
                  <span>Up to 1,000 Team Members</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-purple-600 shrink-0" />
                  <span>Unlimited Projects, Portfolios & Goals</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-purple-600 shrink-0" />
                  <span>5 TB Dedicated Cloud Storage</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-purple-600 shrink-0" />
                  <span>Unlimited Automations & Webhooks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-purple-600 shrink-0" />
                  <span>SAML 2.0 Single Sign-On & SCIM Directory</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-purple-600 shrink-0" />
                  <span>99.99% Uptime SLA & Audit Logs</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="size-4 text-purple-600 shrink-0" />
                  <span>Dedicated Account Manager & GST Compliance</span>
                </li>
              </ul>
            </div>
            <Link
              href="/sign-up"
              className="w-full py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-center text-xs font-bold text-neutral-800 transition block shadow-xs"
            >
              Contact Enterprise Sales
            </Link>
          </div>
        </div>

        {/* 🌟 SEAT LICENSE CHARGEBACK BREAKDOWN (MATCHING IN-APP) 🌟 */}
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200/80 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-neutral-900">
                <Users className="size-4 text-blue-600" />
                <span>Role-Based Seat License Chargebacks</span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Transparent per-seat pricing so each department only pays for the exact tooling their members use.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-[11px] font-bold self-start sm:self-center">
              <span>GSTIN 18% Tax Compliant</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Developer */}
            <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-2xs space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-bold">
                Developer Seat
              </span>
              <p className="text-lg font-black text-neutral-900">₹650 <span className="text-xs font-normal text-neutral-400">/ mo</span></p>
              <p className="text-[11px] text-neutral-500 leading-tight">
                Agile boards, sprints, backlogs, code repos & deployments.
              </p>
            </div>

            {/* Service Agent */}
            <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-2xs space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                Service Desk Agent
              </span>
              <p className="text-lg font-black text-neutral-900">₹1,250 <span className="text-xs font-normal text-neutral-400">/ mo</span></p>
              <p className="text-[11px] text-neutral-500 leading-tight">
                ITSM ticket queues, SLA triage, incidents & change tickets.
              </p>
            </div>

            {/* Portfolio Lead */}
            <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-2xs space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">
                Portfolio Lead
              </span>
              <p className="text-lg font-black text-neutral-900">₹850 <span className="text-xs font-normal text-neutral-400">/ mo</span></p>
              <p className="text-[11px] text-neutral-500 leading-tight">
                Multi-team roadmaps, cross-project portfolio & governance.
              </p>
            </div>

            {/* Business Collaborator */}
            <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-2xs space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold">
                Collaborator
              </span>
              <p className="text-lg font-black text-neutral-900">₹450 <span className="text-xs font-normal text-neutral-400">/ mo</span></p>
              <p className="text-[11px] text-neutral-500 leading-tight">
                Task assignments, progress updates, time tracking & comments.
              </p>
            </div>

            {/* Free Viewer */}
            <div className="p-4 rounded-xl bg-white border border-neutral-200/90 shadow-2xs space-y-1.5">
              <span className="inline-block px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-bold">
                Stakeholder / Viewer
              </span>
              <p className="text-lg font-black text-neutral-900">₹0 <span className="text-xs font-normal text-emerald-600 font-bold">Free</span></p>
              <p className="text-[11px] text-neutral-500 leading-tight">
                Read-only dashboards, reporting views & shared project tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section with Advance View & Options */}
      <section id="faq" className="py-20 px-6 max-w-5xl mx-auto space-y-8 border-t border-neutral-200/80">
        {/* Section Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3.5 py-1 text-xs font-bold text-purple-800 shadow-xs">
            <HelpCircle className="size-3.5 text-purple-600" />
            <span>Architecture & Knowledge Base</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600">
            Explore comprehensive architecture specifications, delivery governance rules, multi-tenant boundaries, and platform capabilities.
          </p>
        </div>

        {/* 🛠️ ADVANCE OPTIONS CONTROL BAR 🛠️ */}
        <div className="space-y-4 bg-neutral-50 border border-neutral-200/90 rounded-2xl p-4 sm:p-6 shadow-xs">
          {/* Top Controls: Search Bar & Toggle Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="size-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search topics, keywords, RBAC rules, or tech stack..."
                className="w-full pl-9.5 pr-8 py-2.5 rounded-xl border border-neutral-300 bg-white text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition shadow-2xs"
              />
              {faqSearch && (
                <button
                  onClick={() => setFaqSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Advance Option Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
              {/* Advance Technical View Toggle */}
              <button
                onClick={() => setAdvancedFaqMode(!advancedFaqMode)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  advancedFaqMode
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-100'
                }`}
                title="Toggle Deep Technical Architecture View"
              >
                <Terminal className="size-3.5" />
                <span>{advancedFaqMode ? 'Deep Tech View: Active' : 'Enable Advance View'}</span>
              </button>

              {/* Expand / Collapse All */}
              <button
                onClick={handleToggleExpandAll}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 transition cursor-pointer"
              >
                {isAllExpanded ? (
                  <>
                    <Minimize2 className="size-3.5 text-neutral-500" />
                    <span>Collapse All</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="size-3.5 text-neutral-500" />
                    <span>Expand All</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-neutral-200/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mr-1 flex items-center gap-1">
              <SlidersHorizontal className="size-3" />
              <span>Filters:</span>
            </span>
            {faqCategories.map((cat) => {
              const isActive = faqCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFaqCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-neutral-900 text-white shadow-xs'
                      : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
                  }`}
                >
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Info Counter */}
        <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
          <span>
            Showing <strong className="text-neutral-900 font-bold">{filteredFaqs.length}</strong> of {faqs.length} questions
            {faqCategory !== 'all' && ` in "${faqCategories.find((c) => c.id === faqCategory)?.label}"`}
          </span>
          {advancedFaqMode && (
            <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-[11px]">
              <Sparkles className="size-3" /> Showing deep architecture specifications
            </span>
          )}
        </div>

        {/* FAQ Cards Accordion Grid */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="p-10 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-center space-y-3">
              <HelpCircle className="size-8 text-neutral-400 mx-auto" />
              <p className="text-sm font-bold text-neutral-800">No matching questions found</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Try searching with different keywords like "RBAC", "Cloudflare", "Workspaces", or "Architecture".
              </p>
              <button
                onClick={() => {
                  setFaqSearch('');
                  setFaqCategory('all');
                }}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = !!openFaqs[faq.id];

              return (
                <div
                  key={faq.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                    isOpen
                      ? 'border-blue-200 bg-white ring-2 ring-blue-500/10'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  {/* Card Header Trigger */}
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-4 sm:p-5 text-left flex items-start sm:items-center justify-between gap-4 hover:bg-neutral-50/50 transition cursor-pointer"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200/80 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                          {faq.badge}
                        </span>
                        {advancedFaqMode && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            <Terminal className="size-2.5" /> Spec Included
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-neutral-900 leading-snug">
                        {faq.q}
                      </h3>
                    </div>

                    <div className="size-8 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 shrink-0 mt-1 sm:mt-0 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                      {isOpen ? (
                        <ChevronUp className="size-4 text-blue-600" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </div>
                  </button>

                  {/* Card Content Body */}
                  {isOpen && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-6 pt-0 space-y-4 text-xs sm:text-sm text-neutral-700 leading-relaxed border-t border-neutral-100 bg-neutral-50/30">
                      <p className="pt-3 text-xs sm:text-sm text-neutral-700">
                        {faq.a}
                      </p>

                      {/* 🚀 DEEP TECHNICAL ADVANCE VIEW CONTAINER 🚀 */}
                      {(advancedFaqMode || faq.advanced) && (
                        <div className="p-4 rounded-xl bg-neutral-950 text-neutral-300 border border-neutral-800 space-y-3 shadow-inner">
                          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-800 pb-2">
                            <span className="flex items-center gap-1.5 text-blue-400">
                              <Terminal className="size-3.5" />
                              <span>Deep Architecture Specification</span>
                            </span>
                            <span className="text-[10px] text-emerald-400 font-mono">Server-Side Mechanics</span>
                          </div>

                          <p className="text-xs text-neutral-300 font-mono leading-relaxed">
                            {faq.advanced}
                          </p>

                          {/* Technical Spec Tags */}
                          {faq.specs && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {faq.specs.map((spec, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-700/80 text-neutral-300 text-[10px] font-mono"
                                >
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Knowledge & Help Banner */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="text-sm font-bold text-neutral-900">Need further technical assistance?</h4>
            <p className="text-xs text-neutral-600">
              Review our enterprise compliance documentation or reach out to the platform engineering team.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            <Link
              href="/security"
              className="px-3.5 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition shadow-xs"
            >
              Security Center
            </Link>
            <Link
              href="/terms"
              className="px-3.5 py-2 rounded-xl border border-neutral-300 hover:bg-neutral-50 text-neutral-800 text-xs font-bold transition shadow-xs"
            >
              Terms & SLA
            </Link>
            <a
              href="mailto:support@klanvision.com"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-md shadow-blue-600/20"
            >
              Contact Support
            </a>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="rounded-3xl bg-blue-600 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 p-8 sm:p-14 text-center space-y-6 shadow-2xl shadow-blue-600/30 text-white relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <h2 className="text-3xl sm:text-5xl font-black max-w-2xl mx-auto text-white tracking-tight leading-tight">
              Ready to accelerate your product development?
            </h2>
            <p className="text-sm sm:text-base text-blue-50 font-medium max-w-2xl mx-auto leading-relaxed">
              Empower your engineering squads with enterprise sprint velocity, seamless agile workflows, and Klanvision-grade delivery governance.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sign-up"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white text-neutral-900 font-black text-sm shadow-xl hover:bg-neutral-100 transition duration-200"
              >
                Create Free Account Now
              </Link>
              <Link
                href="/sign-in"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-white/60 text-white font-bold text-sm hover:bg-white/20 transition duration-200"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Landing Footer */}
      <LandingFooter />
    </div>
  );
};

