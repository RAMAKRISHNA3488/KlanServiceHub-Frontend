import React from 'react';
import { LegalLayout } from './legal-layout';
import { Lock, Shield, Eye, Database, Globe, CheckCircle2 } from 'lucide-react';

export const PrivacyPage = () => {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How klanservicehub collects, safeguards, uses, and respects enterprise user information and workspace project telemetry."
      activeTab="privacy"
      lastUpdated="January 15, 2026"
    >
      <div className="space-y-8 text-neutral-700 text-sm leading-relaxed">
        {/* 1. Overview */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            1. Privacy Commitment & Scope
          </h2>
          <p>
            At <strong>klanservicehub</strong>, we build enterprise-grade project tracking and service desk tooling with security and privacy by design. This Privacy Policy details the data collected across our applications, web portal, APIs, and collaborative workspaces.
          </p>
        </section>

        {/* 2. Information Collected */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            2. Information We Collect
          </h2>
          <div className="space-y-2">
            <p><strong>A. Account & Profile Data:</strong> Name, work email address, hashed credentials, avatar image, workspace memberships, and organizational role assignments.</p>
            <p><strong>B. Customer Content:</strong> Epics, user stories, kanban cards, sprint backlogs, CMDB asset logs, audit history, and uploaded attachments.</p>
            <p><strong>C. Authentication & Security Telemetry:</strong> Login timestamps, IP addresses, session tokens, OTP verification events, and role privilege elevation logs.</p>
          </div>
        </section>

        {/* 3. How We Use Data */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            3. How We Use Your Information
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>To operate, maintain, and provision isolated multi-tenant company workspaces.</li>
            <li>To enforce role-based access control (RBAC) and prevent unauthorized status transitions.</li>
            <li>To deliver email one-time passwords (OTP) and system notification alerts.</li>
            <li>To detect and remediate security threats, fraud, or system abuse.</li>
          </ul>
        </section>

        {/* 4. Data Protection & Encryption */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            4. Data Protection & Encryption Standards
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-xs text-emerald-900">
                <Lock className="size-3.5 text-emerald-600" /> Encryption in Transit
              </p>
              <p className="text-xs text-emerald-800">
                100% of API requests, WebSocket events, and web views use TLS 1.3 encryption with strict HTTPS enforcement.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-950 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-xs text-blue-900">
                <Database className="size-3.5 text-blue-600" /> Encryption at Rest
              </p>
              <p className="text-xs text-blue-800">
                Customer databases, backup snapshots, and asset attachments are encrypted using AES-256 standard keys.
              </p>
            </div>
          </div>
        </section>

        {/* 5. International Compliance (GDPR & CCPA) */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            5. GDPR, CCPA & Data Subject Rights
          </h2>
          <p>
            Users located in the European Economic Area (EEA), United Kingdom, and California enjoy specific statutory rights regarding their personal data, including the right to access, rectify, export, or delete their profile information at any time via Workspace Settings.
          </p>
        </section>

        {/* 6. Contact */}
        <section className="space-y-2 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
          <p>
            Data Protection Officer: <strong>privacy@klanservicehub.dev</strong> | Developed & Maintained by: <strong>Ramakrishna (RK)</strong>
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};
