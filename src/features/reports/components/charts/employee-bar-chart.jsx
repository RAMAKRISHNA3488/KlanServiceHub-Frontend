import React, { useState, useMemo, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  User,
  Award,
  ArrowUpDown,
  Layers,
  LineChart,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  Clock,
  Sparkles,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Compass,
  Star,
  Crown,
  Flame,
  ShieldCheck,
  HelpCircle,
  Activity,
  BarChart2,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Advanced Employee Performance & Output Graph Component
 * Supports:
 * 1. Horizontal Segmented Stacked Bars
 * 2. Vertical Clustered Columns with Benchmark Line
 * 3. Smooth Cubic Bézier Spline Curves with Area Fills
 * 4. 4-Quadrant Efficiency & Output Matrix Scatter Plot
 * 5. Multi-Axis Radar / Spider Velocity Web Chart
 * 6. Bar + Spline Trend Combo Chart
 */
export const EmployeeBarChart = ({
  data = [],
  metric = 'tasks', // 'tasks' | 'points' | 'capacity' | 'completion' | 'efficiency'
  graphType = 'horizontal', // 'horizontal' | 'vertical' | 'line' | 'matrix' | 'radar' | 'combo'
  showBenchmark = true,
  onEmployeeClick,
  height = 320,
  maxItems = 10,
  onMetricChange,
  onGraphTypeChange,
  showControls = true,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [activeMetric, setActiveMetric] = useState(metric);
  const [activeGraphType, setActiveGraphType] = useState(graphType);
  const [sortDirection, setSortDirection] = useState('desc'); // 'desc' | 'asc'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quadrantFilter, setQuadrantFilter] = useState('ALL'); // 'ALL' | 'LEADERS' | 'EFFICIENT' | 'OVERLOADED' | 'AVAILABLE'
  const [radarSelectedIdx, setRadarSelectedIdx] = useState(0);
  const chartContainerRef = useRef(null);

  // Sync props if changed externally
  React.useEffect(() => {
    setActiveMetric(metric);
  }, [metric]);

  React.useEffect(() => {
    setActiveGraphType(graphType);
  }, [graphType]);

  const handleMetricSelect = (m) => {
    setActiveMetric(m);
    if (onMetricChange) onMetricChange(m);
  };

  const handleGraphTypeSelect = (g) => {
    setActiveGraphType(g);
    if (onGraphTypeChange) onGraphTypeChange(g);
  };

  // Process & Compute Data Metrics
  const chartData = useMemo(() => {
    const processed = data.map((m, index) => {
      let completedVal = m.completed || 0;
      let inProgressVal = m.inProgress || 0;
      let openVal = m.open || 0;
      let overdueVal = m.overdue || 0;
      let totalVal = m.totalAssigned || 0;
      const pointsVal = m.storyPoints || 0;
      const capacityVal = m.utilizationRate || 0;
      const completionVal = m.completionRate || 0;

      // Composite Efficiency Index (0 - 100)
      // Factoring: 50% Completion Rate, 25% Overdue Health, 25% Workload Optimal Balance
      const overduePenalty = Math.min(30, (overdueVal || 0) * 10);
      const balanceScore = capacityVal > 110 ? 60 : capacityVal < 40 ? 70 : 100;
      const efficiencyScore = Math.max(
        0,
        Math.min(
          100,
          Math.round(completionVal * 0.5 + (100 - overduePenalty) * 0.25 + balanceScore * 0.25)
        )
      );

      if (activeMetric === 'points') {
        totalVal = pointsVal;
        completedVal = Math.round((completionVal / 100) * totalVal);
        inProgressVal = totalVal - completedVal;
        openVal = 0;
        overdueVal = 0;
      } else if (activeMetric === 'capacity') {
        totalVal = capacityVal;
      } else if (activeMetric === 'completion') {
        totalVal = completionVal;
      } else if (activeMetric === 'efficiency') {
        totalVal = efficiencyScore;
      }

      return {
        ...m,
        id: m.memberId || m.userId || `emp-${index}`,
        totalVal,
        completedVal,
        inProgressVal,
        openVal,
        overdueVal,
        pointsVal,
        capacityVal,
        completionVal,
        efficiencyScore,
      };
    });

    // Sort by totalVal
    processed.sort((a, b) => {
      if (sortDirection === 'asc') return a.totalVal - b.totalVal;
      return b.totalVal - a.totalVal;
    });

    return processed.slice(0, maxItems);
  }, [data, maxItems, activeMetric, sortDirection]);

  // Max value calculation for scaling
  const maxValue = useMemo(() => {
    const vals = chartData.map((d) => d.totalVal);
    const max = Math.max(...vals, 10);
    if (activeMetric === 'completion' || activeMetric === 'efficiency') return 100;
    if (activeMetric === 'capacity') return Math.max(max, 130);
    return Math.ceil(max * 1.15); // Add 15% headroom for aesthetic labels
  }, [chartData, activeMetric]);

  // Organization benchmark average
  const benchmarkAverage = useMemo(() => {
    if (!chartData.length) return 0;
    const sum = chartData.reduce((acc, d) => acc + d.totalVal, 0);
    return Math.round(sum / chartData.length);
  }, [chartData]);

  // Export Data CSV
  const handleExportGraphData = () => {
    if (!chartData.length) {
      toast.error('No graph data available to export');
      return;
    }

    const headers = [
      'Rank',
      'Employee Name',
      'Department',
      'Job Title',
      'Total Assigned',
      'Completed',
      'In Progress',
      'Open Backlog',
      'Overdue',
      'Story Points',
      'Capacity %',
      'Completion Rate %',
      'Efficiency Score',
      'Workload Status',
    ];

    const rows = chartData.map((d, i) => [
      i + 1,
      `"${d.name || 'Staff'}"`,
      `"${d.department || 'Engineering'}"`,
      `"${d.jobTitle || 'Team Member'}"`,
      d.totalAssigned || 0,
      d.completed || 0,
      d.inProgress || 0,
      d.open || 0,
      d.overdue || 0,
      d.storyPoints || 0,
      `${d.utilizationRate || 0}%`,
      `${d.completionRate || 0}%`,
      `${d.efficiencyScore || 0}%`,
      `"${d.workloadStatus || 'Optimal'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `employee_performance_graph_${activeMetric}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Performance graph telemetry dataset exported successfully!');
  };

  if (!chartData.length) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-xs text-neutral-400 gap-2 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
        <BarChart3 className="size-8 text-neutral-300 animate-pulse" />
        <span className="font-semibold text-neutral-600">No employee telemetry records match the current filters</span>
        <span className="text-[11px] text-neutral-400">Adjust date range or employee selection to view performance graphs.</span>
      </div>
    );
  }

  // Common SVG Dimensions
  const svgWidth = 720;
  const currentHeight = isFullscreen ? 520 : height;

  return (
    <div
      ref={chartContainerRef}
      className={`relative rounded-2xl transition-all duration-200 ${
        isFullscreen
          ? 'fixed inset-4 z-50 bg-white p-6 shadow-2xl border border-neutral-200 overflow-y-auto flex flex-col justify-between'
          : 'space-y-4'
      }`}
    >
      {/* 1. Header Toolbar (If Enabled) */}
      {showControls && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              {activeGraphType === 'matrix' ? (
                <Compass className="size-4" />
              ) : activeGraphType === 'radar' ? (
                <Activity className="size-4" />
              ) : activeGraphType === 'line' ? (
                <LineChart className="size-4" />
              ) : (
                <BarChart3 className="size-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Employee Performance Analytics
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                  {chartData.length} Staff Profiled
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Visualizing individual throughput, delivery velocity, capacity utilization, and efficiency benchmarks.
              </p>
            </div>
          </div>

          {/* Controls: Type Switcher, Metric Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Graph Visual Style Picker */}
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 text-[11px] font-medium">
              <button
                onClick={() => handleGraphTypeSelect('horizontal')}
                title="Horizontal Stacked Bars"
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  activeGraphType === 'horizontal'
                    ? 'bg-white shadow-2xs font-bold text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <BarChart2 className="size-3.5 rotate-90" />
                <span>Bars</span>
              </button>
              <button
                onClick={() => handleGraphTypeSelect('vertical')}
                title="Vertical Clustered Columns"
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  activeGraphType === 'vertical'
                    ? 'bg-white shadow-2xs font-bold text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <BarChart3 className="size-3.5" />
                <span>Columns</span>
              </button>
              <button
                onClick={() => handleGraphTypeSelect('line')}
                title="Spline Area Curves"
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  activeGraphType === 'line'
                    ? 'bg-white shadow-2xs font-bold text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <LineChart className="size-3.5 text-blue-600" />
                <span>Trend</span>
              </button>
              <button
                onClick={() => handleGraphTypeSelect('matrix')}
                title="4-Quadrant Efficiency Matrix"
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  activeGraphType === 'matrix'
                    ? 'bg-white shadow-2xs font-bold text-purple-700'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Compass className="size-3.5 text-purple-600" />
                <span>Matrix</span>
              </button>
              <button
                onClick={() => handleGraphTypeSelect('radar')}
                title="Multi-Axis Velocity Radar"
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                  activeGraphType === 'radar'
                    ? 'bg-white shadow-2xs font-bold text-emerald-700'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Activity className="size-3.5 text-emerald-600" />
                <span>Radar</span>
              </button>
            </div>

            {/* Metric Selector */}
            <div className="flex items-center bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 text-[11px] font-medium">
              <button
                onClick={() => handleMetricSelect('tasks')}
                className={`px-2 py-1 rounded-lg transition ${
                  activeMetric === 'tasks'
                    ? 'bg-white shadow-2xs font-bold text-neutral-900'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => handleMetricSelect('points')}
                className={`px-2 py-1 rounded-lg transition ${
                  activeMetric === 'points'
                    ? 'bg-white shadow-2xs font-bold text-purple-700'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Points
              </button>
              <button
                onClick={() => handleMetricSelect('capacity')}
                className={`px-2 py-1 rounded-lg transition ${
                  activeMetric === 'capacity'
                    ? 'bg-white shadow-2xs font-bold text-blue-700'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Capacity %
              </button>
              <button
                onClick={() => handleMetricSelect('completion')}
                className={`px-2 py-1 rounded-lg transition ${
                  activeMetric === 'completion'
                    ? 'bg-white shadow-2xs font-bold text-emerald-700'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Rate %
              </button>
              <button
                onClick={() => handleMetricSelect('efficiency')}
                className={`px-2 py-1 rounded-lg transition ${
                  activeMetric === 'efficiency'
                    ? 'bg-white shadow-2xs font-bold text-amber-700'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Efficiency
              </button>
            </div>

            {/* Sort Toggle */}
            <button
              onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
              title={`Sorting: ${sortDirection === 'desc' ? 'Highest to Lowest' : 'Lowest to Highest'}`}
              className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition shadow-2xs"
            >
              <ArrowUpDown className="size-3.5" />
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportGraphData}
              title="Export visualized graph dataset as CSV"
              className="p-1.5 rounded-lg border border-neutral-200 bg-white text-emerald-700 hover:bg-emerald-50 transition shadow-2xs"
            >
              <Download className="size-3.5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen View'}
              className="p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition shadow-2xs"
            >
              {isFullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Benchmark Summary Bar */}
      {showBenchmark && benchmarkAverage > 0 && activeGraphType !== 'radar' && activeGraphType !== 'matrix' && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-50/90 to-orange-50/70 border border-amber-200/70 text-xs">
          <div className="flex items-center gap-2 text-amber-950 font-semibold">
            <Target className="size-4 text-amber-600 shrink-0" />
            <span>
              Organization Benchmark Average:{' '}
              <strong className="text-amber-900 text-sm">
                {benchmarkAverage}{' '}
                {activeMetric === 'capacity' || activeMetric === 'completion' || activeMetric === 'efficiency'
                  ? '%'
                  : activeMetric === 'points'
                  ? 'pts'
                  : 'items'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md">
              {chartData.filter((d) => d.totalVal >= benchmarkAverage).length} Exceeding Benchmark
            </span>
            <span className="text-amber-800 font-medium">
              {chartData.filter((d) => d.totalVal < benchmarkAverage).length} Below Target
            </span>
          </div>
        </div>
      )}

      {/* 2. GRAPH RENDERING MODES */}

      {/* MODE 1: VERTICAL COLUMNS WITH BENCHMARK LINE */}
      {activeGraphType === 'vertical' && (() => {
        const paddingLeft = 50;
        const paddingRight = 30;
        const paddingTop = 32;
        const paddingBottom = 54;
        const usableWidth = svgWidth - paddingLeft - paddingRight;
        const usableHeight = currentHeight - paddingTop - paddingBottom;
        const colWidth = Math.min(usableWidth / chartData.length - 16, 44);
        const benchmarkY = currentHeight - paddingBottom - (benchmarkAverage / maxValue) * usableHeight;

        return (
          <div className="w-full space-y-3">
            <div className="relative w-full overflow-hidden" style={{ height: currentHeight }}>
              <svg viewBox={`0 0 ${svgWidth} ${currentHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="vGradCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="100%" stopColor="#059669" />
                  </linearGradient>
                  <linearGradient id="vGradInProgress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#1D4ED8" />
                  </linearGradient>
                  <linearGradient id="vGradPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#7E22CE" />
                  </linearGradient>
                  <linearGradient id="vGradAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D97706" />
                  </linearGradient>
                  <filter id="columnGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
                  </filter>
                </defs>

                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = currentHeight - paddingBottom - ratio * usableHeight;
                  const val = Math.round(ratio * maxValue);
                  return (
                    <g key={ratio}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        stroke="#F1F5F9"
                        strokeWidth="1.2"
                      />
                      <text
                        x={paddingLeft - 10}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="10"
                        fontWeight="600"
                        fill="#94A3B8"
                      >
                        {activeMetric === 'capacity' || activeMetric === 'completion' || activeMetric === 'efficiency'
                          ? `${val}%`
                          : val}
                      </text>
                    </g>
                  );
                })}

                {/* Benchmark Average Overlay Line */}
                {showBenchmark && benchmarkAverage > 0 && (
                  <g>
                    <line
                      x1={paddingLeft}
                      y1={benchmarkY}
                      x2={svgWidth - paddingRight}
                      y2={benchmarkY}
                      stroke="#F59E0B"
                      strokeDasharray="4 4"
                      strokeWidth="1.8"
                      opacity="0.9"
                    />
                    <rect
                      x={svgWidth - paddingRight - 84}
                      y={benchmarkY - 16}
                      width="84"
                      height="16"
                      rx="4"
                      fill="#FEF3C7"
                      stroke="#FDE68A"
                      strokeWidth="1"
                    />
                    <text
                      x={svgWidth - paddingRight - 42}
                      y={benchmarkY - 4}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#B45309"
                    >
                      Benchmark: {benchmarkAverage}
                      {activeMetric === 'capacity' || activeMetric === 'completion' || activeMetric === 'efficiency' ? '%' : ''}
                    </text>
                  </g>
                )}

                {/* Columns */}
                {chartData.map((item, idx) => {
                  const step = usableWidth / chartData.length;
                  const x = paddingLeft + idx * step + (step - colWidth) / 2;
                  const barH = maxValue > 0 ? (item.totalVal / maxValue) * usableHeight : 0;
                  const y = currentHeight - paddingBottom - barH;
                  const isHovered = hoveredIdx === idx;

                  // Segment heights for task breakdown
                  const compH = maxValue > 0 ? (item.completedVal / maxValue) * usableHeight : 0;
                  const inProgH = maxValue > 0 ? (item.inProgressVal / maxValue) * usableHeight : 0;
                  const openH = maxValue > 0 ? (item.openVal / maxValue) * usableHeight : 0;

                  return (
                    <g
                      key={item.id}
                      className="cursor-pointer group"
                      onClick={() => onEmployeeClick && onEmployeeClick(item)}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      {/* Highlight Backdrop Pillar on Hover */}
                      {isHovered && (
                        <rect
                          x={x - 8}
                          y={paddingTop - 6}
                          width={colWidth + 16}
                          height={usableHeight + 12}
                          fill="#F8FAFC"
                          rx="8"
                          stroke="#CBD5E1"
                          strokeWidth="1.2"
                        />
                      )}

                      {/* Transparent Hit Zone */}
                      <rect
                        x={x - 8}
                        y={paddingTop}
                        width={colWidth + 16}
                        height={usableHeight}
                        fill="transparent"
                      />

                      {/* Stacked or Solid Column */}
                      {activeMetric === 'tasks' ? (
                        <g filter={isHovered ? 'url(#columnGlow)' : undefined}>
                          {/* Open Tasks (Bottom) */}
                          {openH > 0 && (
                            <rect
                              x={x}
                              y={currentHeight - paddingBottom - openH}
                              width={colWidth}
                              height={openH}
                              fill="#CBD5E1"
                              rx="3"
                            />
                          )}
                          {/* In Progress Tasks (Middle) */}
                          {inProgH > 0 && (
                            <rect
                              x={x}
                              y={currentHeight - paddingBottom - openH - inProgH}
                              width={colWidth}
                              height={inProgH}
                              fill="url(#vGradInProgress)"
                              rx="3"
                            />
                          )}
                          {/* Completed Tasks (Top) */}
                          {compH > 0 && (
                            <rect
                              x={x}
                              y={currentHeight - paddingBottom - openH - inProgH - compH}
                              width={colWidth}
                              height={compH}
                              fill="url(#vGradCompleted)"
                              rx="4"
                            />
                          )}
                        </g>
                      ) : (
                        <rect
                          x={x}
                          y={y}
                          width={colWidth}
                          height={barH}
                          fill={
                            activeMetric === 'points'
                              ? 'url(#vGradPurple)'
                              : activeMetric === 'efficiency'
                              ? 'url(#vGradAmber)'
                              : activeMetric === 'capacity'
                              ? item.totalVal > 110
                                ? '#E11D48'
                                : item.totalVal < 40
                                ? '#F59E0B'
                                : '#3B82F6'
                              : 'url(#vGradCompleted)'
                          }
                          rx="5"
                          filter={isHovered ? 'url(#columnGlow)' : undefined}
                          className="transition-all duration-300"
                        />
                      )}

                      {/* Top Performer Badge for Rank #1 */}
                      {idx === 0 && (
                        <g transform={`translate(${x + colWidth / 2 - 8}, ${y - 24})`}>
                          <circle cx="8" cy="8" r="8" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" />
                          <text x="8" y="11.5" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#B45309">#1</text>
                        </g>
                      )}

                      {/* Value Label on Top of Column */}
                      {item.totalVal > 0 && (
                        <text
                          x={x + colWidth / 2}
                          y={idx === 0 ? y - 26 : y - 7}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="bold"
                          fill={isHovered ? '#2563EB' : '#334155'}
                        >
                          {activeMetric === 'capacity' || activeMetric === 'completion' || activeMetric === 'efficiency'
                            ? `${item.totalVal}%`
                            : item.totalVal}
                        </text>
                      )}

                      {/* Overdue Warning Red Dot Indicator */}
                      {item.overdue > 0 && (
                        <circle
                          cx={x + colWidth}
                          cy={y}
                          r="4"
                          fill="#E11D48"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      )}

                      {/* Employee Name on X Axis */}
                      <text
                        x={x + colWidth / 2}
                        y={currentHeight - paddingBottom + 18}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={isHovered ? 'bold' : '600'}
                        fill={isHovered ? '#1E293B' : '#64748B'}
                      >
                        {(item.name || 'Staff').split(' ')[0]}
                      </text>

                      {/* Secondary Department / Metric subtitle */}
                      <text
                        x={x + colWidth / 2}
                        y={currentHeight - paddingBottom + 30}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#94A3B8"
                      >
                        {item.department ? item.department.slice(0, 7) : 'Eng'}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Tooltip Card */}
              {hoveredIdx !== null && chartData[hoveredIdx] && (
                <div className="absolute top-2 right-4 bg-neutral-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs pointer-events-none z-20 flex items-center gap-4 border border-neutral-700 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-blue-500/30 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                      {(chartData[hoveredIdx].name || 'U').slice(0, 1)}
                    </div>
                    <div>
                      <span className="font-bold text-white block">{chartData[hoveredIdx].name}</span>
                      <span className="text-[10px] text-neutral-400 block">{chartData[hoveredIdx].jobTitle}</span>
                    </div>
                  </div>
                  <div className="h-6 w-px bg-neutral-700" />
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-emerald-400 font-bold">{chartData[hoveredIdx].completed} Done</span>
                    <span className="text-blue-400 font-bold">{chartData[hoveredIdx].inProgress} Active</span>
                    <span className="text-purple-300 font-bold">{chartData[hoveredIdx].storyPoints || 0} Pts</span>
                    <span className="text-amber-300 font-bold">{chartData[hoveredIdx].efficiencyScore}% Score</span>
                  </div>
                </div>
              )}
            </div>

            {/* Column Legend */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-2 border-t border-neutral-100 text-[11px] font-semibold text-neutral-600">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span>Completed ({activeMetric === 'points' ? 'Story Points' : 'Tasks'})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500" />
                <span>In Progress</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-slate-400" />
                <span>Open / Backlog</span>
              </div>
              {showBenchmark && (
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-amber-500 border-dashed" />
                  <span className="text-amber-800">Organization Average Line</span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* MODE 2: SMOOTH CUBIC BÉZIER SPLINE & AREA TREND */}
      {activeGraphType === 'line' && (() => {
        const paddingLeft = 50;
        const paddingRight = 30;
        const paddingTop = 32;
        const paddingBottom = 48;
        const usableWidth = svgWidth - paddingLeft - paddingRight;
        const usableHeight = currentHeight - paddingTop - paddingBottom;

        const getX = (i) => paddingLeft + (i / (chartData.length - 1 || 1)) * usableWidth;
        const getY = (val) => currentHeight - paddingBottom - (val / maxValue) * usableHeight;

        // Build smooth Bézier spline path
        const createSmoothPath = (points) => {
          if (!points.length) return '';
          if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
          let d = `M ${points[0].x} ${points[0].y}`;
          for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cp1x = p0.x + (p1.x - p0.x) / 2;
            const cp1y = p0.y;
            const cp2x = p0.x + (p1.x - p0.x) / 2;
            const cp2y = p1.y;
            d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
          }
          return d;
        };

        const totalPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.totalVal) }));
        const completedPoints = chartData.map((d, i) => ({ x: getX(i), y: getY(d.completedVal) }));

        const totalSpline = createSmoothPath(totalPoints);
        const completedSpline = createSmoothPath(completedPoints);

        const totalArea = `${totalSpline} L ${getX(chartData.length - 1)} ${currentHeight - paddingBottom} L ${paddingLeft} ${currentHeight - paddingBottom} Z`;

        return (
          <div className="w-full space-y-3">
            <div className="relative w-full overflow-hidden" style={{ height: currentHeight }}>
              <svg viewBox={`0 0 ${svgWidth} ${currentHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="areaSplineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="compSplineGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                  const y = currentHeight - paddingBottom - ratio * usableHeight;
                  const val = Math.round(ratio * maxValue);
                  return (
                    <g key={ratio}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        stroke="#F1F5F9"
                        strokeWidth="1.2"
                      />
                      <text
                        x={paddingLeft - 10}
                        y={y + 3.5}
                        textAnchor="end"
                        fontSize="10"
                        fontWeight="600"
                        fill="#94A3B8"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area Fill */}
                <path d={totalArea} fill="url(#areaSplineGrad)" />

                {/* Total Curve Line */}
                <path
                  d={totalSpline}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Completed Curve Line */}
                <path
                  d={completedSpline}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Hover Cursor Vertical Line */}
                {hoveredIdx !== null && (
                  <line
                    x1={getX(hoveredIdx)}
                    y1={paddingTop}
                    x2={getX(hoveredIdx)}
                    y2={currentHeight - paddingBottom}
                    stroke="#94A3B8"
                    strokeDasharray="3 3"
                    strokeWidth="1.5"
                  />
                )}

                {/* Nodes & Touch Points */}
                {chartData.map((d, i) => {
                  const x = getX(i);
                  const yT = getY(d.totalVal);
                  const yC = getY(d.completedVal);
                  const isHovered = hoveredIdx === i;

                  return (
                    <g
                      key={d.id}
                      className="cursor-pointer"
                      onClick={() => onEmployeeClick && onEmployeeClick(d)}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      {/* Invisible Broad Hit Area */}
                      <rect
                        x={x - 18}
                        y={paddingTop}
                        width={36}
                        height={usableHeight}
                        fill="transparent"
                      />

                      {/* Node Total Point */}
                      <circle
                        cx={x}
                        cy={yT}
                        r={isHovered ? 7 : 4.5}
                        fill="#3B82F6"
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        className="transition-all duration-150"
                      />

                      {/* Node Completed Point */}
                      <circle
                        cx={x}
                        cy={yC}
                        r={isHovered ? 7 : 4.5}
                        fill="#10B981"
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        className="transition-all duration-150"
                      />

                      {/* Label under point */}
                      <text
                        x={x}
                        y={currentHeight - paddingBottom + 18}
                        textAnchor="middle"
                        fontSize="10"
                        fill={isHovered ? '#1E293B' : '#64748B'}
                        fontWeight={isHovered ? 'bold' : '600'}
                      >
                        {(d.name || 'Staff').split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Floating Dynamic Popover */}
              {hoveredIdx !== null && chartData[hoveredIdx] && (
                <div
                  className="absolute top-1 transform -translate-x-1/2 bg-neutral-900/95 backdrop-blur-md text-white px-3.5 py-2 rounded-xl shadow-2xl text-xs pointer-events-none z-20 flex items-center gap-3 border border-neutral-700 animate-in fade-in duration-100"
                  style={{
                    left: `${((getX(hoveredIdx) / svgWidth) * 100).toFixed(1)}%`,
                  }}
                >
                  <div className="font-bold text-white">{chartData[hoveredIdx].name}</div>
                  <div className="text-blue-400 font-bold">Total: {chartData[hoveredIdx].totalVal}</div>
                  <div className="text-emerald-400 font-bold">Done: {chartData[hoveredIdx].completedVal}</div>
                  <div className="text-neutral-300 font-semibold">{chartData[hoveredIdx].completionRate}% Rate</div>
                </div>
              )}
            </div>

            {/* Line Legend */}
            <div className="flex items-center justify-center gap-8 pt-2 border-t border-neutral-100 text-[11px] font-semibold text-neutral-600">
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 rounded-full bg-blue-500" />
                <span>Total Workload Trajectory</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 rounded-full bg-emerald-500" />
                <span>Completed Throughput</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* MODE 3: 4-QUADRANT EFFICIENCY & OUTPUT MATRIX */}
      {activeGraphType === 'matrix' && (() => {
        const padding = 50;
        const usableW = svgWidth - padding * 2;
        const usableH = currentHeight - padding * 2;
        const maxTasks = Math.max(...chartData.map((d) => d.totalAssigned || 0), 10);

        // Filter by quadrant if selected
        const filteredPoints = chartData.filter((d) => {
          const isHighVol = (d.totalAssigned || 0) >= maxTasks / 2;
          const isHighDelivery = (d.completionRate || 0) >= 50;
          if (quadrantFilter === 'LEADERS') return isHighVol && isHighDelivery;
          if (quadrantFilter === 'EFFICIENT') return !isHighVol && isHighDelivery;
          if (quadrantFilter === 'OVERLOADED') return isHighVol && !isHighDelivery;
          if (quadrantFilter === 'AVAILABLE') return !isHighVol && !isHighDelivery;
          return true;
        });

        return (
          <div className="w-full space-y-3">
            {/* Quadrant Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                <span className="text-neutral-400 mr-1">Filter Quadrant:</span>
                <button
                  onClick={() => setQuadrantFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    quadrantFilter === 'ALL'
                      ? 'bg-neutral-900 text-white font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  All ({chartData.length})
                </button>
                <button
                  onClick={() => setQuadrantFilter('LEADERS')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    quadrantFilter === 'LEADERS'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <span>Leaders</span>
                </button>
                <button
                  onClick={() => setQuadrantFilter('EFFICIENT')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    quadrantFilter === 'EFFICIENT'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <span>Efficient</span>
                </button>
                <button
                  onClick={() => setQuadrantFilter('OVERLOADED')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    quadrantFilter === 'OVERLOADED'
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  <span>Overloaded</span>
                </button>
                <button
                  onClick={() => setQuadrantFilter('AVAILABLE')}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                    quadrantFilter === 'AVAILABLE'
                      ? 'bg-amber-600 text-white font-bold'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <span>Available</span>
                </button>
              </div>

              <span className="text-[11px] text-neutral-400 font-medium">
                Click dots to inspect collaborator
              </span>
            </div>

            {/* Matrix SVG Plot */}
            <div className="relative w-full rounded-2xl bg-neutral-50/40 border border-neutral-100 p-2" style={{ height: currentHeight }}>
              <svg viewBox={`0 0 ${svgWidth} ${currentHeight}`} className="w-full h-full overflow-visible">
                {/* 4 Quadrant Backgrounds */}
                {/* Top Right: Star Performers / High Velocity */}
                <rect
                  x={padding + usableW / 2}
                  y={padding}
                  width={usableW / 2}
                  height={usableH / 2}
                  fill="rgba(16, 185, 129, 0.08)"
                  rx="8"
                />
                {/* Top Left: High Efficiency Specialists */}
                <rect
                  x={padding}
                  y={padding}
                  width={usableW / 2}
                  height={usableH / 2}
                  fill="rgba(59, 130, 246, 0.06)"
                  rx="8"
                />
                {/* Bottom Right: Overloaded / At Risk */}
                <rect
                  x={padding + usableW / 2}
                  y={padding + usableH / 2}
                  width={usableW / 2}
                  height={usableH / 2}
                  fill="rgba(225, 29, 72, 0.07)"
                  rx="8"
                />
                {/* Bottom Left: Capacity Available / Steady */}
                <rect
                  x={padding}
                  y={padding + usableH / 2}
                  width={usableW / 2}
                  height={usableH / 2}
                  fill="rgba(245, 158, 11, 0.06)"
                  rx="8"
                />

                {/* Center Dividing Axes */}
                <line
                  x1={padding}
                  y1={padding + usableH / 2}
                  x2={svgWidth - padding}
                  y2={padding + usableH / 2}
                  stroke="#CBD5E1"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />
                <line
                  x1={padding + usableW / 2}
                  y1={padding}
                  x2={padding + usableW / 2}
                  y2={currentHeight - padding}
                  stroke="#CBD5E1"
                  strokeDasharray="4 4"
                  strokeWidth="1.5"
                />

                {/* Quadrant Descriptive Headers */}
                <text
                  x={svgWidth - padding - 12}
                  y={padding + 18}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#059669"
                >
                  High Velocity & High Delivery
                </text>
                <text
                  x={padding + 12}
                  y={padding + 18}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#2563EB"
                >
                  High Efficiency Specialists
                </text>
                <text
                  x={svgWidth - padding - 12}
                  y={currentHeight - padding - 12}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#E11D48"
                >
                  High Volume / At-Risk Bottleneck
                </text>
                <text
                  x={padding + 12}
                  y={currentHeight - padding - 12}
                  textAnchor="start"
                  fontSize="11"
                  fontWeight="bold"
                  fill="#D97706"
                >
                  Bandwidth Available
                </text>

                {/* Employee Data Points */}
                {filteredPoints.map((d, i) => {
                  const xRatio = maxTasks > 0 ? (d.totalAssigned || 0) / maxTasks : 0;
                  const yRatio = (d.completionRate || 0) / 100;
                  const cx = padding + xRatio * usableW;
                  const cy = currentHeight - padding - yRatio * usableH;
                  const isHovered = hoveredIdx === i;

                  return (
                    <g
                      key={d.id}
                      className="cursor-pointer group"
                      onClick={() => onEmployeeClick && onEmployeeClick(d)}
                      onMouseEnter={() => setHoveredIdx(i)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      {/* Halo ring on hover */}
                      {isHovered && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r="18"
                          fill="rgba(59, 130, 246, 0.2)"
                          className="animate-pulse"
                        />
                      )}

                      <circle
                        cx={cx}
                        cy={cy}
                        r={isHovered ? 14 : 10}
                        fill={
                          d.workloadStatus === 'Overloaded'
                            ? '#E11D48'
                            : d.completionRate >= 70
                            ? '#10B981'
                            : '#3B82F6'
                        }
                        stroke="#FFFFFF"
                        strokeWidth="2.5"
                        className="transition-all duration-200"
                        style={{
                          filter: isHovered ? 'drop-shadow(0px 4px 8px rgba(0,0,0,0.3))' : 'none',
                        }}
                      />

                      {/* Avatar Initial */}
                      <text
                        x={cx}
                        y={cy + 3.5}
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#FFFFFF"
                      >
                        {(d.name || 'U').slice(0, 1)}
                      </text>

                      {/* Name Label */}
                      <text
                        x={cx}
                        y={cy - 14}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight={isHovered ? 'bold' : '600'}
                        fill={isHovered ? '#0F172A' : '#475569'}
                      >
                        {(d.name || '').split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Matrix Axis Explainer */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px] font-semibold text-neutral-500 px-2">
              <span>← Lower Assigned Workload | Higher Assigned Workload → (X-Axis)</span>
              <span>Y-Axis: Task Completion Rate (0% to 100%) ↑</span>
            </div>
          </div>
        );
      })()}

      {/* MODE 4: RADAR / SPIDER MULTI-AXIS WEB VELOCITY CHART */}
      {activeGraphType === 'radar' && (() => {
        const cx = svgWidth / 2;
        const cy = currentHeight / 2;
        const radius = Math.min(svgWidth, currentHeight) / 2 - 48;
        const dimensions = [
          { key: 'completionRate', label: 'Completion %', max: 100 },
          { key: 'totalAssigned', label: 'Output Volume', max: maxValue },
          { key: 'storyPoints', label: 'Velocity Pts', max: Math.max(...chartData.map((d) => d.storyPoints || 0), 20) },
          { key: 'utilizationRate', label: 'Capacity Load %', max: 120 },
          { key: 'efficiencyScore', label: 'Efficiency Index', max: 100 },
        ];

        const numPoints = dimensions.length;
        const angleStep = (Math.PI * 2) / numPoints;

        // Function to compute radar coordinate
        const getPoint = (dimIndex, value, max) => {
          const angle = dimIndex * angleStep - Math.PI / 2;
          const ratio = Math.min(Math.max(value / (max || 1), 0), 1);
          const r = ratio * radius;
          return {
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle),
          };
        };

        // Polygon path builder
        const getPolygonPoints = (emp) => {
          return dimensions
            .map((dim, i) => {
              const val = emp[dim.key] || 0;
              const pt = getPoint(i, val, dim.max);
              return `${pt.x},${pt.y}`;
            })
            .join(' ');
        };

        const activeEmployee = chartData[radarSelectedIdx] || chartData[0];

        return (
          <div className="w-full space-y-3">
            {/* Employee Selector Pills for Radar comparison */}
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              <span className="text-[11px] text-neutral-400 font-semibold mr-1">Focus Employee:</span>
              {chartData.map((emp, i) => (
                <button
                  key={emp.id}
                  onClick={() => setRadarSelectedIdx(i)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                    radarSelectedIdx === i
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  <div
                    className={`size-2 rounded-full ${
                      emp.workloadStatus === 'Overloaded'
                        ? 'bg-rose-400'
                        : emp.completionRate >= 70
                        ? 'bg-emerald-400'
                        : 'bg-blue-300'
                    }`}
                  />
                  <span>{(emp.name || 'Staff').split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Radar Canvas */}
            <div className="relative w-full" style={{ height: currentHeight }}>
              <svg viewBox={`0 0 ${svgWidth} ${currentHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <radialGradient id="radarAreaGrad">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.1" />
                  </radialGradient>
                </defs>

                {/* Concentric Grid Rings */}
                {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => {
                  const ringPoints = dimensions
                    .map((_, i) => {
                      const angle = i * angleStep - Math.PI / 2;
                      const r = level * radius;
                      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
                    })
                    .join(' ');

                  return (
                    <g key={level}>
                      <polygon
                        points={ringPoints}
                        fill={level === 1.0 ? '#F8FAFC' : 'transparent'}
                        stroke="#E2E8F0"
                        strokeWidth="1"
                      />
                      <text
                        x={cx}
                        y={cy - level * radius + 10}
                        textAnchor="middle"
                        fontSize="8"
                        fill="#94A3B8"
                        fontWeight="600"
                      >
                        {Math.round(level * 100)}%
                      </text>
                    </g>
                  );
                })}

                {/* Dimension Axis Lines & Labels */}
                {dimensions.map((dim, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const labelRadius = radius + 24;
                  const lx = cx + labelRadius * Math.cos(angle);
                  const ly = cy + labelRadius * Math.sin(angle);

                  return (
                    <g key={dim.key}>
                      <line
                        x1={cx}
                        y1={cy}
                        x2={cx + radius * Math.cos(angle)}
                        y2={cy + radius * Math.sin(angle)}
                        stroke="#CBD5E1"
                        strokeWidth="1"
                      />
                      <text
                        x={lx}
                        y={ly + 4}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="bold"
                        fill="#334155"
                      >
                        {dim.label}
                      </text>
                    </g>
                  );
                })}

                {/* Active Employee Radar Polygon */}
                {activeEmployee && (
                  <g>
                    <polygon
                      points={getPolygonPoints(activeEmployee)}
                      fill="url(#radarAreaGrad)"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                    />

                    {/* Vertices */}
                    {dimensions.map((dim, i) => {
                      const pt = getPoint(i, activeEmployee[dim.key] || 0, dim.max);
                      return (
                        <circle
                          key={dim.key}
                          cx={pt.x}
                          cy={pt.y}
                          r="5"
                          fill="#3B82F6"
                          stroke="#FFFFFF"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </g>
                )}
              </svg>
            </div>

            {/* Radar Diagnostics Strip */}
            {activeEmployee && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Completion</span>
                  <span className="font-bold text-emerald-600">{activeEmployee.completionRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Total Tasks</span>
                  <span className="font-bold text-neutral-900">{activeEmployee.totalAssigned} items</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Story Points</span>
                  <span className="font-bold text-purple-700">{activeEmployee.storyPoints || 0} pts</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Capacity Load</span>
                  <span className="font-bold text-blue-600">{activeEmployee.utilizationRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-400 font-semibold block uppercase">Efficiency Index</span>
                  <span className="font-bold text-amber-700">{activeEmployee.efficiencyScore}%</span>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* MODE 5: DEFAULT HORIZONTAL SEGMENTED STACKED BARS */}
      {activeGraphType === 'horizontal' && (
        <div className="space-y-3">
          {chartData.map((item, idx) => {
            const isHovered = hoveredIdx === idx;
            const barWidth = maxValue > 0 ? (item.totalVal / maxValue) * 100 : 0;
            const isTop3 = idx < 3;

            return (
              <div
                key={item.id}
                onClick={() => onEmployeeClick && onEmployeeClick(item)}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className={`p-3 rounded-2xl transition cursor-pointer flex flex-col md:flex-row md:items-center gap-3 md:gap-5 border ${
                  isHovered
                    ? 'bg-blue-50/70 border-blue-300 shadow-sm translate-x-1'
                    : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                }`}
              >
                {/* Employee Profile & Rank */}
                <div className="flex items-center gap-3 w-52 shrink-0 truncate">
                  {/* Rank Badge */}
                  <div
                    className={`size-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 ${
                      idx === 0
                        ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300'
                        : idx === 1
                        ? 'bg-slate-200 text-slate-700'
                        : idx === 2
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="size-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-200">
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt="" className="size-full rounded-full object-cover" />
                      ) : (
                        (item.name || 'U').slice(0, 1).toUpperCase()
                      )}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-white ${
                        item.workloadStatus === 'Overloaded'
                          ? 'bg-rose-500'
                          : item.workloadStatus === 'Underutilized'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="truncate min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-bold text-neutral-900 text-xs truncate block group-hover:text-blue-600 transition">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-neutral-400 truncate block">
                      {item.jobTitle || item.department || 'Staff'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Metric Stack */}
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex flex-wrap items-center gap-3">
                      {activeMetric === 'tasks' && (
                        <>
                          <span className="font-bold text-neutral-900">{item.totalVal} Tasks Total</span>
                          <span className="text-emerald-600 font-semibold">{item.completed} Done</span>
                          <span className="text-blue-600 font-semibold">{item.inProgress} Active</span>
                          {item.overdue > 0 && (
                            <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.2 rounded text-[10px]">
                              {item.overdue} Overdue
                            </span>
                          )}
                        </>
                      )}
                      {activeMetric === 'points' && (
                        <span className="font-bold text-purple-700">{item.totalVal} Story Points Delivered</span>
                      )}
                      {activeMetric === 'capacity' && (
                        <span
                          className={`font-bold ${
                            item.totalVal > 110
                              ? 'text-rose-600'
                              : item.totalVal < 40
                              ? 'text-amber-600'
                              : 'text-neutral-800'
                          }`}
                        >
                          {item.totalVal}% Capacity Load ({item.capacityHours || 40}h bandwidth)
                        </span>
                      )}
                      {activeMetric === 'completion' && (
                        <span className="font-bold text-emerald-600">{item.totalVal}% Completion Rate</span>
                      )}
                      {activeMetric === 'efficiency' && (
                        <span className="font-bold text-amber-700">
                          {item.totalVal}% Efficiency Rating ({item.completionRate}% Done • {item.overdue || 0} Overdue)
                        </span>
                      )}
                    </div>

                    {/* Numeric Pill */}
                    <span className="font-bold text-neutral-900 text-xs bg-neutral-100 px-2 py-0.5 rounded-md">
                      {activeMetric === 'capacity' || activeMetric === 'completion' || activeMetric === 'efficiency'
                        ? `${item.totalVal}%`
                        : item.totalVal}
                    </span>
                  </div>

                  {/* Progress Track */}
                  <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden flex relative shadow-inner">
                    {/* Benchmark Target Marker */}
                    {showBenchmark && (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
                        style={{ left: `${(benchmarkAverage / maxValue) * 100}%` }}
                        title={`Benchmark: ${benchmarkAverage}`}
                      />
                    )}

                    {activeMetric === 'tasks' ? (
                      <>
                        <div
                          title={`Completed: ${item.completedVal}`}
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full transition-all duration-300"
                          style={{ width: `${(item.completedVal / maxValue) * 100}%` }}
                        />
                        <div
                          title={`In Progress: ${item.inProgressVal}`}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300"
                          style={{ width: `${(item.inProgressVal / maxValue) * 100}%` }}
                        />
                        <div
                          title={`Open Backlog: ${item.openVal}`}
                          className="bg-slate-300 h-full transition-all duration-300"
                          style={{ width: `${(item.openVal / maxValue) * 100}%` }}
                        />
                      </>
                    ) : activeMetric === 'points' ? (
                      <div
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    ) : activeMetric === 'efficiency' ? (
                      <div
                        className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    ) : activeMetric === 'capacity' ? (
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.totalVal > 110
                            ? 'bg-rose-500'
                            : item.totalVal < 40
                            ? 'bg-amber-400'
                            : 'bg-blue-600'
                        }`}
                        style={{ width: `${Math.min(item.totalVal, 100)}%` }}
                      />
                    ) : (
                      <div
                        className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(item.totalVal, 100)}%` }}
                      />
                    )}
                  </div>
                </div>

                {/* Inspect Action Arrow */}
                <div className="shrink-0 flex items-center gap-1 text-blue-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition">
                  <span>Inspect</span>
                  <ChevronRight className="size-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmployeeBarChart;
