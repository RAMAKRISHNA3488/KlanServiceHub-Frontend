import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api-client';

export const useLogout = () => {
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async () => {
            await authApi.logout();
        },
        onSuccess: () => {
            queryClient.clear();
            window.location.href = '/sign-in';
        },
    });
    return mutation;
};
