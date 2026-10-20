import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useDeleteProject = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ param }) => {
            const response = await client.api.projects[':projectId']['$delete']({ param });
            if (!response.ok)
                throw new Error('Failed to delete project.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Project deleted.');
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['project'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['dashboards'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        },
        onError: (error) => {
            console.error('[DELETE_PROJECT]: ', error);
            toast.error('Failed to delete project.');
        },
    });
    return mutation;
};
