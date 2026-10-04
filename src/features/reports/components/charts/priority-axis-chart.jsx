import React, { useState } from 'react';

export const PriorityAxisChart = ({ data = [], total = 0, onPriorityClick }) => {
  const [hoveredPriority, setHoveredPriority] = useState(null);

  // P0 - Critical, P1 - High, P2 - Medium, P3 - Low, P4 - Lowest
  const priorities = data.length > 0 ? data : [
    { priority: 'P0 Critical', rawPriority: 'CRITICAL', count: 0, color: '#E11D48' },
    { priority: 'P1 High', rawPriority: 'HIGH', count: 0, color: '#F97316' },
    { priority: 'P2 Medium', rawPriority: 'MEDIUM', count: 0, color: '#EAB308' },
    { priority: 'P3 Low', rawPriority: 'LOW', count: 0, color: '#3B82F6' },
    { priority: 'P4 Lowest', rawPriority: 'LOWEST', count: 0, color: '#64748B' },
  ];

  const maxCount = Math.max(...priorities.map((p) => p.count || 0), 5);

  const getPrioritySymbol = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('p0') || n.includes('critical') || n.includes('highest') || n.includes('urgent')) return '🔥';
    if (n.includes('p1') || n.includes('high')) return '⮝';
    if (n.includes('p2') || n.includes('medium')) return '=';
    if (n.includes('p3') || n.includes('low') && !n.includes('lowest')) return '⮟';
    if (n.includes('p4') || n.includes('lowest')) return '⮟⮟';
    return '•';
  };

  const chartHeight = 130;
  const chartWidth = 420;
  const paddingLeft = 35;
  const paddingBottom = 30;
  const paddingTop = 15;
  const paddingRight = 20;

  const usableHeight = chartHeight - paddingBottom - paddingTop;
  const usableWidth = chartWidth - paddingLeft - paddingRight;

  return (
    <div className="w-full flex flex-col justify-end">
      <div className="relative w-full overflow-hidden" style={{ height: chartHeight }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
          {/* Y Axis line */}
          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={chartHeight - paddingBottom}
            stroke="#94A3B8"
            strokeWidth="1.5"
          />

          {/* X Axis baseline */}
          <line
            x1={paddingLeft}
            y1={chartHeight - paddingBottom}
            x2={chartWidth - paddingRight}
            y2={chartHeight - paddingBottom}
            stroke="#94A3B8"
            strokeWidth="1.5"
          />

          {/* 0 label on Y axis */}
          <text
            x={paddingLeft - 10}
            y={chartHeight - paddingBottom + 3}
            textAnchor="end"
            fontSize="10"
            fill="#64748B"
            fontFamily="inherit"
          >
            0
          </text>

          {/* Max count label */}
          {maxCount > 5 && (
            <text
              x={paddingLeft - 10}
              y={paddingTop + 8}
              textAnchor="end"
              fontSize="9"
              fill="#94A3B8"
              fontFamily="inherit"
            >
              {maxCount}
            </text>
          )}

          {/* Bars / Points for each priority */}
          {priorities.map((item, index) => {
            const step = usableWidth / (priorities.length - 1 || 1);
            const x = paddingLeft + index * step;
            const barHeight = maxCount > 0 ? (item.count / maxCount) * usableHeight : 0;
            const y = chartHeight - paddingBottom - barHeight;
            const isHovered = hoveredPriority === item.priority;

            return (
              <g key={item.priority} className="cursor-pointer group" onClick={() => onPriorityClick && onPriorityClick(item)}>
                {/* Clickable hit area */}
                <rect
                  x={x - 22}
                  y={paddingTop}
                  width="44"
                  height={usableHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredPriority(item.priority)}
                  onMouseLeave={() => setHoveredPriority(null)}
                />

                {/* Subtle vertical guide line on hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={chartHeight - paddingBottom}
                    stroke={item.color}
                    strokeDasharray="2 2"
                    strokeWidth="1"
                    opacity="0.4"
                  />
                )}

                {/* Vertical Bar */}
                {item.count > 0 && (
                  <rect
                    x={x - 8}
                    y={y}
                    width="16"
                    height={barHeight}
                    fill={item.color}
                    rx="3"
                    className="transition-all duration-300 group-hover:brightness-110"
                  />
                )}

                {/* Point indicator on top of bar or line */}
                <circle
                  cx={x}
                  cy={item.count > 0 ? y : chartHeight - paddingBottom}
                  r={isHovered ? 4.5 : 3}
                  fill={item.color}
                  className="transition-all duration-150"
                />

                {/* Count tooltip on hover */}
                {isHovered && item.count > 0 && (
                  <g>
                    <rect
                      x={x - 14}
                      y={y - 20}
                      width="28"
                      height="16"
                      rx="4"
                      fill="#1E293B"
                    />
                    <text
                      x={x}
                      y={y - 9}
                      textAnchor="middle"
                      fontSize="9"
                      fontWeight="bold"
                      fill="#FFFFFF"
                    >
                      {item.count}
                    </text>
                  </g>
                )}

                {/* X axis tick */}
                <line
                  x1={x}
                  y1={chartHeight - paddingBottom}
                  x2={x}
                  y2={chartHeight - paddingBottom + 4}
                  stroke="#94A3B8"
                  strokeWidth="1"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Priority Legend Row (Matching screenshot icons and colors) */}
      <div className="flex items-center justify-between pt-1 px-4 text-[11px] font-medium select-none">
        {priorities.map((item) => (
          <button
            key={item.priority}
            onClick={() => onPriorityClick && onPriorityClick(item)}
            className="flex items-center gap-1 hover:opacity-80 transition py-0.5"
            style={{ color: item.color }}
          >
            <span className="font-bold text-xs">{getPrioritySymbol(item.priority)}</span>
            <span>{item.priority}</span>
            {item.count > 0 && (
              <span className="ml-0.5 rounded-full bg-neutral-100 px-1.5 py-0.2 text-[9px] font-bold text-neutral-600">
                {item.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
