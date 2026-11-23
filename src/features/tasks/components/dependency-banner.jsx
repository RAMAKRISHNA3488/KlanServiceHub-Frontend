'use client';
import React from 'react';
import { ArrowRight, ShieldAlert } from 'lucide-react';

export function DependencyBanner({ unresolvedBlockers = [], onNavigateToTicket }) {
  if (!unresolvedBlockers || unresolvedBlockers.length === 0) return null;

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-3 shadow-2xs text-rose-900 transition animate-in fade-in">
      <div className="flex items-start gap-2.5">
        <div className="p-1 rounded-md bg-rose-100 text-rose-700 shrink-0 mt-0.5">
          <ShieldAlert className="size-3.5" />
        </div>
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-[12px] font-semibold text-rose-800">
              Work Blocked by Unresolved Dependencies
            </h4>
            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              {unresolvedBlockers.length} blocker{unresolvedBlockers.length > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-[11px] text-rose-700 leading-normal">
            This ticket cannot progress until the following dependency ticket{unresolvedBlockers.length > 1 ? 's are' : ' is'} resolved:
          </p>
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            {unresolvedBlockers.map((blocker) => {
              const bKey = blocker.ticket?.key || blocker.key || 'TICKET';
              const bTitle = blocker.ticket?.title || blocker.ticket?.name || blocker.name || '';
              const bStatus = blocker.ticket?.status || blocker.status || 'TODO';
              const bId = blocker.ticket?.id || blocker.id;

              return (
                <button
                  key={bId || bKey}
                  type="button"
                  onClick={() => onNavigateToTicket && onNavigateToTicket(bId)}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-white text-rose-900 border border-rose-200 hover:border-rose-300 hover:bg-rose-50 shadow-2xs transition group cursor-pointer"
                  title={`${bKey}: ${bTitle}`}
                >
                  <span className="font-mono font-semibold text-rose-800">{bKey}</span>
                  <span className="text-[10px] font-medium px-1 py-0.2 rounded bg-rose-50 text-rose-700 border border-rose-200/60">
                    {bStatus}
                  </span>
                  <ArrowRight className="size-3 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DependencyBanner;
