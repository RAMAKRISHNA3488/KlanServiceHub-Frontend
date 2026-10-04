import React from 'react';
import {
  Zap,
  CheckSquare,
  Bug,
  Sparkles,
  Bookmark,
  GitCommit,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';

export const WorkTypeBreakdownCard = ({ workTypeData, loading = false, onDrillDown, onOpenHelp }) => {
  const { total = 0, breakdown = [] } = workTypeData || {};

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'epic':
        return <Zap className="size-3.5 text-purple-600" />;
      case 'task':
        return <CheckSquare className="size-3.5 text-blue-600" />;
      case 'bug':
        return <Bug className="size-3.5 text-rose-600" />;
      case 'feature':
        return <Sparkles className="size-3.5 text-emerald-600" />;
      case 'story':
        return <Bookmark className="size-3.5 text-emerald-600" />;
      case 'subtask':
      case 'sub-task':
        return <GitCommit className="size-3.5 text-cyan-600" />;
      default:
        return <CheckSquare className="size-3.5 text-neutral-500" />;
    }
  };

  const defaultTypes = [
    { type: 'Epic', color: '#9333EA', count: 0, percentage: 0 },
    { type: 'Task', color: '#3B82F6', count: 0, percentage: 0 },
    { type: 'Bug', color: '#EF4444', count: 0, percentage: 0 },
    { type: 'Feature', color: '#10B981', count: 0, percentage: 0 },
    { type: 'Story', color: '#10B981', count: 0, percentage: 0 },
    { type: 'Subtask', color: '#06B6D4', count: 0, percentage: 0 },
  ];

  const typesList = breakdown.length > 0 ? breakdown : defaultTypes;
  const isEmpty = total === 0;

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between min-h-[340px] transition-all hover:shadow-sm">
      {/* Card Header matching screenshot 1 */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">Types of work</h3>
          {!isEmpty && (
            <span className="text-[11px] font-semibold text-neutral-400">
              {total} total items
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Create some work items to view a breakdown of total work by work type.{' '}
          <button
            onClick={onOpenHelp}
            className="text-blue-600 hover:underline font-medium focus:outline-hidden"
          >
            What are work types?
          </button>
        </p>
      </div>

      {/* Table Header */}
      <div className="pt-4">
        <div className="grid grid-cols-12 text-[11px] font-bold text-neutral-400 pb-2 border-b border-neutral-100 uppercase tracking-wider">
          <div className="col-span-4">Type</div>
          <div className="col-span-8">Distribution</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-neutral-50 max-h-[190px] overflow-y-auto custom-scrollbar">
          {typesList.map((item) => (
            <div
              key={item.type}
              onClick={() =>
                !isEmpty &&
                onDrillDown &&
                onDrillDown({ workType: item.type, title: `${item.type} Work Items` })
              }
              className={`grid grid-cols-12 items-center py-2 text-xs transition ${
                !isEmpty ? 'cursor-pointer hover:bg-neutral-50/80 rounded-lg px-1' : ''
              }`}
            >
              {/* Type column */}
              <div className="col-span-4 flex items-center gap-2">
                <span className="shrink-0">{getTypeIcon(item.type)}</span>
                <span className="font-semibold text-neutral-800">{item.type}</span>
              </div>

              {/* Distribution column */}
              <div className="col-span-8 flex items-center gap-3">
                {isEmpty ? (
                  /* Empty state gray placeholder bar matching screenshot 1 */
                  <div className="w-full h-4 bg-neutral-200/70 rounded-md" />
                ) : (
                  /* Populated distribution bar with percentage and trend */
                  <>
                    <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percentage > 0 ? item.percentage : item.count > 0 ? 8 : 0}%`,
                          backgroundColor: item.color || '#3B82F6',
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 min-w-[70px] justify-end">
                      <span className="font-bold text-neutral-900">{item.count}</span>
                      <span className="text-[10px] text-neutral-400 font-medium">
                        ({item.percentage}%)
                      </span>
                      {item.trend !== undefined && item.trend !== 0 && (
                        <span
                          className={`text-[9px] font-bold flex items-center ${
                            item.trend > 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {item.trend > 0 ? '+' : ''}
                          {item.trend}%
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Standard Jira issue hierarchy</span>
        {!isEmpty && (
          <span className="text-neutral-500 font-medium">Dynamic DB calculation</span>
        )}
      </div>
    </div>
  );
};
