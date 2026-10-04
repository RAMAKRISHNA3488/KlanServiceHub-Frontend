import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { apiFetch } from '@/lib/api-client';
import { CrossProjectDependencyGraph } from '@/features/dependencies/components/cross-project-dependency-graph';
import {
  GitFork,
  Activity,
  ShieldCheck,
  LifeBuoy,
  Server,
  Rocket,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  TrendingUp,
  Cpu,
  BarChart2,
  Users,
} from 'lucide-react';

// ==========================================
// 1. Cross-Project Dependencies View
// ==========================================
export const DependenciesView = () => {
  return <CrossProjectDependencyGraph />;
};

// ==========================================
// 2. Capacity & Team Workload View
// ==========================================
export const CapacityView = () => {
  const workspaceId = useWorkspaceId();
  const { data, isLoading } = useQuery({
    queryKey: ['team-workload', workspaceId],
    queryFn: () => apiFetch(`/api/capacity/workload/${workspaceId}`),
  });

  const workloads = data?.data || [];

  return (
    <div className="flex flex-col gap-y-5 p-6">
      <div className="border-b pb-3">
        <h1 className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-2">
          <Activity className="size-5 text-emerald-600" /> Capacity Planning & Workload Engine
        </h1>
        <p className="text-[11px] text-neutral-500">
          Compute weekly team utilization, story points allocation, and overload indicators.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-xs">
        <h2 className="text-xs font-bold text-neutral-900 mb-3">Member Workload & Utilization</h2>
        {isLoading ? (
          <div className="py-6 text-center text-xs text-neutral-500">Calculating workload metrics...</div>
        ) : workloads.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500">No active members found.</div>
        ) : (
          <div className="divide-y text-xs">
            {workloads.map((w) => (
              <div key={w.userId} className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-neutral-900 text-xs">{w.name}</p>
                  <p className="text-[11px] text-neutral-500">{w.email}</p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-500">Assigned Work</p>
                    <p className="font-semibold text-neutral-900 text-xs">{w.assignedTasksCount} tasks ({w.totalStoryPoints} pts)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-neutral-500">Capacity</p>
                    <p className="font-semibold text-neutral-900 text-xs">{w.capacityHours}h / wk</p>
                  </div>
                  <div className="w-24 text-right">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${w.isOverloaded ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {w.utilizationPercentage}% util
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
// ==========================================
// 3. Project Governance, Health & Risks View
// ==========================================
export const GovernanceView = () => {
  const workspaceId = useWorkspaceId();
  const { data: approvalsData } = useQuery({
    queryKey: ['governance-approvals', workspaceId],
    queryFn: () => apiFetch(`/api/governance/approvals/${workspaceId}`),
  });

  const approvals = approvalsData?.data || [];

  return (
    <div className="flex flex-col gap-y-5 p-6">
      <div className="border-b pb-3">
        <h1 className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-2">
          <ShieldCheck className="size-5 text-purple-600" /> Project Governance & Approval Engine
        </h1>
        <p className="text-[11px] text-neutral-500">
          Enforce change approval workflows, project health scores, and risk mitigations.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-xs">
        <h2 className="text-xs font-bold text-neutral-900 mb-3">Pending & Historical Change Approvals</h2>
        {approvals.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500">No approval requests submitted.</div>
        ) : (
          <div className="divide-y text-xs">
            {approvals.map((a) => (
              <div key={a.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-neutral-900 text-xs">{a.resource_type}</p>
                  <p className="text-[11px] text-neutral-500">Requested by: {a.requester_name || 'Member'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${a.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import { ServiceManagementView as KsmServiceManagementView } from '@/features/service-management/components/service-management-view';

// ==========================================
// 4. klanservicehub Service Management (KSM) View
// ==========================================
export const ServiceManagementView = () => {
  return <KsmServiceManagementView />;
};

// ==========================================
// 5. CMDB Assets & Infrastructure View
// ==========================================
export const AssetsView = () => {
  const workspaceId = useWorkspaceId();
  const { data } = useQuery({
    queryKey: ['cmdb-assets', workspaceId],
    queryFn: () => apiFetch(`/api/assets/${workspaceId}`),
  });

  const assets = data?.data || [];

  return (
    <div className="flex flex-col gap-y-5 p-6">
      <div className="border-b pb-3">
        <h1 className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-2">
          <Server className="size-5 text-indigo-600" /> CMDB Assets & Infrastructure Topology
        </h1>
        <p className="text-[11px] text-neutral-500">
          Configuration items, servers, databases, and microservices topology.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-xs">
        <h2 className="text-xs font-bold text-neutral-900 mb-3">Registered Configuration Items</h2>
        {assets.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500">No CMDB assets registered.</div>
        ) : (
          <div className="divide-y text-xs">
            {assets.map((a) => (
              <div key={a.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-neutral-900 text-xs">{a.name}</p>
                  <p className="text-[11px] text-neutral-500">{a.type} • {a.environment} • {a.location}</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 6. Deployments & DORA Metrics View
// ==========================================
export const DeploymentsView = () => {
  const workspaceId = useWorkspaceId();
  const { data } = useQuery({
    queryKey: ['dora-metrics', workspaceId],
    queryFn: () => apiFetch(`/api/deployments/dora/${workspaceId}`),
  });

  const metrics = data?.data || {
    deploymentFrequency: '0 deploys / month',
    leadTimeForChanges: 'N/A',
    changeFailureRate: '0%',
    meanTimeToRecovery: 'N/A',
    doraRating: 'HIGH',
  };

  return (
    <div className="flex flex-col gap-y-5 p-6">
      <div className="border-b pb-3">
        <h1 className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-2">
          <Rocket className="size-5 text-rose-600" /> Deployments & DORA Engineering Metrics
        </h1>
        <p className="text-[11px] text-neutral-500">
          Continuous delivery frequency, lead time for changes, and MTTR reliability scoring.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border bg-white shadow-xs">
          <p className="text-[11px] font-medium text-neutral-500">Deployment Frequency</p>
          <p className="text-lg font-bold text-neutral-900 mt-1">{metrics.deploymentFrequency}</p>
        </div>
        <div className="p-3.5 rounded-xl border bg-white shadow-xs">
          <p className="text-[11px] font-medium text-neutral-500">Lead Time for Changes</p>
          <p className="text-lg font-bold text-neutral-900 mt-1">{metrics.leadTimeForChanges}</p>
        </div>
        <div className="p-3.5 rounded-xl border bg-white shadow-xs">
          <p className="text-[11px] font-medium text-neutral-500">Change Failure Rate</p>
          <p className="text-lg font-bold text-neutral-900 mt-1">{metrics.changeFailureRate}</p>
        </div>
        <div className="p-3.5 rounded-xl border bg-white shadow-xs">
          <p className="text-[11px] font-medium text-neutral-500">DORA Rating</p>
          <p className="text-lg font-bold text-emerald-600 mt-1">{metrics.doraRating}</p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 7. Portfolio, Initiatives & Goals View
// ==========================================
export const PortfoliosView = () => {
  const workspaceId = useWorkspaceId();
  const { data: portfoliosData } = useQuery({
    queryKey: ['portfolios', workspaceId],
    queryFn: () => apiFetch(`/api/portfolio/${workspaceId}`),
  });
  const { data: initiativesData } = useQuery({
    queryKey: ['initiatives', workspaceId],
    queryFn: () => apiFetch(`/api/portfolio/${workspaceId}/initiatives`),
  });

  const portfolios = portfoliosData?.data || [];
  const initiatives = initiativesData?.data || [];

  return (
    <div className="flex flex-col gap-y-5 p-6">
      <div className="border-b pb-3">
        <h1 className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-2">
          <Layers className="size-5 text-amber-600" /> Strategic Portfolio & Initiatives
        </h1>
        <p className="text-[11px] text-neutral-500">
          Executive portfolio tracking aligning company OKRs to multi-project initiatives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-xs">
          <h2 className="text-xs font-bold text-neutral-900 mb-3">Enterprise Portfolios</h2>
          {portfolios.length === 0 ? (
            <div className="py-5 text-center text-xs text-neutral-500">No portfolios created.</div>
          ) : (
            <div className="divide-y text-xs">
              {portfolios.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <span className="font-semibold text-neutral-900 text-xs">{p.name}</span>
                  <span className="text-[11px] text-neutral-500">{p.owner_name || 'Owner'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-xs">
          <h2 className="text-xs font-bold text-neutral-900 mb-3">Active Strategic Initiatives</h2>
          {initiatives.length === 0 ? (
            <div className="py-5 text-center text-xs text-neutral-500">No initiatives created.</div>
          ) : (
            <div className="divide-y text-xs">
              {initiatives.map((i) => (
                <div key={i.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-neutral-900 text-xs">{i.name}</p>
                    <p className="text-[11px] text-neutral-500">{i.description || 'Target: 2026'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[10px]">
                    {i.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
