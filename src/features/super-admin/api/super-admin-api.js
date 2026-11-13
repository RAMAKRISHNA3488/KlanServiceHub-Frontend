import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { platformAdminApi } from '@/lib/api-client';

export const useSuperAdminCurrent = () => {
  return useQuery({
    queryKey: ['super-admin-current'],
    queryFn: async () => {
      try {
        const res = await platformAdminApi.getCurrent();
        return res?.data || null;
      } catch (err) {
        return null;
      }
    },
    retry: false,
    staleTime: 30 * 1000,
  });
};

export const useSuperAdminOverview = () => {
  return useQuery({
    queryKey: ['super-admin-overview'],
    queryFn: async () => {
      const res = await platformAdminApi.getOverview();
      return res?.data || null;
    },
    refetchInterval: 15 * 1000, // Live poll every 15s
    staleTime: 10 * 1000,
  });
};

export const useSuperAdminOrganizations = () => {
  return useQuery({
    queryKey: ['super-admin-organizations'],
    queryFn: async () => {
      const res = await platformAdminApi.getOrganizations();
      return res?.data?.organizations || [];
    },
    staleTime: 15 * 1000,
  });
};

export const useSuperAdminUsers = () => {
  return useQuery({
    queryKey: ['super-admin-users'],
    queryFn: async () => {
      const res = await platformAdminApi.getUsers();
      return res?.data?.users || [];
    },
    staleTime: 15 * 1000,
  });
};

export const useSuperAdminAuditLogs = (params = {}) => {
  return useQuery({
    queryKey: ['super-admin-audit-logs', params],
    queryFn: async () => {
      const res = await platformAdminApi.getAuditLogs(params);
      return res?.data?.logs || [];
    },
    staleTime: 15 * 1000,
  });
};

export const useSuperAdminHealth = () => {
  return useQuery({
    queryKey: ['super-admin-health'],
    queryFn: async () => {
      const res = await platformAdminApi.getSystemHealth();
      return res?.data || null;
    },
    refetchInterval: 10 * 1000,
  });
};

export const useUpdateOrganizationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => platformAdminApi.updateOrganizationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-organizations'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-overview'] });
    },
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => platformAdminApi.updateUserStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin-overview'] });
    },
  });
};

export const useToggleSuperAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isSuperAdmin }) => platformAdminApi.toggleSuperAdmin(id, isSuperAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
    },
  });
};

