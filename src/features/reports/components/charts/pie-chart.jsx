import React, { useState } from 'react';

export const PieChart = ({
  data = [],
  size = 200,
  innerRadius = 0, // 0 for full Pie Chart, > 0 for Donut Chart
  title = '',
  onSliceClick,
  showLegend = true,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const validData = data.filter((item) => Number(item.value) > 0);

  if (!validData.length || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-neutral-400 space-y-2">
        <div
          className="rounded-full border-4 border-dashed border-neutral-200 flex items-center justify-center"
          style={{ width: size * 0.7, height: size * 0.7 }}
        >
          <span className="text-xs font-semibold text-neutral-400">No Data</span>
        </div>
        {title && <span className="text-xs font-bold text-neutral-600">{title}</span>}
      </div>
    );
  }

  const center = size / 2;
  const radius = size / 2 - 10;
  const isDonut = innerRadius > 0;
  const holeRadius = isDonut ? innerRadius : 0;

  // Helper to calculate SVG arc path
  let cumulativeAngle = 0;
  const slices = validData.map((slice, index) => {
    const value = Number(slice.value) || 0;
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const sliceAngle = total > 0 ? (value / total) * 2 * Math.PI : 0;

    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + sliceAngle;
    cumulativeAngle += sliceAngle;

    // Outer arc points
    const x1 = center + radius * Math.cos(startAngle - Math.PI / 2);
    const y1 = center + radius * Math.sin(startAngle - Math.PI / 2);
    const x2 = center + radius * Math.cos(endAngle - Math.PI / 2);
    const y2 = center + radius * Math.sin(endAngle - Math.PI / 2);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    let pathData;
    if (isDonut) {
      const ix1 = center + holeRadius * Math.cos(endAngle - Math.PI / 2);
      const iy1 = center + holeRadius * Math.sin(endAngle - Math.PI / 2);
      const ix2 = center + holeRadius * Math.cos(startAngle - Math.PI / 2);
      const iy2 = center + holeRadius * Math.sin(startAngle - Math.PI / 2);

      pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${holeRadius} ${holeRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
        'Z',
      ].join(' ');
    } else {
      pathData = [
        `M ${center} ${center}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z',
      ].join(' ');
    }

    // Midpoint for label / hover
    const midAngle = startAngle + sliceAngle / 2;
    const labelRadius = isDonut ? (radius + holeRadius) / 2 : radius * 0.65;
    const lx = center + labelRadius * Math.cos(midAngle - Math.PI / 2);
    const ly = center + labelRadius * Math.sin(midAngle - Math.PI / 2);

    return {
      ...slice,
      index,
      percentage: Math.round(percentage),
      pathData,
      lx,
      ly,
    };
  });

  return (
    <div className="flex flex-col items-center">
      {title && (
        <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-2">
          {title}
        </h4>
      )}

      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {slices.map((slice) => {
            const isHovered = hoveredIdx === slice.index;
            return (
              <g key={slice.label || slice.index}>
                <path
                  d={slice.pathData}
                  fill={slice.color || '#3B82F6'}
                  className="transition-all duration-200 cursor-pointer hover:opacity-90"
                  style={{
                    transformOrigin: `${center}px ${center}px`,
                    transform: isHovered ? 'scale(1.04)' : 'scale(1)',
                    filter: isHovered ? 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))' : 'none',
                  }}
                  onMouseEnter={() => setHoveredIdx(slice.index)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => onSliceClick && onSliceClick(slice)}
                />
              </g>
            );
          })}
        </svg>

        {/* Donut Center Display */}
        {isDonut && (
          <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none transition-all">
            {hoveredIdx !== null && slices[hoveredIdx] ? (
              <>
                <span className="text-lg font-black" style={{ color: slices[hoveredIdx].color }}>
                  {slices[hoveredIdx].value}
                </span>
                <span className="text-[10px] font-bold text-neutral-600 truncate max-w-[70px]">
                  {slices[hoveredIdx].label} ({slices[hoveredIdx].percentage}%)
                </span>
              </>
            ) : (
              <>
                <span className="text-xl font-bold text-neutral-900">{total}</span>
                <span className="text-[10px] font-semibold text-neutral-400">Total</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Interactive Legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-3 pt-2 border-t border-neutral-100 max-w-xs">
          {slices.map((slice) => (
            <button
              key={slice.label}
              onClick={() => onSliceClick && onSliceClick(slice)}
              onMouseEnter={() => setHoveredIdx(slice.index)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition cursor-pointer ${
                hoveredIdx === slice.index
                  ? 'bg-neutral-100 shadow-2xs font-bold text-neutral-900'
                  : 'text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <span
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span>{slice.label}</span>
              <span className="font-bold text-neutral-900 ml-0.5">{slice.value}</span>
              <span className="text-[10px] text-neutral-400">({slice.percentage}%)</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PieChart;
