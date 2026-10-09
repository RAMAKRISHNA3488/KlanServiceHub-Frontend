import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Lock,
  SlidersHorizontal,
  X,
  Cpu,
  Sparkles,
} from 'lucide-react';
import {
  getCookieConsent,
  setCookieConsent,
} from '@/lib/performance-optimizer';

export const CookieConsentBanner = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  // Preference states
  const [performanceConsent, setPerformanceConsent] = useState(true);
  const [functionalConsent, setFunctionalConsent] = useState(true);
  const [telemetryConsent, setTelemetryConsent] = useState(true);

  useEffect(() => {
    const existing = getCookieConsent();
    if (existing) {
      setHasConsented(true);
      setPerformanceConsent(existing.performance !== false);
      setFunctionalConsent(existing.functional !== false);
      setTelemetryConsent(existing.telemetry !== false);
      setIsOpen(false);
    } else {
      // First-time visitor: display bottom bar promptly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for programmatic open requests (e.g., from footer or floating trigger)
  useEffect(() => {
    const handleOpenPreferences = () => {
      const current = getCookieConsent();
      if (current) {
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
    setCookieConsent({
      performance: true,
      functional: true,
      telemetry: true,
    });
    setPerformanceConsent(true);
    setFunctionalConsent(true);
    setTelemetryConsent(true);
    setHasConsented(true);
    setIsOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleRejectOptional = () => {
    setCookieConsent({
      performance: false,
      functional: false,
      telemetry: false,
    });
    setPerformanceConsent(false);
    setFunctionalConsent(false);
    setTelemetryConsent(false);
    setHasConsented(true);
    setIsOpen(false);
    setIsCustomizeOpen(false);
  };

  const handleSavePreferences = () => {
    setCookieConsent({
      performance: performanceConsent,
      functional: functionalConsent,
      telemetry: telemetryConsent,
    });
    setHasConsented(true);
    setIsOpen(false);
    setIsCustomizeOpen(false);
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
          className="fixed bottom-4 left-4 z-40 group flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#2d2d2d]/95 hover:bg-[#202020] text-white border border-neutral-700 shadow-xl backdrop-blur-md transition-all duration-200 cursor-pointer text-xs font-semibold"
          title="Cookie & Performance Settings"
          aria-label="Manage Cookie and Performance Settings"
        >
          <div className="size-5 rounded-full bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 group-hover:scale-110 transition-transform">
            <Zap className="size-3" />
          </div>
          <span className="hidden sm:inline text-[11px] font-bold tracking-tight">Consent Settings</span>
        </button>
      )}

      {/* Main Bottom Consent Bar (Exact Full-Width Layout from Reference) */}
      {isOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#2d2d2d] text-white border-t border-neutral-800 shadow-[0_-10px_35px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className="max-w-7xl mx-auto px-5 py-6 sm:px-8 sm:py-7">
            {!isCustomizeOpen ? (
              /* Standard Full-Width Banner View */
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Left Side: Title & Notice Text */}
                <div className="space-y-2 max-w-4xl flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Consent for Data Processing
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-950/80 border border-red-700/60 px-2 py-0.5 text-[10px] font-bold text-red-300">
                      <Sparkles className="size-2.5" /> Up to 3x Faster
                    </span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-neutral-300 leading-relaxed">
                    This website uses cookies and similar technologies (hereinafter &quot;Technologies&quot;) that enable us to provide an optimized online experience, pre-warm application routes, eliminate layout shifts, and tailor content to your interests. By clicking &quot;Accept All&quot;, you consent that these Technologies may be stored and read on your device. This includes high-speed caching and workspace telemetry to make our services as fast, secure, and user-friendly as possible. For more information and the option to withdraw or adjust your consent at any time, please refer to &quot;Consent Settings&quot; at the bottom of the website.{' '}
                    <Link href="/privacy" className="text-white underline underline-offset-2 hover:text-red-400 transition font-medium">
                      Privacy Notice
                    </Link>{' '}
                    <Link href="/terms" className="text-white underline underline-offset-2 hover:text-red-400 transition font-medium ml-1">
                      Legal Notice
                    </Link>
                  </p>
                </div>

                {/* Right Side: 3 Action Buttons (Matching Screenshot) */}
                <div className="flex items-center gap-2.5 sm:gap-3 w-full lg:w-auto shrink-0 flex-wrap sm:flex-nowrap">
                  {/* 1. Consent Settings */}
                  <button
                    onClick={() => setIsCustomizeOpen(true)}
                    className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 bg-[#d40511] hover:bg-[#b0040e] text-white font-bold text-xs sm:text-[13px] tracking-wide rounded-xs transition-colors duration-150 text-center cursor-pointer shadow-sm"
                  >
                    Consent Settings
                  </button>

                  {/* 2. Strictly Necessary Only */}
                  <button
                    onClick={handleRejectOptional}
                    className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 bg-[#d40511] hover:bg-[#b0040e] text-white font-bold text-xs sm:text-[13px] tracking-wide rounded-xs transition-colors duration-150 text-center cursor-pointer shadow-sm"
                  >
                    Strictly Necessary Only
                  </button>

                  {/* 3. Accept All */}
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 sm:py-3 bg-[#d40511] hover:bg-[#b0040e] text-white font-bold text-xs sm:text-[13px] tracking-wide rounded-xs transition-colors duration-150 text-center cursor-pointer shadow-sm"
                  >
                    Accept All
                  </button>
                </div>
              </div>
            ) : (
              /* Granular Settings View */
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-700">
                  <div className="flex items-center gap-2.5">
                    <SlidersHorizontal className="size-5 text-red-500" />
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      Consent Settings & Speed Preferences
                    </h3>
                  </div>
                  {hasConsented && (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition cursor-pointer"
                      title="Close"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>

                {/* 4 Categorized Preference Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-72 overflow-y-auto pr-1">
                  {/* Category 1: Strictly Necessary */}
                  <div className="p-3.5 rounded-lg bg-[#222222] border border-neutral-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <Lock className="size-3.5 text-neutral-400" />
                        <span>Strictly Necessary & Session Auth</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 bg-neutral-800 px-2 py-0.5 rounded-xs border border-neutral-600">
                        Always Active
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Encrypted JWT sessions, CSRF protection, and multi-tenant workspace isolation. Required for authenticating and managing project tasks.
                    </p>
                  </div>

                  {/* Category 2: High-Speed Turbocache */}
                  <div className="p-3.5 rounded-lg bg-[#222222] border border-red-900/40 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-red-400 flex items-center gap-1.5">
                        <Zap className="size-3.5 text-red-500" />
                        <span>High-Speed Turbocache & Prefetching</span>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={performanceConsent}
                          onChange={(e) => setPerformanceConsent(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#d40511]"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Pre-warms next routes during idle intervals and link hover to deliver near-instantaneous page transitions.
                    </p>
                  </div>

                  {/* Category 3: Workspace Layout Memory */}
                  <div className="p-3.5 rounded-lg bg-[#222222] border border-neutral-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <SlidersHorizontal className="size-3.5 text-neutral-400" />
                        <span>Workspace Layout Memory</span>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={functionalConsent}
                          onChange={(e) => setFunctionalConsent(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#d40511]"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Remembers table densities, sidebar collapse states, and view filters to eliminate visual layout shifts (CLS).
                    </p>
                  </div>

                  {/* Category 4: Diagnostics & Edge Latency */}
                  <div className="p-3.5 rounded-lg bg-[#222222] border border-neutral-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                        <Cpu className="size-3.5 text-neutral-400" />
                        <span>Edge Latency & Diagnostics</span>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={telemetryConsent}
                          onChange={(e) => setTelemetryConsent(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#d40511]"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      Anonymous latency diagnostics to verify server responses remain below 10ms.
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-neutral-700">
                  <button
                    onClick={() => setIsCustomizeOpen(false)}
                    className="px-4 py-2.5 rounded-xs text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 transition cursor-pointer text-center sm:text-left"
                  >
                    ← Back to Overview
                  </button>

                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={handleRejectOptional}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xs transition cursor-pointer text-center"
                    >
                      Strictly Necessary Only
                    </button>
                    <button
                      onClick={handleSavePreferences}
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#d40511] hover:bg-[#b0040e] text-white font-bold text-xs rounded-xs transition cursor-pointer text-center shadow-sm"
                    >
                      Save Preferences
                    </button>
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#d40511] hover:bg-[#b0040e] text-white font-bold text-xs rounded-xs transition cursor-pointer text-center shadow-sm"
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
