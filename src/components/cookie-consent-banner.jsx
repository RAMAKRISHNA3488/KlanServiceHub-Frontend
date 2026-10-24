import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Lock,
  SlidersHorizontal,
  X,
  Cpu,
  Sparkles,
  Shield,
  CheckCircle2,
  Copy,
  Check,
  FileCheck2,
  ExternalLink,
} from 'lucide-react';
import {
  getCookieConsent,
  setCookieConsent,
} from '@/lib/performance-optimizer';

export const CookieConsentBanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('categories'); // 'categories' | 'dpa' | 'receipt'
  const [hasConsented, setHasConsented] = useState(false);
  const [consentData, setConsentData] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Preference states
  const [performanceConsent, setPerformanceConsent] = useState(true);
  const [functionalConsent, setFunctionalConsent] = useState(true);
  const [telemetryConsent, setTelemetryConsent] = useState(true);

  useEffect(() => {
    const existing = getCookieConsent();
    if (existing) {
      setHasConsented(true);
      setConsentData(existing);
      setPerformanceConsent(existing.performance !== false);
      setFunctionalConsent(existing.functional !== false);
      setTelemetryConsent(existing.telemetry !== false);
      setIsOpen(false);
    } else {
      // First-time visitor: display bottom bar smoothly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for programmatic open requests (e.g., from footer or settings)
  useEffect(() => {
    const handleOpenPreferences = () => {
      const current = getCookieConsent();
      if (current) {
        setConsentData(current);
        setPerformanceConsent(current.performance !== false);
        setFunctionalConsent(current.functional !== false);
        setTelemetryConsent(current.telemetry !== false);
      }
      setIsCustomizeOpen(true);
      setIsOpen(true);
    };

    window.addEventListener('open-cookie-preferences', handleOpenPreferences);
    return () => window.removeEventListener('open-cookie-preferences', handleOpenPreferences);
  }, []);

  const handleAcceptAll = () => {
    const consent = setCookieConsent({
      performance: true,
      functional: true,
      telemetry: true,
    });
    setConsentData(consent);
    setPerformanceConsent(true);
    setFunctionalConsent(true);
    setTelemetryConsent(true);
    setHasConsented(true);
    setIsOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleRejectOptional = () => {
    const consent = setCookieConsent({
      performance: false,
      functional: false,
      telemetry: false,
    });
    setConsentData(consent);
    setPerformanceConsent(false);
    setFunctionalConsent(false);
    setTelemetryConsent(false);
    setHasConsented(true);
    setIsOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleSavePreferences = () => {
    const consent = setCookieConsent({
      performance: performanceConsent,
      functional: functionalConsent,
      telemetry: telemetryConsent,
    });
    setConsentData(consent);
    setHasConsented(true);
    setIsOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleCopyReceipt = () => {
    if (!consentData) return;
    const receipt = JSON.stringify(
      {
        issuer: 'klanservicehub by Klanvision IT Solutions',
        consentId: consentData.consentId || 'cst_default',
        timestamp: consentData.timestamp || new Date().toISOString(),
        version: consentData.version || '1.0',
        preferences: {
          strictlyNecessary: true,
          performanceCache: consentData.performance !== false,
          functionalLayoutMemory: consentData.functional !== false,
          edgeDiagnostics: consentData.telemetry !== false,
        },
      },
      null,
      2
    );
    navigator.clipboard.writeText(receipt);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <>
      {/* FLOATING WHITE GLASS RE-OPEN BADGE (Shown after consent has been given) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsCustomizeOpen(true);
            setIsOpen(true);
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/90 hover:bg-white text-neutral-900 border border-neutral-200/90 shadow-[0_12px_30px_rgba(0,0,0,0.1),inset_0_1px_0_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-all duration-200 cursor-pointer text-xs font-semibold hover:scale-105 active:scale-95 ring-1 ring-black/[0.03]"
          title="Manage Consent & Data Processing Preferences"
          aria-label="Manage Cookie and Data Processing Settings"
        >
          <div className="size-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <Shield className="size-3 text-blue-600" />
          </div>
          <span className="hidden sm:inline text-[11px] font-bold tracking-tight text-neutral-800 group-hover:text-neutral-950">
            Consent Settings
          </span>
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
        </button>
      )}

      {/* 100% FULL-WIDTH WHITE FROSTED GLASS FLOATING CONSENT BAR WITH RESPONSIVE FLOATING MARGINS */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 w-full p-2.5 sm:p-4 md:p-6 pointer-events-none flex justify-center animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="pointer-events-auto relative w-full max-w-7xl mx-auto rounded-2xl sm:rounded-3xl bg-white/85 sm:bg-white/90 text-neutral-900 border border-neutral-200/80 sm:border-white/90 shadow-[0_20px_50px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.05),inset_0_1px_0_0_rgba(255,255,255,0.9)] backdrop-blur-2xl backdrop-saturate-180 overflow-hidden ring-1 ring-black/[0.04]">
            {/* Top Specular Edge Highlight */}
            <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/40 via-indigo-500/30 to-transparent" />

            {/* Ambient Diffused Light Orbs behind white frosted glass */}
            <div className="pointer-events-none absolute -top-16 -left-12 size-72 bg-blue-400/10 rounded-full blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -right-12 size-72 bg-indigo-400/10 rounded-full blur-3xl" />

            <div className="relative px-5 py-4 sm:px-8 sm:py-5 lg:px-10 lg:py-6">
              {!isCustomizeOpen ? (
                /* STANDARD WHITE GLASS FLOATING BAR VIEW */
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6">
                  {/* Left Side: Title & Notice Text */}
                  <div className="space-y-2 max-w-4xl flex-1">
                    <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                      <div className="size-8 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
                        <Shield className="size-4 text-blue-600" />
                      </div>
                      <h2 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight">
                        Consent for Data Processing
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 shadow-xs">
                        <Sparkles className="size-2.5 text-blue-600" /> Up to 3x Faster Edge Cache
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shadow-xs">
                        <CheckCircle2 className="size-2.5 text-emerald-600" /> GDPR & DPDP Ready
                      </span>
                    </div>

                    <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-normal">
                      This platform utilizes cookies and edge caching technologies to optimize application response times, pre-warm workspace navigation, eliminate layout shifts (CLS), and deliver high-security tenant isolation. By clicking &quot;Accept All&quot;, you consent to the storage and cryptographic processing of these performance tokens on your device in accordance with our{' '}
                      <Link
                        href="/data-processing"
                        className="text-blue-600 font-semibold underline underline-offset-2 hover:text-blue-700 transition"
                      >
                        Data Processing Agreement (DPA)
                      </Link>
                      ,{' '}
                      <Link
                        href="/privacy"
                        className="text-neutral-800 underline underline-offset-2 hover:text-blue-600 transition font-medium"
                      >
                        Privacy Policy
                      </Link>
                      , and{' '}
                      <Link
                        href="/terms"
                        className="text-neutral-800 underline underline-offset-2 hover:text-blue-600 transition font-medium"
                      >
                        Legal Terms
                      </Link>
                      . You may adjust or revoke your preferences at any time via Consent Settings.
                    </p>
                  </div>

                  {/* Right Side: Frosted Glass Action Buttons */}
                  <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto shrink-0 flex-wrap sm:flex-nowrap">
                    {/* 1. Consent Settings */}
                    <button
                      onClick={() => {
                        setIsCustomizeOpen(true);
                        setActiveTab('categories');
                      }}
                      className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 bg-white/90 hover:bg-neutral-100 text-neutral-800 hover:text-neutral-950 font-bold text-xs sm:text-[13px] tracking-wide rounded-xl border border-neutral-300/80 backdrop-blur-md shadow-xs transition-all duration-150 text-center cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <SlidersHorizontal className="size-3.5 text-neutral-600" />
                      <span>Consent Settings</span>
                    </button>

                    {/* 2. Strictly Necessary Only */}
                    <button
                      onClick={handleRejectOptional}
                      className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 bg-neutral-100/90 hover:bg-neutral-200/90 text-neutral-700 hover:text-neutral-950 font-bold text-xs sm:text-[13px] tracking-wide rounded-xl border border-neutral-200/90 backdrop-blur-md shadow-xs transition-all duration-150 text-center cursor-pointer active:scale-95"
                    >
                      Strictly Necessary Only
                    </button>

                    {/* 3. Accept All */}
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-[13px] tracking-wide rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all duration-150 text-center cursor-pointer active:scale-95"
                    >
                      Accept All
                    </button>
                  </div>
                </div>
              ) : (
                /* INTERACTIVE GRANULAR WHITE GLASS SETTINGS VIEW */
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Header & Tab Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-neutral-200/80 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 shadow-xs">
                        <SlidersHorizontal className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-neutral-950 tracking-tight flex items-center gap-2">
                          <span>Data Processing & Consent Management</span>
                        </h3>
                        <p className="text-xs text-neutral-500">
                          Configure granular data processing categories and audit compliance preferences.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Glass Navigation Tabs */}
                      <div className="flex items-center p-1 rounded-xl bg-neutral-100 border border-neutral-200 text-xs">
                        <button
                          onClick={() => setActiveTab('categories')}
                          className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                            activeTab === 'categories'
                              ? 'bg-white text-blue-600 shadow-xs font-bold border border-neutral-200/70'
                              : 'text-neutral-600 hover:text-neutral-950'
                          }`}
                        >
                          Categories
                        </button>
                        <button
                          onClick={() => setActiveTab('dpa')}
                          className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                            activeTab === 'dpa'
                              ? 'bg-white text-blue-600 shadow-xs font-bold border border-neutral-200/70'
                              : 'text-neutral-600 hover:text-neutral-950'
                          }`}
                        >
                          DPA Summary
                        </button>
                        <button
                          onClick={() => setActiveTab('receipt')}
                          className={`px-3.5 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                            activeTab === 'receipt'
                              ? 'bg-white text-blue-600 shadow-xs font-bold border border-neutral-200/70'
                              : 'text-neutral-600 hover:text-neutral-950'
                          }`}
                        >
                          Consent Receipt
                        </button>
                      </div>

                      {hasConsented && (
                        <button
                          onClick={() => setIsOpen(false)}
                          className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                          title="Close"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* TAB 1: Granular White Glass Tiles */}
                  {activeTab === 'categories' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-72 overflow-y-auto pr-1">
                      {/* Category 1: Strictly Necessary */}
                      <div className="p-4 rounded-2xl bg-white/70 border border-neutral-200/80 backdrop-blur-md space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-2">
                            <Lock className="size-4 text-neutral-500" />
                            <span>Strictly Necessary & Session Auth</span>
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-md border border-neutral-200">
                            Always Active
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Encrypted JWT sessions, CSRF protection, and multi-tenant workspace isolation. Required to access projects and verify RBAC credentials.
                        </p>
                      </div>

                      {/* Category 2: High-Speed Turbocache */}
                      <div className="p-4 rounded-2xl bg-white/70 hover:bg-white/90 border border-neutral-200/80 hover:border-blue-300 backdrop-blur-md transition-all space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-blue-700 flex items-center gap-2">
                            <Zap className="size-4 text-blue-600" />
                            <span>High-Speed Turbocache & Prefetching</span>
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={performanceConsent}
                              onChange={(e) => setPerformanceConsent(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5.5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Pre-warms dashboard views and asset bundles during idle intervals to deliver near-instantaneous transitions between tasks and boards.
                        </p>
                      </div>

                      {/* Category 3: Workspace Layout Memory */}
                      <div className="p-4 rounded-2xl bg-white/70 hover:bg-white/90 border border-neutral-200/80 hover:border-indigo-300 backdrop-blur-md transition-all space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-2">
                            <SlidersHorizontal className="size-4 text-indigo-600" />
                            <span>Workspace Layout Memory</span>
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={functionalConsent}
                              onChange={(e) => setFunctionalConsent(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5.5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Persists table column densities, collapsed navigation state, and project filters to prevent layout shifts across page reloads.
                        </p>
                      </div>

                      {/* Category 4: Diagnostics & Edge Latency */}
                      <div className="p-4 rounded-2xl bg-white/70 hover:bg-white/90 border border-neutral-200/80 hover:border-sky-300 backdrop-blur-md transition-all space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-2">
                            <Cpu className="size-4 text-sky-600" />
                            <span>Edge Latency & Diagnostics</span>
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={telemetryConsent}
                              onChange={(e) => setTelemetryConsent(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-10 h-5.5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                        <p className="text-[11px] text-neutral-600 leading-relaxed">
                          Anonymous diagnostics measuring Cloudflare D1 edge query latency to maintain response times under 10ms worldwide.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DPA White Glass Summary */}
                  {activeTab === 'dpa' && (
                    <div className="max-h-72 overflow-y-auto pr-1 space-y-3.5 text-xs text-neutral-700">
                      <div className="p-4 rounded-2xl bg-white/70 border border-neutral-200/80 backdrop-blur-md space-y-2 shadow-xs">
                        <div className="flex items-center gap-2 font-bold text-neutral-950 text-sm">
                          <FileCheck2 className="size-4 text-blue-600" />
                          <span>Data Processing Agreement Overview (Art. 28 GDPR)</span>
                        </div>
                        <p className="text-neutral-600 leading-relaxed">
                          KlanserviceHub acts as a certified Data Processor on behalf of your organization. All personal credentials and workspace boards are encrypted using AES-256 at rest and TLS 1.3 in transit.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-white/70 border border-neutral-200/80 backdrop-blur-md space-y-1 shadow-xs">
                          <p className="font-bold text-neutral-900 text-[11px]">Authorized Sub-processors</p>
                          <p className="text-neutral-500 text-[10px]">Cloudflare (Edge D1 DB, CDN), Appwrite (Auth Engine), Klanvision Cloud Infrastructure.</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-white/70 border border-neutral-200/80 backdrop-blur-md space-y-1 shadow-xs">
                          <p className="font-bold text-neutral-900 text-[11px]">Retention & Deletion Policy</p>
                          <p className="text-neutral-500 text-[10px]">Active workspace data is retained per subscription. Edge telemetry logs automatically rotate and purge every 30 days.</p>
                        </div>
                      </div>

                      <div className="pt-1">
                        <Link
                          href="/data-processing"
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-xs"
                        >
                          <span>View Complete Statutory Data Processing Agreement</span>
                          <ExternalLink className="size-3" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: Consent White Glass Receipt */}
                  {activeTab === 'receipt' && (
                    <div className="max-h-72 overflow-y-auto pr-1 space-y-3.5 text-xs text-neutral-700">
                      <div className="p-4 rounded-2xl bg-white/70 border border-neutral-200/80 backdrop-blur-md space-y-2.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-950 text-sm flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-emerald-600" />
                            <span>Cryptographic Consent Audit Receipt</span>
                          </span>
                          <span className="text-[10px] font-mono bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                            Verified
                          </span>
                        </div>

                        <div className="font-mono text-[11px] bg-neutral-50 p-3 rounded-xl border border-neutral-200 space-y-1 text-neutral-700">
                          <p>Consent ID: <span className="text-blue-600 font-bold">{consentData?.consentId || 'Generated on Save'}</span></p>
                          <p>Timestamp: <span className="text-neutral-500">{consentData?.timestamp || new Date().toISOString()}</span></p>
                          <p>Scope: <span className="text-neutral-500">Strictly Necessary (Active), Prefetch ({performanceConsent ? 'Granted' : 'Revoked'}), Layout ({functionalConsent ? 'Granted' : 'Revoked'}), Telemetry ({telemetryConsent ? 'Granted' : 'Revoked'})</span></p>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <p className="text-[11px] text-neutral-500">
                            Export this receipt for organizational GDPR/CCPA data compliance records.
                          </p>
                          <button
                            onClick={handleCopyReceipt}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-50 text-neutral-800 font-semibold text-xs border border-neutral-200 transition cursor-pointer shadow-xs"
                          >
                            {copiedId ? (
                              <>
                                <Check className="size-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="size-3.5 text-neutral-500" />
                                <span>Copy Receipt</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Footer Controls */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-neutral-200/80">
                    <button
                      onClick={() => setIsCustomizeOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100 transition cursor-pointer text-center sm:text-left"
                    >
                      ← Back to Overview
                    </button>

                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={handleRejectOptional}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 hover:text-neutral-950 font-bold text-xs rounded-xl border border-neutral-200/90 transition cursor-pointer text-center shadow-xs active:scale-95"
                      >
                        Strictly Necessary Only
                      </button>
                      <button
                        onClick={handleSavePreferences}
                        className="flex-1 sm:flex-initial px-5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs rounded-xl border border-neutral-200 transition cursor-pointer text-center shadow-xs active:scale-95"
                      >
                        Save Preferences
                      </button>
                      <button
                        onClick={handleAcceptAll}
                        className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition cursor-pointer text-center active:scale-95"
                      >
                        Accept All
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsentBanner;
