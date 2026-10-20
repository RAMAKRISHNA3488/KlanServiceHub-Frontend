import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Layers, Target, DollarSign, TrendingUp, RefreshCw, Plus, 
  Calendar, CheckCircle2, AlertTriangle, AlertOctagon, 
  Search, Filter, ChevronRight, X, Edit3, Trash2, Zap, 
  Briefcase, ShieldCheck, Cpu, Cloud, Award, PieChart
} from 'lucide-react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Health status helpers
const HEALTH_CONFIG = {
  ON_TRACK: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'On Track', dot: 'bg-emerald-500' },
  AT_RISK: { badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'At Risk', dot: 'bg-amber-500' },
  OFF_TRACK: { badge: 'bg-rose-50 text-rose-700 border-rose-200', text: 'Off Track', dot: 'bg-rose-500' },
  COMPLETED: { badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'Completed', dot: 'bg-blue-500' },
};

const PRIORITY_CONFIG = {
  P0: { label: 'P0 - Critical', badge: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' },
  P1: { label: 'P1 - High', badge: 'bg-amber-50 text-amber-700 border-amber-200 font-semibold' },
  P2: { label: 'P2 - Medium', badge: 'bg-neutral-100 text-neutral-700 border-neutral-200 font-medium' },
};

const CATEGORY_ICONS = {
  'Cloud Infrastructure': Cloud,
  'AI & Machine Learning': Cpu,
  'Security & Governance': ShieldCheck,
  'Product Growth': TrendingUp,
};

export const PortfoliosView = () => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('initiatives'); // 'portfolios' | 'initiatives' | 'goals'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPortfolio, setFilterPortfolio] = useState('ALL');
  const [filterHealth, setFilterHealth] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  // Modals state
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isInitiativeModalOpen, setIsInitiativeModalOpen] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState(null);

  // 1. Fetch Executive Overview Telemetry
  const { data: overviewRes, isFetching: isOverviewFetching, refetch: refetchOverview } = useQuery({
    queryKey: ['portfolio-overview', workspaceId],
    queryFn: () => apiFetch(`/api/portfolio/${workspaceId}/overview`),
    refetchInterval: 15000,
  });

  // 2. Fetch Portfolios
  const { data: portfoliosRes, isFetching: isPortfoliosFetching, refetch: refetchPortfolios } = useQuery({
    queryKey: ['portfolios', workspaceId],
    queryFn: () => apiFetch(`/api/portfolio/${workspaceId}`),
    refetchInterval: 15000,
  });

  // 3. Fetch Initiatives
  const { data: initiativesRes, isFetching: isInitiativesFetching, refetch: refetchInitiatives } = useQuery({
    queryKey: ['initiatives', workspaceId],
    queryFn: () => apiFetch(`/api/portfolio/${workspaceId}/initiatives`),
    refetchInterval: 15000,
  });

  // 4. Fetch Goals
  const { data: goalsRes, isFetching: isGoalsFetching, refetch: refetchGoals } = useQuery({
    queryKey: ['strategic-goals', workspaceId],
    queryFn: () => apiFetch(`/api/portfolio/${workspaceId}/goals`),
    refetchInterval: 15000,
  });

  const overview = overviewRes?.data || {
    totalPortfolios: 0,
    totalInitiatives: 0,
    totalGoals: 0,
    healthScore: 100,
    avgProgress: 0,
    totalBudgetAllocated: 0,
    totalBudgetSpent: 0,
    targetHorizon: ''
  };

  const portfolios = portfoliosRes?.data || [];
  const initiatives = initiativesRes?.data || [];
  const goals = goalsRes?.data || [];

  // Filtered initiatives list
  const filteredInitiatives = useMemo(() => {
    return initiatives.filter(i => {
      const matchSearch = searchTerm === '' ||
        (i.name && i.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (i.description && i.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (i.portfolio_name && i.portfolio_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (i.owner_name && i.owner_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchPortfolio = filterPortfolio === 'ALL' || i.portfolio_id === filterPortfolio;
      const matchHealth = filterHealth === 'ALL' || (i.health_status || 'ON_TRACK') === filterHealth;
      const matchPriority = filterPriority === 'ALL' || (i.priority || 'P1') === filterPriority;

      return matchSearch && matchPortfolio && matchHealth && matchPriority;
    });
  }, [initiatives, searchTerm, filterPortfolio, filterHealth, filterPriority]);

  // Seed sample blueprint mutation
  const seedMutation = useMutation({
    mutationFn: () => apiFetch(`/api/portfolio/${workspaceId}/seed-sample`, { method: 'POST' }),
    onSuccess: (data) => {
      toast.success(data?.message || 'Sample strategic portfolio & initiatives seeded!');
      queryClient.invalidateQueries(['portfolio-overview', workspaceId]);
      queryClient.invalidateQueries(['portfolios', workspaceId]);
      queryClient.invalidateQueries(['initiatives', workspaceId]);
      queryClient.invalidateQueries(['strategic-goals', workspaceId]);
    },
    onError: (err) => toast.error(err?.message || 'Failed to seed sample portfolio.'),
  });

  // Delete portfolio mutation
  const deletePortfolioMutation = useMutation({
    mutationFn: (portfolioId) => apiFetch(`/api/portfolio/${workspaceId}/portfolios/${portfolioId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast.success('Portfolio removed');
      queryClient.invalidateQueries(['portfolio-overview', workspaceId]);
      queryClient.invalidateQueries(['portfolios', workspaceId]);
      queryClient.invalidateQueries(['initiatives', workspaceId]);
    },
    onError: (err) => toast.error(err?.message || 'Failed to remove portfolio')
  });

  // Delete initiative mutation
  const deleteInitiativeMutation = useMutation({
    mutationFn: (initiativeId) => apiFetch(`/api/portfolio/${workspaceId}/initiatives/${initiativeId}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast.success('Initiative removed');
      setSelectedInitiative(null);
      queryClient.invalidateQueries(['portfolio-overview', workspaceId]);
      queryClient.invalidateQueries(['initiatives', workspaceId]);
    },
    onError: (err) => toast.error(err?.message || 'Failed to remove initiative')
  });

  // Refetch all queries
  const handleRefreshAll = () => {
    refetchOverview();
    refetchPortfolios();
    refetchInitiatives();
    refetchGoals();
  };

  const isAnyFetching = isOverviewFetching || isPortfoliosFetching || isInitiativesFetching || isGoalsFetching;

  return (
    <div className="flex flex-col gap-y-4 p-5 min-h-[calc(100vh-4rem)] bg-neutral-50/50 text-[11px]">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b pb-3.5 bg-white p-4 rounded-xl shadow-xs border-neutral-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 shadow-xs">
              <Layers className="size-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-neutral-900 flex items-center gap-2">
                Strategic Portfolio & Initiatives
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  OKR ALIGNMENT
                </span>
              </h1>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                Executive program delivery tracking aligning multi-project strategic roadmaps with corporate OKRs.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshAll}
            disabled={isAnyFetching}
            className="text-[11px] h-8 gap-1.5 font-medium text-neutral-600 hover:text-neutral-900"
          >
            <RefreshCw className={cn('size-3', isAnyFetching && 'animate-spin text-amber-600')} />
            Sync Portfolio
          </Button>

          {portfolios.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="text-[11px] h-8 gap-1.5 font-medium bg-amber-50/60 border-amber-200 text-amber-700 hover:bg-amber-100"
            >
              <Zap className="size-3 text-amber-600" />
              {seedMutation.isPending ? 'Seeding...' : 'Load Executive Blueprint'}
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPortfolioModalOpen(true)}
            className="text-[11px] h-8 gap-1.5 font-medium text-neutral-700"
          >
            <Plus className="size-3 text-neutral-500" />
            New Portfolio
          </Button>

          <Button
            size="sm"
            onClick={() => setIsInitiativeModalOpen(true)}
            disabled={portfolios.length === 0}
            className="text-[11px] h-8 gap-1.5 font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-xs"
          >
            <Plus className="size-3" />
            New Initiative
          </Button>
        </div>
      </div>

      {/* Executive Strategic KPI Health Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Portfolios</span>
            <Briefcase className="size-3.5 text-neutral-400" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-neutral-900">{overview.totalPortfolios || 0}</span>
            <span className="text-[10px] text-neutral-400 font-medium">programs</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Active Initiatives</span>
            <Target className="size-3.5 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-indigo-600">{overview.totalInitiatives || 0}</span>
            <span className="text-[10px] text-neutral-400 font-medium">in flight</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Avg Progress</span>
            <TrendingUp className="size-3.5 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-emerald-600">{overview.avgProgress || 0}%</span>
            <span className="text-[10px] text-emerald-700 font-semibold">completed</span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Budget Utilization</span>
            <DollarSign className="size-3.5 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-neutral-900">
              ${(overview.totalBudgetSpent / 1000).toFixed(0)}k
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">
              / ${(overview.totalBudgetAllocated / 1000).toFixed(0)}k
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider">OKR Health Score</span>
            <Award className="size-3.5 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold text-purple-600">{overview.healthScore || 100}%</span>
            <span className="text-[10px] text-purple-700 font-medium">on track</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('initiatives')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all',
              activeTab === 'initiatives'
                ? 'bg-white text-amber-700 border border-neutral-200 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            )}
          >
            <Target className="size-3.5" />
            Strategic Initiatives & OKRs
            <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-neutral-100 font-bold">
              {initiatives.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('portfolios')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all',
              activeTab === 'portfolios'
                ? 'bg-white text-amber-700 border border-neutral-200 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            )}
          >
            <Layers className="size-3.5" />
            Programs & Portfolios
            <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-neutral-100 font-bold">
              {portfolios.length}
            </Badge>
          </button>

          <button
            onClick={() => setActiveTab('goals')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all',
              activeTab === 'goals'
                ? 'bg-white text-amber-700 border border-neutral-200 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
            )}
          >
            <Award className="size-3.5" />
            Corporate Goals & OKRs
            <Badge variant="secondary" className="text-[9px] py-0 px-1 bg-neutral-100 font-bold">
              {goals.length}
            </Badge>
          </button>
        </div>

        <div className="hidden md:flex items-center gap-3 text-[10px] text-neutral-500">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-emerald-500" /> On Track
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-amber-500" /> At Risk
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-rose-500" /> Off Track
          </span>
        </div>
      </div>

      {/* TAB 1: STRATEGIC INITIATIVES & OKRS TABLE */}
      {activeTab === 'initiatives' && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs flex flex-col gap-3">
          {/* Search & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-sm">
              <Search className="size-3 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Search initiative title, portfolio, or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8 text-[11px] rounded-lg"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {portfolios.length > 0 && (
                <select
                  value={filterPortfolio}
                  onChange={(e) => setFilterPortfolio(e.target.value)}
                  className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
                >
                  <option value="ALL">All Portfolios</option>
                  {portfolios.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              <select
                value={filterHealth}
                onChange={(e) => setFilterHealth(e.target.value)}
                className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="ALL">All Health States</option>
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="OFF_TRACK">Off Track</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="ALL">All Priorities</option>
                <option value="P0">P0 - Critical</option>
                <option value="P1">P1 - High</option>
                <option value="P2">P2 - Medium</option>
              </select>
            </div>
          </div>

          {/* Initiatives Table */}
          {filteredInitiatives.length === 0 ? (
            <div className="py-10 text-center text-[11px] text-neutral-500">
              {initiatives.length === 0 ? (
                <div className="flex flex-col items-center justify-center">
                  <Target className="size-6 text-neutral-400 mb-2" />
                  <p className="font-bold text-neutral-800">No Strategic Initiatives Found</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5 mb-3">
                    Create your first initiative or load the executive strategic blueprint.
                  </p>
                  <Button
                    onClick={() => seedMutation.mutate()}
                    disabled={seedMutation.isPending}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] h-7 px-3 font-semibold gap-1.5"
                  >
                    <Zap className="size-3" />
                    {seedMutation.isPending ? 'Seeding...' : 'Load Sample Blueprint'}
                  </Button>
                </div>
              ) : (
                'No initiatives matched your search criteria.'
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold text-[10px]">
                  <tr>
                    <th className="py-2 px-3">Initiative & Scope</th>
                    <th className="py-2 px-2.5">Strategic Portfolio</th>
                    <th className="py-2 px-2.5">Target Horizon</th>
                    <th className="py-2 px-2.5">Priority</th>
                    <th className="py-2 px-2.5">Health Status</th>
                    <th className="py-2 px-2.5 w-32">Progress</th>
                    <th className="py-2 px-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredInitiatives.map((init) => {
                    const healthCfg = HEALTH_CONFIG[init.health_status] || HEALTH_CONFIG.ON_TRACK;
                    const prioCfg = PRIORITY_CONFIG[init.priority] || PRIORITY_CONFIG.P1;
                    const progress = Number(init.progress_percent) || 0;

                    return (
                      <tr key={init.id} className="hover:bg-neutral-50/80 transition">
                        <td className="py-2.5 px-3 max-w-[240px]">
                          <div className="font-bold text-neutral-900 truncate">{init.name}</div>
                          <div className="text-[9px] text-neutral-500 truncate mt-0.5">{init.description || 'Target deliverables'}</div>
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className="font-semibold text-neutral-700">{init.portfolio_name || 'Enterprise'}</span>
                        </td>
                        <td className="py-2.5 px-2.5 text-[10px] font-mono text-neutral-600 whitespace-nowrap">
                          {init.target_date ? new Date(init.target_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Q4 2026'}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className={cn('px-1.5 py-0.5 rounded text-[8px] border', prioCfg.badge)}>
                            {prioCfg.label}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border', healthCfg.badge)}>
                            <span className={cn('size-1.5 rounded-full shrink-0', healthCfg.dot)} />
                            {healthCfg.text}
                          </span>
                        </td>
                        <td className="py-2.5 px-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  progress >= 80 ? 'bg-emerald-500' : (progress >= 40 ? 'bg-amber-500' : 'bg-rose-500')
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-neutral-700 shrink-0">{progress}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedInitiative(init)}
                              className="h-6 px-1.5 text-[10px] text-amber-700 hover:text-amber-800 hover:bg-amber-50 font-medium"
                            >
                              Inspect
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteInitiativeMutation.mutate(init.id)}
                              className="h-6 px-1.5 text-[10px] text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="size-2.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PORTFOLIOS & PROGRAMS GRID */}
      {activeTab === 'portfolios' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {portfolios.map((p) => {
            const CatIcon = CATEGORY_ICONS[p.category] || Briefcase;
            const progress = Number(p.progress_percent) || 0;
            const spent = Number(p.budget_spent) || 0;
            const allocated = Number(p.budget_allocated) || 1;
            const budgetRatio = Math.round((spent / allocated) * 100);

            return (
              <div key={p.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                      <CatIcon className="size-2.5 text-amber-600" />
                      {p.category || 'Strategic Program'}
                    </span>
                    <button
                      onClick={() => deletePortfolioMutation.mutate(p.id)}
                      className="text-neutral-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>

                  <h3 className="text-xs font-bold text-neutral-900 mb-1">{p.name}</h3>
                  <p className="text-[10px] text-neutral-500 mb-3 line-clamp-2">
                    {p.description || 'Enterprise strategic portfolio alignment.'}
                  </p>

                  {/* Progress bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-[9px] font-bold text-neutral-600 mb-1">
                      <span>Delivery Completion</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                  </div>

                  {/* Budget Allocation Gauge */}
                  <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-[10px] space-y-1 mb-2">
                    <div className="flex justify-between text-neutral-500">
                      <span>Budget Utilization:</span>
                      <span className="font-bold text-neutral-800">${(spent / 1000).toFixed(0)}k / ${(allocated / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="h-1 rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', budgetRatio > 90 ? 'bg-rose-500' : 'bg-emerald-500')}
                        style={{ width: `${Math.min(100, budgetRatio)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[10px] text-neutral-500">
                  <span>{p.initiatives_count || 0} active initiatives</span>
                  <span className="font-semibold text-neutral-700">{p.owner_name || 'Executive Lead'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: COMPANY GOALS & OKRS */}
      {activeTab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {goals.map((g) => (
            <div key={g.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    <Award className="size-2.5" />
                    CORPORATE OKR
                  </span>
                  <span className="text-[9px] font-mono text-neutral-400">Horizon: {g.target_date || '2026'}</span>
                </div>

                <h3 className="text-xs font-bold text-neutral-900 mb-1">{g.name}</h3>
                <p className="text-[10px] text-neutral-500 mb-2.5">{g.description}</p>

                {g.key_result && (
                  <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-200 text-[10px] mb-3">
                    <span className="text-neutral-400 font-bold block text-[9px] uppercase">Key Result:</span>
                    <span className="text-neutral-800 font-semibold">{g.key_result}</span>
                  </div>
                )}

                <div className="mb-2">
                  <div className="flex justify-between text-[9px] font-bold text-neutral-600 mb-1">
                    <span>Target Attainment</span>
                    <span className="text-emerald-600">{g.progress_percent || 80}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${g.progress_percent || 80}%` }} />
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-500">
                <span>Status: <strong className="text-emerald-700">{g.status || 'ON_TRACK'}</strong></span>
                <span>{g.owner_name || 'Executive Office'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: CREATE PORTFOLIO */}
      {isPortfolioModalOpen && (
        <CreatePortfolioModal
          isOpen={isPortfolioModalOpen}
          onClose={() => setIsPortfolioModalOpen(false)}
          workspaceId={workspaceId}
          onCreated={() => {
            setIsPortfolioModalOpen(false);
            handleRefreshAll();
          }}
        />
      )}

      {/* MODAL 2: CREATE INITIATIVE */}
      {isInitiativeModalOpen && (
        <CreateInitiativeModal
          isOpen={isInitiativeModalOpen}
          onClose={() => setIsInitiativeModalOpen(false)}
          workspaceId={workspaceId}
          portfolios={portfolios}
          onCreated={() => {
            setIsInitiativeModalOpen(false);
            handleRefreshAll();
          }}
        />
      )}

      {/* DRAWER 3: INITIATIVE DETAILS INSPECTOR */}
      {selectedInitiative && (
        <InitiativeDetailsDrawer
          initiative={selectedInitiative}
          workspaceId={workspaceId}
          onClose={() => setSelectedInitiative(null)}
          onUpdated={() => {
            setSelectedInitiative(null);
            handleRefreshAll();
          }}
        />
      )}
    </div>
  );
};

// Modal: Create Portfolio
const CreatePortfolioModal = ({ isOpen, onClose, workspaceId, onCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Cloud Infrastructure');
  const [budget, setBudget] = useState('250000');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Portfolio name is required');

    setIsSubmitting(true);
    try {
      await apiFetch(`/api/portfolio/${workspaceId}`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          category,
          budget_allocated: parseInt(budget) || 250000
        })
      });
      toast.success('Strategic Portfolio created successfully');
      onCreated();
    } catch (err) {
      toast.error(err?.message || 'Failed to create portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-neutral-200 text-[11px]">
        <div className="flex items-center justify-between pb-2.5 border-b mb-3">
          <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Plus className="size-3.5 text-amber-600" /> Create Strategic Portfolio
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-neutral-700">
            <X className="size-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Program Title</label>
            <Input
              required
              placeholder="e.g. Next-Gen Cloud Modernization"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-[11px] h-8 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
            >
              <option value="Cloud Infrastructure">Cloud Infrastructure</option>
              <option value="AI & Machine Learning">AI & Machine Learning</option>
              <option value="Security & Governance">Security & Governance</option>
              <option value="Product Growth">Product Growth</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Strategic Budget Allocation ($)</label>
            <Input
              type="number"
              placeholder="250000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="text-[11px] h-8 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Description & Objectives</label>
            <Input
              placeholder="Key strategic goals and high-level milestones"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[11px] h-8 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2.5 border-t mt-1">
            <Button variant="outline" type="button" onClick={onClose} className="text-[10px] h-7 px-2.5">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] h-7 px-3 font-semibold">
              {isSubmitting ? 'Creating...' : 'Create Portfolio'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal: Create Initiative
const CreateInitiativeModal = ({ isOpen, onClose, workspaceId, portfolios, onCreated }) => {
  const [name, setName] = useState('');
  const [portfolioId, setPortfolioId] = useState(portfolios[0]?.id || '');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [priority, setPriority] = useState('P1');
  const [healthStatus, setHealthStatus] = useState('ON_TRACK');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Initiative title is required');

    setIsSubmitting(true);
    try {
      await apiFetch(`/api/portfolio/${workspaceId}/initiatives`, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          portfolioId,
          targetDate,
          priority,
          health_status: healthStatus,
          progress_percent: 10
        })
      });
      toast.success('Strategic Initiative created successfully');
      onCreated();
    } catch (err) {
      toast.error(err?.message || 'Failed to create initiative');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-3">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-neutral-200 text-[11px]">
        <div className="flex items-center justify-between pb-2.5 border-b mb-3">
          <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Target className="size-3.5 text-amber-600" /> New Strategic Initiative
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-neutral-700">
            <X className="size-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Initiative Title</label>
            <Input
              required
              placeholder="e.g. Cloudflare Workers Edge API Gateway Migration"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-[11px] h-8 rounded-lg"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Parent Portfolio</label>
            <select
              value={portfolioId}
              onChange={(e) => setPortfolioId(e.target.value)}
              className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
            >
              {portfolios.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="P0">P0 - Critical</option>
                <option value="P1">P1 - High</option>
                <option value="P2">P2 - Medium</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Initial Health</label>
              <select
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value)}
                className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-[10px] text-neutral-700 font-medium"
              >
                <option value="ON_TRACK">On Track</option>
                <option value="AT_RISK">At Risk</option>
                <option value="OFF_TRACK">Off Track</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Target Completion Horizon</label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="text-[11px] h-8 rounded-lg font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-neutral-700 mb-0.5 text-[10px]">Scope Description</label>
            <Input
              placeholder="Key deliverable milestones and success metrics"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-[11px] h-8 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2.5 border-t mt-1">
            <Button variant="outline" type="button" onClick={onClose} className="text-[10px] h-7 px-2.5">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] h-7 px-3 font-semibold">
              {isSubmitting ? 'Creating...' : 'Create Initiative'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Drawer: Initiative Details & Progress Adjuster
const InitiativeDetailsDrawer = ({ initiative, workspaceId, onClose, onUpdated }) => {
  const [progress, setProgress] = useState(initiative.progress_percent || 0);
  const [healthStatus, setHealthStatus] = useState(initiative.health_status || 'ON_TRACK');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      await apiFetch(`/api/portfolio/${workspaceId}/initiatives/${initiative.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          progress_percent: parseInt(progress),
          health_status: healthStatus
        })
      });
      toast.success('Initiative progress updated');
      onUpdated();
    } catch (err) {
      toast.error(err?.message || 'Failed to update initiative');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/30 backdrop-blur-xs">
      <div className="h-full w-full max-w-sm bg-white shadow-2xl border-l border-neutral-200 p-5 flex flex-col justify-between overflow-y-auto text-[11px]">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center gap-1.5">
              <Target className="size-3.5 text-amber-600" />
              <span className="text-xs font-bold text-neutral-900">Initiative Inspector</span>
            </div>
            <button onClick={onClose} className="p-1 rounded-md text-neutral-400 hover:text-neutral-700">
              <X className="size-3.5" />
            </button>
          </div>

          <div>
            <span className="text-xs font-bold text-neutral-900">{initiative.name}</span>
            <p className="text-[10px] text-neutral-500 mt-1">{initiative.description || 'Strategic deliverable milestone.'}</p>
          </div>

          {/* Interactive Progress Slider */}
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 flex flex-col gap-2">
            <div className="flex justify-between text-[10px] font-bold text-neutral-700">
              <span>Delivery Completion</span>
              <span className="text-amber-700">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              className="w-full accent-amber-600 cursor-pointer"
            />
          </div>

          {/* Health Status Switcher */}
          <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 flex flex-col gap-1.5">
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500">
              Health Status State
            </span>
            <div className="grid grid-cols-3 gap-1">
              {['ON_TRACK', 'AT_RISK', 'OFF_TRACK'].map((st) => (
                <button
                  key={st}
                  onClick={() => setHealthStatus(st)}
                  className={cn(
                    'px-1.5 py-1 rounded text-[9px] font-bold border transition text-center',
                    healthStatus === st
                      ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 border-neutral-200'
                  )}
                >
                  {HEALTH_CONFIG[st]?.text || st}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-neutral-200 space-y-1.5 text-[10px]">
            <div className="flex justify-between">
              <span className="text-neutral-400">Parent Portfolio:</span>
              <span className="font-semibold text-neutral-800">{initiative.portfolio_name || 'Enterprise'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Target Horizon:</span>
              <span className="font-mono text-neutral-700">{initiative.target_date ? new Date(initiative.target_date).toLocaleDateString() : 'Q4 2026'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Priority:</span>
              <span className="font-bold text-neutral-800">{initiative.priority || 'P1'}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t flex flex-col gap-2">
          <Button
            onClick={handleSave}
            disabled={isUpdating}
            className="bg-amber-600 hover:bg-amber-700 text-white text-[10px] h-8 font-semibold"
          >
            {isUpdating ? 'Saving Changes...' : 'Save Progress & Status'}
          </Button>
          <Button variant="outline" onClick={onClose} className="text-[10px] h-8">
            Close Inspector
          </Button>
        </div>
      </div>
    </div>
  );
};
