import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useRegister = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ json }) => {
            const response = await client.api.auth.register['$post']({ json });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to register!');
            }
            return await response.json();
        },
        onSuccess: () => {
            router.refresh();
            queryClient.invalidateQueries({
                queryKey: ['current'],
            });
        },
        onError: (error) => {
            console.error('[REGISTER]: ', error);
            toast.error(error.message || 'Failed to register!');
        },
    });
    return mutation;
};
