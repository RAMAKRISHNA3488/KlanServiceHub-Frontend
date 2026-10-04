import React from 'react';
import { usePermissions } from '@/hooks/use-permissions';

/**
 * Renders children only if current user has the required permission in the active workspace.
 * Company Owner automatically has full accessibility.
 */
export const PermissionGate = ({
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
  children,
}) => {
  const { hasPermission, isOwner, isLoading } = usePermissions();

  if (isLoading) return null;
  if (isOwner) return <>{children}</>;

  const checkList = permission ? [permission] : permissions;
  if (checkList.length === 0) return <>{children}</>;

  const hasAccess = requireAll
    ? checkList.every((p) => hasPermission(p))
    : checkList.some((p) => hasPermission(p));

  if (!hasAccess) {
    return fallback;
  }

  return <>{children}</>;
};
