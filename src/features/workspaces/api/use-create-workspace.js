import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useCreateWorkspace = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ form }) => {
            const response = await client.api.workspaces['$post']({ form });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to create workspace.');
            }
            return await response.json();
        },
        onSuccess: () => {
            toast.success('Workspace created.');
            queryClient.invalidateQueries({
                queryKey: ['workspaces'],
            });
        },
        onError: (error) => {
            console.error('[CREATE_WORKSPACE]: ', error);
            toast.error(error.message || 'Failed to create workspace.');
        },
    });
    return mutation;
};
