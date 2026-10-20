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
            console.error('[CREATE_TASK]: ', error);
            toast.error('Failed to create task.');
        },
    });
    return mutation;
};
