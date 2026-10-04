import { useQuery } from '@tanstack/react-query';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { apiFetch } from '@/lib/api-client';

export const usePermissions = () => {
  const workspaceId = useWorkspaceId();

  const { data, isLoading } = useQuery({
    queryKey: ['workspace-permissions', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return { permissions: [], isOwner: false };
      return apiFetch(`/api/company/${workspaceId}/permissions`).catch(() => ({ permissions: [], isOwner: false }));
    },
    enabled: !!workspaceId,
  });

  const permissions = data?.permissions || [];
  const isOwner = !!data?.isOwner;

  const hasPermission = (permissionCode) => {
    if (isOwner) return true;
    return permissions.includes(permissionCode);
  };

  return {
    permissions,
    isOwner,
    hasPermission,
    isLoading,
  };
};
