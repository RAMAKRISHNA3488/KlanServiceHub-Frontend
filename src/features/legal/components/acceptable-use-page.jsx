import React from 'react';
import { LegalLayout } from './legal-layout';
import { AlertOctagon, CheckCircle2, ShieldAlert, Ban, Zap } from 'lucide-react';

export const AcceptableUsePage = () => {
  return (
    <LegalLayout
      title="Acceptable Use Policy"
      subtitle="Operational rules, community guidelines, and prohibited activities across klanservicehub enterprise workspaces."
      activeTab="acceptable-use"
      lastUpdated="January 15, 2026"
    >
      <div className="space-y-8 text-neutral-700 text-sm leading-relaxed">
        {/* 1. Purpose */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            1. Purpose & Standards
          </h2>
          <p>
            This Acceptable Use Policy ("AUP") defines rules of conduct for using klanservicehub services, APIs, task boards, and communication tools. We require all users and organizations to maintain high ethical and operational standards.
          </p>
        </section>

        {/* 2. Prohibited Activities */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            2. Strictly Prohibited Activities
          </h2>
          <div className="space-y-2">
            <div className="flex items-start gap-2.5">
              <Ban className="size-4 text-red-500 shrink-0 mt-0.5" />
              <span><strong>Malicious Code & Exploits:</strong> Uploading or transmitting viruses, worms, Trojan horses, ransomware, or payloads designed to compromise server infrastructure.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Ban className="size-4 text-red-500 shrink-0 mt-0.5" />
              <span><strong>System Abuse & Load Flooding:</strong> Excessive scraping, volumetric denial of service (DoS) attempts, or automated API hammering outside documented rate limits.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Ban className="size-4 text-red-500 shrink-0 mt-0.5" />
              <span><strong>Unauthorized Privilege Escalation:</strong> Bypassing RBAC governance rules or manipulating tokens to gain illicit administrative access.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Ban className="size-4 text-red-500 shrink-0 mt-0.5" />
              <span><strong>Spam & Deceptive Phishing:</strong> Using invitation systems or email OTP dispatchers for unauthorized commercial spam or fraudulent credential harvesting.</span>
            </div>
          </div>
        </section>

        {/* 3. Enforcement & Remediation */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            3. Monitoring, Suspension & Enforcement
          </h2>
          <p>
            klanservicehub reserves the right to suspend or terminate accounts or workspaces found in breach of this policy to protect the stability and integrity of other tenant instances.
          </p>
        </section>

        {/* 4. Contact */}
        <section className="space-y-2 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
          <p>
            To report policy violations, contact: <strong>abuse@klanservicehub.dev</strong> | Architect: <strong>Ramakrishna (RK)</strong>
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};
