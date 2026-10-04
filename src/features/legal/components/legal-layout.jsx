import React from 'react';
import Link from 'next/link';
import { Sparkles, Shield, ArrowLeft, FileText, Lock, CheckCircle2, Globe, Check, ArrowRight } from 'lucide-react';
import { LandingFooter } from '@/components/landing-footer';

export const LegalLayout = ({ title, subtitle, lastUpdated, children, activeTab }) => {
  const tabs = [
    { name: 'Terms of Service', href: '/terms', id: 'terms' },
    { name: 'Privacy Policy', href: '/privacy', id: 'privacy' },
    { name: 'Security & Trust', href: '/security', id: 'security' },
    { name: 'Acceptable Use', href: '/acceptable-use', id: 'acceptable-use' },
  ];

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
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-[10px] font-bold text-neutral-700">
              Legal & Trust Center
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
            href="/sign-in"
            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="bg-neutral-950 text-white py-14 px-6 sm:px-12 border-b border-neutral-800">
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
            <Shield className="size-3.5" />
            <span>Enterprise Governance & Legal Compliance</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">{title}</h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-2xl">{subtitle}</p>
          <div className="pt-2 flex items-center gap-4 text-xs text-neutral-500">
            <span>Last Updated: {lastUpdated || 'January 2026'}</span>
            <span>•</span>
            <span>Applies to klanservicehub Cloud & Workspace Instances</span>
          </div>
        </div>
      </div>

      {/* Main Legal Content Container */}
      <div className="max-w-5xl mx-auto w-full px-6 py-10 flex-1 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-4">
          <div className="sticky top-24 bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs space-y-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-3 pb-2">
              Legal Documents
            </p>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-50'
                  }`}
                >
                  <FileText className={`size-3.5 ${isActive ? 'text-blue-600' : 'text-neutral-400'}`} />
                  <span>{tab.name}</span>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-neutral-100 px-3 space-y-2 text-[11px] text-neutral-500">
              <p className="font-semibold text-neutral-800">Need Enterprise Agreements?</p>
              <p>For custom DPA, BAA, or MSA terms, contact our compliance engineering team.</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="md:col-span-3 bg-white border border-neutral-200 rounded-3xl p-6 sm:p-10 shadow-xs prose prose-neutral max-w-none">
          {children}
        </div>
      </div>

      {/* Landing Footer */}
      <LandingFooter />
    </div>
  );
};
