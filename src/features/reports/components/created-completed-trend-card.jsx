import React, { useState } from 'react';
import { TrendChart } from './charts/trend-chart';
import { TrendingUp, Calendar, RefreshCw } from 'lucide-react';

export const CreatedCompletedTrendCard = ({ trendsData, loading = false, onIntervalChange, currentInterval = 'daily' }) => {
  const { trends = [] } = trendsData || {};

  const totalCreated = trends.reduce((acc, t) => acc + (t.created || 0), 0);
  const totalCompleted = trends.reduce((acc, t) => acc + (t.completed || 0), 0);
  const netRatio = totalCreated > 0 ? Math.round((totalCompleted / totalCreated) * 100) : 100;

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs space-y-4 transition-all hover:shadow-sm">
      {/* Header with Interval Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-600" />
            Created vs. Completed Trend
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Throughput rate of newly introduced work vs resolved deliverables over time.
          </p>
        </div>

        {/* Interval Buttons */}
        <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-xl text-xs font-semibold select-none">
          {['daily', 'weekly', 'monthly'].map((intv) => (
            <button
              key={intv}
              onClick={() => onIntervalChange && onIntervalChange(intv)}
              className={`rounded-lg px-2.5 py-1 transition text-[11px] capitalize ${
                currentInterval === intv
                  ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {intv}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Header Summary */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Created</span>
          <span className="text-xl font-black text-blue-900 mt-1 block">{totalCreated}</span>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block">Completed</span>
          <span className="text-xl font-black text-emerald-900 mt-1 block">{totalCompleted}</span>
        </div>
        <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 block">Net Throughput</span>
          <span className="text-xl font-black text-purple-900 mt-1 block">{netRatio}%</span>
        </div>
      </div>

      {/* Line Chart */}
      <div className="pt-2">
        {loading ? (
          <div className="h-52 flex items-center justify-center">
            <RefreshCw className="size-6 animate-spin text-neutral-400" />
          </div>
        ) : (
          <TrendChart data={trends} height={200} />
        )}
      </div>
    </div>
  );
};
