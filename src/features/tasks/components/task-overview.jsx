import { Pencil } from 'lucide-react';
import { DottedSeparator } from '@/components/dotted-separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { useEditTaskModal } from '@/features/tasks/hooks/use-edit-task-modal';
import { snakeCaseToTitleCase } from '@/lib/utils';
import { OverviewProperty } from './overview-property';
import { TaskDate } from './task-date';
export const TaskOverview = ({ task }) => {
    const { open } = useEditTaskModal();
    return (<div className="col-span-1 flex flex-col gap-y-4">
      <div className="rounded-lg bg-muted p-4">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Overview</p>

          <Button onClick={() => open(task.$id)} size="sm" variant="secondary">
            <Pencil className="mr-2 size-4"/>
            Edit
          </Button>
        </div>

        <DottedSeparator className="my-4"/>

        <div className="flex flex-col gap-y-4">
          <OverviewProperty label="Assignees">
            {task.assignees && task.assignees.length > 0 ? (
              <div className="flex flex-col gap-y-1.5">
                {task.assignees.map((a) => (
                  <div key={a.$id || a.id} className="flex items-center gap-x-2">
                    <MemberAvatar name={a.name} className="size-6"/>
                    <p className="text-sm font-medium text-neutral-800">{a.name}</p>
                  </div>
                ))}
              </div>
            ) : task.assignee ? (
              <div className="flex items-center gap-x-2">
                <MemberAvatar name={task.assignee.name} className="size-6"/>
                <p className="text-sm font-medium text-neutral-800">{task.assignee.name}</p>
              </div>
            ) : (
              <p className="text-sm text-neutral-400 italic">Unassigned</p>
            )}
          </OverviewProperty>

          <OverviewProperty label="Due Date">
            <TaskDate value={task.dueDate} className="text-sm font-medium"/>
          </OverviewProperty>

          <OverviewProperty label="Status">
            <Badge variant={task.status}>{snakeCaseToTitleCase(task.status)}</Badge>
          </OverviewProperty>
        </div>
      </div>
    </div>);
};
