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
import { GovernanceView as FullGovernanceView } from '@/features/governance/components/governance-view';

// ==========================================
// 3. Project Governance, Health & Risks View
// ==========================================
export const GovernanceView = () => {
  return <FullGovernanceView />;
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
import { CmdbView } from '@/features/cmdb/components/cmdb-view';
export const AssetsView = () => {
  return <CmdbView />;
};

// ==========================================
// 6. Deployments & DORA Metrics View
// ==========================================
import { DeploymentsView as EnterpriseDeploymentsView } from '@/features/deployments/components/deployments-view';
export const DeploymentsView = () => {
  return <EnterpriseDeploymentsView />;
};

// ==========================================
// 7. Portfolio, Initiatives & Goals View
// ==========================================
import { PortfoliosView as EnterprisePortfoliosView } from '@/features/portfolio/components/portfolio-view';
export const PortfoliosView = () => {
  return <EnterprisePortfoliosView />;
};
