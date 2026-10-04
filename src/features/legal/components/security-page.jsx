import React from 'react';
import { LegalLayout } from './legal-layout';
import { Shield, Lock, Cpu, Server, CheckCircle2, FileCheck, Key, Zap } from 'lucide-react';

export const SecurityPage = () => {
  return (
    <LegalLayout
      title="Security & Trust Center"
      subtitle="Enterprise security controls, architecture governance, encryption protocols, and vulnerability management at klanservicehub."
      activeTab="security"
      lastUpdated="January 15, 2026"
    >
      <div className="space-y-8 text-neutral-700 text-sm leading-relaxed">
        {/* 1. Security Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            1. Enterprise Security Architecture
          </h2>
          <p>
            klanservicehub is architected with defense-in-depth security principles. Our multi-tenant infrastructure isolates company data, workspaces, team members, and audit streams to guarantee enterprise confidentiality.
          </p>
        </section>

        {/* 2. Key Security Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="size-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Shield className="size-4" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">Fine-Grained RBAC Governance</h3>
            <p className="text-xs text-neutral-600">
              72+ granular permissions spanning 8 distinct organizational roles prevent unauthorized project alterations and access creep.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="size-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Key className="size-4" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">Secure Authentication & OTP</h3>
            <p className="text-xs text-neutral-600">
              Cryptographically random time-based email OTPs, social SSO OAuth integrations, and bcrypt password hashing.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="size-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <Server className="size-4" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">Cloudflare D1 Distributed Edge</h3>
            <p className="text-xs text-neutral-600">
              Sub-10ms query execution with real-time replication, automated snapshots, and DDoS mitigation protection.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
            <div className="size-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <FileCheck className="size-4" />
            </div>
            <h3 className="font-bold text-neutral-900 text-sm">Immutable Audit Logs</h3>
            <p className="text-xs text-neutral-600">
              Every status change, permission elevation, and project deletion is permanently timestamped and logged for compliance auditing.
            </p>
          </div>
        </div>

        {/* 3. Vulnerability Disclosure */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            2. Responsible Vulnerability Disclosure
          </h2>
          <p>
            We welcome responsible security disclosures from independent researchers. If you discover a vulnerability or security anomaly in klanservicehub, please notify our security engineering team immediately.
          </p>
          <div className="p-4 rounded-2xl bg-neutral-900 text-neutral-300 text-xs font-mono space-y-1">
            <p className="text-emerald-400 font-bold">Security Reporting Channel:</p>
            <p>Email: security@klanservicehub.dev</p>
            <p>PGP Key Fingerprint: 4A89 F012 3349 98BC RK_KLAN_SEC</p>
          </div>
        </section>

        {/* 4. Contact */}
        <section className="space-y-2 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
          <p>
            Security Operations & Platform Architect: <strong>Ramakrishna (RK)</strong>
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};
