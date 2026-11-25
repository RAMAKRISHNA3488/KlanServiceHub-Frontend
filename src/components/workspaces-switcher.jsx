'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { RiAddCircleFill } from 'react-icons/ri';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetWorkspaces } from '@/features/workspaces/api/use-get-workspaces';
import { useCurrent } from '@/features/auth/api/use-current';
import { WorkspaceAvatar } from '@/features/workspaces/components/workspace-avatar';
import { useCreateWorkspaceModal } from '@/features/workspaces/hooks/use-create-workspace-modal';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

export const WorkspaceSwitcher = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const workspaceId = useWorkspaceId();
    const { open } = useCreateWorkspaceModal();
    const { data: workspaces, isLoading: isLoadingWorkspaces } = useGetWorkspaces();
    const { data: user } = useCurrent();

    // Resilient workspace list: prefer fresh workspaces query, fallback to user.workspaces from /current
    const workspaceList = useMemo(() => {
        if (Array.isArray(workspaces?.documents) && workspaces.documents.length > 0) {
            return workspaces.documents;
        }
        if (Array.isArray(user?.workspaces) && user.workspaces.length > 0) {
            return user.workspaces.map((w) => ({
                $id: w.id || w.$id,
                id: w.id || w.$id,
                name: w.name,
                imageUrl: w.image_url || w.imageUrl,
            }));
        }
        return [];
    }, [workspaces, user]);

    // Active workspace to display
    const currentWorkspace = useMemo(() => {
        if (!workspaceList.length) return null;
        if (workspaceId) {
            return workspaceList.find((w) => (w.$id || w.id) === workspaceId) || workspaceList[0];
        }
        return workspaceList[0];
    }, [workspaceList, workspaceId]);

    const activeValue = workspaceId || currentWorkspace?.$id || currentWorkspace?.id || '';

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

      <Select onValueChange={onSelect} value={activeValue || undefined}>
        <SelectTrigger className="w-full bg-neutral-200/80 hover:bg-neutral-200 p-1 font-medium transition text-xs">
          {currentWorkspace ? (
            <div className="flex items-center gap-2 overflow-hidden text-left w-full pr-1">
              <WorkspaceAvatar name={currentWorkspace.name} image={currentWorkspace.imageUrl}/>
              <span className="truncate font-semibold text-neutral-800">{currentWorkspace.name}</span>
            </div>
          ) : (
            <SelectValue placeholder={isLoadingWorkspaces ? "Loading..." : "Select organization"}/>
          )}
        </SelectTrigger>

        <SelectContent>
          {workspaceList.map((workspace) => {
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
