import React from 'react';
import { LegalLayout } from './legal-layout';
import { Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export const TermsPage = () => {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="The customer terms and conditions governing access to and use of klanservicehub cloud services, workspaces, and agile developer modules."
      activeTab="terms"
      lastUpdated="January 15, 2026"
    >
      <div className="space-y-8 text-neutral-700 text-sm leading-relaxed">
        {/* 1. Acceptance */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            1. Acceptance of Terms & Service Scope
          </h2>
          <p>
            These Customer Terms of Service ("Agreement") are entered into by and between <strong>klanservicehub</strong> ("we", "us", or "our") and the entity or individual agreeing to these terms ("Customer", "you", or "your").
          </p>
          <p>
            By accessing or using klanservicehub, creating an organization workspace, configuring KlanserviceHub-grade boards, sprints, or service desks, or clicking "I agree", you agree to be legally bound by this Agreement.
          </p>
        </section>

        {/* 2. Workspace Administration & Roles */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            2. Workspace Administration, RBAC & Delivery Governance
          </h2>
          <p>
            Customer is responsible for designating administrators who manage access permissions, invite squad members, and assign project roles.
          </p>
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-blue-900 space-y-2 text-xs">
            <p className="font-bold flex items-center gap-1.5 text-blue-950">
              <Shield className="size-4 text-blue-600" /> Delivery Governance Rule
            </p>
            <p>
              To maintain audit compliance and QA verification integrity across engineering workflows, issue and task transitions to the <strong>"Done"</strong> status are strictly restricted to Workspace Administrators and Project Leads.
            </p>
          </div>
        </section>

        {/* 3. Customer Data & Intellectual Property */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            3. Customer Data & Intellectual Property Ownership
          </h2>
          <p>
            As between the parties, Customer retains all right, title, and interest (including all intellectual property rights) in and to Customer Data submitted into the Service (including tasks, descriptions, sprint logs, attachments, and comments).
          </p>
          <p>
            klanservicehub and its licensors retain all right, title, and interest in and to the platform architecture, software components, user interface designs, and documentation.
          </p>
        </section>

        {/* 4. Service Level & Uptime */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            4. High Availability & Service Level Agreement (SLA)
          </h2>
          <p>
            We strive to provide 99.9% uptime for cloud-hosted workspaces. System maintenance windows are communicated in advance. Real-time sub-10ms query execution is guaranteed through distributed Cloudflare edge caching and SQLite replication.
          </p>
        </section>

        {/* 5. Subscriptions, Fees & Billing */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            5. Subscriptions, Billing & Seat Allocation
          </h2>
          <p>
            Certain features of the Service are provided under paid subscription tiers (e.g., Enterprise Scale, JSM Pro). Subscriptions renew automatically unless cancelled prior to the renewal date. All payments are non-refundable except where required by law.
          </p>
        </section>

        {/* 6. Limitation of Liability */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-neutral-950 pb-2 border-b border-neutral-100">
            6. Limitation of Liability & Warranties
          </h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE". NEITHER PARTY WILL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES ARISING OUT OF THIS AGREEMENT.
          </p>
        </section>

        {/* 7. Contact */}
        <section className="space-y-2 pt-4 border-t border-neutral-100 text-xs text-neutral-500">
          <p>
            For legal inquiries, contact: <strong>legal@klanservicehub.dev</strong>
          </p>
        </section>
      </div>
    </LegalLayout>
  );
};
