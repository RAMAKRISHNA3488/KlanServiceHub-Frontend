'use client';
import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { useGetWorkspace } from '@/features/workspaces/api/use-get-workspace';
import { EditWorkspaceForm } from '@/features/workspaces/components/edit-workspace-form';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
export const WorkspaceIdSettingsClient = () => {
    const workspaceId = useWorkspaceId();
    const { data: initialValues, isLoading } = useGetWorkspace({ workspaceId });
    if (isLoading && !initialValues)
        return <PageLoader />;
    if (!initialValues && !isLoading)
        return <PageError message="Workspace not found."/>;
    return (<div className="w-full lg:max-w-xl">
      <EditWorkspaceForm initialValues={initialValues}/>
    </div>);
};
