import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useDeleteTask = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ param }) => {
            const response = await client.api.tasks[':taskId']['$delete']({ param });
            if (!response.ok)
                throw new Error('Failed to delete task.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Task deleted.');
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
            console.error('[DELETE_TASK]: ', error);
            toast.error('Failed to delete task.');
        },
    });
    return mutation;
};
