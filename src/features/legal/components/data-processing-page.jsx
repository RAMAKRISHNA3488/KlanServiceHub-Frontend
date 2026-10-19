import React, { useState, useEffect } from 'react';
import { LegalLayout } from './legal-layout';
import {
  Shield,
  Lock,
  Database,
  CheckCircle2,
  FileCheck2,
  Server,
  Zap,
  SlidersHorizontal,
  Cpu,
  Copy,
  Check,
  RefreshCw,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  getCookieConsent,
  setCookieConsent,
  resetCookieConsent,
} from '@/lib/performance-optimizer';

export const DataProcessingPage = () => {
  const [consentState, setConsentState] = useState(null);
  const [performanceConsent, setPerformanceConsent] = useState(true);
  const [functionalConsent, setFunctionalConsent] = useState(true);
  const [telemetryConsent, setTelemetryConsent] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    const syncState = () => {
      const current = getCookieConsent();
      setConsentState(current);
      if (current) {
        setPerformanceConsent(current.performance !== false);
        setFunctionalConsent(current.functional !== false);
        setTelemetryConsent(current.telemetry !== false);
      }
    };

    syncState();
    window.addEventListener('cookie-consent-updated', syncState);
    return () => window.removeEventListener('cookie-consent-updated', syncState);
  }, []);

  const handleSave = () => {
    const updated = setCookieConsent({
      performance: performanceConsent,
      functional: functionalConsent,
      telemetry: telemetryConsent,
    });
    setConsentState(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAcceptAll = () => {
    const updated = setCookieConsent({
      performance: true,
      functional: true,
      telemetry: true,
    });
    setPerformanceConsent(true);
    setFunctionalConsent(true);
    setTelemetryConsent(true);
    setConsentState(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleReset = () => {
    resetCookieConsent();
    setConsentState(null);
    setPerformanceConsent(false);
    setFunctionalConsent(false);
    setTelemetryConsent(false);
  };

  const handleCopyReceipt = () => {
    if (!consentState) return;
    const receiptData = JSON.stringify(
      {
        subject: 'KlanserviceHub Consent for Data Processing Receipt',
        consentId: consentState.consentId || 'cst_default',
        timestamp: consentState.timestamp || new Date().toISOString(),
        version: consentState.version || '1.0',
        preferences: {
          strictlyNecessary: true,
          performanceCache: consentState.performance !== false,
          functionalLayoutMemory: consentState.functional !== false,
          edgeDiagnostics: consentState.telemetry !== false,
        },
        processor: 'Klanvision IT Solutions',
        jurisdiction: 'GDPR (EU/EEA) / CCPA / Global Edge',
      },
      null,
      2
    );

    navigator.clipboard.writeText(receiptData);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <LegalLayout
      title="Consent for Data Processing (DPA)"
      subtitle="Enterprise Data Processing Agreement, statutory GDPR/CCPA governance terms, and granular consent management center."
      activeTab="data-processing"
      lastUpdated="January 15, 2026"
    >
      <div className="space-y-10 text-neutral-700 text-sm leading-relaxed">
        {/* Compliance Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80 text-blue-950 space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
              <Shield className="size-3.5 text-blue-600" /> GDPR Art. 28
            </span>
            <p className="text-[11px] text-blue-800">Statutory Data Processing Agreement</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-emerald-950 space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
              <Lock className="size-3.5 text-emerald-600" /> AES-256 + TLS 1.3
            </span>
            <p className="text-[11px] text-emerald-800">Zero plain-text transmission</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80 text-purple-950 space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
              <Server className="size-3.5 text-purple-600" /> Edge Multi-Tenant
            </span>
            <p className="text-[11px] text-purple-800">Isolated workspace data partitions</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-amber-950 space-y-1">
            <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <CheckCircle2 className="size-3.5 text-amber-600" /> CCPA Compliant
            </span>
            <p className="text-[11px] text-amber-800">Zero data selling or broker sharing</p>
          </div>
        </div>

        {/* INTERACTIVE CONSENT MANAGEMENT CENTER (GLASSMORHPISM FORMAT) */}
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-neutral-950/75 sm:bg-neutral-900/65 text-white p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.15)] backdrop-blur-2xl backdrop-saturate-150 space-y-6">
          {/* Ambient Specular Glow Orbs */}
          <div className="pointer-events-none absolute -top-16 -left-12 size-60 bg-blue-500/15 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-12 size-60 bg-indigo-500/15 rounded-full blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-2 backdrop-blur-md">
                <FileCheck2 className="size-3.5" /> Live Consent Preference Center
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Manage Data Processing Consents
              </h2>
              <p className="text-xs sm:text-sm text-neutral-300 mt-1">
                Adjust how klanservicehub handles your workspace caching, local storage state, and diagnostics.
              </p>
            </div>

            {consentState?.consentId && (
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={handleCopyReceipt}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-200 hover:text-white border border-white/15 backdrop-blur-md text-xs font-medium transition cursor-pointer"
                  title="Copy cryptographic audit receipt"
                >
                  {copiedReceipt ? (
                    <>
                      <Check className="size-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Receipt Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5 text-neutral-400" />
                      <span>Copy Audit ID</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Consent Toggles Grid (Frosted Glass Tiles) */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Necessary */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Lock className="size-4 text-neutral-400" /> Strictly Necessary & Session Auth
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-300 bg-white/10 px-2.5 py-0.5 rounded-md border border-white/15">
                  Always Active
                </span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Encrypted JWT authentication tokens, CSRF tokens, and multi-tenant workspace isolation. Mandatory to safely execute project management workflows.
              </p>
            </div>

            {/* 2. Turbocache */}
            <div className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-blue-400/30 backdrop-blur-md space-y-2 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-blue-300 flex items-center gap-2">
                  <Zap className="size-4 text-blue-400" /> Edge Turbocache & Route Pre-warming
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={performanceConsent}
                    onChange={(e) => setPerformanceConsent(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-indigo-500 peer-checked:shadow-[0_0_12px_rgba(37,99,235,0.6)]"></div>
                </label>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Pre-warms next dashboard views during idle network cycles and hover intervals to deliver near-instantaneous page transitions with zero spinner lag.
              </p>
            </div>

            {/* 3. Layout Memory */}
            <div className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-indigo-400/30 backdrop-blur-md space-y-2 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <SlidersHorizontal className="size-4 text-indigo-400" /> Workspace Layout Memory
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={functionalConsent}
                    onChange={(e) => setFunctionalConsent(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-indigo-500 peer-checked:shadow-[0_0_12px_rgba(37,99,235,0.6)]"></div>
                </label>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Stores your table view densities, collapsed sidebar status, and active task filters locally to eliminate cumulative layout shifts (CLS).
              </p>
            </div>

            {/* 4. Diagnostics */}
            <div className="p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/10 hover:border-sky-400/30 backdrop-blur-md space-y-2 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="size-4 text-sky-400" /> Latency Diagnostics & Edge Health
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={telemetryConsent}
                    onChange={(e) => setTelemetryConsent(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5.5 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/30 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-blue-600 peer-checked:to-indigo-500 peer-checked:shadow-[0_0_12px_rgba(37,99,235,0.6)]"></div>
                </label>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Anonymous edge round-trip latency measurements to ensure Cloudflare D1 query speeds remain under 10ms.
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-neutral-300">
              {consentState?.consentId ? (
                <span>
                  Consent Active: <strong className="text-white font-mono">{consentState.consentId}</strong>
                </span>
              ) : (
                <span className="text-amber-300 flex items-center gap-1">
                  <AlertCircle className="size-3.5" /> No active consent recorded on this browser.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {consentState && (
                <button
                  onClick={handleReset}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-200 text-xs font-semibold border border-white/10 backdrop-blur-md transition cursor-pointer"
                >
                  Reset Consent
                </button>
              )}
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold border border-white/15 backdrop-blur-md transition cursor-pointer"
              >
                Accept All
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600/90 to-indigo-600/90 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold transition border border-blue-400/40 shadow-[0_0_20px_rgba(37,99,235,0.35)] backdrop-blur-md cursor-pointer flex items-center gap-1.5"
              >
                {saveSuccess ? (
                  <>
                    <Check className="size-3.5" /> Saved Successfully!
                  </>
                ) : (
                  'Save Preferences'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1: Scope & Legal Context */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            1. Scope & Legal Framework
          </h2>
          <p>
            This <strong>Data Processing Agreement (&quot;DPA&quot;)</strong> forms a binding extension to the KlanserviceHub Terms of Service between <strong>Klanvision IT Solutions</strong> (&quot;Data Processor&quot;) and the subscribing organization or user (&quot;Data Controller&quot;).
          </p>
          <p>
            This agreement satisfies the statutory mandates of Article 28 of Regulation (EU) 2016/679 (General Data Protection Regulation - <strong>GDPR</strong>), the UK Data Protection Act 2018, the California Consumer Privacy Act (<strong>CCPA</strong>), and applicable international privacy frameworks.
          </p>
        </section>

        {/* SECTION 2: Categories of Processed Data */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            2. Categories of Processed Customer Data
          </h2>
          <div className="space-y-2">
            <p><strong>A. Workspace Project Data:</strong> Kanban boards, agile sprints, user stories, task assignments, story point estimates, bug logs, and file attachments submitted to the workspace.</p>
            <p><strong>B. User Identification Data:</strong> Authorized user email addresses, full names, authentication cryptographic salts/hashes, role privilege assignments, and team groupings.</p>
            <p><strong>C. System & Audit Records:</strong> Real-time event audit logs, IP addresses, session duration, and HTTP request routing parameters.</p>
          </div>
        </section>

        {/* SECTION 3: Authorized Sub-processors */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            3. Authorized Sub-processors
          </h2>
          <p>
            The Data Controller explicitly authorizes KlanserviceHub to engage the following infrastructure sub-processors for the purpose of executing the core software service:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-neutral-200 rounded-xl overflow-hidden">
              <thead className="bg-neutral-100 text-neutral-900 font-bold">
                <tr>
                  <th className="p-3 border-b border-neutral-200">Sub-processor</th>
                  <th className="p-3 border-b border-neutral-200">Processing Purpose</th>
                  <th className="p-3 border-b border-neutral-200">Location</th>
                  <th className="p-3 border-b border-neutral-200">Safeguards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 text-neutral-700">
                <tr>
                  <td className="p-3 font-semibold text-neutral-950">Cloudflare, Inc.</td>
                  <td className="p-3">Global Edge Network, Cloudflare D1 Serverless Database, DDoS Protection</td>
                  <td className="p-3">Global Edge (300+ Cities)</td>
                  <td className="p-3">EU Standard Contractual Clauses (SCCs), ISO 27001</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-950">Appwrite Cloud / Self-Host</td>
                  <td className="p-3">User Authentication & Multi-Tenant RBAC Session Enforcement</td>
                  <td className="p-3">EU / US Regions</td>
                  <td className="p-3">AES-256 Storage Encryption, GDPR Compliant</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-neutral-950">Klanvision Cloud Infrastructure</td>
                  <td className="p-3">Centralized Platform Operations, Disaster Recovery Snapshots</td>
                  <td className="p-3">Secure Regional Data Centers</td>
                  <td className="p-3">Zero-Trust Network Architecture, Strict RBAC</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 4: Technical and Organizational Measures (TOMs) */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            4. Technical and Organizational Security Measures (TOMs)
          </h2>
          <p>
            KlanserviceHub implements and maintains comprehensive technical and physical safeguards to prevent accidental or unlawful destruction, loss, alteration, or unauthorized disclosure of Customer Data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li><strong>Cryptographic Isolation:</strong> All data transmissions are protected via Transport Layer Security (TLS 1.3). Persistent databases and attachments are encrypted at rest with AES-256.</li>
            <li><strong>Tenant Segregation:</strong> Multi-tenant workspaces are strictly isolated by workspace ID with row-level filtering and tenant-scoped session tokens.</li>
            <li><strong>Continuous Vulnerability Testing:</strong> Regular code scans, dependency vulnerability monitoring, and intrusion prevention policies.</li>
            <li><strong>Ephemeral Diagnostics:</strong> Performance telemetry is retained for no longer than 30 days and contains zero personal credentials or confidential task bodies.</li>
          </ul>
        </section>

        {/* SECTION 5: Data Subject Rights & Contact */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            5. Exercise of Data Subject Rights & Audits
          </h2>
          <p>
            Data Controllers and authorized users may exercise their rights of access, correction, export, or deletion under GDPR Articles 15-22 and CCPA at any time directly within Workspace Settings, or by submitting a formal request to our Data Protection Officer:
          </p>
          <div className="p-4 rounded-2xl bg-neutral-100 text-neutral-800 text-xs space-y-1">
            <p><strong>Data Protection Officer:</strong> privacy@klanservicehub.dev</p>
            <p><strong>Legal & Compliance Desk:</strong> legal@klanvision.com</p>
            <p><strong>Operator:</strong> Klanvision IT Solutions</p>
          </div>
        </section>
      </div>
    </LegalLayout>
  );
};

export default DataProcessingPage;
