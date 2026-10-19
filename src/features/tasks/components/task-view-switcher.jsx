'use client';
import { Loader2, PlusIcon } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DottedSeparator } from '@/components/dotted-separator';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBulkUpdateTasks } from '@/features/tasks/api/use-bulk-update-tasks';
import { useGetTasks } from '@/features/tasks/api/use-get-tasks';
import { useCreateTaskModal } from '@/features/tasks/hooks/use-create-task-modal';
import { useTaskFilters } from '@/features/tasks/hooks/use-task-filters';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useCurrent } from '@/features/auth/api/use-current';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { teamsAdminApi, sprintsApi, workflowsAdminApi } from '@/lib/api-client';
import { BoardFilters } from '@/features/company/components/board-filters';
import { columns } from './columns';
import { DataCalendar } from './data-calendar';
import { DataFilters } from './data-filters';
import { DataKanban } from './data-kanban';
import { DataSearch } from './data-search';
import { DataTable } from './data-table';

const isWithinDateRange = (taskDateStr, range, startDate, endDate) => {
  if (!range || range === 'ALL') return true;
  if (!taskDateStr) return false;

  const taskDate = new Date(taskDateStr);
  if (isNaN(taskDate.getTime())) return false;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === 'today') {
    return taskDate >= startOfToday;
  }
  if (range === '7d') {
    const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return taskDate >= past7;
  }
  if (range === '30d') {
    const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return taskDate >= past30;
  }
  if (range === '90d') {
    const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    return taskDate >= past90;
  }
  if (range === 'thisYear') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return taskDate >= startOfYear;
  }
  if (range === 'custom') {
    if (startDate && new Date(taskDateStr) < new Date(startDate)) return false;
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(taskDateStr) > end) return false;
    }
    return true;
  }
  return true;
};

