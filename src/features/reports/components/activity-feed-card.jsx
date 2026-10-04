import React from 'react';
import {
  Activity,
  User,
  Clock,
  CheckCircle2,
  GitCommit,
  PlusCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const ActivityFeedCard = ({ activities = [], loading = false, onOpenActivityDetails }) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs animate-pulse space-y-4 h-[320px]">
        <div className="h-4 w-32 bg-neutral-200 rounded" />
        <div className="h-3 w-48 bg-neutral-100 rounded" />
        <div className="space-y-3 pt-4">
          <div className="h-6 bg-neutral-100 rounded" />
          <div className="h-6 bg-neutral-100 rounded" />
          <div className="h-6 bg-neutral-100 rounded" />
        </div>
      </div>
    );
  }

  const isEmpty = !activities || activities.length === 0;

  const formatActivityText = (item) => {
    const actor = item.actor_name || item.userName || 'A teammate';
    const action = item.action || 'updated';
    const target = item.task_name || item.task_key || item.project_name || 'an item';

    let actionLabel = action.toLowerCase().replace(/_/g, ' ');
    return (
      <span>
        <strong className="text-neutral-900 font-semibold">{actor}</strong> {actionLabel}{' '}
        <span className="font-semibold text-blue-600">{target}</span>
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between min-h-[340px] transition-all hover:shadow-sm">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Activity className="size-4 text-blue-600" />
            Organization Activity
          </h3>
          {!isEmpty && (
            <span className="text-[11px] font-semibold text-neutral-400">
              Live Feed
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          {isEmpty
            ? 'Chronological event history across projects, work items, and memberships.'
            : 'Recent events and updates across your organization.'}
        </p>
      </div>

      {/* Main Content */}
      {isEmpty ? (
        /* Empty State Matching Screenshot 1 */
        <div className="my-auto flex flex-col items-center justify-center py-6 text-center select-none">
          {/* Card stack illustration matching screenshot 1 */}
          <div className="relative size-12 mb-3">
            <div className="absolute top-0 right-1 size-8 bg-neutral-300/80 rounded-sm" />
            <div className="absolute bottom-0 left-1 size-9 bg-blue-700 rounded-sm flex items-center justify-center shadow-xs">
              <CheckCircle2 className="size-4 text-white" />
            </div>
          </div>
          <span className="text-sm font-bold text-neutral-900">No activity yet</span>
          <p className="text-xs text-neutral-500 mt-1 max-w-xs">
            Create a few work items and invite some teammates to your space to see your space activity.
          </p>
        </div>
      ) : (
        /* Live Activity Stream */
        <div className="pt-3 divide-y divide-neutral-100 max-h-[200px] overflow-y-auto custom-scrollbar">
          {activities.map((act) => {
            let timeAgo = 'recently';
            try {
              if (act.created_at || act.$createdAt) {
                timeAgo = formatDistanceToNow(new Date(act.created_at || act.$createdAt), { addSuffix: true });
              }
            } catch (e) {}

            return (
              <div
                key={act.id || act.$id}
                className="py-2.5 flex items-start gap-3 hover:bg-neutral-50/60 rounded-lg px-2 transition text-xs"
              >
                {/* User Avatar */}
                <div className="size-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 font-bold text-[10px] mt-0.5 border border-blue-200">
                  {act.actor_avatar ? (
                    <img src={act.actor_avatar} alt="" className="size-full rounded-full object-cover" />
                  ) : (
                    (act.actor_name || 'U').slice(0, 1).toUpperCase()
                  )}
                </div>

                {/* Event Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-neutral-700 leading-snug truncate">{formatActivityText(act)}</p>
                  <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                    <span>{timeAgo}</span>
                    {act.project_key && (
                      <>
                        <span>•</span>
                        <span className="font-mono text-neutral-500">{act.project_key}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Real-time audit telemetry</span>
        {!isEmpty && (
          <span className="text-neutral-500 font-medium">{activities.length} events logged</span>
        )}
      </div>
    </div>
  );
};
