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
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['task'] });
            queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['sprints'] });
            queryClient.invalidateQueries({ queryKey: ['dashboards'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
            queryClient.invalidateQueries({ queryKey: ['team-workload'] });
            queryClient.invalidateQueries({ queryKey: ['dependencies-graph'] });
            queryClient.invalidateQueries({ queryKey: ['reports'] });
        },
        onError: (error) => {
            console.error('[BULK_UPDATE_TASKS]: ', error);
            toast.error('Failed to update tasks.');
        },
    });
    return mutation;
};
