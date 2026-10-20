import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Filter,
  Layers,
  Calendar,
  FileText,
  User,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Trash2,
  Activity,
  Check,
  X,
  RefreshCw,
  FolderKanban,
  Flag,
} from 'lucide-react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useCurrent } from '@/features/auth/api/use-current';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { governanceApi } from '@/lib/api-client';

export const GovernanceView = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrent();
  const { data: projectsData } = useGetProjects({ workspaceId });
  const { data: membersData } = useGetMembers({ workspaceId });

  const projects = projectsData?.documents || [];
  const members = membersData?.documents || [];

  const currentMember = members.find(
    (m) => m.userId === currentUser?.$id || m.userId === currentUser?.id || m.user_id === currentUser?.$id
  );
  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentMember?.role === 'ADMIN' ||
    currentMember?.role === 'OWNER' ||
    currentUser?.isOwner;

  // Active Project Selection & Active Tab State
  const [selectedProjectId, setSelectedProjectId] = useState('ALL');
  const [activeTab, setActiveTab] = useState('approvals'); // approvals | risks | decisions | milestones

  // Filter states
  const [approvalStatusFilter, setApprovalStatusFilter] = useState('ALL');
  const [approvalTypeFilter, setApprovalTypeFilter] = useState('ALL');

  // Modals
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [riskModalOpen, setRiskModalOpen] = useState(false);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [verdictModalData, setVerdictModalData] = useState(null); // { id, status, notes }

  // Forms
  const [approvalForm, setApprovalForm] = useState({
    title: '',
    resourceType: 'Production Release Sign-off',
    resourceId: '',
    reason: '',
    urgency: 'HIGH',
    projectId: '',
  });

  const [riskForm, setRiskForm] = useState({
    title: '',
    description: '',
    probability: 'MEDIUM',
    impact: 'MEDIUM',
    mitigation: '',
    dueDate: '',
    projectId: '',
  });

  const [decisionForm, setDecisionForm] = useState({
    title: '',
    decision: '',
    reason: '',
    description: '',
    projectId: '',
  });

  const [milestoneForm, setMilestoneForm] = useState({
    name: '',
    description: '',
    targetDate: '',
    status: 'PLANNED',
    projectId: '',
  });

  // Queries
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['governance-health', workspaceId, selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId === 'ALL') {
        const res = await governanceApi.getWorkspaceHealth(workspaceId).catch(() => null);
        return res?.data || null;
      }
      const res = await governanceApi.getHealth(selectedProjectId).catch(() => null);
      return res?.data || null;
    },
    enabled: !!workspaceId,
  });

  const { data: approvalsData, isLoading: approvalsLoading, refetch: refetchApprovals } = useQuery({
    queryKey: ['governance-approvals', workspaceId, selectedProjectId],
    queryFn: async () => {
      const res = await governanceApi.getApprovals(workspaceId, selectedProjectId);
      return res?.data || [];
    },
    enabled: !!workspaceId,
  });

  const { data: risksData, isLoading: risksLoading, refetch: refetchRisks } = useQuery({
    queryKey: ['governance-risks', workspaceId, selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId === 'ALL') {
        if (projects.length === 0) return [];
        const allRisks = await Promise.all(
          projects.map((p) => governanceApi.getRisks(p.$id || p.id).catch(() => ({ data: [] })))
        );
        return allRisks.flatMap((r) => r.data || []);
      }
      const res = await governanceApi.getRisks(selectedProjectId);
      return res?.data || [];
    },
    enabled: !!workspaceId,
  });

  const { data: decisionsData, isLoading: decisionsLoading, refetch: refetchDecisions } = useQuery({
    queryKey: ['governance-decisions', workspaceId, selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId === 'ALL') {
        if (projects.length === 0) return [];
        const allDecs = await Promise.all(
          projects.map((p) => governanceApi.getDecisions(p.$id || p.id).catch(() => ({ data: [] })))
        );
        return allDecs.flatMap((d) => d.data || []);
      }
      const res = await governanceApi.getDecisions(selectedProjectId);
      return res?.data || [];
    },
    enabled: !!workspaceId,
  });

  const { data: milestonesData, isLoading: milestonesLoading, refetch: refetchMilestones } = useQuery({
    queryKey: ['governance-milestones', workspaceId, selectedProjectId],
    queryFn: async () => {
      if (selectedProjectId === 'ALL') {
        if (projects.length === 0) return [];
        const allMils = await Promise.all(
          projects.map((p) => governanceApi.getMilestones(p.$id || p.id).catch(() => ({ data: [] })))
        );
        return allMils.flatMap((m) => m.data || []);
      }
      const res = await governanceApi.getMilestones(selectedProjectId);
      return res?.data || [];
    },
    enabled: !!workspaceId,
  });

  const approvals = approvalsData || [];
  const risks = risksData || [];
  const decisions = decisionsData || [];
  const milestones = milestonesData || [];

  const refetchAll = () => {
    refetchHealth();
    refetchApprovals();
    refetchRisks();
    refetchDecisions();
    refetchMilestones();
    toast.success('Governance telemetry refreshed');
  };

  // Actions
  const handleDecideApproval = async (approvalId, status, notes = '') => {
    try {
      await governanceApi.decideApproval(approvalId, status, notes);
      toast.success(`Approval request marked as ${status}`);
      refetchApprovals();
      refetchHealth();
      setVerdictModalData(null);
    } catch (err) {
      toast.error(err.message || 'Failed to update approval status');
    }
  };

  const handleDeleteApproval = async (approvalId) => {
    try {
      await governanceApi.deleteApproval(approvalId);
      toast.success('Approval request deleted');
      refetchApprovals();
      refetchHealth();
    } catch (err) {
      toast.error(err.message || 'Failed to delete approval');
    }
  };

  const handleCreateApproval = async (e) => {
    e.preventDefault();
    if (!approvalForm.resourceType || !approvalForm.resourceId || !approvalForm.reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    const targetProject = approvalForm.projectId || (selectedProjectId !== 'ALL' ? selectedProjectId : projects[0]?.$id || projects[0]?.id);
    try {
      await governanceApi.createApproval(workspaceId, {
        title: approvalForm.title || `${approvalForm.resourceType} for ${approvalForm.resourceId}`,
        resourceType: approvalForm.resourceType,
        resourceId: approvalForm.resourceId,
        reason: approvalForm.reason,
        projectId: targetProject,
        urgency: approvalForm.urgency,
      });
      toast.success('Change approval request submitted successfully');
      setApprovalModalOpen(false);
      setApprovalForm({
        title: '',
        resourceType: 'Production Release Sign-off',
        resourceId: '',
        reason: '',
        urgency: 'HIGH',
        projectId: '',
      });
      refetchApprovals();
      refetchHealth();
    } catch (err) {
      toast.error(err.message || 'Failed to submit approval request');
    }
  };

  const handleCreateRisk = async (e) => {
    e.preventDefault();
    if (!riskForm.title) {
      toast.error('Risk title is required');
      return;
    }
    const targetProject = riskForm.projectId || (selectedProjectId !== 'ALL' ? selectedProjectId : projects[0]?.$id || projects[0]?.id);
    if (!targetProject) {
      toast.error('Please create or select a project first');
      return;
    }
    try {
      await governanceApi.createRisk(targetProject, riskForm);
      toast.success('Risk logged in register');
      setRiskModalOpen(false);
      setRiskForm({
        title: '',
        description: '',
        probability: 'MEDIUM',
        impact: 'MEDIUM',
        mitigation: '',
        dueDate: '',
        projectId: '',
      });
      refetchRisks();
      refetchHealth();
    } catch (err) {
      toast.error(err.message || 'Failed to log risk');
    }
  };

  const handleUpdateRiskStatus = async (riskId, newStatus) => {
    try {
      await governanceApi.updateRisk(riskId, { status: newStatus });
      toast.success(`Risk status updated to ${newStatus}`);
      refetchRisks();
      refetchHealth();
    } catch (err) {
      toast.error(err.message || 'Failed to update risk');
    }
  };

  const handleDeleteRisk = async (riskId) => {
    try {
      await governanceApi.deleteRisk(riskId);
      toast.success('Risk item removed');
      refetchRisks();
      refetchHealth();
    } catch (err) {
      toast.error(err.message || 'Failed to delete risk');
    }
  };

  const handleCreateDecision = async (e) => {
    e.preventDefault();
    if (!decisionForm.title || !decisionForm.decision) {
      toast.error('Title and decision statement are required');
      return;
    }
    const targetProject = decisionForm.projectId || (selectedProjectId !== 'ALL' ? selectedProjectId : projects[0]?.$id || projects[0]?.id);
    if (!targetProject) {
      toast.error('Please create or select a project first');
      return;
    }
    try {
      await governanceApi.createDecision(targetProject, decisionForm);
      toast.success('Architecture decision recorded');
      setDecisionModalOpen(false);
      setDecisionForm({
        title: '',
        decision: '',
        reason: '',
        description: '',
        projectId: '',
      });
      refetchDecisions();
    } catch (err) {
      toast.error(err.message || 'Failed to record decision');
    }
  };

  const handleDeleteDecision = async (decisionId) => {
    try {
      await governanceApi.deleteDecision(decisionId);
      toast.success('Decision removed');
      refetchDecisions();
    } catch (err) {
      toast.error(err.message || 'Failed to delete decision');
    }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!milestoneForm.name || !milestoneForm.targetDate) {
      toast.error('Milestone name and target date are required');
      return;
    }
    const targetProject = milestoneForm.projectId || (selectedProjectId !== 'ALL' ? selectedProjectId : projects[0]?.$id || projects[0]?.id);
    if (!targetProject) {
      toast.error('Please create or select a project first');
      return;
    }
    try {
      await governanceApi.createMilestone(targetProject, milestoneForm);
      toast.success('Milestone created');
      setMilestoneModalOpen(false);
      setMilestoneForm({
        name: '',
        description: '',
        targetDate: '',
        status: 'PLANNED',
        projectId: '',
      });
      refetchMilestones();
    } catch (err) {
      toast.error(err.message || 'Failed to create milestone');
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId, newStatus) => {
    try {
      await governanceApi.updateMilestone(milestoneId, { status: newStatus });
      toast.success(`Milestone updated to ${newStatus}`);
      refetchMilestones();
    } catch (err) {
      toast.error(err.message || 'Failed to update milestone');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    try {
      await governanceApi.deleteMilestone(milestoneId);
      toast.success('Milestone removed');
      refetchMilestones();
    } catch (err) {
      toast.error(err.message || 'Failed to delete milestone');
    }
  };

  // Filtered Approvals
  const filteredApprovals = approvals.filter((a) => {
    if (approvalStatusFilter !== 'ALL' && a.status !== approvalStatusFilter) return false;
    if (approvalTypeFilter !== 'ALL' && a.resource_type !== approvalTypeFilter) return false;
    return true;
  });

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;
  const openRisksCount = risks.filter((r) => r.status === 'OPEN').length;

  const healthScore = healthData?.overallHealth || 'GREEN';
  const completionRate = healthData?.completionRate ?? 100;
  const criticalBugs = healthData?.criticalBugs ?? 0;

  return (
    <div className="flex flex-col gap-y-5 max-w-7xl mx-auto pb-16 p-3 sm:p-6 transition-all">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-neutral-200 pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-1.5 sm:gap-2">
              <ShieldCheck className="size-4 sm:size-5 text-purple-600 shrink-0" />
              <span>Project Governance & Approval Engine</span>
            </h1>
            <span className="rounded bg-purple-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-purple-700 shrink-0">
              ENTERPRISE GATEKEEPING
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5">
            Enforce change approval workflows, project health telemetry, risk mitigations, and Architecture Decision Records (ADRs).
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => setApprovalModalOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 rounded-lg bg-purple-600 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition"
          >
            <Plus className="size-3 sm:size-3.5" />
            <span>Request Approval</span>
          </button>

          <button
            onClick={() => setRiskModalOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-amber-300 bg-amber-50/70 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-amber-800 shadow-xs hover:bg-amber-100 transition"
          >
            <AlertTriangle className="size-3 sm:size-3.5 text-amber-600" />
            <span>Log Risk</span>
          </button>

          <button
            onClick={refetchAll}
            className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-neutral-300 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
            title="Refresh Governance Telemetry"
          >
            <RefreshCw className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Project Selector Pills */}
      {projects.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
            <Layers className="size-3 sm:size-3.5 text-neutral-500" />
            <span>Scope:</span>
          </span>
          <button
            onClick={() => setSelectedProjectId('ALL')}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedProjectId === 'ALL'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
            }`}
          >
            All Workspace Projects
          </button>
          {projects.map((p) => {
            const pId = p.$id || p.id;
            const isSelected = selectedProjectId === pId;
            return (
              <button
                key={pId}
                onClick={() => setSelectedProjectId(pId)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                }`}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: isSelected ? '#ffffff' : '#9333EA' }} />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Executive Telemetry Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Health Score */}
        <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-xs space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Project Health
            </span>
            <div className="flex items-center gap-1">
              <span
                className={`size-2 sm:size-2.5 rounded-full animate-pulse ${
                  healthScore === 'GREEN'
                    ? 'bg-emerald-500'
                    : healthScore === 'AMBER'
                    ? 'bg-amber-500'
                    : 'bg-red-500'
                }`}
              />
              <span
                className={`text-[10px] sm:text-xs font-black uppercase ${
                  healthScore === 'GREEN'
                    ? 'text-emerald-700'
                    : healthScore === 'AMBER'
                    ? 'text-amber-700'
                    : 'text-red-700'
                }`}
              >
                {healthScore}
              </span>
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-neutral-900">
            {healthScore === 'GREEN' ? 'Healthy' : healthScore === 'AMBER' ? 'Warning' : 'Critical'}
          </div>
          <p className="text-[9.5px] sm:text-[10.5px] text-neutral-500 truncate">
            {healthData?.reasons?.[0] || 'All delivery milestones on schedule'}
          </p>
        </div>

        {/* Delivery Completion Rate */}
        <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-xs space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Completion Rate
            </span>
            <TrendingUp className="size-3.5 sm:size-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-neutral-900">
            {completionRate}%
          </div>
          <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* Critical Blockers */}
        <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-xs space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Critical Bugs
            </span>
            <span className="px-1.5 py-0.5 rounded bg-red-50 text-[9px] font-bold text-red-700">P0 BLOCKERS</span>
          </div>
          <div className={`text-lg sm:text-2xl font-black ${criticalBugs > 0 ? 'text-red-600' : 'text-neutral-900'}`}>
            {criticalBugs}
          </div>
          <p className="text-[9.5px] sm:text-[10.5px] text-neutral-500">
            {criticalBugs === 0 ? 'Zero critical impediments' : 'Requires immediate triage'}
          </p>
        </div>

        {/* Pending Approvals */}
        <div className="rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 shadow-xs space-y-1 sm:space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              Pending Approvals
            </span>
            <Clock className="size-3.5 sm:size-4 text-purple-600" />
          </div>
          <div className={`text-lg sm:text-2xl font-black ${pendingApprovalsCount > 0 ? 'text-purple-700' : 'text-neutral-900'}`}>
            {pendingApprovalsCount}
          </div>
          <p className="text-[9.5px] sm:text-[10.5px] text-neutral-500">
            {pendingApprovalsCount === 0 ? 'All changes approved' : 'Awaiting sign-off verdict'}
          </p>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-1 border-b border-neutral-200 pb-0 overflow-x-auto scrollbar-none text-[11px] sm:text-xs font-semibold">
        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'approvals'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <ShieldCheck className="size-3.5 sm:size-4" />
          <span>Change Approvals</span>
          {pendingApprovalsCount > 0 && (
            <span className="size-4 rounded-full bg-purple-600 text-white text-[9px] flex items-center justify-center font-bold">
              {pendingApprovalsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('risks')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'risks'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <AlertTriangle className="size-3.5 sm:size-4" />
          <span>Risk Register & Matrix</span>
          {openRisksCount > 0 && (
            <span className="size-4 rounded-full bg-amber-500 text-white text-[9px] flex items-center justify-center font-bold">
              {openRisksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'decisions'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <FileText className="size-3.5 sm:size-4" />
          <span>Architecture Decisions (ADRs)</span>
          <span className="text-[10px] text-neutral-400">({decisions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
            activeTab === 'milestones'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-neutral-600 hover:text-neutral-900'
          }`}
        >
          <Calendar className="size-3.5 sm:size-4" />
          <span>Milestones & Stage Gates</span>
          <span className="text-[10px] text-neutral-400">({milestones.length})</span>
        </button>
      </div>

      {/* ==================================================== */}
      {/* TAB 1: CHANGE APPROVALS ENGINE */}
      {/* ==================================================== */}
      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-50 p-2.5 rounded-xl border border-neutral-200 text-xs">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mr-1">Status:</span>
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setApprovalStatusFilter(st)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                    approvalStatusFilter === st
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'bg-white text-neutral-600 border hover:bg-neutral-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={approvalTypeFilter}
                onChange={(e) => setApprovalTypeFilter(e.target.value)}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-700 shadow-2xs focus:outline-none"
              >
                <option value="ALL">All Resource Types</option>
                <option value="Production Release Sign-off">Production Release Sign-off</option>
                <option value="Schema Migration / DDL">Schema Migration / DDL</option>
                <option value="Scope & Budget Variance">Scope & Budget Variance</option>
                <option value="Architecture Shift">Architecture Shift</option>
                <option value="Security Exception">Security Exception</option>
              </select>
            </div>
          </div>

          {/* Approvals List */}
          {approvalsLoading ? (
            <div className="flex h-48 items-center justify-center">
              <RefreshCw className="size-6 animate-spin text-neutral-400" />
            </div>
          ) : filteredApprovals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-10 text-center space-y-2">
              <ShieldCheck className="size-8 text-neutral-400 mx-auto" />
              <p className="text-xs font-semibold text-neutral-700">No change approvals found</p>
              <p className="text-[11px] text-neutral-500">
                Submit a new change approval request to enforce delivery sign-off.
              </p>
              <button
                onClick={() => setApprovalModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold shadow-xs hover:bg-purple-700"
              >
                <Plus className="size-3.5" />
                <span>Submit Approval Request</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredApprovals.map((item) => {
                const isPending = item.status === 'PENDING';
                const isApproved = item.status === 'APPROVED';
                const isRejected = item.status === 'REJECTED';

                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 shadow-xs hover:shadow-sm transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                          {item.resource_type}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded">
                          {item.resource_id}
                        </span>
                        {item.project_name && (
                          <span className="text-[10px] text-neutral-500 font-medium">
                            • Project: {item.project_name}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : isRejected
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800 animate-pulse'
                          }`}
                        >
                          {item.status}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => handleDeleteApproval(item.id)}
                            className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Approval Request"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Justification Text */}
                    <div className="text-xs text-neutral-800 leading-relaxed font-normal whitespace-pre-wrap">
                      {item.reason}
                    </div>

                    {/* Footer: Requester info & Verdict controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-[11px] text-neutral-500">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="size-5 rounded-full bg-neutral-100 border flex items-center justify-center font-bold text-[9px] text-neutral-600 uppercase">
                          {item.requester_name?.charAt(0) || <User className="size-3" />}
                        </div>
                        <span>Requested by: <strong className="text-neutral-700">{item.requester_name || 'Team Member'}</strong></span>
                        <span>•</span>
                        <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        {item.approver_name && (
                          <>
                            <span>•</span>
                            <span>Signed-off by: <strong className="text-neutral-700">{item.approver_name}</strong></span>
                          </>
                        )}
                      </div>

                      {/* Admin Verdict Actions */}
                      {isPending && isAdmin && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto">
                          <button
                            onClick={() => setVerdictModalData({ id: item.id, status: 'REJECTED', notes: '' })}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            <X className="size-3" />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => setVerdictModalData({ id: item.id, status: 'APPROVED', notes: '' })}
                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs cursor-pointer"
                          >
                            <Check className="size-3" />
                            <span>Approve</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: RISK MANAGEMENT & 3x3 MATRIX */}
      {/* ==================================================== */}
      {activeTab === 'risks' && (
        <div className="space-y-5">
          {/* 3x3 Risk Matrix Header Card */}
          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                  <Activity className="size-4 text-amber-600" />
                  <span>3×3 Probability & Impact Risk Assessment Matrix</span>
                </h3>
                <p className="text-[10px] sm:text-[11px] text-neutral-500">
                  Heatmap distribution of active project vulnerabilities and exposure points.
                </p>
              </div>
              <button
                onClick={() => setRiskModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 shadow-xs"
              >
                <Plus className="size-3" />
                <span>Log Risk</span>
              </button>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-bold">
              <div className="p-2 font-bold text-neutral-400">Prob \ Impact</div>
              <div className="p-2 bg-neutral-100 rounded text-neutral-700">LOW</div>
              <div className="p-2 bg-neutral-100 rounded text-neutral-700">MEDIUM</div>
              <div className="p-2 bg-neutral-100 rounded text-neutral-700">HIGH</div>

              <div className="p-2 bg-neutral-100 rounded text-neutral-700 font-bold flex items-center justify-center">HIGH</div>
              <div className="p-3 bg-amber-100 text-amber-900 rounded font-black text-xs">
                {risks.filter((r) => r.probability === 'HIGH' && r.impact === 'LOW').length}
              </div>
              <div className="p-3 bg-orange-100 text-orange-900 rounded font-black text-xs">
                {risks.filter((r) => r.probability === 'HIGH' && r.impact === 'MEDIUM').length}
              </div>
              <div className="p-3 bg-red-200 text-red-900 rounded font-black text-xs ring-1 ring-red-400">
                {risks.filter((r) => r.probability === 'HIGH' && r.impact === 'HIGH').length}
              </div>

              <div className="p-2 bg-neutral-100 rounded text-neutral-700 font-bold flex items-center justify-center">MEDIUM</div>
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded font-black text-xs">
                {risks.filter((r) => r.probability === 'MEDIUM' && r.impact === 'LOW').length}
              </div>
              <div className="p-3 bg-amber-100 text-amber-900 rounded font-black text-xs">
                {risks.filter((r) => r.probability === 'MEDIUM' && r.impact === 'MEDIUM').length}
              </div>
              <div className="p-3 bg-orange-100 text-orange-900 rounded font-black text-xs">
                {risks.filter((r) => r.probability === 'MEDIUM' && r.impact === 'HIGH').length}
              </div>

              <div className="p-2 bg-neutral-100 rounded text-neutral-700 font-bold flex items-center justify-center">LOW</div>
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded font-black text-xs">
                {risks.filter((r) => r.probability === 'LOW' && r.impact === 'LOW').length}
              </div>
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded font-black text-xs">
                {risks.filter((r) => r.probability === 'LOW' && r.impact === 'MEDIUM').length}
              </div>
              <div className="p-3 bg-amber-100 text-amber-900 rounded font-black text-xs">
                {risks.filter((r) => r.probability === 'LOW' && r.impact === 'HIGH').length}
              </div>
            </div>
          </div>

          {/* Risks Register Table */}
          <div className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-5 shadow-xs space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-neutral-900">Registered Risk Items ({risks.length})</h3>

            {risksLoading ? (
              <div className="flex h-32 items-center justify-center">
                <RefreshCw className="size-6 animate-spin text-neutral-400" />
              </div>
            ) : risks.length === 0 ? (
              <div className="text-center py-6 text-xs text-neutral-400">
                No risks registered for this scope.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {risks.map((risk) => (
                  <div key={risk.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            risk.severity === 'CRITICAL'
                              ? 'bg-red-100 text-red-800'
                              : risk.severity === 'HIGH'
                              ? 'bg-orange-100 text-orange-800'
                              : risk.severity === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {risk.severity} SEVERITY
                        </span>
                        <h4 className="text-xs font-bold text-neutral-900">{risk.title}</h4>
                      </div>
                      {risk.description && (
                        <p className="text-[11px] text-neutral-600">{risk.description}</p>
                      )}
                      {risk.mitigation && (
                        <p className="text-[10px] text-blue-700 bg-blue-50/60 p-1 rounded font-medium">
                          <strong>Mitigation:</strong> {risk.mitigation}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${risk.status === 'MITIGATED' ? 'bg-emerald-100 text-emerald-800' : risk.status === 'CLOSED' ? 'bg-neutral-100 text-neutral-600' : 'bg-red-100 text-red-700'}`}>
                        {risk.status}
                      </span>
                      {risk.status === 'OPEN' && (
                        <button
                          onClick={() => handleUpdateRiskStatus(risk.id, 'MITIGATED')}
                          className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                        >
                          Mitigate
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteRisk(risk.id)}
                          className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 3: ARCHITECTURE DECISION RECORDS (ADRs) */}
      {/* ==================================================== */}
      {activeTab === 'decisions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                Architecture Decision Records (ADRs)
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-500">
                Log structural architectural changes, technology adoptions, and technical governance justifications.
              </p>
            </div>
            <button
              onClick={() => setDecisionModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Record ADR</span>
            </button>
          </div>

          {decisionsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <RefreshCw className="size-6 animate-spin text-neutral-400" />
            </div>
          ) : decisions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-xs text-neutral-400">
              No Architecture Decisions recorded yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {decisions.map((dec, idx) => (
                <div
                  key={dec.id}
                  className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs space-y-2 hover:shadow-sm transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                      ADR-{String(idx + 1).padStart(3, '0')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                        {dec.status || 'APPROVED'}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteDecision(dec.id)}
                          className="p-1 rounded text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-neutral-900">{dec.title}</h4>

                  <div className="p-2 rounded bg-neutral-50 text-[11px] text-neutral-800 border border-neutral-100">
                    <strong className="text-purple-700 block mb-0.5">Decision:</strong>
                    {dec.decision}
                  </div>

                  {dec.reason && (
                    <p className="text-[10px] text-neutral-500">
                      <strong>Rationale:</strong> {dec.reason}
                    </p>
                  )}

                  <div className="text-[10px] text-neutral-400 pt-1 border-t border-neutral-100 flex items-center justify-between">
                    <span>Decided by: {dec.decided_by_name || 'Architect'}</span>
                    <span>{new Date(dec.decided_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 4: DELIVERY MILESTONES & STAGE GATES */}
      {/* ==================================================== */}
      {activeTab === 'milestones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900">
                Delivery Milestones & Phase Gatekeeping
              </h3>
              <p className="text-[10px] sm:text-[11px] text-neutral-500">
                Enforce delivery commitments, stage exit criteria, and release target dates.
              </p>
            </div>
            <button
              onClick={() => setMilestoneModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Create Milestone</span>
            </button>
          </div>

          {milestonesLoading ? (
            <div className="flex h-32 items-center justify-center">
              <RefreshCw className="size-6 animate-spin text-neutral-400" />
            </div>
          ) : milestones.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-xs text-neutral-400">
              No milestones defined for this scope.
            </div>
          ) : (
            <div className="space-y-2.5">
              {milestones.map((m) => {
                const target = new Date(m.target_date);
                const isPast = target < new Date();
                const isMet = m.status === 'MET';

                return (
                  <div
                    key={m.id}
                    className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Flag className="size-3.5 text-purple-600" />
                        <h4 className="text-xs font-bold text-neutral-900">{m.name}</h4>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isMet
                              ? 'bg-emerald-100 text-emerald-800'
                              : m.status === 'MISSED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      {m.description && <p className="text-[11px] text-neutral-600">{m.description}</p>}
                      <p className="text-[10px] text-neutral-400">
                        Target Date: <strong>{target.toLocaleDateString()}</strong> {isPast && !isMet && <span className="text-rose-600 font-bold ml-1">(Past Due)</span>}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {!isMet && (
                        <button
                          onClick={() => handleUpdateMilestoneStatus(m.id, 'MET')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold"
                        >
                          Mark Met
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteMilestone(m.id)}
                          className="p-1 rounded text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: SUBMIT CHANGE APPROVAL REQUEST */}
      {/* ==================================================== */}
      {approvalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <ShieldCheck className="size-4 text-purple-600" />
                <span>Submit Change Approval Request</span>
              </h3>
              <button onClick={() => setApprovalModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateApproval} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Approval Category</label>
                <select
                  value={approvalForm.resourceType}
                  onChange={(e) => setApprovalForm({ ...approvalForm, resourceType: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                >
                  <option value="Production Release Sign-off">Production Release Sign-off</option>
                  <option value="Schema Migration / DDL">Schema Migration / DDL</option>
                  <option value="Scope & Budget Variance">Scope & Budget Variance</option>
                  <option value="Architecture Shift">Architecture Shift</option>
                  <option value="Security Exception">Security Exception</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Resource Key or Ticket (e.g. REL-1.4 or TASK-89)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. REL-v2.1.0 or TASK-404"
                  value={approvalForm.resourceId}
                  onChange={(e) => setApprovalForm({ ...approvalForm, resourceId: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Urgency Level</label>
                <select
                  value={approvalForm.urgency}
                  onChange={(e) => setApprovalForm({ ...approvalForm, urgency: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical (Immediate Deployment)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Business Justification & Verification Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the change, test coverage evidence, risk mitigation, and reason for approval..."
                  value={approvalForm.reason}
                  onChange={(e) => setApprovalForm({ ...approvalForm, reason: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setApprovalModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-neutral-600 hover:bg-neutral-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
                >
                  Submit for Verdict
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: LOG RISK */}
      {/* ==================================================== */}
      {riskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <AlertTriangle className="size-4 text-amber-600" />
                <span>Log New Project Risk</span>
              </h3>
              <button onClick={() => setRiskModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRisk} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Risk Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Third-party payment gateway latency breach"
                  value={riskForm.title}
                  onChange={(e) => setRiskForm({ ...riskForm, title: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Probability</label>
                  <select
                    value={riskForm.probability}
                    onChange={(e) => setRiskForm({ ...riskForm, probability: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 mb-1">Impact</label>
                  <select
                    value={riskForm.impact}
                    onChange={(e) => setRiskForm({ ...riskForm, impact: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Mitigation Strategy</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Implement circuit breaker pattern and cached token retries"
                  value={riskForm.mitigation}
                  onChange={(e) => setRiskForm({ ...riskForm, mitigation: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRiskModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-neutral-600 hover:bg-neutral-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 text-white font-bold text-xs hover:bg-amber-700"
                >
                  Save Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: RECORD ADR */}
      {/* ==================================================== */}
      {decisionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <FileText className="size-4 text-purple-600" />
                <span>Record Architecture Decision (ADR)</span>
              </h3>
              <button onClick={() => setDecisionModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDecision} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Decision Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Adopt Cloudflare D1 for Edge Relational Storage"
                  value={decisionForm.title}
                  onChange={(e) => setDecisionForm({ ...decisionForm, title: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Decision Statement</label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. We will migrate all organization metrics from in-memory objects to Cloudflare D1 with atomic transactions."
                  value={decisionForm.decision}
                  onChange={(e) => setDecisionForm({ ...decisionForm, decision: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Context & Justification</label>
                <textarea
                  rows={2}
                  placeholder="Why was this decision chosen? What trade-offs were accepted?"
                  value={decisionForm.reason}
                  onChange={(e) => setDecisionForm({ ...decisionForm, reason: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-neutral-600 hover:bg-neutral-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
                >
                  Record Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 4: CREATE MILESTONE */}
      {/* ==================================================== */}
      {milestoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <Calendar className="size-4 text-purple-600" />
                <span>Create Delivery Milestone</span>
              </h3>
              <button onClick={() => setMilestoneModalOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Milestone Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beta Release 1.0 Sign-off"
                  value={milestoneForm.name}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Target Delivery Date</label>
                <input
                  type="date"
                  required
                  value={milestoneForm.targetDate}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, targetDate: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 mb-1">Description / Gate Criteria</label>
                <textarea
                  rows={2}
                  placeholder="Prerequisites, testing pass rates, and sign-off criteria..."
                  value={milestoneForm.description}
                  onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setMilestoneModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border text-neutral-600 hover:bg-neutral-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
                >
                  Create Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 5: VERDICT CONFIRMATION WITH NOTES */}
      {/* ==================================================== */}
      {verdictModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4 animate-in fade-in">
            <h3 className="text-sm font-bold text-neutral-900">
              Confirm Sign-off Verdict: <span className={verdictModalData.status === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'}>{verdictModalData.status}</span>
            </h3>
            <p className="text-xs text-neutral-600">
              Please enter optional review remarks or gate verification notes to record in the permanent governance audit trail.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Verified load testing benchmarks and security vulnerability scans passed..."
              value={verdictModalData.notes || ''}
              onChange={(e) => setVerdictModalData({ ...verdictModalData, notes: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 p-2 text-xs focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setVerdictModalData(null)}
                className="px-3 py-1.5 rounded-lg border text-neutral-600 hover:bg-neutral-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecideApproval(verdictModalData.id, verdictModalData.status, verdictModalData.notes)}
                className={`px-4 py-1.5 rounded-lg text-white font-bold text-xs ${verdictModalData.status === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
              >
                Confirm {verdictModalData.status}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
