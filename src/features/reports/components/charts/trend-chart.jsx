import React, { useState } from 'react';

export const TrendChart = ({ data = [], height = 200 }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-neutral-400 text-xs">
        <span>No activity trend recorded in this date range.</span>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.created || 0, d.completed || 0)), 5);
  const chartWidth = 600;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 35;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = height - paddingTop - paddingBottom;

  const getX = (index) => paddingLeft + (index / (data.length - 1 || 1)) * usableWidth;
  const getY = (val) => height - paddingBottom - (val / maxVal) * usableHeight;

  // Build SVG polyline points
  const createdPoints = data.map((d, i) => `${getX(i)},${getY(d.created || 0)}`).join(' ');
  const completedPoints = data.map((d, i) => `${getX(i)},${getY(d.completed || 0)}`).join(' ');

  return (
    <div className="w-full">
      <div className="relative w-full" style={{ height }}>
        <svg viewBox={`0 0 ${chartWidth} ${height}`} className="w-full h-full overflow-visible">
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - paddingBottom - ratio * usableHeight;
            const val = Math.round(ratio * maxVal);
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94A3B8"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Created line (Blue) */}
          <polyline
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={createdPoints}
          />

          {/* Completed line (Emerald Green) */}
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={completedPoints}
          />

          {/* Data Points */}
          {data.map((d, i) => {
            const x = getX(i);
            const yCreated = getY(d.created || 0);
            const yCompleted = getY(d.completed || 0);
            const isHovered = hoveredIndex === i;

            return (
              <g key={d.date || i}>
                {/* Hit area */}
                <rect
                  x={x - 15}
                  y={paddingTop}
                  width="30"
                  height={usableHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={height - paddingBottom}
                    stroke="#CBD5E1"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                )}

                {/* Point for created */}
                <circle
                  cx={x}
                  cy={yCreated}
                  r={isHovered ? 4.5 : 3}
                  fill="#3B82F6"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                {/* Point for completed */}
                <circle
                  cx={x}
                  cy={yCompleted}
                  r={isHovered ? 4.5 : 3}
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />

                {/* X Axis Label */}
                {(data.length <= 10 || i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) && (
                  <text
                    x={x}
                    y={height - paddingBottom + 16}
                    textAnchor="middle"
                    fontSize="9"
                    fill="#64748B"
                  >
                    {d.date.length > 5 ? d.date.slice(5) : d.date}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            className="absolute -top-2 transform -translate-x-1/2 bg-neutral-900 text-white px-2.5 py-1.5 rounded-lg shadow-xl text-[10px] pointer-events-none z-20 flex items-center gap-3 border border-neutral-700"
            style={{
              left: `${((getX(hoveredIndex) / chartWidth) * 100).toFixed(1)}%`,
            }}
          >
            <div className="font-semibold text-neutral-300">{data[hoveredIndex].date}</div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-blue-500 inline-block" />
              <span>Created: <strong>{data[hoveredIndex].created || 0}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500 inline-block" />
              <span>Completed: <strong>{data[hoveredIndex].completed || 0}</strong></span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-3 text-xs font-semibold text-neutral-600">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-blue-500" />
          <span>Work Items Created</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full bg-emerald-500" />
          <span>Work Items Completed</span>
        </div>
      </div>
    </div>
  );
};
