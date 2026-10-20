import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useUpdateProject = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ form, param }) => {
            const response = await client.api.projects[':projectId']['$patch']({ form, param });
            if (!response.ok)
                throw new Error('Failed to update project.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Project updated.');
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['project'] });
            queryClient.invalidateQueries({ queryKey: ['tasks'] });
            queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['dashboards'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        },
        onError: (error) => {
            console.error('[UPDATE_PROJECT]: ', error);
            toast.error('Failed to update project.');
        },
    });
    return mutation;
};
