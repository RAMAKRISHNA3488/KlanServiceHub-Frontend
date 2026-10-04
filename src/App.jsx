import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import AuthLayout from '@/app/(auth)/layout';
import DashboardLayout from '@/app/(dashboard)/layout';
import StandaloneLayout from '@/app/(standalone)/layout';
import NotFoundPage from '@/app/not-found';
import { useCurrent } from '@/features/auth/api/use-current';
import { useGetWorkspaces } from '@/features/workspaces/api/use-get-workspaces';
import { WorkspaceIdClient } from '@/app/(dashboard)/workspaces/[workspaceId]/client';
import { ProjectIdClient } from '@/app/(dashboard)/workspaces/[workspaceId]/projects/[projectId]/client';
import { TaskIdClient } from '@/app/(dashboard)/workspaces/[workspaceId]/tasks/[taskId]/client';
import { TaskViewSwitcher } from '@/features/tasks/components/task-view-switcher';
import { CreateWorkspaceForm } from '@/features/workspaces/components/create-workspace-form';
import { WorkspaceIdSettingsClient } from '@/app/(standalone)/workspaces/[workspaceId]/settings/client';
import { MembersList } from '@/features/workspaces/components/members-list';
import { WorkspaceIdJoinClient } from '@/app/(standalone)/workspaces/[workspaceId]/join/[inviteCode]/client';
import { ProjectIdSettingsClient } from '@/app/(standalone)/workspaces/[workspaceId]/projects/[projectId]/settings/client';
import { WorkspacesManagementView } from '@/features/workspaces/components/workspaces-management-view';
import { PageLoader } from '@/components/page-loader';
import { ScrollToTop } from '@/components/scroll-to-top';

// SaaS Landing Page & Onboarding
import { LandingPageView } from '@/features/landing/components/landing-page';
import { EmailFirstAuth } from '@/features/auth/components/email-first-auth';
import { OnboardingWizard } from '@/features/onboarding/components/onboarding-wizard';
import { InvitationAcceptancePage } from '@/app/(public)/invite/[token]/page';

// Legal & Trust Center Pages
import { TermsPage } from '@/features/legal/components/terms-page';
import { PrivacyPage } from '@/features/legal/components/privacy-page';
import { SecurityPage } from '@/features/legal/components/security-page';
import { AcceptableUsePage } from '@/features/legal/components/acceptable-use-page';

// Product Solutions Deep-Dive Pages
import { SolutionDetailPage } from '@/features/solutions/components/solution-detail-page';

// Enterprise Jira Modules
import { CompanyProfileView } from '@/features/company/components/company-profile-view';
import { UsersAdminView } from '@/features/company/components/users-admin-view';
import { GroupsAdminView } from '@/features/company/components/groups-admin-view';
import { RolesAdminView } from '@/features/company/components/roles-admin-view';
import { TeamsAdminView } from '@/features/company/components/teams-admin-view';
import { WorkflowsAdminView } from '@/features/company/components/workflows-admin-view';
import { SprintsView } from '@/features/company/components/sprints-view';
import { BoardsView } from '@/features/company/components/boards-view';
import { DashboardsView } from '@/features/company/components/dashboards-view';
import { ReportsView } from '@/features/company/components/reports-view';
import { AutomationsView } from '@/features/company/components/automations-view';
import { IntegrationsView } from '@/features/company/components/integrations-view';
import { ApiTokensView } from '@/features/company/components/api-tokens-view';
import { SecurityView } from '@/features/company/components/security-view';
import { AuditLogsView } from '@/features/company/components/audit-logs-view';
import { BillingView } from '@/features/company/components/billing-view';
import { DataManagementView } from '@/features/company/components/data-management-view';
import { RoadmapView } from '@/features/company/components/roadmap-view';
import { ReleasesView } from '@/features/company/components/releases-view';
import {
  DependenciesView,
  CapacityView,
  GovernanceView,
  ServiceManagementView,
  AssetsView,
  DeploymentsView,
  PortfoliosView,
} from '@/features/enterprise/components/enterprise-views';

// Protected Route Component
const ProtectedRoute = () => {
  const { data: user, isLoading } = useCurrent();
  if (isLoading) return <PageLoader />;
  if (!user) return <Navigate to="/sign-in" replace />;
  return <Outlet />;
};

// Public/Guest Route Component
const PublicRoute = () => {
  const { data: user, isLoading } = useCurrent();
  if (isLoading) return <PageLoader />;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
};

// Home Redirect / SaaS Landing Page Component
const HomePage = () => {
  const { data: user, isLoading: isLoadingUser } = useCurrent();
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useGetWorkspaces({
    enabled: !!user,
  });

  if (user) {
    if (isLoadingWorkspaces) return <PageLoader />;
    if (!workspaces || workspaces.total === 0) return <Navigate to="/onboarding" replace />;
    const wsId = workspaces.documents[0]?.$id || workspaces.documents[0]?.id;
    if (wsId) return <Navigate to={`/workspaces/${wsId}`} replace />;
    return <Navigate to="/onboarding" replace />;
  }

  // Render Landing Page immediately for visitors with zero spinner lag
  return <LandingPageView />;
};

