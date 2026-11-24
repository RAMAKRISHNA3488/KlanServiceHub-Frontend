import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ChevronRight,
  TrendingUp,
  User,
  ExternalLink,
} from 'lucide-react';

export const BottleneckDiagnosticsCard = ({
  bottlenecks = {},
  loading = false,
  onDrillDown = () => {},
  onOpenTask = null,
}) => {
  const { primary = {}, stages = [] } = bottlenecks;
  const [selectedStageKey, setSelectedStageKey] = useState(null);

  // Active selected stage details or primary bottleneck stage
  const activeStage = stages.find((s) => s.stage === selectedStageKey) || primary || stages[0] || {};
  const isOptimal = !primary.isBottleneck;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-neutral-900">
              Automated Bottleneck Detection & Process Diagnostics
            </h3>
            <span
              className={`rounded-full px-2 py-0.2 text-[9px] font-bold ${
                isOptimal ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {isOptimal ? 'Balanced Flow' : 'Action Required'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Statistical flow diagnostics detecting queue accumulation, dwell times, and delivery friction across active workflow stages.
          </p>
        </div>
      </div>

      {/* Primary Bottleneck Status Alert Banner */}
      {isOptimal ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-emerald-950">
              Optimal Workflow Velocity – No Stage Bottlenecks
            </h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              {primary.message || 'Work is flowing evenly across all stages with no critical queue accumulation or excessive dwell times.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-700 shrink-0">
              <ShieldAlert className="size-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.2 rounded-full">
                  {primary.severity || 'CRITICAL'} BOTTLENECK
                </span>
                <h4 className="text-xs font-bold text-rose-950">
                  Friction in Stage: {primary.label || primary.stage}
                </h4>
              </div>
              <p className="text-[11px] text-rose-900 leading-relaxed">
                <strong>{primary.accumulatedCount} tickets</strong> are currently queued with an average dwell time of{' '}
                <strong>{primary.avgDwellTimeDays} days</strong> in this stage.
              </p>
            </div>
          </div>

          <button
            onClick={() => onDrillDown({ status: primary.stage })}
            className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-medium text-white shadow-2xs hover:bg-rose-700 transition shrink-0 flex items-center gap-1 self-end sm:self-auto cursor-pointer"
          >
            <span>Inspect Affected Tickets</span>
            <ArrowRight className="size-2.5" />
          </button>
        </div>
      )}

      {/* Stage Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stages.map((st) => {
          const isSelected = (selectedStageKey || primary.stage) === st.stage;
          const isCrit = st.severity === 'CRITICAL';
          const isWarn = st.severity === 'WARNING';

          return (
            <div
              key={st.stage}
              onClick={() => setSelectedStageKey(st.stage)}
              className={`rounded-xl border p-3.5 transition cursor-pointer relative ${
                isSelected
                  ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/30'
                  : 'border-neutral-200 bg-white hover:border-neutral-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-900">{st.label}</span>
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                    isCrit
                      ? 'bg-rose-100 text-rose-700'
                      : isWarn
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {st.severity}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-neutral-600 text-xs my-2">
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                  <span className="text-[10px] text-neutral-400 block font-semibold">Accumulated</span>
                  <strong className="text-sm font-extrabold text-neutral-900">{st.accumulatedCount}</strong>
                  <span className="text-[10px] text-neutral-400 ml-0.5">tickets</span>
                </div>
                <div className="bg-neutral-50 p-2 rounded-lg border border-neutral-100">
                  <span className="text-[10px] text-neutral-400 block font-semibold">Avg Dwell</span>
                  <strong className="text-sm font-extrabold text-neutral-900">{st.avgDwellTimeDays}</strong>
                  <span className="text-[10px] text-neutral-400 ml-0.5">days</span>
                </div>
              </div>

              {/* Dwell Progress / Capacity Indicator */}
              <div className="w-full bg-neutral-100 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.max(10, (st.avgDwellTimeDays / 7) * 100))}%`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Stage Detail & Affected Tickets List */}
      {activeStage && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-blue-600" />
              <h4 className="text-xs font-bold text-neutral-900">
                Tickets In {activeStage.label || activeStage.stage} Stage (Longest Waiting First)
              </h4>
              <span className="rounded-full bg-neutral-200 text-neutral-700 px-2 py-0.2 text-[9px] font-bold">
                {activeStage.affectedTickets?.length || 0} Listed
              </span>
            </div>

            <button
              onClick={() => onDrillDown({ status: activeStage.stage })}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View Full History Drill-down <ChevronRight className="size-3" />
            </button>
          </div>

          {/* Agile Process Recommendation Box */}
          <div className="rounded-lg bg-blue-50/80 border border-blue-100 p-3 flex items-start gap-2.5">
            <Sparkles className="size-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-[11px] text-blue-950">
              <strong className="font-bold">Agile Process Recommendation: </strong>
              {activeStage.recommendation || 'Maintain steady cadence and respect WIP limits.'}
            </div>
          </div>

          {/* Tickets List */}
          {activeStage.affectedTickets && activeStage.affectedTickets.length > 0 ? (
            <div className="divide-y divide-neutral-200 bg-white rounded-lg border border-neutral-200 overflow-hidden">
              {activeStage.affectedTickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    if (onOpenTask) {
                      onOpenTask(t.id);
                    } else {
                      onDrillDown({ status: activeStage.stage });
                    }
                  }}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-neutral-50 transition cursor-pointer group"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-2.5">
                    <span className="font-mono text-[10px] font-bold bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded shrink-0">
                      {t.key}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                        t.priority === 'CRITICAL' || t.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                    <h5 className="text-xs font-semibold text-neutral-900 group-hover:text-blue-600 truncate">
                      {t.name}
                    </h5>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-xs">
                    {/* Assignee */}
                    <div className="flex items-center gap-1.5 text-neutral-500">
                      {t.assigneeAvatar ? (
                        <img src={t.assigneeAvatar} alt="" className="size-4 rounded-full object-cover" />
                      ) : (
                        <User className="size-3.5 text-neutral-400" />
                      )}
                      <span className="text-[11px] truncate max-w-[100px]">{t.assigneeName}</span>
                    </div>

                    {/* Dwell Time Badge */}
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        t.daysInStage >= 4
                          ? 'bg-rose-100 text-rose-700'
                          : t.daysInStage >= 2
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <Clock className="size-3" />
                      {t.daysInStage}d waiting
                    </span>

                    <ExternalLink className="size-3.5 text-neutral-300 group-hover:text-blue-600 transition" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-neutral-400 bg-white rounded-lg border border-neutral-200">
              No tickets currently waiting in this stage.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
