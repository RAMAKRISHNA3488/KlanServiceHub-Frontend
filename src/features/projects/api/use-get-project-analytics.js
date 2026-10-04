import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';
export const useGetProjectAnalytics = ({ projectId }) => {
    const query = useQuery({
        queryKey: ['project-analytics', projectId],
        queryFn: async () => {
            const response = await client.api.projects[':projectId'].analytics.$get({
                param: { projectId },
            });
            if (!response.ok)
                throw new Error('Failed to fetch project analytics.');
            const { data } = await response.json();
            return data;
        },
        enabled: !!projectId,
    });
    return query;
};
