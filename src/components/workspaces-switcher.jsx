'use client';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { RiAddCircleFill } from 'react-icons/ri';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetWorkspaces } from '@/features/workspaces/api/use-get-workspaces';
import { WorkspaceAvatar } from '@/features/workspaces/components/workspace-avatar';
import { useCreateWorkspaceModal } from '@/features/workspaces/hooks/use-create-workspace-modal';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

export const WorkspaceSwitcher = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();
    const { open } = useCreateWorkspaceModal();
    const { data: workspaces } = useGetWorkspaces();

    const onSelect = (id) => {
        if (!id) return;
        queryClient.invalidateQueries({ queryKey: ['workspace', id] });
        queryClient.invalidateQueries({ queryKey: ['company', id] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        router.push(`/workspaces/${id}`);
    };

    return (<div className="flex flex-col gap-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase text-neutral-500 font-semibold tracking-wider">Organizations</p>
        <button onClick={open} title="Create New Workspace / Organization">
          <RiAddCircleFill className="size-5 cursor-pointer text-neutral-500 transition hover:text-blue-600"/>
        </button>
      </div>

      <Select onValueChange={onSelect} value={workspaceId || undefined}>
        <SelectTrigger className="w-full bg-neutral-200/80 hover:bg-neutral-200 p-1 font-medium transition">
          <SelectValue placeholder="No workspace selected"/>
        </SelectTrigger>

        <SelectContent>
          {workspaces?.documents?.map((workspace) => {
            const wsId = workspace.$id || workspace.id;
            return (
              <SelectItem key={wsId} value={wsId}>
                <div className="flex items-center justify-start gap-3 font-medium">
                  <WorkspaceAvatar name={workspace.name} image={workspace.imageUrl}/>
                  <span className="truncate">{workspace.name}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      <button
        type="button"
        onClick={() => router.push(workspaceId ? `/workspaces/${workspaceId}/workspaces-admin` : '/workspaces')}
        className="flex items-center justify-center gap-1 text-[11px] font-semibold text-neutral-500 hover:text-blue-600 transition py-0.5"
      >
        <span>Manage all workspaces</span>
      </button>
    </div>);
};
