import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Kanban,
  Shield,
  Users,
  Globe,
  ExternalLink,
  Sparkles,
  User,
  Check,
  Copy,
  Terminal,
  X,
  Code2,
  Cpu,
  Layers,
  Zap,
  Award,
  ArrowUpRight,
  Send,
} from 'lucide-react';

const InstagramIcon = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const LinkedInIcon = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const GitHubIcon = ({ className = 'size-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export const developerDetails = {
  name: 'Ramakrishna K (RK)',
  shortName: 'RK',
  role: 'Lead Full-Stack Software Engineer & Cloud Architect',
  bio: 'Lead software engineer and architect behind klanservicehub. Specialized in high-performance enterprise agile tools, scalable cloud backends, microservices, and modern responsive user interfaces.',
  organization: 'Klanvision IT Solutions Private Limited',
  portfolioUrl: 'https://ramakrishna3488.github.io/',
  socials: [
    {
      id: 'linkedin',
      name: 'LinkedIn',
      url: 'https://www.linkedin.com/in/ramakrishna-k-a9a9811ab/',
      handle: 'in/ramakrishna-k-a9a9811ab',
      desc: 'Connect professionally, view background, and network',
      icon: LinkedInIcon,
      accentColor: '#0077b5',
      badgeBg: 'bg-[#0077b5]/15 hover:bg-[#0077b5]/25 text-[#0077b5] border-[#0077b5]/30 dark:text-blue-400',
      actionText: 'Connect on LinkedIn',
    },
    {
      id: 'github',
      name: 'GitHub',
      url: 'https://github.com/RAMAKRISHNA3488',
      handle: '@RAMAKRISHNA3488',
      desc: 'Explore source code repositories and open-source projects',
      icon: GitHubIcon,
      accentColor: '#24292e',
      badgeBg: 'bg-neutral-800 hover:bg-neutral-700 text-white border-neutral-700',
      actionText: 'View Repositories',
    },
    {
      id: 'portfolio',
      name: 'RK Portfolio',
      url: 'https://ramakrishna3488.github.io/',
      handle: 'ramakrishna3488.github.io',
      desc: 'Live interactive showcase, enterprise architecture, and case studies',
      icon: Globe,
      accentColor: '#10b981',
      badgeBg: 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
      actionText: 'Visit Live Portfolio',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      url: 'https://www.instagram.com/k_ramakrishna_99/',
      handle: '@k_ramakrishna_99',
      desc: 'Follow for tech lifestyle, developer updates, and creative highlights',
      icon: InstagramIcon,
      accentColor: '#E1306C',
      badgeBg: 'bg-pink-500/15 hover:bg-pink-500/25 text-pink-600 border-pink-500/30 dark:text-pink-400',
      actionText: 'Follow on Instagram',
    },
  ],
  stats: [
    { label: 'Architecture', value: '72+ RBAC Flags' },
    { label: 'Query Latency', value: '<10ms p99 Edge' },
    { label: 'Stack', value: 'React 19 & Hono' },
    { label: 'Security', value: 'Zero-Trust Auth' },
  ],
  skills: [
    'React 19 & Next.js Architecture',
    'Cloudflare Workers & D1 SQLite',
    'Hono REST & Microservices',
    '72-Permission RBAC Matrix',
    'Real-time WebSocket State Sync',
    'TailwindCSS & Framer UI Design',
    'Enterprise Agile / Kanban / Scrum',
    'GitOps & CI/CD Cloud Automation',
  ],
};

export const LandingFooter = ({ className = '' }) => {
  const [isDevModalOpen, setIsDevModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Open modal on custom event from anywhere (e.g. navbar, hero badge, or footer)
  useEffect(() => {
    const handleOpenModal = () => setIsDevModalOpen(true);
    window.addEventListener('open-dev-modal', handleOpenModal);
    return () => window.removeEventListener('open-dev-modal', handleOpenModal);
  }, []);

  // Close modal on Escape key and lock scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsDevModalOpen(false);
    };
    if (isDevModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isDevModalOpen]);

  const handleCopyLink = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`mt-auto w-full ${className}`}>
      {/* 🌟 MAIN MULTI-COLUMN FOOTER 🌟 */}
      <footer className="border-t border-neutral-200 bg-neutral-50 pt-14 pb-10 px-6 sm:px-12 text-xs text-neutral-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 pb-10 border-b border-neutral-200/80">
          {/* Left Side: Brand & Company Overview */}
          <div className="lg:col-span-4 space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="size-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-500/20">
                K
              </div>
              <span className="font-black text-lg text-neutral-950 tracking-tight">klanservicehub</span>
            </Link>

            <p className="text-xs text-neutral-600 leading-relaxed max-w-sm">
              Enterprise agile project management, sprint planning, and service desk platform powered by{' '}
              <a
                href="https://klanvision.com"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-neutral-900 hover:text-blue-600 underline underline-offset-2 transition"
              >
                Klanvision IT Solutions
              </a>
              . Delivering scalable, safe, and secure digital software architectures.
            </p>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => setIsDevModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300/80 bg-emerald-50 hover:bg-emerald-100/80 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-2xs transition cursor-pointer group"
              >
                <Sparkles className="size-3.5 text-emerald-600 group-hover:rotate-12 transition-transform" />
                <span>Application Developed by RK</span>
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-mono">View</span>
              </button>
              <p className="text-[11px] text-neutral-500">
                Official Parent Portal:{' '}
                <a
                  href="https://klanvision.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                >
                  klanvision.com <ExternalLink className="size-3" />
                </a>
              </p>
            </div>
          </div>

          {/* Right Side: Multi-Column Links */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {/* Column 1: Platform Modules */}
            <div className="space-y-3">
              <p className="font-bold uppercase tracking-wider text-neutral-900 text-[11px] flex items-center gap-1.5">
                <Kanban className="size-3.5 text-indigo-600" />
                <span>Platform</span>
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/solutions/scrum-kanban-boards" className="hover:text-blue-600 transition">
                    Kanban & Sprints
                  </Link>
                </li>
                <li>
                  <Link href="/solutions/dependency-graph" className="hover:text-blue-600 transition">
                    Dependency Graph
                  </Link>
                </li>
                <li>
                  <Link href="/solutions/rbac-governance" className="hover:text-blue-600 transition">
                    RBAC Governance
                  </Link>
                </li>
                <li>
                  <Link href="/solutions/automations-engine" className="hover:text-blue-600 transition">
                    Automations Engine
                  </Link>
                </li>
                <li>
                  <Link href="/solutions/velocity-analytics" className="hover:text-blue-600 transition">
                    Velocity Analytics
                  </Link>
                </li>
                <li>
                  <Link href="/solutions/service-desk-management" className="hover:text-blue-600 transition">
                    JSM Service Desk
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 2: Trust & Legal Policy */}
            <div className="space-y-3">
              <p className="font-bold uppercase tracking-wider text-neutral-900 text-[11px] flex items-center gap-1.5">
                <Shield className="size-3.5 text-emerald-600" />
                <span>Legal & Trust</span>
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/terms" className="hover:text-blue-600 transition">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-blue-600 transition">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="hover:text-blue-600 transition">
                    Security & Trust
                  </Link>
                </li>
                <li>
                  <Link href="/acceptable-use" className="hover:text-blue-600 transition">
                    Acceptable Use
                  </Link>
                </li>
                <li>
                  <Link href="/landing#faq" className="hover:text-blue-600 transition">
                    FAQ & Audits
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Account & Access */}
            <div className="space-y-3">
              <p className="font-bold uppercase tracking-wider text-neutral-900 text-[11px] flex items-center gap-1.5">
                <Users className="size-3.5 text-purple-600" />
                <span>Account & Access</span>
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/sign-in" className="hover:text-blue-600 transition font-semibold">
                    Sign in to Portal
                  </Link>
                </li>
                <li>
                  <Link href="/sign-up" className="text-blue-600 hover:text-blue-700 font-bold transition">
                    Get Started Free
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/RAMAKRISHNA3488"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600 transition"
                  >
                    GitHub Repositories
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@klanvision.com"
                    className="hover:text-blue-600 transition"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Klanvision Services (Rightmost side, from klanvision.com) */}
            <div className="space-y-3">
              <p className="font-bold uppercase tracking-wider text-neutral-900 text-[11px] flex items-center gap-1.5">
                <Globe className="size-3.5 text-blue-600" />
                <span>Klanvision Services</span>
              </p>
              <ul className="space-y-2 text-xs">
                <li>
                  <a
                    href="https://klanvision.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600 transition flex items-center gap-1 font-medium"
                  >
                    <span>Web Development</span>
                    <ExternalLink className="size-2.5 opacity-60" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://klanvision.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600 transition flex items-center gap-1 font-medium"
                  >
                    <span>Mobile App Dev</span>
                    <ExternalLink className="size-2.5 opacity-60" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://klanvision.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600 transition flex items-center gap-1 font-medium"
                  >
                    <span>Cloud & DevOps</span>
                    <ExternalLink className="size-2.5 opacity-60" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://klanvision.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600 transition flex items-center gap-1 font-medium"
                  >
                    <span>IT Consulting</span>
                    <ExternalLink className="size-2.5 opacity-60" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://klanvision.com"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-blue-600 transition flex items-center gap-1 font-medium"
                  >
                    <span>Digital Marketing / SEO</span>
                    <ExternalLink className="size-2.5 opacity-60" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom copyright sub-strip */}
        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-neutral-500">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span>© 2026 KLANVISION IT SOLUTIONS PRIVATE LIMITED.</span>
            <span className="hidden sm:inline">•</span>
            <span>All rights reserved.</span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              Corporate Site:{' '}
              <a
                href="https://klanvision.com"
                target="_blank"
                rel="noreferrer"
                className="text-neutral-700 hover:text-blue-600 font-semibold underline"
              >
                klanvision.com
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* 🌟 ULTRA-PREMIUM DEVELOPER BAR (BELOW FOOTER) 🌟 */}
      <section id="developer-details" className="bg-gradient-to-r from-neutral-950 via-[#0a0d14] to-neutral-950 text-neutral-300 border-t border-neutral-800/90 py-3.5 px-4 sm:px-8 lg:px-12 shadow-2xl relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
          {/* Developer Title & Badge */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-neutral-900/90 border border-neutral-700/80 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-400 shadow-inner">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              <span className="text-neutral-400 text-[11px] font-normal">Architect & Creator:</span>
              <span className="text-white font-bold tracking-tight">{developerDetails.name}</span>
            </div>

            <button
              type="button"
              onClick={() => setIsDevModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 border border-blue-500/30 text-xs font-semibold transition cursor-pointer"
            >
              <User className="size-3.5 text-blue-400" />
              <span>Developer Details</span>
            </button>
          </div>

          {/* Social Links Bar */}
          <div className="flex items-center justify-center md:justify-end gap-2 flex-wrap">
            <span className="text-[11px] text-neutral-400 font-medium hidden xl:inline mr-1">
              Official Profiles:
            </span>

            {/* LinkedIn Link */}
            <a
              href="https://www.linkedin.com/in/ramakrishna-k-a9a9811ab/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-[#0077b5]/20 text-neutral-300 hover:text-blue-300 border border-neutral-800 hover:border-[#0077b5]/60 transition duration-200 text-xs font-semibold shadow-xs"
              title="Ramakrishna K on LinkedIn"
            >
              <LinkedInIcon className="size-3.5 text-[#0077b5]" />
              <span className="text-[11px] leading-none">LinkedIn</span>
            </a>

            {/* GitHub Link */}
            <a
              href="https://github.com/RAMAKRISHNA3488"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 hover:border-neutral-600 transition duration-200 text-xs font-semibold shadow-xs"
              title="Ramakrishna K on GitHub"
            >
              <GitHubIcon className="size-3.5 text-neutral-200" />
              <span className="text-[11px] leading-none">GitHub</span>
            </a>

            {/* Portfolio Link */}
            <a
              href="https://ramakrishna3488.github.io/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-emerald-950/40 text-neutral-300 hover:text-emerald-300 border border-neutral-800 hover:border-emerald-500/50 transition duration-200 text-xs font-semibold shadow-xs"
              title="RK Portfolio Live Site"
            >
              <Globe className="size-3.5 text-emerald-400" />
              <span className="text-[11px] leading-none">RK Portfolio</span>
            </a>

            {/* Instagram Link */}
            <a
              href="https://www.instagram.com/k_ramakrishna_99/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-pink-950/40 text-neutral-300 hover:text-pink-300 border border-neutral-800 hover:border-pink-500/50 transition duration-200 text-xs font-semibold shadow-xs"
              title="Ramakrishna K on Instagram"
            >
              <InstagramIcon className="size-3.5 text-pink-400" />
              <span className="text-[11px] leading-none">Instagram</span>
            </a>

            {/* View Full Card Button */}
            <button
              type="button"
              onClick={() => setIsDevModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/30 transition duration-200 cursor-pointer"
            >
              <Sparkles className="size-3.5" />
              <span className="leading-none">My Details</span>
            </button>
          </div>
        </div>
      </section>

      {/* 🌟 STATE-OF-THE-ART DEVELOPER DETAILS & PORTFOLIO MODAL 🌟 */}
      {isDevModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Deep Frosted Glass Blurred Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-3xl transition-all animate-in fade-in duration-200"
            style={{
              backdropFilter: 'blur(32px) saturate(200%)',
              WebkitBackdropFilter: 'blur(32px) saturate(200%)',
            }}
            onClick={() => setIsDevModalOpen(false)}
          />

          {/* Modal Container */}
          <div
            className="relative z-10 w-full max-w-2xl bg-neutral-950/95 border border-neutral-700/80 rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_50px_rgba(37,99,235,0.25)] text-white animate-in zoom-in-95 duration-200 my-auto text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Glowing Gradient Header */}
            <div className="h-28 sm:h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 relative p-5 sm:p-6 flex items-start justify-between overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_70%)]" />
              
              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md border border-white/20 px-3.5 py-1 text-xs font-bold text-white shadow-md relative z-10">
                <Sparkles className="size-3.5 text-amber-300" />
                <span>Lead Architect & Creator</span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setIsDevModalOpen(false)}
                className="size-8 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 hover:text-white transition cursor-pointer relative z-10"
                title="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Profile Avatar & Header Info */}
            <div className="px-5 sm:px-8 pb-7 pt-0 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 relative z-20">
                <div className="flex items-center sm:items-end gap-3.5 sm:gap-4">
                  {/* Glowing 3D Avatar */}
                  <div className="size-20 sm:size-24 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-emerald-400 p-1 shadow-2xl shadow-blue-500/30 shrink-0">
                    <div className="size-full bg-neutral-900 rounded-[13px] flex items-center justify-center font-black text-2xl sm:text-3xl text-white tracking-widest border border-white/15">
                      RK
                    </div>
                  </div>

                  {/* Name, Badge & Role moved up */}
                  <div className="space-y-1 sm:mb-2 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight">
                        {developerDetails.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 shadow-2xs">
                        <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#34d399]" /> Verified Creator
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-blue-400 font-semibold leading-snug">
                      {developerDetails.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-end sm:mb-2">
                  <a
                    href="https://ramakrishna3488.github.io/"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-1.5"
                  >
                    <span>RK Portfolio</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              </div>

              {/* Bio Description & Organization Box */}
              <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-xs text-neutral-300 leading-relaxed space-y-3 text-left">
                <p className="text-xs text-neutral-300 leading-relaxed">{developerDetails.bio}</p>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-400 pt-2.5 border-t border-neutral-800/80">
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-500">Parent Entity:</span>
                    <strong className="text-neutral-200 font-semibold">Klanvision IT Solutions Private Limited</strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-500">Corporate Portal:</span>
                    <a
                      href="https://klanvision.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-0.5 underline underline-offset-2"
                    >
                      <span>klanvision.com</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Engineering Highlights Quick Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                {developerDetails.stats.map((st, sIdx) => (
                  <div key={sIdx} className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-1">
                    <p className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider leading-none">{st.label}</p>
                    <p className="text-xs font-bold text-emerald-400 leading-none">{st.value}</p>
                  </div>
                ))}
              </div>

              {/* 🌟 SOCIAL PROFILES & DIRECT CONNECT GRID 🌟 */}
              <div className="space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Globe className="size-3.5 text-blue-400" />
                    <span>Official Verified Profiles & Connect</span>
                  </p>
                  <span className="text-[10px] text-neutral-500 font-medium">1-click copy & direct visits</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* LinkedIn Card */}
                  <div className="p-3.5 rounded-2xl bg-[#0077b5]/10 border border-[#0077b5]/30 hover:border-[#0077b5]/70 transition duration-200 flex flex-col justify-between space-y-3 shadow-xs group text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-xl bg-[#0077b5] flex items-center justify-center text-white shadow-md shrink-0">
                        <LinkedInIcon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-300 transition leading-tight">LinkedIn</h4>
                        <p className="text-[10px] text-blue-300/80 font-mono truncate leading-normal" title="in/ramakrishna-k-a9a9811ab">
                          in/ramakrishna-k-a9a9811ab
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full pt-0.5">
                      <a
                        href="https://www.linkedin.com/in/ramakrishna-k-a9a9811ab/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-8 px-3 rounded-lg bg-[#0077b5] hover:bg-[#0077b5]/80 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs leading-none"
                      >
                        <span>Connect</span>
                        <ExternalLink className="size-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyLink('linkedin', 'https://www.linkedin.com/in/ramakrishna-k-a9a9811ab/')}
                        className="h-8 px-2.5 rounded-lg bg-neutral-900 border border-[#0077b5]/40 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs transition cursor-pointer flex items-center justify-center"
                        title="Copy LinkedIn Link"
                      >
                        {copiedId === 'linkedin' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* GitHub Card */}
                  <div className="p-3.5 rounded-2xl bg-[#161b22] border border-neutral-700/80 hover:border-neutral-500 transition duration-200 flex flex-col justify-between space-y-3 shadow-xs group text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-xl bg-neutral-800 flex items-center justify-center text-white shadow-md shrink-0">
                        <GitHubIcon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition leading-tight">GitHub</h4>
                        <p className="text-[10px] text-neutral-400 font-mono truncate leading-normal" title="@RAMAKRISHNA3488">
                          @RAMAKRISHNA3488
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full pt-0.5">
                      <a
                        href="https://github.com/RAMAKRISHNA3488"
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-8 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs leading-none"
                      >
                        <span>View Profile</span>
                        <ExternalLink className="size-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyLink('github', 'https://github.com/RAMAKRISHNA3488')}
                        className="h-8 px-2.5 rounded-lg bg-neutral-900 border border-neutral-700 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs transition cursor-pointer flex items-center justify-center"
                        title="Copy GitHub Link"
                      >
                        {copiedId === 'github' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* RK Portfolio Card */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 hover:border-emerald-500/70 transition duration-200 flex flex-col justify-between space-y-3 shadow-xs group text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shrink-0">
                        <Globe className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition leading-tight">RK Portfolio</h4>
                        <p className="text-[10px] text-emerald-300/80 font-mono truncate leading-normal" title="ramakrishna3488.github.io">
                          ramakrishna3488.github.io
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full pt-0.5">
                      <a
                        href="https://ramakrishna3488.github.io/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs leading-none"
                      >
                        <span>Live Site</span>
                        <ExternalLink className="size-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyLink('portfolio', 'https://ramakrishna3488.github.io/')}
                        className="h-8 px-2.5 rounded-lg bg-neutral-900 border border-emerald-500/40 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs transition cursor-pointer flex items-center justify-center"
                        title="Copy Portfolio Link"
                      >
                        {copiedId === 'portfolio' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Instagram Card */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-pink-950/40 via-purple-950/40 to-neutral-900 border border-pink-500/30 hover:border-pink-500/70 transition duration-200 flex flex-col justify-between space-y-3 shadow-xs group text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-xl bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
                        <InstagramIcon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition leading-tight">Instagram</h4>
                        <p className="text-[10px] text-pink-300/80 font-mono truncate leading-normal" title="@k_ramakrishna_99">
                          @k_ramakrishna_99
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full pt-0.5">
                      <a
                        href="https://www.instagram.com/k_ramakrishna_99/"
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-8 px-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs leading-none"
                      >
                        <span>Follow</span>
                        <ExternalLink className="size-3" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyLink('instagram', 'https://www.instagram.com/k_ramakrishna_99/')}
                        className="h-8 px-2.5 rounded-lg bg-neutral-900 border border-pink-500/40 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs transition cursor-pointer flex items-center justify-center"
                        title="Copy Instagram Link"
                      >
                        {copiedId === 'instagram' ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Expertise Badges */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-800 text-left">
                <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Terminal className="size-3.5 text-purple-400" />
                  <span>Platform Architecture & Engineering Core</span>
                </p>
                <div className="flex flex-wrap gap-2 text-left">
                  {developerDetails.skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-3 py-1 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-200 text-xs font-medium shadow-2xs hover:border-blue-500/40 hover:text-white transition"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Modal Bottom Close */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsDevModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs border border-neutral-800 transition cursor-pointer text-center"
                >
                  Close Window
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingFooter;
