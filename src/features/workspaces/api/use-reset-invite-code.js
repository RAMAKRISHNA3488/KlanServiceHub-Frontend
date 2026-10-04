import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useResetInviteCode = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ param }) => {
            const response = await client.api.workspaces[':workspaceId']['resetInviteCode']['$post']({ param });
            if (!response.ok)
                throw new Error('Failed to reset invite code.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Invite code reset.');
            queryClient.invalidateQueries({
                queryKey: ['workspaces'],
            });
            queryClient.invalidateQueries({
                queryKey: ['workspace', data.$id],
                exact: true,
            });
        },
        onError: (error) => {
            console.error('[RESET_INVITE_CODE]: ', error);
            toast.error('Failed to reset invite code.');
        },
    });
    return mutation;
};