export const TaskViewSwitcher = ({ projectId, hideProjectFilter }) => {
    const [view, setView] = useQueryState('task-view', {
        defaultValue: 'table',
    });
    const [{ status, assigneeId, projectId: filteredProjectId, dueDate, search }] = useTaskFilters();
    const workspaceId = useWorkspaceId();
    const { open } = useCreateTaskModal();
    const { data: currentUser } = useCurrent();
    const { data: membersData } = useGetMembers({ workspaceId });
    const { data: projectsData } = useGetProjects({ workspaceId });

    const projects = projectsData?.documents || [];
    const members = membersData?.documents || [];
    const currentMember = members.find(
        (m) => m.userId === currentUser?.$id || m.userId === currentUser?.id || m.user_id === currentUser?.$id
    );
    const isAdmin =
        currentUser?.role === 'ADMIN' ||
        currentMember?.role === 'ADMIN' ||
        currentMember?.role === 'OWNER' ||
        currentMember?.organization_role === 'COMPANY_OWNER' ||
        currentMember?.organization_role === 'COMPANY_ADMIN' ||
        currentUser?.isOwner;

    // Fetch teams, sprints, workflows & issueTypes for rich Kanban filtering
    const { data: auxData } = useQuery({
      queryKey: ['task-view-aux-data', workspaceId],
      queryFn: async () => {
        const [teamsRes, sprintsRes, wfRes, typesRes] = await Promise.all([
          teamsAdminApi.getTeams(workspaceId).catch(() => ({ data: [] })),
          sprintsApi.getSprints(workspaceId).catch(() => ({ data: [] })),
          workflowsAdminApi.getWorkflows(workspaceId).catch(() => ({ data: [] })),
          workflowsAdminApi.getIssueTypes(workspaceId).catch(() => ({ data: [] })),
        ]);
        return {
          teams: Array.isArray(teamsRes?.data) ? teamsRes.data : (teamsRes?.data?.teams || []),
          sprints: Array.isArray(sprintsRes?.data) ? sprintsRes.data : (sprintsRes?.data?.sprints || []),
          workflows: wfRes?.data || [],
          issueTypes: typesRes?.data || [],
        };
      },
      enabled: !!workspaceId,
    });

    const teams = auxData?.teams || [];
    const sprints = auxData?.sprints || [];
    const workflows = auxData?.workflows || [];
    const issueTypes = auxData?.issueTypes || [];
    const workflowStatuses = workflows[0]?.statuses?.length > 0 ? workflows[0].statuses : [];

    // Kanban Rich Filter State matching reference image
    const [kanbanFilters, setKanbanFilters] = useState({
      dateRange: null,
      startDate: '',
      endDate: '',
      projectId: projectId || 'ALL',
      teamId: 'ALL',
      assigneeId: 'ALL',
      workType: 'ALL',
      status: 'ALL',
      priority: 'ALL',
      sprintId: 'ALL',
    });
    const [kanbanSearch, setKanbanSearch] = useState('');

    useEffect(() => {
      if (projectId && projectId !== kanbanFilters.projectId) {
        setKanbanFilters((prev) => ({ ...prev, projectId }));
      }
    }, [projectId]);

    const handleKanbanFilterChange = (key, value) => {
      setKanbanFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleResetKanbanFilters = () => {
      setKanbanFilters({
        dateRange: null,
        startDate: '',
        endDate: '',
        projectId: projectId || 'ALL',
        teamId: 'ALL',
        assigneeId: 'ALL',
        workType: 'ALL',
        status: 'ALL',
        priority: 'ALL',
        sprintId: 'ALL',
      });
      setKanbanSearch('');
    };

    const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
        workspaceId,
        status,
        assigneeId,
        projectId: projectId ?? filteredProjectId,
        dueDate,
        search,
    });
    const { mutate: bulkUpdateTasks } = useBulkUpdateTasks();
    const onKanbanChange = useCallback((tasks) => {
        bulkUpdateTasks({
            json: { tasks },
        });
    }, [bulkUpdateTasks]);

    // Apply 9-factor filtering on Kanban tasks
    const filteredKanbanTasks = useMemo(() => {
      const rawTasks = tasks?.documents ?? [];
      return rawTasks.filter((task) => {
        // 1. Search Query
        if (kanbanSearch) {
          const query = kanbanSearch.toLowerCase();
          const matchesSearch =
            task.name?.toLowerCase().includes(query) ||
            task.key?.toLowerCase().includes(query) ||
            task.description?.toLowerCase().includes(query);
          if (!matchesSearch) return false;
        }

        // 2. Project Filter
        if (kanbanFilters.projectId && kanbanFilters.projectId !== 'ALL') {
          const matchesProject =
            task.projectId === kanbanFilters.projectId ||
            task.project_id === kanbanFilters.projectId ||
            task.project?.$id === kanbanFilters.projectId ||
            task.project?.id === kanbanFilters.projectId;
          if (!matchesProject) return false;
        }

        // 3. Team Filter
        if (kanbanFilters.teamId && kanbanFilters.teamId !== 'ALL') {
          const selectedTeam = teams.find((t) => t.id === kanbanFilters.teamId);
          if (selectedTeam) {
            const teamMemberIds = new Set((selectedTeam.members || []).map((m) => m.id || m.userId || m.user_id));
            const teamProjectIds = new Set((selectedTeam.projects || []).map((p) => p.id || p.$id));
            const assigneeUserId = task.assignee?.userId || task.assignee?.user_id || task.assignee?.id || task.assigneeId;
            const taskProjId = task.projectId || task.project_id;
            const inTeamMembers = assigneeUserId && teamMemberIds.has(assigneeUserId);
            const inTeamProjects = taskProjId && teamProjectIds.has(taskProjId);
            if (!inTeamMembers && !inTeamProjects) return false;
          }
        }

        // 4. Assignee Filter
        if (kanbanFilters.assigneeId && kanbanFilters.assigneeId !== 'ALL') {
          if (kanbanFilters.assigneeId === 'UNASSIGNED') {
            if (task.assigneeId || task.assignee) return false;
          } else {
            const matchesAssignee =
              task.assigneeId === kanbanFilters.assigneeId ||
              task.assignee?.$id === kanbanFilters.assigneeId ||
              task.assignee?.id === kanbanFilters.assigneeId ||
              task.assignee?.userId === kanbanFilters.assigneeId ||
              (Array.isArray(task.assignees) &&
                task.assignees.some(
                  (a) =>
                    a.id === kanbanFilters.assigneeId ||
                    a.memberId === kanbanFilters.assigneeId ||
                    a.userId === kanbanFilters.assigneeId
                ));
            if (!matchesAssignee) return false;
          }
        }

        // 5. Work Type Filter
        if (kanbanFilters.workType && kanbanFilters.workType !== 'ALL') {
          const taskType = (task.issueType || task.issue_type || 'Task').toUpperCase();
          if (taskType !== kanbanFilters.workType.toUpperCase()) return false;
        }

        // 6. Status Filter
        if (kanbanFilters.status && kanbanFilters.status !== 'ALL') {
          const taskStatus = (task.status || '').toUpperCase().trim();
          const filterStatus = kanbanFilters.status.toUpperCase().trim();
          if (taskStatus !== filterStatus) return false;
        }

        // 7. Priority Filter
        if (kanbanFilters.priority && kanbanFilters.priority !== 'ALL') {
          const taskPriority = (task.priority || '').toUpperCase().trim();
          const filterPriority = kanbanFilters.priority.toUpperCase().trim();
          if (taskPriority !== filterPriority) return false;
        }

        // 8. Sprint Filter
        if (kanbanFilters.sprintId && kanbanFilters.sprintId !== 'ALL') {
          const taskSprint = task.sprintId || task.sprint_id;
          if (taskSprint !== kanbanFilters.sprintId) return false;
        }

        // 9. Date Range Filter
        if (kanbanFilters.dateRange && kanbanFilters.dateRange !== 'ALL') {
          const taskDates = [
            task.createdAt,
            task.created_at,
            task.updatedAt,
            task.updated_at,
            task.dueDate,
            task.due_date,
          ].filter(Boolean);

          if (taskDates.length > 0) {
            const anyMatches = taskDates.some((d) =>
              isWithinDateRange(d, kanbanFilters.dateRange, kanbanFilters.startDate, kanbanFilters.endDate)
            );
            if (!anyMatches) return false;
          }
        }

        return true;
      });
    }, [tasks?.documents, kanbanSearch, kanbanFilters, teams]);

    return (<Tabs defaultValue={view} onValueChange={setView} className="w-full flex-1 rounded-lg border">
      <div className="flex h-full flex-col overflow-auto p-4">
        <div className="flex flex-col items-center justify-between gap-y-2 lg:flex-row">
          <TabsList className="w-full lg:w-auto">
            <TabsTrigger className="h-8 w-full lg:w-auto" value="table">
              Table
            </TabsTrigger>

            <TabsTrigger className="h-8 w-full lg:w-auto" value="kanban">
              Kanban
            </TabsTrigger>

            <TabsTrigger className="h-8 w-full lg:w-auto" value="calendar">
              Calendar
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => open()} size="sm" className="w-full lg:w-auto">
            <PlusIcon className="size-4"/>
            New
          </Button>
        </div>
        <DottedSeparator className="my-4"/>

        {/* Filter Section: Rich BoardFilters for Kanban view, standard DataFilters for Table & Calendar */}
        {view === 'kanban' ? (
          <div className="mb-4">
            <BoardFilters
              filters={kanbanFilters}
              onFilterChange={handleKanbanFilterChange}
              onResetFilters={handleResetKanbanFilters}
              searchQuery={kanbanSearch}
              onSearchChange={setKanbanSearch}
              projects={projects}
              teams={teams}
              members={members}
              sprints={sprints}
              statuses={workflowStatuses}
              issueTypes={issueTypes}
            />
          </div>
        ) : (
          <>
            <div className="flex flex-col justify-between gap-2 xl:flex-row xl:items-center">
              <DataFilters hideProjectFilter={hideProjectFilter}/>
              <DataSearch />
            </div>
            <DottedSeparator className="my-4"/>
          </>
        )}

        {isLoadingTasks ? (<div className="flex h-[200px] w-full flex-col items-center justify-center rounded-lg border">
            <Loader2 className="size-5 animate-spin text-muted-foreground"/>
          </div>) : (<>
            <TabsContent value="table" className="mt-0">
              <DataTable columns={columns} data={tasks?.documents ?? []}/>
            </TabsContent>

            <TabsContent value="kanban" className="mt-0">
              <DataKanban data={filteredKanbanTasks} onChange={onKanbanChange} isAdmin={isAdmin}/>
            </TabsContent>

            <TabsContent value="calendar" className="mt-0 h-full pb-4">
              <DataCalendar data={tasks?.documents ?? []}/>
            </TabsContent>
          </>)}
      </div>
    </Tabs>);
};
