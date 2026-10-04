import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useUpdateTask = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ json, param }) => {
            const response = await client.api.tasks[':taskId']['$patch']({ json, param });
            if (!response.ok)
                throw new Error('Failed to update task.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Task updated.');
            queryClient.invalidateQueries({
                queryKey: ['workspace-analytics', data.workspaceId],
                exact: true,
            });
            queryClient.invalidateQueries({
                queryKey: ['project-analytics', data.projectId],
                exact: true,
            });
            queryClient.invalidateQueries({
                queryKey: ['tasks', data.workspaceId],
                exact: false,
            });
            queryClient.invalidateQueries({
                queryKey: ['task', data.$id],
                exact: true,
            });
        },
        onError: (error) => {
            console.error('[UPDATE_TASK]: ', error);
            toast.error('Failed to update task.');
        },
    });
    return mutation;
};
