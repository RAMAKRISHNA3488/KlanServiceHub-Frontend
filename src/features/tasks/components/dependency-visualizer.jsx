'use client';
import React from 'react';
import { ArrowRight, GitBranch, CheckCircle2, AlertCircle } from 'lucide-react';

const STATUS_PILL = {
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
  TODO: 'bg-slate-50 text-slate-700 border-slate-200',
  BACKLOG: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

export function DependencyVisualizer({ currentTicketId, visualChains = [], onNavigateToTicket }) {
  if (!visualChains || visualChains.length === 0) return null;

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <GitBranch className="size-3.5 text-blue-600" />
        <h4 className="text-[12px] font-semibold text-neutral-800">
          Dependency Flow & Blocking Chains
        </h4>
        <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-neutral-200/70 text-neutral-700">
          {visualChains.length} chain{visualChains.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2">
        {visualChains.map((chain, chainIdx) => {
          return (
            <div
              key={chainIdx}
              className="p-2.5 bg-white rounded-lg border border-neutral-200 shadow-2xs space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-medium text-neutral-600">
                  {chain.description}
                </span>
                {chain.hasUnresolved ? (
                  <span className="flex items-center gap-1 font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px]">
                    <AlertCircle className="size-3" /> Unresolved
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 text-[10px]">
                    <CheckCircle2 className="size-3" /> All Resolved
                  </span>
                )}
              </div>

              {/* Chain Flow Nodes */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                {chain.nodes.map((node, nodeIdx) => {
                  const isCurrent = node.id === currentTicketId || node.isCurrent;
                  const pillClass = STATUS_PILL[node.status] || 'bg-neutral-100 text-neutral-600 border-neutral-200';

                  return (
                    <React.Fragment key={node.id || nodeIdx}>
                      {nodeIdx > 0 && (
                        <div className="flex flex-col items-center px-1 shrink-0">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400">
                            blocks
                          </span>
                          <ArrowRight className="size-3 text-neutral-400" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => !isCurrent && onNavigateToTicket && onNavigateToTicket(node.id)}
                        disabled={isCurrent}
                        className={`flex items-center gap-2 px-2.5 py-1 rounded-md border text-left shrink-0 transition ${
                          isCurrent
                            ? 'bg-blue-50/70 border-blue-300 ring-1 ring-blue-500/20 shadow-2xs'
                            : 'bg-white hover:bg-neutral-50 border-neutral-200 cursor-pointer hover:border-neutral-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono text-[11px] font-semibold ${isCurrent ? 'text-blue-700' : 'text-neutral-900'}`}>
                              {node.key || 'TASK'}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-blue-600 text-white">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-500 truncate max-w-[100px]" title={node.name}>
                            {node.name}
                          </p>
                        </div>
                        <span className={`text-[9px] font-medium px-1 py-0.2 rounded border uppercase shrink-0 ${pillClass}`}>
                          {node.status || 'TODO'}
                        </span>
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DependencyVisualizer;
