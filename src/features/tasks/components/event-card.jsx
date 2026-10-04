import { useRouter } from 'next/navigation';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { TaskStatus } from '@/features/tasks/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { cn } from '@/lib/utils';
const statusColorMap = {
    [TaskStatus.BACKLOG]: 'border-l-pink-500',
    [TaskStatus.TODO]: 'border-l-red-500',
    [TaskStatus.IN_PROGRESS]: 'border-l-yellow-500',
    [TaskStatus.IN_REVIEW]: 'border-l-blue-500',
    [TaskStatus.DONE]: 'border-l-emerald-500',
};
export const EventCard = ({ title, assignee, assignees, project, status, id }) => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const memberList = (assignees && assignees.length > 0) ? assignees : (assignee ? [assignee] : []);
    const memberNames = memberList.map((m) => m.name).join(', ') || 'Unassigned';

    const onClick = (e) => {
        e.stopPropagation();
        router.push(`/workspaces/${workspaceId}/tasks/${id}`);
    };
    return (<div className="px-2">
      <button onClick={onClick} className={cn('flex cursor-pointer flex-col gap-y-1.5 rounded-md border border-l-4 bg-white p-1.5 text-xs text-primary transition hover:opacity-75', statusColorMap[status])}>
        <p className="font-medium truncate">{title}</p>

        <div className="flex items-center gap-x-1" title={memberNames}>
          {memberList.length > 1 ? (
            <div className="flex items-center -space-x-1 overflow-hidden">
              {memberList.slice(0, 2).map((m, i) => (
                <MemberAvatar key={m.$id || m.id || i} name={m.name} className="size-4 ring-1 ring-white" fallbackClassName="text-[8px]"/>
              ))}
              {memberList.length > 2 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-neutral-100 ring-1 ring-white text-[8px] font-bold text-neutral-600">
                  +{memberList.length - 2}
                </span>
              )}
            </div>
          ) : (
            <MemberAvatar name={memberList[0]?.name} className="size-4" fallbackClassName="text-[8px]"/>
          )}

          <div aria-hidden className="size-1 rounded-full bg-neutral-300"/>
          <ProjectAvatar name={project?.name} image={project?.imageUrl} className="size-4" fallbackClassName="text-[8px]"/>
        </div>
      </button>
    </div>);
};
