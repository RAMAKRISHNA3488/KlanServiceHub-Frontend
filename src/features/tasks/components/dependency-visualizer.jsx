'use client';
import React from 'react';
import { ArrowRight, GitBranch, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const STATUS_PILL = {
  DONE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RESOLVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-800 border-amber-200',
  IN_REVIEW: 'bg-purple-50 text-purple-800 border-purple-200',
  TODO: 'bg-blue-50 text-blue-700 border-blue-200',
  BACKLOG: 'bg-neutral-100 text-neutral-700 border-neutral-300',
};

export function DependencyVisualizer({ currentTicketId, visualChains = [], onNavigateToTicket }) {
  if (!visualChains || visualChains.length === 0) return null;

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GitBranch className="size-4 text-blue-600" />
        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
          Dependency Flow & Blocking Chains
        </h4>
        <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-neutral-200/70 text-neutral-700">
          {visualChains.length} chain{visualChains.length > 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-2.5">
        {visualChains.map((chain, chainIdx) => {
          const isIncoming = chain.type === 'incoming';

          return (
            <div
              key={chainIdx}
              className="p-3 bg-white rounded-xl border border-neutral-200 shadow-2xs space-y-2"
            >
              <div className="flex items-center justify-between text-2xs">
                <span className="font-semibold text-neutral-600">
                  {chain.description}
                </span>
                {chain.hasUnresolved ? (
                  <span className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    <AlertCircle className="size-3" /> Unresolved
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle2 className="size-3" /> All Resolved
                  </span>
                )}
              </div>

              {/* Chain Flow Nodes */}
              <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs">
                {chain.nodes.map((node, nodeIdx) => {
                  const isCurrent = node.id === currentTicketId || node.isCurrent;
                  const isDone = node.status === 'DONE' || node.status === 'RESOLVED';
                  const pillClass = STATUS_PILL[node.status] || 'bg-neutral-100 text-neutral-700 border-neutral-200';

                  return (
                    <React.Fragment key={node.id || nodeIdx}>
                      {nodeIdx > 0 && (
                        <div className="flex flex-col items-center px-1 shrink-0">
                          <span className="text-3xs font-bold uppercase tracking-widest text-neutral-600">
                            blocks
                          </span>
                          <ArrowRight className="size-3.5 text-neutral-500" />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => !isCurrent && onNavigateToTicket && onNavigateToTicket(node.id)}
                        disabled={isCurrent}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left shrink-0 transition ${
                          isCurrent
                            ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-2xs'
                            : 'bg-white hover:bg-neutral-50 border-neutral-300 cursor-pointer hover:border-neutral-400'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className={`font-mono font-bold ${isCurrent ? 'text-blue-700 font-extrabold' : 'text-neutral-900'}`}>
                              {node.key || 'TASK'}
                            </span>
                            {isCurrent && (
                              <span className="text-3xs font-extrabold px-1.5 py-0.2 rounded bg-blue-600 text-white">
                                Current
                              </span>
                            )}
                          </div>
                          <p className="text-2xs text-neutral-500 truncate max-w-[120px]" title={node.name}>
                            {node.name}
                          </p>
                        </div>
                        <span className={`text-3xs font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${pillClass}`}>
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
