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

  const getShortName = (name) => {
    const n = (name || '');
    if (/critical/i.test(n)) return 'Critical';
    if (/high/i.test(n) && !/highest/i.test(n)) return 'High';
    if (/medium/i.test(n)) return 'Medium';
    if (/lowest/i.test(n)) return 'Lowest';
    if (/low/i.test(n)) return 'Low';
    return n.replace(/^P\d\s*/, '');
  };

  const chartHeight = 150;
  const chartWidth = 440;
  const paddingLeft = 38;
  const paddingBottom = 42;
  const paddingTop = 26;
  const paddingRight = 24;

  const usableHeight = chartHeight - paddingBottom - paddingTop;
  const usableWidth = chartWidth - paddingLeft - paddingRight;

  return (
    <div className="w-full flex flex-col justify-end">
      <div className="relative w-full" style={{ minHeight: chartHeight }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
          {/* Y Axis line */}
          <line
            x1={paddingLeft}
            y1={paddingTop - 6}
            x2={paddingLeft}
            y2={chartHeight - paddingBottom}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          {/* X Axis baseline */}
          <line
            x1={paddingLeft}
            y1={chartHeight - paddingBottom}
            x2={chartWidth - paddingRight + 8}
            y2={chartHeight - paddingBottom}
            stroke="#CBD5E1"
            strokeWidth="1.5"
          />

          {/* 0 label on Y axis */}
          <text
            x={paddingLeft - 8}
            y={chartHeight - paddingBottom + 3}
            textAnchor="end"
            fontSize="10"
            fontWeight="500"
            fill="#64748B"
            fontFamily="inherit"
          >
            0
          </text>

          {/* Max count label */}
          {maxCount > 5 && (
            <text
              x={paddingLeft - 8}
              y={paddingTop + 4}
              textAnchor="end"
              fontSize="9.5"
              fontWeight="600"
              fill="#64748B"
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
            const shortName = getShortName(item.priority);

            return (
              <g
                key={item.priority}
                className="cursor-pointer group"
                onClick={() => onPriorityClick && onPriorityClick(item)}
                onMouseEnter={() => setHoveredPriority(item.priority)}
                onMouseLeave={() => setHoveredPriority(null)}
              >
                {/* Clickable hit area */}
                <rect
                  x={x - 24}
                  y={paddingTop - 10}
                  width="48"
                  height={usableHeight + paddingBottom}
                  fill="transparent"
                />

                {/* Subtle vertical guide line on hover */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={paddingTop - 6}
                    x2={x}
                    y2={chartHeight - paddingBottom}
                    stroke={item.color}
                    strokeDasharray="2 2"
                    strokeWidth="1.5"
                    opacity="0.5"
                  />
                )}

                {/* Vertical Bar */}
                {item.count > 0 && (
                  <rect
                    x={x - 10}
                    y={y}
                    width="20"
                    height={barHeight}
                    fill={item.color}
                    rx="4"
                    className="transition-all duration-300 group-hover:brightness-110 drop-shadow-xs"
                  />
                )}

                {/* Point indicator on top of bar or line */}
                <circle
                  cx={x}
                  cy={item.count > 0 ? y : chartHeight - paddingBottom}
                  r={isHovered ? 5 : 3.5}
                  fill={item.color}
                  stroke="#FFFFFF"
                  strokeWidth="1"
                  className="transition-all duration-150"
                />

                {/* Count badge directly above the bar */}
                {item.count > 0 && (
                  <text
                    x={x}
                    y={y - 6}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill={item.color}
                  >
                    {item.count}
                  </text>
                )}

                {/* X axis tick */}
                <line
                  x1={x}
                  y1={chartHeight - paddingBottom}
                  x2={x}
                  y2={chartHeight - paddingBottom + 5}
                  stroke="#94A3B8"
                  strokeWidth="1.5"
                />

                {/* Priority Label directly below the axis tick */}
                <text
                  x={x}
                  y={chartHeight - paddingBottom + 18}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight={isHovered || item.count > 0 ? '700' : '600'}
                  fill={item.count > 0 ? item.color : '#64748B'}
                  className="transition-colors select-none"
                >
                  {shortName}
                </text>

                {/* Item count / percentage under priority label */}
                <text
                  x={x}
                  y={chartHeight - paddingBottom + 31}
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="600"
                  fill={item.count > 0 ? '#334155' : '#94A3B8'}
                  className="select-none"
                >
                  {item.count > 0 ? `${item.count} (${item.percentage || Math.round((item.count / (total || 1)) * 100)}%)` : '0'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

