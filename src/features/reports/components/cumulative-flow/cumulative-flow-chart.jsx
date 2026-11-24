import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  Layers,
  HelpCircle,
  Eye,
  EyeOff,
  Maximize2,
  Calendar,
  Filter,
  CheckCircle2,
  ChevronRight,
  Info,
} from 'lucide-react';

export const CumulativeFlowChart = ({
  data = {},
  loading = false,
  interval = 'daily',
  onIntervalChange = () => {},
  onDrillDown = () => {},
}) => {
  const { timeline = [], statuses = [], totalTickets = 0, dateRange = {} } = data;

  const [hiddenStatuses, setHiddenStatuses] = useState(new Set());
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Filter visible statuses
  const visibleStatuses = useMemo(() => {
    return statuses.filter((s) => !hiddenStatuses.has(s.key));
  }, [statuses, hiddenStatuses]);

  const toggleStatusVisibility = (statusKey) => {
    setHiddenStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(statusKey)) {
        next.delete(statusKey);
      } else {
        // Keep at least one status visible
        if (next.size < statuses.length - 1) {
          next.add(statusKey);
        }
      }
      return next;
    });
  };

  // Dimensions & Padding
  const width = 960;
  const height = 400;
  const padding = { top: 30, right: 30, bottom: 45, left: 55 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Compute maximum cumulative value across timeline for visible statuses
  const { maxVal, processedTimeline } = useMemo(() => {
    if (!timeline || timeline.length === 0) {
      return { maxVal: 10, processedTimeline: [] };
    }

    let calculatedMax = 0;
    const processed = timeline.map((bucket) => {
      let cumulativeSum = 0;
      const visibleCumulative = {};

      // Re-sum cumulative based only on visible statuses
      visibleStatuses.forEach((st) => {
        const count = bucket.statuses?.[st.key] || 0;
        cumulativeSum += count;
        visibleCumulative[st.key] = cumulativeSum;
      });

      if (cumulativeSum > calculatedMax) {
        calculatedMax = cumulativeSum;
      }

      return {
        ...bucket,
        visibleCumulative,
        visibleTotal: cumulativeSum,
      };
    });

    const safeMax = Math.max(calculatedMax, 5);
    // Round up max to a clean multiple
    const roundedMax = Math.ceil(safeMax * 1.1);

    return { maxVal: roundedMax, processedTimeline: processed };
  }, [timeline, visibleStatuses]);

  // Reset hovered index if it exceeds processed timeline bounds
  useEffect(() => {
    if (hoveredIndex !== null && (!processedTimeline[hoveredIndex] || hoveredIndex >= processedTimeline.length)) {
      setHoveredIndex(null);
    }
  }, [processedTimeline, hoveredIndex]);

  // Coordinates mapping
  const numPoints = processedTimeline.length;
  const getX = (index) => {
    if (numPoints <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (numPoints - 1)) * chartWidth;
  };

  const getY = (val) => {
    if (maxVal === 0) return padding.top + chartHeight;
    return padding.top + chartHeight - (val / maxVal) * chartHeight;
  };

  // Compute SVG Area Paths for each visible status band
  // Cumulative stack goes from bottom status (Done) up to top status (Backlog)
  const areaBands = useMemo(() => {
    if (processedTimeline.length === 0 || visibleStatuses.length === 0) return [];

    const bands = [];

    for (let sIdx = 0; sIdx < visibleStatuses.length; sIdx++) {
      const currentStatus = visibleStatuses[sIdx];
      const prevStatus = sIdx > 0 ? visibleStatuses[sIdx - 1] : null;

      const topPoints = [];
      const bottomPoints = [];

      processedTimeline.forEach((bucket, pIdx) => {
        const x = getX(pIdx);
        const topVal = bucket?.visibleCumulative?.[currentStatus.key] || 0;
        const bottomVal = prevStatus ? (bucket?.visibleCumulative?.[prevStatus.key] || 0) : 0;

        topPoints.push({ x, y: getY(topVal) });
        bottomPoints.push({ x, y: getY(bottomVal) });
      });

      // Forward along top edge, reverse along bottom edge
      let pathD = `M ${topPoints[0].x} ${topPoints[0].y}`;
      for (let i = 1; i < topPoints.length; i++) {
        pathD += ` L ${topPoints[i].x} ${topPoints[i].y}`;
      }
      for (let i = bottomPoints.length - 1; i >= 0; i--) {
        pathD += ` L ${bottomPoints[i].x} ${bottomPoints[i].y}`;
      }
      pathD += ' Z';

      // Top line path for distinct border stroke
      let topLineD = `M ${topPoints[0].x} ${topPoints[0].y}`;
      for (let i = 1; i < topPoints.length; i++) {
        topLineD += ` L ${topPoints[i].x} ${topPoints[i].y}`;
      }

      bands.push({
        status: currentStatus,
        pathD,
        topLineD,
        topPoints,
      });
    }

    return bands;
  }, [processedTimeline, visibleStatuses, maxVal]);

  // Y-axis tick divisions (5 ticks)
  const yTicks = useMemo(() => {
    const ticks = [];
    const step = maxVal / 5;
    for (let i = 0; i <= 5; i++) {
      const val = Math.round(i * step);
      ticks.push({
        val,
        y: getY(val),
      });
    }
    return ticks;
  }, [maxVal]);

  // X-axis date labels: distribute 6-8 labels evenly
  const xLabels = useMemo(() => {
    if (processedTimeline.length === 0) return [];
    if (processedTimeline.length <= 7) {
      return processedTimeline.map((b, idx) => ({
        index: idx,
        x: getX(idx),
        label: b.label || b.date.slice(5),
      }));
    }
    const step = Math.ceil(processedTimeline.length / 7);
    const labels = [];
    for (let i = 0; i < processedTimeline.length; i += step) {
      labels.push({
        index: i,
        x: getX(i),
        label: processedTimeline[i].label || processedTimeline[i].date.slice(5),
      });
    }
    // Ensure final date is present
    const lastIdx = processedTimeline.length - 1;
    if (labels[labels.length - 1].index !== lastIdx) {
      labels.push({
        index: lastIdx,
        x: getX(lastIdx),
        label: processedTimeline[lastIdx].label || processedTimeline[lastIdx].date.slice(5),
      });
    }
    return labels;
  }, [processedTimeline]);

  // Mouse interaction handling
  const handleMouseMove = (e) => {
    if (!containerRef.current || processedTimeline.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouseX to SVG coordinate
    const scaleX = width / rect.width;
    const svgX = mouseX * scaleX;

    const boundedX = Math.max(padding.left, Math.min(padding.left + chartWidth, svgX));
    const ratio = (boundedX - padding.left) / chartWidth;
    const index = Math.round(ratio * (processedTimeline.length - 1));

    if (index >= 0 && index < processedTimeline.length) {
      setHoveredIndex(index);
      setHoverPos({ x: mouseX, y: mouseY });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const hoveredBucket = hoveredIndex !== null ? processedTimeline[hoveredIndex] : null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-900">Cumulative Flow Diagram (CFD)</h3>
            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.2 text-[9px] font-bold">
              Real-time Work Movement
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Visualize workflow state stability, identify bottleneck slopes, and track cumulative delivery over time.
          </p>
        </div>

        {/* Interval Toggles */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mr-1">Interval:</span>
          {['daily', 'weekly', 'monthly'].map((intv) => (
            <button
              key={intv}
              onClick={() => onIntervalChange(intv)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition ${
                interval === intv
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {intv}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Legend with Status Filter Toggles */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-100">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Filter className="size-3" /> Statuses:
        </span>
        {statuses.map((st) => {
          const isHidden = hiddenStatuses.has(st.key);
          return (
            <button
              key={st.key}
              onClick={() => toggleStatusVisibility(st.key)}
              title={isHidden ? `Show ${st.label} in chart` : `Hide ${st.label} in chart`}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                isHidden
                  ? 'border-neutral-200 bg-neutral-50 text-neutral-400 line-through opacity-60'
                  : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 shadow-2xs'
              }`}
            >
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: isHidden ? '#cbd5e1' : st.color }}
              />
              <span>{st.label}</span>
              {isHidden ? <EyeOff className="size-3 text-neutral-400" /> : <Eye className="size-3 text-neutral-400" />}
            </button>
          );
        })}
      </div>

      {/* Main Interactive SVG Chart Container */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full overflow-hidden select-none bg-neutral-50/50 rounded-xl border border-neutral-100 p-2"
        style={{ minHeight: '400px' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-3">
            <div className="size-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-xs font-semibold text-neutral-500">Reconstructing historical flow from audit history...</span>
          </div>
        ) : processedTimeline.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-2 text-neutral-400">
            <Layers className="size-10 text-neutral-300 stroke-[1.5]" />
            <span className="text-sm font-bold text-neutral-700">No Historical Ticket Data Found</span>
            <span className="text-xs text-neutral-400 max-w-sm text-center">
              No tickets matched the selected project, team, sprint, or date filters. Adjust filters to inspect activity.
            </span>
          </div>
        ) : (
          <>
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible cursor-crosshair"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Status Fill Gradients */}
                {visibleStatuses.map((st) => (
                  <linearGradient
                    key={`grad-${st.key}`}
                    id={`grad-${st.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={st.color} stopOpacity="0.82" />
                    <stop offset="100%" stopColor={st.color} stopOpacity="0.65" />
                  </linearGradient>
                ))}
                {/* Drop shadow for crosshair points */}
                <filter id="point-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.2" />
                </filter>
              </defs>

              {/* Y-Axis Horizontal Grid Lines & Ticks */}
              {yTicks.map((tick, i) => (
                <g key={`ytick-${i}`}>
                  <line
                    x1={padding.left}
                    y1={tick.y}
                    x2={width - padding.right}
                    y2={tick.y}
                    stroke="#e2e8f0"
                    strokeDasharray={i === 0 ? 'none' : '3 3'}
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 10}
                    y={tick.y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="600"
                    fill="#94a3b8"
                  >
                    {tick.val}
                  </text>
                </g>
              ))}

              {/* X-Axis Ticks & Labels */}
              {xLabels.map((lbl, i) => (
                <g key={`xlbl-${i}`}>
                  <line
                    x1={lbl.x}
                    y1={padding.top}
                    x2={lbl.x}
                    y2={padding.top + chartHeight}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                  />
                  <text
                    x={lbl.x}
                    y={height - padding.bottom + 20}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill="#64748b"
                  >
                    {lbl.label}
                  </text>
                </g>
              ))}

              {/* Stacked Area Polygons */}
              {areaBands.map((band) => (
                <g key={`band-${band.status.key}`}>
                  <path
                    d={band.pathD}
                    fill={`url(#grad-${band.status.key})`}
                    className="transition-opacity hover:opacity-95"
                  />
                  <path
                    d={band.topLineD}
                    fill="none"
                    stroke={band.status.color}
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </g>
              ))}

              {/* Hover Crosshair Guide Line and Status Intersection Dots */}
              {hoveredIndex !== null && processedTimeline[hoveredIndex] && (
                <g>
                  {/* Vertical Crosshair Line */}
                  <line
                    x1={getX(hoveredIndex)}
                    y1={padding.top}
                    x2={getX(hoveredIndex)}
                    y2={padding.top + chartHeight}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />

                  {/* Intersection points on each status line */}
                  {visibleStatuses.map((st) => {
                    const bucket = processedTimeline[hoveredIndex];
                    if (!bucket || !bucket.visibleCumulative) return null;
                    const val = bucket.visibleCumulative[st.key] || 0;
                    const cx = getX(hoveredIndex);
                    const cy = getY(val);

                    return (
                      <circle
                        key={`dot-${st.key}`}
                        cx={cx}
                        cy={cy}
                        r="3.5"
                        fill="#ffffff"
                        stroke={st.color}
                        strokeWidth="2"
                        filter="url(#point-glow)"
                      />
                    );
                  })}
                </g>
              )}
            </svg>

            {/* Floating Interactive Tooltip */}
            {hoveredBucket && hoveredBucket.visibleCumulative && (
              <div
                className="absolute z-30 pointer-events-auto rounded-xl border border-neutral-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md w-64 text-xs transition-all duration-75"
                style={{
                  left: Math.min(Math.max(10, hoverPos.x + 15), (containerRef.current?.clientWidth || 600) - 270),
                  top: Math.max(10, Math.min(hoverPos.y - 40, 240)),
                }}
              >
                {/* Tooltip Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2 mb-2">
                  <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                    <Calendar className="size-3.5 text-blue-600" />
                    <span>{hoveredBucket.date}</span>
                  </div>
                  <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                    {hoveredBucket.visibleTotal} Total
                  </span>
                </div>

                {/* Status Breakdown with Direct Drill-Down Trigger */}
                <div className="space-y-1.5">
                  {visibleStatuses
                    .slice()
                    .reverse() // show Backlog at top, Done at bottom
                    .map((st) => {
                      const count = hoveredBucket.statuses?.[st.key] || 0;
                      const cumVal = hoveredBucket.visibleCumulative?.[st.key] || 0;
                      const pct = hoveredBucket.visibleTotal > 0
                        ? Math.round((count / hoveredBucket.visibleTotal) * 100)
                        : 0;

                      return (
                        <div
                          key={`tt-${st.key}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDrillDown({
                              date: hoveredBucket.date,
                              status: st.key,
                              statusLabel: st.label,
                            });
                          }}
                          className="flex items-center justify-between p-1 rounded-md hover:bg-neutral-100 transition cursor-pointer group"
                          title={`Click to inspect tickets in ${st.label} on ${hoveredBucket.date}`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span
                              className="size-2 rounded-full shrink-0"
                              style={{ backgroundColor: st.color }}
                            />
                            <span className="text-[11px] font-semibold text-neutral-700 truncate group-hover:text-blue-600">
                              {st.label}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-neutral-400 font-mono">({pct}%)</span>
                            <span className="text-[11px] font-bold text-neutral-900">{count}</span>
                            <ChevronRight className="size-3 text-neutral-300 group-hover:text-blue-600" />
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Footer Hint */}
                <div className="pt-2 mt-2 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
                  <span className="flex items-center gap-1">
                    <Info className="size-2.5" /> Click status to drill-down
                  </span>
                  <span>Stack: Bottom → Top</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Diagram Reading Guide / Agile Notes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-[11px] text-neutral-500">
        <div className="rounded-lg bg-neutral-50 p-2.5 border border-neutral-100">
          <strong className="text-neutral-800 block mb-0.5">Horizontal Distance (Cycle Time)</strong>
          The horizontal distance between the top border (work started) and bottom border (work completed) indicates the cycle time. Wider bands signify longer cycle times.
        </div>
        <div className="rounded-lg bg-neutral-50 p-2.5 border border-neutral-100">
          <strong className="text-neutral-800 block mb-0.5">Vertical Distance (WIP)</strong>
          The vertical height of an active status band represents the Work In Progress. Expanding vertical height reveals ticket accumulation and emerging bottlenecks.
        </div>
        <div className="rounded-lg bg-neutral-50 p-2.5 border border-neutral-100">
          <strong className="text-neutral-800 block mb-0.5">Parallel Slopes (Stable Flow)</strong>
          When all status boundaries rise at the exact same parallel angle, arrival rate equals departure rate, confirming predictable delivery flow.
        </div>
      </div>
    </div>
  );
};
