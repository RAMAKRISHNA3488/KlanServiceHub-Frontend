import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useCreateProject = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ form }) => {
            const response = await client.api.projects['$post']({ form });
            if (!response.ok)
                throw new Error('Failed to create project.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Project created.');
            queryClient.invalidateQueries({ queryKey: ['projects'] });
            queryClient.invalidateQueries({ queryKey: ['project'] });
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
            queryClient.invalidateQueries({ queryKey: ['dashboards'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
        },
        onError: (error) => {
            console.error('[CREATE_PROJECT]: ', error);
            toast.error('Failed to create project.');
        },
    });
    return mutation;
};
