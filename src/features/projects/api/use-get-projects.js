import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';
export const useGetProjects = ({ workspaceId }) => {
    const query = useQuery({
        queryKey: ['projects', workspaceId],
        queryFn: async () => {
            const response = await client.api.projects.$get({
                query: { workspaceId },
            });
            if (!response.ok)
                throw new Error('Failed to fetch projects.');
            const { data } = await response.json();
            return data;
        },
        enabled: !!workspaceId,
    });
    return query;
};
