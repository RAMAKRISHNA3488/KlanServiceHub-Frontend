import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/hono';
export const useGetWorkspaceAnalytics = ({ workspaceId }) => {
    const query = useQuery({
        queryKey: ['workspace-analytics', workspaceId],
        queryFn: async () => {
            const response = await client.api.workspaces[':workspaceId'].analytics.$get({
                param: { workspaceId },
            });
            if (!response.ok)
                throw new Error('Failed to fetch workspace analytics.');
            const { data } = await response.json();
            return data;
        },
        enabled: !!workspaceId,
    });
    return query;
};
