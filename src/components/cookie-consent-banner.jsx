import React, { useState, useEffect } from 'react';
import {
  Zap,
  Shield,
  Lock,
  SlidersHorizontal,
  Check,
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
      // First-time visitor: display prompt promptly
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, []);

  // Listen for programmatic open requests (e.g., from footer or floating badge)
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
      {/* Floating Re-Open Trigger Badge (Available after first-time prompt is completed) */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsCustomizeOpen(true);
            setIsOpen(true);
          }}
          className="fixed bottom-4 left-4 z-40 group flex items-center gap-2 px-3 py-2 rounded-full bg-white/95 hover:bg-white text-neutral-700 hover:text-neutral-950 border border-neutral-300 shadow-md hover:shadow-lg backdrop-blur-md transition-all duration-200 cursor-pointer text-xs font-semibold"
          title="Cookie & Performance Settings"
          aria-label="Manage Cookie and Performance Settings"
        >
          <div className="size-5 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
            <Zap className="size-3" />
          </div>
          <span className="hidden sm:inline text-[11px] font-bold">Speed & Cookies</span>
        </button>
      )}

      {/* Main Cookie Consent Modal / Drawer */}
      {isOpen && (
        <>
          {/* Backdrop overlay for first-time visitors */}
          <div
            className={`fixed inset-0 z-50 transition-opacity duration-300 ${
              !hasConsented
                ? 'bg-neutral-950/40 backdrop-blur-[3px]'
                : 'bg-neutral-950/20 backdrop-blur-[1px]'
            }`}
            onClick={() => {
              if (hasConsented) setIsOpen(false);
            }}
          />

          {/* Modal Card */}
          <div className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[94vw] sm:w-full animate-in fade-in slide-in-from-bottom-6 duration-300">
            <div className="relative rounded-2xl bg-white/95 backdrop-blur-2xl border border-neutral-200 shadow-2xl p-5 sm:p-6 space-y-4 text-neutral-900">
              {/* Subtle top gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-t-2xl" />

              {/* Header */}
              <div className="flex items-start justify-between gap-3 pt-1">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/25 shrink-0">
                    <Zap className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-sm sm:text-base text-neutral-950 tracking-tight">
                        We Value Your Privacy & Speed
                      </h3>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        <Sparkles className="size-2.5" /> Up to 3x Faster
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 font-medium">
                      Klanvision IT Solutions • High-Performance Web Architecture
                    </p>
                  </div>
                </div>

                {hasConsented && (
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition cursor-pointer"
                    title="Close"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-neutral-600 leading-relaxed">
                klanservicehub uses essential security cookies and intelligent performance tokens to pre-warm application routes, eliminate layout shifts, and accelerate workspace collaboration. Choose your preference below:
              </p>

              {/* Granular Preferences Accordion */}
              {isCustomizeOpen ? (
                <div className="space-y-3 pt-2 border-t border-neutral-200 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                  {/* 1. Essential Cookies */}
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        <Lock className="size-3.5 text-neutral-600" />
                        <span>Strictly Necessary & Session Auth</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-200/80 px-2 py-0.5 rounded-md">
                        Always Active
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-normal">
                      Encrypted JWT sessions, CSRF protection, and multi-tenant workspace security. Required for authentication and task management.
                    </p>
                  </div>

                  {/* 2. High-Speed Turbocache (Performance Boost) */}
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                        <Zap className="size-3.5 text-blue-600" />
                        <span>High-Speed Turbocache & Prefetching</span>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={performanceConsent}
                          onChange={(e) => setPerformanceConsent(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-blue-900/80 leading-normal">
                      Pre-warms routes during idle cycles to deliver 0ms perceived navigation across boards, tasks, and settings.
                    </p>
                  </div>

                  {/* 3. Functional Layout Memory */}
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        <SlidersHorizontal className="size-3.5 text-neutral-600" />
                        <span>Workspace Layout Memory</span>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={functionalConsent}
                          onChange={(e) => setFunctionalConsent(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-neutral-900"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-normal">
                      Caches active table densities, sidebar collapse states, and view filters to eliminate visual layout shifts.
                    </p>
                  </div>

                  {/* 4. Telemetry & Edge Latency */}
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                        <Cpu className="size-3.5 text-neutral-600" />
                        <span>Edge Latency & Diagnostics</span>
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={telemetryConsent}
                          onChange={(e) => setTelemetryConsent(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-neutral-900"></div>
                      </label>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-normal">
                      Monitors query execution speeds to verify edge latency stays below 10ms.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2 px-3 rounded-xl bg-neutral-100/80 text-[11px] text-neutral-600">
                  <Shield className="size-3.5 text-blue-600 shrink-0" />
                  <span>
                    Complies with enterprise GDPR and CCPA standards. Strictly necessary cookies are always secured.
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {isCustomizeOpen ? (
                  <>
                    <button
                      onClick={() => setIsCustomizeOpen(false)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition cursor-pointer text-center sm:text-left"
                    >
                      ← Back
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRejectOptional}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer text-center"
                      >
                        Reject Non-Essential
                      </button>
                      <button
                        onClick={handleSavePreferences}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition cursor-pointer text-center"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsCustomizeOpen(true)}
                      className="px-3.5 py-2.5 rounded-xl text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <SlidersHorizontal className="size-3.5" />
                      <span>Customize</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRejectOptional}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition cursor-pointer text-center"
                      >
                        Reject Non-Essential
                      </button>
                      <button
                        onClick={handleAcceptAll}
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                      >
                        <Zap className="size-3.5" />
                        <span>Accept All & Boost Speed</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
