import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useCreateTask = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ json }) => {
            const response = await client.api.tasks['$post']({ json });
            if (!response.ok)
                throw new Error('Failed to create task.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Task created.');
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
        },
        onError: (error) => {
            console.error('[CREATE_TASK]: ', error);
            toast.error('Failed to create task.');
        },
    });
    return mutation;
};
