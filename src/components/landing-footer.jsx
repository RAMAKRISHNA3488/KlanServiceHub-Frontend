import React from 'react';
import Link from 'next/link';
import {
  Kanban,
  Shield,
  Users,
  Globe,
  ExternalLink,
} from 'lucide-react';

export const LandingFooter = ({ className = '' }) => {
  return (
    <div className={`mt-auto w-full ${className}`}>
      {/* MAIN MULTI-COLUMN FOOTER */}
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
              <p className="text-[11px] text-neutral-500">
                Official Portal:{' '}
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
                    href="mailto:support@klanvision.com"
                    className="hover:text-blue-600 transition"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Klanvision Services */}
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
    </div>
  );
};

export default LandingFooter;
