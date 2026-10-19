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
  Info,
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
      {/* Floating Re-Open Badge (Shown after consent has been given) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsCustomizeOpen(true);
            setIsOpen(true);
          }}
          className="fixed bottom-4 left-4 z-40 group flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-neutral-900/95 hover:bg-neutral-800 text-white border border-neutral-700/80 shadow-2xl backdrop-blur-md transition-all duration-200 cursor-pointer text-xs font-semibold hover:scale-105 active:scale-95"
          title="Manage Consent & Data Processing Preferences"
          aria-label="Manage Cookie and Data Processing Settings"
        >
          <div className="size-5 rounded-full bg-blue-600/20 border border-blue-500/50 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <Shield className="size-3 text-blue-400" />
          </div>
          <span className="hidden sm:inline text-[11px] font-bold tracking-tight text-neutral-200 group-hover:text-white">
            Consent Settings
          </span>
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      )}

      {/* Main Consent Container */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-950/95 text-white border-t border-neutral-800/90 shadow-[0_-12px_45px_rgba(0,0,0,0.65)] backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-5 duration-300">
          {/* Subtle Brand Accent Gradient Line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400" />

          <div className="max-w-7xl mx-auto px-5 py-6 sm:px-8 sm:py-7">
            {!isCustomizeOpen ? (
              /* STANDARD BANNER VIEW */
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Left Side: Title & Notice Text */}
                <div className="space-y-2.5 max-w-4xl flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="size-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <Shield className="size-4 text-blue-400" />
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Consent for Data Processing
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-950/80 border border-blue-700/60 px-2.5 py-0.5 text-[10px] font-bold text-blue-300">
                      <Sparkles className="size-2.5 text-blue-400" /> Up to 3x Faster Edge Cache
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-700/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
                      <CheckCircle2 className="size-2.5 text-emerald-400" /> GDPR & CCPA Ready
                    </span>
                  </div>

                  <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed">
                    This platform utilizes cookies and edge caching technologies to optimize application response times, pre-warm workspace navigation, eliminate layout shifts (CLS), and deliver high-security tenant isolation. By clicking &quot;Accept All&quot;, you consent to the storage and cryptographic processing of these performance tokens on your device in accordance with our{' '}
                    <Link
                      href="/data-processing"
                      className="text-blue-400 font-semibold underline underline-offset-2 hover:text-blue-300 transition"
                    >
                      Data Processing Agreement (DPA)
                    </Link>
                    ,{' '}
                    <Link
                      href="/privacy"
                      className="text-neutral-200 underline underline-offset-2 hover:text-white transition font-medium"
                    >
                      Privacy Policy
                    </Link>
                    , and{' '}
                    <Link
                      href="/terms"
                      className="text-neutral-200 underline underline-offset-2 hover:text-white transition font-medium"
                    >
                      Legal Terms
                    </Link>
                    . You may adjust or revoke your preferences at any time via Consent Settings.
                  </p>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 flex-wrap sm:flex-nowrap">
                  {/* 1. Consent Settings */}
                  <button
                    onClick={() => {
                      setIsCustomizeOpen(true);
                      setActiveTab('categories');
                    }}
                    className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white font-bold text-xs sm:text-[13px] tracking-wide rounded-xl border border-neutral-700/90 transition duration-150 text-center cursor-pointer shadow-sm active:scale-95"
                  >
                    Consent Settings
                  </button>

                  {/* 2. Strictly Necessary Only */}
                  <button
                    onClick={handleRejectOptional}
                    className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-xs sm:text-[13px] tracking-wide rounded-xl border border-neutral-700/90 transition duration-150 text-center cursor-pointer shadow-sm active:scale-95"
                  >
                    Strictly Necessary
                  </button>

                  {/* 3. Accept All */}
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-initial px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-[13px] tracking-wide rounded-xl shadow-lg shadow-blue-600/30 transition duration-150 text-center cursor-pointer active:scale-95"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            ) : (
              /* INTERACTIVE GRANULAR SETTINGS VIEW */
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header & Tab Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      <SlidersHorizontal className="size-4" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                        <span>Data Processing & Consent Management</span>
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Configure granular data processing categories and audit compliance preferences.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Navigation Tabs */}
                    <div className="flex items-center p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
                      <button
                        onClick={() => setActiveTab('categories')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                          activeTab === 'categories'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Categories
                      </button>
                      <button
                        onClick={() => setActiveTab('dpa')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                          activeTab === 'dpa'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        DPA Summary
                      </button>
                      <button
                        onClick={() => setActiveTab('receipt')}
                        className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                          activeTab === 'receipt'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Consent Receipt
                      </button>
                    </div>

                    {hasConsented && (
                      <button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                        title="Close"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* TAB 1: Granular Categories */}
                {activeTab === 'categories' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-72 overflow-y-auto pr-1">
                    {/* Category 1: Strictly Necessary */}
                    <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                          <Lock className="size-4 text-neutral-400" />
                          <span>Strictly Necessary & Session Auth</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 bg-neutral-800 px-2.5 py-0.5 rounded-md border border-neutral-700">
                          Always Active
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Encrypted JWT sessions, CSRF protection, and multi-tenant workspace isolation. Required to access projects and verify RBAC credentials.
                      </p>
                    </div>

                    {/* Category 2: High-Speed Turbocache */}
                    <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-blue-900/50 transition space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-blue-400 flex items-center gap-2">
                          <Zap className="size-4 text-blue-500" />
                          <span>High-Speed Turbocache & Prefetching</span>
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={performanceConsent}
                            onChange={(e) => setPerformanceConsent(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Pre-warms dashboard views and asset bundles during idle intervals to deliver near-instantaneous transitions between tasks and boards.
                      </p>
                    </div>

                    {/* Category 3: Workspace Layout Memory */}
                    <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-blue-900/50 transition space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                          <SlidersHorizontal className="size-4 text-indigo-400" />
                          <span>Workspace Layout Memory</span>
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={functionalConsent}
                            onChange={(e) => setFunctionalConsent(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Persists table column densities, collapsed navigation state, and project filters to prevent layout shifts across page reloads.
                      </p>
                    </div>

                    {/* Category 4: Diagnostics & Edge Latency */}
                    <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 hover:border-blue-900/50 transition space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                          <Cpu className="size-4 text-sky-400" />
                          <span>Edge Latency & Diagnostics</span>
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={telemetryConsent}
                            onChange={(e) => setTelemetryConsent(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Anonymous diagnostics measuring Cloudflare D1 edge query latency to maintain response times under 10ms worldwide.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 2: DPA Summary */}
                {activeTab === 'dpa' && (
                  <div className="max-h-72 overflow-y-auto pr-1 space-y-3.5 text-xs text-neutral-300">
                    <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-white text-sm">
                        <FileCheck2 className="size-4 text-blue-400" />
                        <span>Data Processing Agreement Overview (Art. 28 GDPR)</span>
                      </div>
                      <p className="text-neutral-400 leading-relaxed">
                        KlanserviceHub acts as a certified Data Processor on behalf of your organization. All personal credentials and workspace boards are encrypted using AES-256 at rest and TLS 1.3 in transit.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-1">
                        <p className="font-bold text-white text-[11px]">Authorized Sub-processors</p>
                        <p className="text-neutral-400 text-[10px]">Cloudflare (Edge D1 DB, CDN), Appwrite (Auth Engine), Klanvision Cloud Infrastructure.</p>
                      </div>
                      <div className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 space-y-1">
                        <p className="font-bold text-white text-[11px]">Retention & Deletion Policy</p>
                        <p className="text-neutral-400 text-[10px]">Active workspace data is retained per subscription. Edge telemetry logs automatically rotate and purge every 30 days.</p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link
                        href="/data-processing"
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 font-bold text-xs"
                      >
                        <span>View Complete Statutory Data Processing Agreement</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* TAB 3: Consent Receipt */}
                {activeTab === 'receipt' && (
                  <div className="max-h-72 overflow-y-auto pr-1 space-y-3.5 text-xs text-neutral-300">
                    <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-sm flex items-center gap-2">
                          <CheckCircle2 className="size-4 text-emerald-400" />
                          <span>Cryptographic Consent Audit Receipt</span>
                        </span>
                        <span className="text-[10px] font-mono bg-emerald-950 border border-emerald-700/60 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                          Verified
                        </span>
                      </div>

                      <div className="font-mono text-[11px] bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1 text-neutral-300">
                        <p>Consent ID: <span className="text-blue-400 font-bold">{consentData?.consentId || 'Generated on Save'}</span></p>
                        <p>Timestamp: <span className="text-neutral-400">{consentData?.timestamp || new Date().toISOString()}</span></p>
                        <p>Scope: <span className="text-neutral-400">Strictly Necessary (Active), Prefetch ({performanceConsent ? 'Granted' : 'Revoked'}), Layout ({functionalConsent ? 'Granted' : 'Revoked'}), Telemetry ({telemetryConsent ? 'Granted' : 'Revoked'})</span></p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <p className="text-[11px] text-neutral-400">
                          Export this receipt for organizational GDPR/CCPA data compliance records.
                        </p>
                        <button
                          onClick={handleCopyReceipt}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs border border-neutral-700 transition cursor-pointer"
                        >
                          {copiedId ? (
                            <>
                              <Check className="size-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-3.5 text-neutral-400" />
                              <span>Copy Receipt</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-neutral-800">
                  <button
                    onClick={() => setIsCustomizeOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer text-center sm:text-left"
                  >
                    ← Back to Overview
                  </button>

                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={handleRejectOptional}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold text-xs rounded-xl border border-neutral-700/80 transition cursor-pointer text-center active:scale-95"
                    >
                      Strictly Necessary Only
                    </button>
                    <button
                      onClick={handleSavePreferences}
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl border border-neutral-600 transition cursor-pointer text-center shadow-sm active:scale-95"
                    >
                      Save Preferences
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 sm:flex-initial px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer text-center active:scale-95"
                    >
                      Accept All
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsentBanner;
