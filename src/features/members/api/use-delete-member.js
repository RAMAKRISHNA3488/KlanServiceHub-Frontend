import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useDeleteMember = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ param }) => {
            const response = await client.api.members[':memberId']['$delete']({ param });
            if (!response.ok)
                throw new Error('Failed to delete member.');
            return await response.json();
        },
        onSuccess: ({ data }) => {
            toast.success('Member deleted.');
            queryClient.invalidateQueries({ queryKey: ['members'] });
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['team-workload'] });
            queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
        },
        onError: (error) => {
            console.error('[DELETE_MEMBER]: ', error);
            toast.error('Failed to delete member.');
        },
    });
    return mutation;
};
