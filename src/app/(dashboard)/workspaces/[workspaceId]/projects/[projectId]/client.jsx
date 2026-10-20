'use client';
import { useMemo } from 'react';
import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { Analytics } from '@/components/analytics';
import { PageError } from '@/components/page-error';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { useGetProject } from '@/features/projects/api/use-get-project';
import { useGetProjectAnalytics } from '@/features/projects/api/use-get-project-analytics';
import { useGetTasks } from '@/features/tasks/api/use-get-tasks';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { useProjectId } from '@/features/projects/hooks/use-project-id';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { TaskViewSwitcher } from '@/features/tasks/components/task-view-switcher';

export const ProjectIdClient = () => {
    const projectId = useProjectId();
    const workspaceId = useWorkspaceId();
    const { data: project, isLoading: isLoadingProject } = useGetProject({ projectId });
    const { data: projectAnalytics, isLoading: isLoadingProjectAnalytics } = useGetProjectAnalytics({ projectId });
    const { data: tasks } = useGetTasks({ workspaceId, projectId });

    const safeAnalytics = useMemo(() => {
      const taskDocs = tasks?.documents || [];
      const total = tasks?.total || taskDocs.length;
      const completed = taskDocs.filter((t) => t.status === 'DONE').length;
      const incomplete = Math.max(0, total - completed);
      const assigned = taskDocs.filter((t) => 
        Boolean(t.assigneeId || t.assignee_id || t.assignee || (Array.isArray(t.assigneeIds) && t.assigneeIds.length > 0))
      ).length;
      const overdue = taskDocs.filter((t) => 
        t.status !== 'DONE' && t.dueDate && !isNaN(new Date(t.dueDate).getTime()) && new Date(t.dueDate).getTime() < Date.now()
      ).length;

      if (projectAnalytics && (projectAnalytics.taskCount > 0 || total === 0)) {
        return {
          ...projectAnalytics,
          taskCount: Math.max(projectAnalytics.taskCount || 0, total),
          assignedTaskCount: Math.max(projectAnalytics.assignedTaskCount || 0, assigned),
          completedTaskCount: Math.max(projectAnalytics.completedTaskCount || 0, completed),
          incompleteTaskCount: Math.max(projectAnalytics.incompleteTaskCount || 0, incomplete),
          overdueTaskCount: Math.max(projectAnalytics.overdueTaskCount || 0, overdue),
        };
      }

      return {
        taskCount: total,
        taskDifference: projectAnalytics?.taskDifference || 0,
        assignedTaskCount: assigned,
        assignedTaskDifference: projectAnalytics?.assignedTaskDifference || 0,
        completedTaskCount: completed,
        completedTaskDifference: projectAnalytics?.completedTaskDifference || 0,
        incompleteTaskCount: incomplete,
        incompleteTaskDifference: projectAnalytics?.incompleteTaskDifference || 0,
        overdueTaskCount: overdue,
        overdueTaskDifference: projectAnalytics?.overdueTaskDifference || 0,
      };
    }, [projectAnalytics, tasks]);

    const isLoading = isLoadingProject && !project;
    if (isLoading)
        return <PageLoader />;
    if (!project && !isLoadingProject)
        return <PageError message="Project not found."/>;
    return (<div className="flex flex-col gap-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <ProjectAvatar name={project.name} image={project.imageUrl} className="size-8"/>

          <p className="text-lg font-semibold">{project.name}</p>
        </div>

        <div>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/workspaces/${project.workspaceId}/projects/${project.$id}/settings`}>
              <Pencil className="mr-2 size-4"/>
              Edit Project
            </Link>
          </Button>
        </div>
      </div>

      <Analytics data={safeAnalytics}/>

      <TaskViewSwitcher projectId={projectId} hideProjectFilter/>
    </div>);
};
