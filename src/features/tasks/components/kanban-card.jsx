import { MoreHorizontal } from 'lucide-react';
import { DottedSeparator } from '@/components/dotted-separator';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { TaskActions } from './task-actions';
import { TaskDate } from './task-date';
export const KanbanCard = ({ task }) => {
    const assignees = (task.assignees && task.assignees.length > 0) 
      ? task.assignees 
      : (task.assignee ? [task.assignee] : []);
    const assigneeNames = assignees.map(a => a.name).join(', ') || 'Unassigned';
    const projectName = task.project?.name || 'Project';
    const projectImage = task.project?.imageUrl;

    return (<div className="mb-2.5 space-y-2.5 rounded-xl border border-neutral-200 bg-white p-3 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-x-2">
        <div className="space-y-1">
          {task.key && (
            <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              {task.key}
            </span>
          )}
          <p className="line-clamp-2 text-xs font-semibold text-neutral-900 break-words">{task.name}</p>
        </div>

        <TaskActions id={task.$id} projectId={task.projectId}>
          <MoreHorizontal className="size-[18px] shrink-0 cursor-pointer stroke-1 text-neutral-700 transition hover:opacity-75"/>
        </TaskActions>
      </div>

      <DottedSeparator />

      <div className="flex items-center justify-between gap-x-2">
        <div className="flex items-center gap-x-1.5" title={assigneeNames}>
          {assignees.length > 1 ? (
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              {assignees.slice(0, 3).map((a, idx) => (
                <MemberAvatar key={a.$id || a.id || idx} name={a.name} className="size-5 ring-1 ring-white" fallbackClassName="text-[9px]" />
              ))}
              {assignees.length > 3 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-neutral-100 ring-1 ring-white text-[9px] font-bold text-neutral-600">
                  +{assignees.length - 3}
                </span>
              )}
            </div>
          ) : (
            <MemberAvatar name={assignees[0]?.name || 'Unassigned'} className="size-5" fallbackClassName="text-[10px]"/>
          )}
          <span className="text-[11px] text-neutral-500 truncate max-w-[110px]">
            {assignees.length > 1 ? `${assignees.length} Assignees` : (assignees[0]?.name || 'Unassigned')}
          </span>
        </div>

        <TaskDate value={task.dueDate} className="text-xs shrink-0"/>
      </div>

      <div className="flex items-center gap-x-1.5">
        <ProjectAvatar name={projectName} image={projectImage} fallbackClassName="text-[10px]"/>
        <span className="text-xs font-medium text-neutral-600 truncate">{projectName}</span>
      </div>
    </div>);
};
