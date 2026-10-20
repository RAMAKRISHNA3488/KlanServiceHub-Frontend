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
      const taskDocs = tasks?.documents;

      if (Array.isArray(taskDocs)) {
        const isCompleted = (t) => {
          const s = String(t?.status || '').toUpperCase().trim();
          return s === 'DONE' || s === 'COMPLETED' || s === 'RESOLVED' || s === 'CLOSED';
        };

        const isBacklog = (t) => {
          const s = String(t?.status || '').toUpperCase().trim();
          return s === 'BACKLOG' || s === 'BACK_LOG';
        };

        const isAssigned = (t) => {
          return Boolean(
            t?.assigneeId ||
            t?.assignee_id ||
            t?.assignee ||
            (Array.isArray(t?.assignees) && t.assignees.length > 0) ||
            (Array.isArray(t?.assigneeIds) && t.assigneeIds.length > 0)
          );
        };

        const isOverdue = (t) => {
          if (isCompleted(t) || isBacklog(t)) return false;
          const dStr = t?.dueDate || t?.due_date;
          if (!dStr) return false;
          try {
            const raw = String(dStr).trim();
            const normalized = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') + 'Z' : raw;
            const d = new Date(normalized);
            return !isNaN(d.getTime()) && d.getTime() < Date.now();
          } catch {
            return false;
          }
        };

        const total = tasks?.total ?? taskDocs.length;
        const completed = taskDocs.filter(isCompleted).length;
        const incomplete = Math.max(0, total - completed);
        const assigned = taskDocs.filter(isAssigned).length;
        const overdue = taskDocs.filter(isOverdue).length;

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
      }

      if (projectAnalytics) {
        const total = Number(projectAnalytics.taskCount || 0);
        const completed = Number(projectAnalytics.completedTaskCount || 0);
        const incomplete = Math.max(0, total - completed);

        return {
          ...projectAnalytics,
          taskCount: total,
          completedTaskCount: completed,
          incompleteTaskCount: incomplete,
          assignedTaskCount: Number(projectAnalytics.assignedTaskCount || 0),
          overdueTaskCount: Number(projectAnalytics.overdueTaskCount || 0),
        };
      }

      return {
        taskCount: 0,
        taskDifference: 0,
        assignedTaskCount: 0,
        assignedTaskDifference: 0,
        completedTaskCount: 0,
        completedTaskDifference: 0,
        incompleteTaskCount: 0,
        incompleteTaskDifference: 0,
        overdueTaskCount: 0,
        overdueTaskDifference: 0,
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
