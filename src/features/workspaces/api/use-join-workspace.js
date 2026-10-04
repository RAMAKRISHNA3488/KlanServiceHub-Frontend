import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useJoinWorkspace = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ param, json }) => {
            const response = await client.api.workspaces[':workspaceId']['join']['$post']({ param, json });
            if (!response.ok)
                throw new Error('Failed to join workspace.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Joined workspace.');
            queryClient.invalidateQueries({
                queryKey: ['workspaces'],
            });
            queryClient.invalidateQueries({
                queryKey: ['workspace', data.$id],
                exact: true,
            });
        },
        onError: (error) => {
            console.error('[JOIN_WORKSPACE]: ', error);
            toast.error('Failed to join workspace.');
        },
    });
    return mutation;
};
