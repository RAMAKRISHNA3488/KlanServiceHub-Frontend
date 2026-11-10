import { Circle, CircleCheck, CircleDashed, CircleDot, CircleDotDashed, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateTaskModal } from '@/features/tasks/hooks/use-create-task-modal';
import { TaskStatus } from '@/features/tasks/types';
import { snakeCaseToTitleCase } from '@/lib/utils';

const statusIconMap = {
    [TaskStatus.BACKLOG]: <CircleDashed className="size-[18px] text-pink-400"/>,
    [TaskStatus.TODO]: <Circle className="size-[18px] text-red-400"/>,
    [TaskStatus.IN_PROGRESS]: <CircleDotDashed className="size-[18px] text-yellow-400"/>,
    [TaskStatus.IN_REVIEW]: <CircleDot className="size-[18px] text-blue-400"/>,
    [TaskStatus.DONE]: <CircleCheck className="size-[18px] text-emerald-400"/>,
};

export const KanbanColumnHeader = ({ board, label, color, category, taskCount, maxTasks = 5, overloadColor = '#EF4444' }) => {
    const { open } = useCreateTaskModal();
    const isDone = category === 'DONE' || board === TaskStatus.DONE || board === 'DONE';
    const limit = Number(maxTasks) > 0 ? Number(maxTasks) : 5;
    const isOverload = !isDone && (taskCount || 0) > limit;
    const displayLabel = label || snakeCaseToTitleCase(board);

    return (
      <div className="flex items-center justify-between px-1.5 py-1">
        <div className="flex items-center gap-x-1.5 min-w-0">
          {color ? (
            <span
              className="size-2.5 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: color }}
            />
          ) : (
            <span className="shrink-0">{statusIconMap[board] || <CircleDot className="size-3.5 text-blue-400" />}</span>
          )}
          
          <h2 className="text-xs font-semibold text-neutral-800 truncate max-w-[110px]" title={displayLabel}>
            {displayLabel}
          </h2>

          {isDone ? (
            <div className="flex size-4.5 min-w-4.5 px-1 items-center justify-center rounded bg-neutral-200/80 text-[10px] font-bold text-neutral-600" title="Completed tasks (exempt from capacity limit)">
              {taskCount || 0}
            </div>
          ) : isOverload ? (
            <div
              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-bold text-white shadow-2xs animate-pulse cursor-help"
              style={{ backgroundColor: overloadColor }}
              title={`Stage Overloaded: ${taskCount || 0} tickets (limit: ${limit})`}
            >
              <span>⚠️</span>
              <span>{taskCount || 0}/{limit}</span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-300/80 text-[9.5px] font-bold text-emerald-700 cursor-help"
              title={`Healthy Capacity: ${taskCount || 0} / ${limit} tickets`}
            >
              <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span>{taskCount || 0}/{limit}</span>
            </div>
          )}

          {isDone && (
            <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 tracking-tight shrink-0 uppercase">
              Done
            </span>
          )}
        </div>

        <Button
          onClick={() => open(board)}
          variant="ghost"
          size="icon"
          className="size-5 hover:bg-neutral-200/80 rounded p-0 shrink-0"
          title={`Create ${displayLabel} task`}
        >
          <Plus className="size-3 text-neutral-500"/>
        </Button>
      </div>
    );
};
