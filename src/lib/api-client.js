export async function apiFetch(endpoint, options = {}) {
  const res = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return res.text();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const authApi = {
  checkEmail: (email) => apiFetch('/api/auth/check-email', { method: 'POST', body: JSON.stringify({ email }) }),
  sendOtp: (email, purpose = 'LOGIN') => apiFetch('/api/auth/send-otp', { method: 'POST', body: JSON.stringify({ email, purpose }) }),
  verifyOtp: (email, otp) => apiFetch('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  loginWithOtp: (email, otp) => apiFetch('/api/auth/login-with-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  register: (data) => apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (data) => apiFetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify(data) }),
  verifyResetOtp: (data) => apiFetch('/api/auth/verify-reset-otp', { method: 'POST', body: JSON.stringify(data) }),
  resetPassword: (data) => apiFetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
  socialLogin: (data) => apiFetch('/api/auth/social-login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  getCurrentUser: () => apiFetch('/api/auth/current'),
};

export const companyApi = {
  createCompany: (data) => apiFetch('/api/company', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: (workspaceId) => apiFetch(`/api/company/${workspaceId}`),
  updateProfile: (workspaceId, data) => apiFetch(`/api/company/${workspaceId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  transferOwnership: (workspaceId, data) => apiFetch(`/api/company/${workspaceId}/transfer-ownership`, { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (workspaceId, status) => apiFetch(`/api/company/${workspaceId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteCompany: (workspaceId) => apiFetch(`/api/company/${workspaceId}`, { method: 'DELETE' }),
};

export const usersAdminApi = {
  getUsers: (workspaceId) => apiFetch(`/api/users/${workspaceId}`),
  inviteUser: (workspaceId, data) => apiFetch(`/api/users/${workspaceId}/invite`, { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (workspaceId, userId, status) => apiFetch(`/api/users/${workspaceId}/${userId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateRole: (workspaceId, userId, roleId) => apiFetch(`/api/users/${workspaceId}/${userId}/role`, { method: 'PATCH', body: JSON.stringify({ roleId }) }),
  updateProfile: (workspaceId, userId, data) => apiFetch(`/api/users/${workspaceId}/${userId}/profile`, { method: 'PATCH', body: JSON.stringify(data) }),
  removeUser: (workspaceId, userId) => apiFetch(`/api/users/${workspaceId}/${userId}`, { method: 'DELETE' }),
  reassignAndRemove: (workspaceId, userId, reassignToUserId) => apiFetch(`/api/users/${workspaceId}/${userId}/reassign-and-remove`, { method: 'POST', body: JSON.stringify({ reassignToUserId }) }),
};

export const invitationsApi = {
  getInvitationByToken: (token) => apiFetch(`/api/invitations/token/${token}`),
  acceptInvitation: (token) => apiFetch(`/api/invitations/token/${token}/accept`, { method: 'POST' }),
  declineInvitation: (token) => apiFetch(`/api/invitations/token/${token}/decline`, { method: 'POST' }),
  getInvitations: (workspaceId) => apiFetch(`/api/invitations/${workspaceId}`),
  createInvitation: (workspaceId, data) => apiFetch(`/api/invitations/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  revokeInvitation: (workspaceId, id) => apiFetch(`/api/invitations/${workspaceId}/${id}`, { method: 'DELETE' }),
};

export const groupsApi = {
  getGroups: (workspaceId) => apiFetch(`/api/groups/${workspaceId}`),
  getDirectoryStats: (workspaceId) => apiFetch(`/api/groups/${workspaceId}/directory/stats`),
  getDomainRules: (workspaceId) => apiFetch(`/api/groups/${workspaceId}/domain-rules`),
  createDomainRule: (workspaceId, data) => apiFetch(`/api/groups/${workspaceId}/domain-rules`, { method: 'POST', body: JSON.stringify(data) }),
  deleteDomainRule: (workspaceId, ruleId) => apiFetch(`/api/groups/${workspaceId}/domain-rules/${ruleId}`, { method: 'DELETE' }),
  createGroup: (workspaceId, data) => apiFetch(`/api/groups/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateGroup: (workspaceId, groupId, data) => apiFetch(`/api/groups/${workspaceId}/${groupId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getGroupMembers: (workspaceId, groupId) => apiFetch(`/api/groups/${workspaceId}/${groupId}/members`),
  addGroupMember: (workspaceId, groupId, userId) => apiFetch(`/api/groups/${workspaceId}/${groupId}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
  addMultipleMembers: (workspaceId, groupId, userIds) => apiFetch(`/api/groups/${workspaceId}/${groupId}/members`, { method: 'POST', body: JSON.stringify({ userIds }) }),
  removeGroupMember: (workspaceId, groupId, userId) => apiFetch(`/api/groups/${workspaceId}/${groupId}/members/${userId}`, { method: 'DELETE' }),
  deleteGroup: (workspaceId, groupId) => apiFetch(`/api/groups/${workspaceId}/${groupId}`, { method: 'DELETE' }),
};

export const rolesAdminApi = {
  getRoles: (workspaceId) => apiFetch(`/api/roles/${workspaceId}`),
  createRole: (workspaceId, data) => apiFetch(`/api/roles/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  updatePermissions: (workspaceId, roleId, permissions) => apiFetch(`/api/roles/${workspaceId}/${roleId}/permissions`, { method: 'PUT', body: JSON.stringify({ permissions }) }),
  deleteRole: (workspaceId, roleId) => apiFetch(`/api/roles/${workspaceId}/${roleId}`, { method: 'DELETE' }),
};

export const teamsAdminApi = {
  getTeams: (workspaceId) => apiFetch(`/api/teams/${workspaceId}`),
  createTeam: (workspaceId, data) => apiFetch(`/api/teams/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateTeam: (workspaceId, teamId, data) => apiFetch(`/api/teams/${workspaceId}/${teamId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTeam: (workspaceId, teamId) => apiFetch(`/api/teams/${workspaceId}/${teamId}`, { method: 'DELETE' }),
};

export const workflowsAdminApi = {
  getWorkflows: (workspaceId) => apiFetch(`/api/workflows/${workspaceId}`),
  createWorkflow: (workspaceId, data) => apiFetch(`/api/workflows/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateWorkflow: (workspaceId, workflowId, data) => apiFetch(`/api/workflows/${workspaceId}/${workflowId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteWorkflow: (workspaceId, workflowId) => apiFetch(`/api/workflows/${workspaceId}/${workflowId}`, { method: 'DELETE' }),
  addStatus: (workspaceId, workflowId, data) => apiFetch(`/api/workflows/${workspaceId}/${workflowId}/statuses`, { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (workspaceId, workflowId, statusId, data) => apiFetch(`/api/workflows/${workspaceId}/${workflowId}/statuses/${statusId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  reorderStatuses: (workspaceId, workflowId, statusIds) => apiFetch(`/api/workflows/${workspaceId}/${workflowId}/reorder`, { method: 'PUT', body: JSON.stringify({ statusIds }) }),
  deleteStatus: (workspaceId, workflowId, statusId) => apiFetch(`/api/workflows/${workspaceId}/${workflowId}/statuses/${statusId}`, { method: 'DELETE' }),
  getIssueTypes: (workspaceId) => apiFetch(`/api/issue-types/${workspaceId}`),
  createIssueType: (workspaceId, data) => apiFetch(`/api/issue-types/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  deleteIssueType: (workspaceId, id) => apiFetch(`/api/issue-types/${workspaceId}/${id}`, { method: 'DELETE' }),
};

export const sprintsApi = {
  getSprints: (workspaceId, projectId) => apiFetch(`/api/sprints/${workspaceId}${projectId ? `?projectId=${projectId}` : ''}`),
  createSprint: (workspaceId, data) => apiFetch(`/api/sprints/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateSprint: (workspaceId, sprintId, data) => apiFetch(`/api/sprints/${workspaceId}/${sprintId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSprint: (workspaceId, sprintId) => apiFetch(`/api/sprints/${workspaceId}/${sprintId}`, { method: 'DELETE' }),
  startSprint: (workspaceId, sprintId, data = {}) => apiFetch(`/api/sprints/${workspaceId}/${sprintId}/start`, { method: 'PATCH', body: JSON.stringify(data) }),
  completeSprint: (workspaceId, sprintId, data = {}) => apiFetch(`/api/sprints/${workspaceId}/${sprintId}/complete`, { method: 'PATCH', body: JSON.stringify(data) }),
  moveTask: (workspaceId, taskId, sprintId) => apiFetch(`/api/sprints/${workspaceId}/move-task`, { method: 'POST', body: JSON.stringify({ taskId, sprintId }) }),
};

export const boardsApi = {
  getBoards: (workspaceId) => apiFetch(`/api/boards/${workspaceId}`),
  createBoard: (workspaceId, data) => apiFetch(`/api/boards/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateBoard: (workspaceId, id, data) => apiFetch(`/api/boards/${workspaceId}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteBoard: (workspaceId, id) => apiFetch(`/api/boards/${workspaceId}/${id}`, { method: 'DELETE' }),
};

export const releasesApi = {
  getReleases: (workspaceId, projectId) => apiFetch(`/api/releases/${workspaceId}${projectId ? `?projectId=${projectId}` : ''}`),
  createRelease: (workspaceId, data) => apiFetch(`/api/releases/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateRelease: (workspaceId, id, data) => apiFetch(`/api/releases/${workspaceId}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRelease: (workspaceId, id) => apiFetch(`/api/releases/${workspaceId}/${id}`, { method: 'DELETE' }),
};

export const tasksApi = {
  getTasks: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/tasks?${query}`);
  },
  getTask: (taskId) => apiFetch(`/api/tasks/${taskId}`),
  createTask: (data) => apiFetch('/api/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (taskId, data) => apiFetch(`/api/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (taskId) => apiFetch(`/api/tasks/${taskId}`, { method: 'DELETE' }),
  bulkUpdate: (tasks) => apiFetch('/api/tasks/bulk-update', { method: 'POST', body: JSON.stringify({ tasks }) }),
  getComments: (taskId) => apiFetch(`/api/tasks/${taskId}/comments`),
  addComment: (taskId, content) => apiFetch(`/api/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
};

export const dashboardsApi = {
  getDashboardData: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/dashboards/${workspaceId}${q ? `?${q}` : ''}`);
  },
  createDashboard: (workspaceId, data) => apiFetch(`/api/dashboards/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  updateDashboard: (workspaceId, dashboardId, data) => apiFetch(`/api/dashboards/${workspaceId}/${dashboardId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteDashboard: (workspaceId, dashboardId) => apiFetch(`/api/dashboards/${workspaceId}/${dashboardId}`, { method: 'DELETE' }),
  addGadget: (workspaceId, dashboardId, data) => apiFetch(`/api/dashboards/${workspaceId}/${dashboardId}/gadgets`, { method: 'POST', body: JSON.stringify(data) }),
  deleteGadget: (workspaceId, dashboardId, gadgetId) => apiFetch(`/api/dashboards/${workspaceId}/${dashboardId}/gadgets/${gadgetId}`, { method: 'DELETE' }),
};

export const reportsApi = {
  getReportsData: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}${q ? `?${q}` : ''}`);
  },
  getOverview: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/overview${q ? `?${q}` : ''}`);
  },
  getStatus: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/status${q ? `?${q}` : ''}`);
  },
  getWorkTypes: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/work-types${q ? `?${q}` : ''}`);
  },
  getPriorities: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/priorities${q ? `?${q}` : ''}`);
  },
  getTeams: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/teams${q ? `?${q}` : ''}`);
  },
  getMembers: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/members${q ? `?${q}` : ''}`);
  },
  getProjects: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/projects${q ? `?${q}` : ''}`);
  },
  getEpics: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/epics${q ? `?${q}` : ''}`);
  },
  getTrends: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/trends${q ? `?${q}` : ''}`);
  },
  getSprints: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/sprints${q ? `?${q}` : ''}`);
  },
  getBugs: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/bugs${q ? `?${q}` : ''}`);
  },
  getOverdue: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/overdue${q ? `?${q}` : ''}`);
  },
  getActivity: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/activity${q ? `?${q}` : ''}`);
  },
  getDrilldown: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/reports/${workspaceId}/drilldown${q ? `?${q}` : ''}`);
  },
  exportReport: async (workspaceId, params = {}, format = 'comprehensive') => {
    const q = new URLSearchParams({ ...params, format }).toString();
    const res = await fetch(`/api/reports/${workspaceId}/export?${q}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to export report');
    if (format === 'json') {
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-telemetry-${workspaceId}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      return data;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const prefix = format === 'comprehensive' ? 'executive-analytics-dossier' : 'analytics-tasks-report';
    a.download = `${prefix}-${workspaceId}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    return true;
  },
};

export const automationsApi = {
  getAutomations: (workspaceId) => apiFetch(`/api/automations/${workspaceId}`),
  createAutomation: (workspaceId, data) => apiFetch(`/api/automations/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  toggleActive: (workspaceId, id) => apiFetch(`/api/automations/${workspaceId}/${id}/toggle`, { method: 'PATCH' }),
  testRun: (workspaceId, id) => apiFetch(`/api/automations/${workspaceId}/${id}/test`, { method: 'POST' }),
  deleteAutomation: (workspaceId, id) => apiFetch(`/api/automations/${workspaceId}/${id}`, { method: 'DELETE' }),
};

export const notificationsApi = {
  getNotifications: (workspaceId) => apiFetch(`/api/notifications${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
  markRead: (id) => apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: (workspaceId) => apiFetch(`/api/notifications/read-all${workspaceId ? `?workspaceId=${workspaceId}` : ''}`, { method: 'POST' }),
  getPreferences: (workspaceId) => apiFetch(`/api/notifications/preferences${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
  updatePreferences: (data) => apiFetch('/api/notifications/preferences', { method: 'PUT', body: JSON.stringify(data) }),
};

export const integrationsApi = {
  getIntegrations: (workspaceId) => apiFetch(`/api/integrations/${workspaceId}`),
  connect: (workspaceId, data) => apiFetch(`/api/integrations/${workspaceId}/connect`, { method: 'POST', body: JSON.stringify(data) }),
  testDelivery: (workspaceId, id) => apiFetch(`/api/integrations/${workspaceId}/${id}/test`, { method: 'POST' }),
  disconnect: (workspaceId, id) => apiFetch(`/api/integrations/${workspaceId}/${id}`, { method: 'DELETE' }),
};

export const apiTokensApi = {
  getTokens: (workspaceId) => apiFetch(`/api/api-tokens/${workspaceId}`),
  createToken: (workspaceId, data) => apiFetch(`/api/api-tokens/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  revokeToken: (workspaceId, id) => apiFetch(`/api/api-tokens/${workspaceId}/${id}`, { method: 'DELETE' }),
};

export const securityApi = {
  getSecurity: (workspaceId) => apiFetch(`/api/security/${workspaceId}`),
  updatePolicy: (workspaceId, data) => apiFetch(`/api/security/${workspaceId}/policy`, { method: 'PUT', body: JSON.stringify(data) }),
  revokeSession: (workspaceId, sessionId) => apiFetch(`/api/security/${workspaceId}/sessions/${sessionId}`, { method: 'DELETE' }),
};

export const auditLogsApi = {
  getLogs: (workspaceId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/api/audit-logs/${workspaceId}${query ? `?${query}` : ''}`);
  },
  exportCsvUrl: (workspaceId) => `/api/audit-logs/${workspaceId}/export`,
};

export const billingApi = {
  getBilling: (workspaceId) => apiFetch(`/api/billing/${workspaceId}`),
  upgradePlan: (workspaceId, data) => apiFetch(`/api/billing/${workspaceId}/upgrade`, { method: 'POST', body: JSON.stringify(data) }),
  updateMemberLicense: (workspaceId, memberId, data) => apiFetch(`/api/billing/${workspaceId}/members/${memberId}/license`, { method: 'PATCH', body: JSON.stringify(data) }),
  generateInvoice: (workspaceId) => apiFetch(`/api/billing/${workspaceId}/invoices/generate`, { method: 'POST' }),
};

export const dataManagementApi = {
  exportData: (workspaceId) => apiFetch(`/api/data/${workspaceId}/export`),
  getBackups: (workspaceId) => apiFetch(`/api/data/${workspaceId}/backups`),
  createBackup: (workspaceId) => apiFetch(`/api/data/${workspaceId}/backups`, { method: 'POST' }),
  restoreBackup: (workspaceId, backupId) => apiFetch(`/api/data/${workspaceId}/restore`, { method: 'POST', body: JSON.stringify({ backupId }) }),
};

export const dependenciesApi = {
  getGraph: (workspaceId) => apiFetch(`/api/dependencies/graph/${workspaceId}`),
  getProjectDependencies: (projectId) => apiFetch(`/api/dependencies/project/${projectId}`),
  createDependency: (data) => apiFetch('/api/dependencies', { method: 'POST', body: JSON.stringify(data) }),
};

export const capacityApi = {
  getCapacities: (workspaceId) => apiFetch(`/api/capacity/${workspaceId}`),
  setCapacity: (workspaceId, data) => apiFetch(`/api/capacity/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  getWorkload: (workspaceId) => apiFetch(`/api/capacity/workload/${workspaceId}`),
};

export const governanceApi = {
  getMilestones: (projectId) => apiFetch(`/api/governance/milestones/${projectId}`),
  createMilestone: (projectId, data) => apiFetch(`/api/governance/milestones/${projectId}`, { method: 'POST', body: JSON.stringify(data) }),
  getHealth: (projectId) => apiFetch(`/api/governance/health/${projectId}`),
  getRisks: (projectId) => apiFetch(`/api/governance/risks/${projectId}`),
  createRisk: (projectId, data) => apiFetch(`/api/governance/risks/${projectId}`, { method: 'POST', body: JSON.stringify(data) }),
  getDecisions: (projectId) => apiFetch(`/api/governance/decisions/${projectId}`),
  createDecision: (projectId, data) => apiFetch(`/api/governance/decisions/${projectId}`, { method: 'POST', body: JSON.stringify(data) }),
  getApprovals: (workspaceId) => apiFetch(`/api/governance/approvals/${workspaceId}`),
  createApproval: (workspaceId, data) => apiFetch(`/api/governance/approvals/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  decideApproval: (approvalId, status) => apiFetch(`/api/governance/approvals/item/${approvalId}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

export const serviceManagementApi = {
  getRequests: (workspaceId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiFetch(`/api/service-management/${workspaceId}/requests${q ? `?${q}` : ''}`);
  },
  createRequest: (workspaceId, data) => apiFetch(`/api/service-management/${workspaceId}/requests`, { method: 'POST', body: JSON.stringify(data) }),
  updateRequest: (workspaceId, id, data) => apiFetch(`/api/service-management/${workspaceId}/requests/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRequest: (workspaceId, id) => apiFetch(`/api/service-management/${workspaceId}/requests/${id}`, { method: 'DELETE' }),
  getQueues: (workspaceId) => apiFetch(`/api/service-management/${workspaceId}/queues`),
  getSlas: (workspaceId) => apiFetch(`/api/service-management/${workspaceId}/slas`),
  seedDemo: (workspaceId) => apiFetch(`/api/service-management/${workspaceId}/seed-demo`, { method: 'POST' }),
  getCustomers: (workspaceId) => apiFetch(`/api/service-management/${workspaceId}/customers`),
  createCustomerOrg: (workspaceId, data) => apiFetch(`/api/service-management/${workspaceId}/customers`, { method: 'POST', body: JSON.stringify(data) }),
};

export const assetsApi = {
  getAssets: (workspaceId) => apiFetch(`/api/assets/${workspaceId}`),
  createAsset: (workspaceId, data) => apiFetch(`/api/assets/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  getDependencies: (workspaceId) => apiFetch(`/api/assets/${workspaceId}/dependencies`),
  createDependency: (workspaceId, data) => apiFetch(`/api/assets/${workspaceId}/dependencies`, { method: 'POST', body: JSON.stringify(data) }),
};

export const deploymentsApi = {
  getDeployments: (projectId) => apiFetch(`/api/deployments/${projectId}`),
  createDeployment: (projectId, data) => apiFetch(`/api/deployments/${projectId}`, { method: 'POST', body: JSON.stringify(data) }),
  getDoraMetrics: (workspaceId) => apiFetch(`/api/deployments/dora/${workspaceId}`),
  getReleaseReadiness: (releaseId) => apiFetch(`/api/deployments/readiness/${releaseId}`),
};

export const portfolioApi = {
  getPortfolios: (workspaceId) => apiFetch(`/api/portfolio/${workspaceId}`),
  createPortfolio: (workspaceId, data) => apiFetch(`/api/portfolio/${workspaceId}`, { method: 'POST', body: JSON.stringify(data) }),
  getInitiatives: (workspaceId) => apiFetch(`/api/portfolio/${workspaceId}/initiatives`),
  createInitiative: (workspaceId, data) => apiFetch(`/api/portfolio/${workspaceId}/initiatives`, { method: 'POST', body: JSON.stringify(data) }),
  getGoals: (workspaceId) => apiFetch(`/api/portfolio/${workspaceId}/goals`),
  createGoal: (workspaceId, data) => apiFetch(`/api/portfolio/${workspaceId}/goals`, { method: 'POST', body: JSON.stringify(data) }),
  globalSearch: (workspaceId, q) => apiFetch(`/api/search/global?workspaceId=${workspaceId}&q=${encodeURIComponent(q)}`),
  getEnterpriseHome: (workspaceId) => apiFetch(`/api/enterprise/home${workspaceId ? `?workspaceId=${workspaceId}` : ''}`),
};

