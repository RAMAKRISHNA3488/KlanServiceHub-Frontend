import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '@/lib/api-client';

export const useLogin = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const mutation = useMutation({
        mutationFn: async ({ json }) => {
            const data = await authApi.login(json);
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
            toast.error(error.message || 'Email or Password is incorrect!');
        },
    });
    return mutation;
};
