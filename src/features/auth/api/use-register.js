import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authApi } from '@/lib/api-client';

export const useRegister = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ json }) => {
            const data = await authApi.register(json);
            return data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['current'] });
            queryClient.invalidateQueries({ queryKey: ['workspaces'] });
            if (data?.workspaceId) {
                window.location.href = `/workspaces/${data.workspaceId}`;
            } else {
                window.location.href = '/';
            }
        },
        onError: (error) => {
            console.error('[REGISTER]: ', error);
            toast.error(error.message || 'Failed to register!');
        },
    });
    return mutation;
};
