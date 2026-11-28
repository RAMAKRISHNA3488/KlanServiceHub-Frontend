import { useQuery } from '@tanstack/react-query';
import { authApi, AUTH_TOKEN_KEY } from '@/lib/api-client';

export const useCurrent = () => {
    const hasToken = typeof window !== 'undefined' ? Boolean(localStorage.getItem(AUTH_TOKEN_KEY)) : false;

    const query = useQuery({
        queryKey: ['current'],
        queryFn: async () => {
            try {
                const data = await authApi.getCurrentUser();
                return data?.data || null;
            } catch (e) {
                return null;
            }
        },
        retry: hasToken ? 1 : false,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
    });
    return query;
};