export const App = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public Landing & Invitation Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/landing" element={<LandingPageView />} />
      <Route path="/invite/:token" element={<InvitationAcceptancePage />} />

      {/* Legal & Trust Center Routes */}
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/terms-of-service" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/privacy-policy" element={<PrivacyPage />} />
      <Route path="/security" element={<SecurityPage />} />
      <Route path="/trust" element={<SecurityPage />} />
      <Route path="/acceptable-use" element={<AcceptableUsePage />} />
      <Route path="/aup" element={<AcceptableUsePage />} />

      {/* Product Solutions Lifecycle Pages */}
      <Route path="/solutions" element={<SolutionDetailPage />} />
      <Route path="/solutions/:slug" element={<SolutionDetailPage />} />

      {/* Public Email-First Auth Routes */}
      <Route element={<PublicRoute />}>
        <Route
          element={
            <AuthLayout>
              <Outlet />
            </AuthLayout>
          }
        >
          <Route path="/sign-in" element={<EmailFirstAuth initialMode="SIGN_IN" />} />
          <Route path="/sign-up" element={<EmailFirstAuth initialMode="SIGN_UP" />} />
          <Route path="/forgot-password" element={<EmailFirstAuth initialMode="FORGOT_PASSWORD" />} />
          <Route path="/reset-password" element={<EmailFirstAuth initialMode="RESET_PASSWORD" />} />
        </Route>
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        {/* Onboarding Wizard */}
        <Route path="/onboarding" element={<OnboardingWizard />} />

        {/* Standalone Pages */}
        <Route
          element={
            <StandaloneLayout>
              <Outlet />
            </StandaloneLayout>
          }
        >
          <Route
            path="/workspaces/create"
            element={
              <div className="w-full lg:max-w-xl">
                <CreateWorkspaceForm />
              </div>
            }
          />
          <Route path="/workspaces/:workspaceId/settings" element={<WorkspaceIdSettingsClient />} />
          <Route
            path="/workspaces/:workspaceId/members"
            element={
              <div className="w-full lg:max-w-xl">
                <MembersList />
              </div>
            }
          />
          <Route path="/workspaces/:workspaceId/join/:inviteCode" element={<WorkspaceIdJoinClient />} />
          <Route path="/workspaces/:workspaceId/projects/:projectId/settings" element={<ProjectIdSettingsClient />} />
        </Route>

        {/* Dashboard Pages */}
        <Route
          element={
            <DashboardLayout>
              <Outlet />
            </DashboardLayout>
          }
        >
          <Route path="/workspaces/:workspaceId" element={<WorkspaceIdClient />} />
          <Route path="/workspaces" element={<WorkspacesManagementView />} />
          <Route path="/workspaces/:workspaceId/workspaces-admin" element={<WorkspacesManagementView />} />
          <Route path="/workspaces/:workspaceId/projects/:projectId" element={<ProjectIdClient />} />
          <Route
            path="/workspaces/:workspaceId/tasks"
            element={
              <div className="flex h-full flex-col">
                <TaskViewSwitcher />
              </div>
            }
          />
          <Route path="/workspaces/:workspaceId/tasks/:taskId" element={<TaskIdClient />} />

          {/* Planning Suite */}
          <Route path="/workspaces/:workspaceId/roadmap" element={<RoadmapView />} />
          <Route path="/workspaces/:workspaceId/sprints" element={<SprintsView />} />
          <Route path="/workspaces/:workspaceId/boards" element={<BoardsView />} />
          <Route path="/workspaces/:workspaceId/releases" element={<ReleasesView />} />

          {/* Insights */}
          <Route path="/workspaces/:workspaceId/dashboards" element={<DashboardsView />} />
          <Route path="/workspaces/:workspaceId/reports" element={<ReportsView />} />

          {/* Enterprise Cross-Project Coordination Suite */}
          <Route path="/workspaces/:workspaceId/dependencies" element={<DependenciesView />} />
          <Route path="/workspaces/:workspaceId/capacity" element={<CapacityView />} />
          <Route path="/workspaces/:workspaceId/governance" element={<GovernanceView />} />
          <Route path="/workspaces/:workspaceId/service-desk" element={<ServiceManagementView />} />
          <Route path="/workspaces/:workspaceId/assets" element={<AssetsView />} />
          <Route path="/workspaces/:workspaceId/deployments" element={<DeploymentsView />} />
          <Route path="/workspaces/:workspaceId/portfolios" element={<PortfoliosView />} />

          {/* Enterprise Company Owner & Admin Suite */}
          <Route path="/workspaces/:workspaceId/company-profile" element={<CompanyProfileView />} />
          <Route path="/workspaces/:workspaceId/users-admin" element={<UsersAdminView />} />
          <Route path="/workspaces/:workspaceId/groups-admin" element={<GroupsAdminView />} />
          <Route path="/workspaces/:workspaceId/roles-admin" element={<RolesAdminView />} />
          <Route path="/workspaces/:workspaceId/teams-admin" element={<TeamsAdminView />} />
          <Route path="/workspaces/:workspaceId/workflows-admin" element={<WorkflowsAdminView />} />
          <Route path="/workspaces/:workspaceId/automations" element={<AutomationsView />} />
          <Route path="/workspaces/:workspaceId/integrations" element={<IntegrationsView />} />
          <Route path="/workspaces/:workspaceId/api-tokens" element={<ApiTokensView />} />
          <Route path="/workspaces/:workspaceId/security" element={<SecurityView />} />
          <Route path="/workspaces/:workspaceId/audit-logs" element={<AuditLogsView />} />
          <Route path="/workspaces/:workspaceId/billing" element={<BillingView />} />
          <Route path="/workspaces/:workspaceId/data-management" element={<DataManagementView />} />
        </Route>
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
};

export default App;
