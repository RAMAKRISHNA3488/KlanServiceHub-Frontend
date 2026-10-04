import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useUpdateMember = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ param, json }) => {
            const response = await client.api.members[':memberId']['$patch']({ param, json });
            if (!response.ok)
                throw new Error('Failed to update member.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Member updated.');
            queryClient.invalidateQueries({
                queryKey: ['members', data.workspaceId],
                exact: true,
            });
        },
        onError: (error) => {
            console.error('[UPDATE_MEMBER]: ', error);
            toast.error('Failed to update member.');
        },
    });
    return mutation;
};
