import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/lib/api-client';

export const useCurrent = () => {
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
        retry: false,
        staleTime: 60 * 1000,
        refetchOnWindowFocus: true,
    });
    return query;
};
