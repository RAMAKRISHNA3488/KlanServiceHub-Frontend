import React, { useState } from 'react';

export const DonutChart = ({ data = [], total = 0, onSliceClick, size = 180, thickness = 26 }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0 || total === 0) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - thickness) / 2}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={thickness}
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
          <span className="text-2xl font-bold text-neutral-800">0</span>
          <span className="text-[11px] font-medium text-neutral-400">Total</span>
        </div>
      </div>
    );
  }

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  const validSlices = data.filter((d) => d.count > 0);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#F8FAFC"
          strokeWidth={thickness}
        />

        {validSlices.map((slice, index) => {
          const sliceFraction = slice.count / total;
          const strokeDasharray = `${sliceFraction * circumference} ${circumference}`;
          const strokeDashoffset = -accumulatedAngle * circumference;
          accumulatedAngle += sliceFraction;

          const isHovered = hoveredIdx === index;

          return (
            <circle
              key={slice.key || slice.label || index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={slice.color || '#3B82F6'}
              strokeWidth={isHovered ? thickness + 4 : thickness}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-200 cursor-pointer hover:opacity-90"
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
              onClick={() => onSliceClick && onSliceClick(slice)}
            />
          );
        })}
      </svg>

      {/* Center Label */}
      <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none transition-all">
        {hoveredIdx !== null && validSlices[hoveredIdx] ? (
          <>
            <span className="text-xl font-extrabold" style={{ color: validSlices[hoveredIdx].color }}>
              {validSlices[hoveredIdx].count}
            </span>
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider max-w-[80px] truncate">
              {validSlices[hoveredIdx].label}
            </span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold text-neutral-900">{total}</span>
            <span className="text-[11px] font-medium text-neutral-400">Total items</span>
          </>
        )}
      </div>
    </div>
  );
};
