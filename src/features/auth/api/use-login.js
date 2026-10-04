import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { client } from '@/lib/hono';
export const useLogin = () => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ json }) => {
            const response = await client.api.auth.login['$post']({ json });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Email or Password is incorrect!');
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
            toast.error(error.message || 'Email or Password is incorrect!');
        },
    });
    return mutation;
};
