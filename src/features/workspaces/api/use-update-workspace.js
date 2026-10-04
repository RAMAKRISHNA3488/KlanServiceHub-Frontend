import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useUpdateWorkspace = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ form, param }) => {
            const response = await client.api.workspaces[':workspaceId']['$patch']({ form, param });
            if (!response.ok)
                throw new Error('Failed to update workspace.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Workspace updated.');
            queryClient.invalidateQueries({
                queryKey: ['workspaces'],
            });
            queryClient.invalidateQueries({
                queryKey: ['workspace', data.$id],
                exact: true,
            });
        },
        onError: (error) => {
            console.error('[UPDATE_WORKSPACE]: ', error);
            toast.error('Failed to update workspace.');
        },
    });
    return mutation;
};
