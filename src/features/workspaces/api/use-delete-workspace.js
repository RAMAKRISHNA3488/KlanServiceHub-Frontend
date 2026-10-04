import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useDeleteWorkspace = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ param }) => {
            const response = await client.api.workspaces[':workspaceId']['$delete']({ param });
            if (!response.ok)
                throw new Error('Failed to delete workspace.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Workspace deleted.');
            queryClient.invalidateQueries({
                queryKey: ['workspaces'],
            });
            queryClient.invalidateQueries({
                queryKey: ['workspace', data.$id],
                exact: true,
            });
        },
        onError: (error) => {
            console.error('[DELETE_WORKSPACE]: ', error);
            toast.error('Failed to delete workspace.');
        },
    });
    return mutation;
};
