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

export const KanbanColumnHeader = ({ board, label, color, category, taskCount }) => {
    const { open } = useCreateTaskModal();
    const isDone = category === 'DONE' || board === TaskStatus.DONE || board === 'DONE';
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
          
          <h2 className="text-xs font-semibold text-neutral-800 truncate max-w-[120px]" title={displayLabel}>
            {displayLabel}
          </h2>

          <div className="flex size-4.5 min-w-4.5 px-1 items-center justify-center rounded bg-neutral-200/80 text-[10px] font-bold text-neutral-600">
            {taskCount || 0}
          </div>

          {isDone && (
            <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 tracking-tight shrink-0 uppercase">
              Admin
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
