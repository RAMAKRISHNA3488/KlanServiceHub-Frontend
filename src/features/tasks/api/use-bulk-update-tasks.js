import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useBulkUpdateTasks = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ json }) => {
            const response = await client.api.tasks['bulk-update']['$post']({ json });
            if (!response.ok)
                throw new Error('Failed to update task.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Tasks updated.');
            const wsId = data?.workspaceId;
            if (wsId) {
                queryClient.invalidateQueries({
                    queryKey: ['workspace-analytics', wsId],
                    exact: true,
                });
                queryClient.invalidateQueries({
                    queryKey: ['tasks', wsId],
                    exact: false,
                });
            } else {
                queryClient.invalidateQueries({
                    queryKey: ['workspace-analytics'],
                    exact: false,
                });
            }
            queryClient.invalidateQueries({
                queryKey: ['tasks'],
                exact: false,
            });
            queryClient.invalidateQueries({
                queryKey: ['project-analytics'],
                exact: false,
            });
        },
        onError: (error) => {
            console.error('[BULK_UPDATE_TASKS]: ', error);
            toast.error('Failed to update tasks.');
        },
    });
    return mutation;
};
