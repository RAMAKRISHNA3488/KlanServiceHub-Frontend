import { ExternalLink, PencilIcon, Trash, Share2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useDeleteTask } from '@/features/tasks/api/use-delete-task';
import { useEditTaskModal } from '@/features/tasks/hooks/use-edit-task-modal';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { tasksApi } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const TaskActions = ({ id, projectId, isFavorite, children }) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();
    const { open } = useEditTaskModal();
    const [ConfirmDialog, confirm] = useConfirm('Delete task', 'This action cannot be undone.', 'destructive');
    const { mutate: deleteTask, isPending } = useDeleteTask();

    const onCopyLink = (e) => {
        e?.stopPropagation();
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${origin}/workspaces/${workspaceId}/tasks/${id}`;
        if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText(url);
        }
        toast.success('Ticket link copied to clipboard!');
    };

    const onToggleFavorite = async (e) => {
        e?.stopPropagation();
        try {
            const res = await tasksApi.toggleFavorite(id);
            if (res?.success) {
                queryClient.invalidateQueries({ queryKey: ['tasks'] });
                queryClient.invalidateQueries({ queryKey: ['task', id] });
                toast.success(res.isFavorite ? 'Saved to favorites' : 'Removed from favorites');
            }
        } catch (err) {
            toast.error('Failed to update favorite status');
        }
    };

    const onDelete = async () => {
        const ok = await confirm({
            title: 'Delete Task',
            subtitle: 'Issue permanent deletion',
            message: 'Are you sure you want to permanently delete this task?',
            impactTitle: 'Permanent Deletion',
            impactNotice: 'This task, its subtasks, attachments, and worklogs will be permanently removed. This action cannot be undone.',
            confirmText: 'Delete Task',
            variant: 'destructive',
        });
        if (!ok)
            return;
        deleteTask({ param: { taskId: id } });
    };
    const onOpenTask = () => {
        router.push(`/workspaces/${workspaceId}/tasks/${id}`);
    };
    const onOpenProject = () => {
        router.push(`/workspaces/${workspaceId}/projects/${projectId}`);
    };
    return (<div className="flex justify-end">
      <ConfirmDialog />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild disabled={isPending}>
          {children}
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onOpenTask} disabled={isPending} className="p-[10px] font-medium">
            <ExternalLink className="mr-2 size-4 stroke-2"/>
            Task Details
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onCopyLink} className="p-[10px] font-medium">
            <Share2 className="mr-2 size-4 stroke-2 text-neutral-600"/>
            Share / Copy Link
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onToggleFavorite} className="p-[10px] font-medium">
            <Star className={`mr-2 size-4 stroke-2 ${isFavorite ? 'fill-amber-400 text-amber-500' : 'text-neutral-600'}`}/>
            {isFavorite ? 'Remove Favorite' : 'Save to Favorites'}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onOpenProject} disabled={isPending} className="p-[10px] font-medium">
            <ExternalLink className="mr-2 size-4 stroke-2"/>
            Open Project
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => open(id)} disabled={isPending} className="p-[10px] font-medium">
            <PencilIcon className="mr-2 size-4 stroke-2"/>
            Edit Task
          </DropdownMenuItem>

          <DropdownMenuItem onClick={onDelete} disabled={isPending} className="p-[10px] font-medium text-amber-700 focus:text-amber-700">
            <Trash className="mr-2 size-4 stroke-2"/>
            Delete Task
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>);
};
