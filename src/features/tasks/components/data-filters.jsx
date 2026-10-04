import { useEffect, useState } from 'react';
import { Folder, ListChecks, UserIcon } from 'lucide-react';
import { DatePicker } from '@/components/date-picker';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useTaskFilters } from '@/features/tasks/hooks/use-task-filters';
import { TaskStatus } from '@/features/tasks/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { workflowsAdminApi } from '@/lib/api-client';
import { snakeCaseToTitleCase } from '@/lib/utils';

export const DataFilters = ({ hideProjectFilter }) => {
    const workspaceId = useWorkspaceId();
    const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
    const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });
    const [workflows, setWorkflows] = useState([]);

    useEffect(() => {
        if (workspaceId) {
            workflowsAdminApi.getWorkflows(workspaceId)
                .then((res) => {
                    if (res?.data) setWorkflows(res.data);
                })
                .catch(() => {});
        }
    }, [workspaceId]);

    const defaultWorkflow = workflows[0];
    const workflowStatuses = defaultWorkflow?.statuses?.length > 0 
        ? defaultWorkflow.statuses 
        : [
            { name: TaskStatus.BACKLOG },
            { name: TaskStatus.TODO },
            { name: TaskStatus.IN_PROGRESS },
            { name: TaskStatus.IN_REVIEW },
            { name: TaskStatus.DONE },
        ];

    const isLoading = isLoadingProjects || isLoadingMembers;
    const projectOptions = projects?.documents.map((project) => ({
        value: project.$id,
        label: project.name,
    }));
    const memberOptions = members?.documents.map((member) => ({
        value: member.$id,
        label: member.name,
    }));
    const [{ status, assigneeId, projectId, dueDate }, setFilters] = useTaskFilters();
    const onStatusChange = (value) => {
        setFilters({ status: value === 'all' ? null : value });
    };
    const onAssigneeChange = (value) => {
        setFilters({ assigneeId: value === 'all' ? null : value });
    };
    const onProjectChange = (value) => {
        setFilters({ projectId: value === 'all' ? null : value });
    };
    if (isLoading)
        return null;
    return (<div className="flex flex-col gap-2 lg:flex-row">
      <Select defaultValue={status ?? undefined} onValueChange={onStatusChange}>
        <SelectTrigger className="h-8 w-full lg:w-auto">
          <div className="flex items-center pr-2">
            <ListChecks className="mr-2 size-4"/>
            <SelectValue placeholder="All statuses"/>
          </div>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectSeparator />

          {workflowStatuses.map((st) => (
            <SelectItem key={st.name} value={st.name}>
              {snakeCaseToTitleCase(st.name)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select defaultValue={assigneeId ?? undefined} onValueChange={onAssigneeChange}>
        <SelectTrigger className="h-8 w-full lg:w-auto">
          <div className="flex items-center pr-2">
            <UserIcon className="mr-2 size-4"/>
            <SelectValue placeholder="All assignees"/>
          </div>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          <SelectSeparator />

          {memberOptions?.map((member) => (<SelectItem key={member.value} value={member.value}>
              {member.label}
            </SelectItem>))}
        </SelectContent>
      </Select>

      {!hideProjectFilter && (<Select defaultValue={projectId ?? undefined} onValueChange={onProjectChange}>
          <SelectTrigger className="h-8 w-full lg:w-auto">
            <div className="flex items-center pr-2">
              <Folder className="mr-2 size-4"/>
              <SelectValue placeholder="All projects"/>
            </div>
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            <SelectSeparator />

            {projectOptions?.map((project) => (<SelectItem key={project.value} value={project.value}>
                {project.label}
              </SelectItem>))}
          </SelectContent>
        </Select>)}

      <DatePicker placeholder="Due date" className="h-8 w-full lg:w-auto" value={dueDate ? new Date(dueDate) : undefined} onChange={(date) => {
            setFilters({
                dueDate: date ? date.toISOString() : null,
            });
        }} showReset/>
    </div>);
};
