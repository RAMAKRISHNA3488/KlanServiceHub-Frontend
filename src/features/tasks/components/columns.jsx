'use client';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowUpDown, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { snakeCaseToTitleCase } from '@/lib/utils';
import { TaskActions } from './task-actions';
import { TaskDate } from './task-date';
const columnHelper = createColumnHelper();
export const columns = columnHelper.columns([
    columnHelper.accessor('name', {
        header: ({ column }) => {
            return (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Task Name
          <ArrowUpDown className="ml-2 h-4 w-4"/>
        </Button>);
        },
        cell: ({ row }) => {
            const name = row.original.name;
            const key = row.original.key;
            return (
              <div className="flex items-center gap-x-2">
                {key && (
                  <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded shrink-0">
                    {key}
                  </span>
                )}
                <p className="line-clamp-1 font-medium">{name}</p>
              </div>
            );
        },
    }),
    columnHelper.accessor('project', {
        header: ({ column }) => {
            return (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Project
          <ArrowUpDown className="ml-2 h-4 w-4"/>
        </Button>);
        },
        cell: ({ row }) => {
            const project = row.original.project;
            return (<div className="flex items-center gap-x-2 text-sm font-medium">
          <ProjectAvatar className="size-6" name={project.name} image={project.imageUrl}/>

          <p className="line-clamp-1">{project.name}</p>
        </div>);
        },
    }),
    columnHelper.accessor('assignee', {
        header: ({ column }) => {
            return (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Assignees
          <ArrowUpDown className="ml-2 h-4 w-4"/>
        </Button>);
        },
        cell: ({ row }) => {
            const assignees = (row.original.assignees && row.original.assignees.length > 0)
              ? row.original.assignees
              : (row.original.assignee ? [row.original.assignee] : []);
            
            if (assignees.length === 0) {
              return <span className="text-xs text-neutral-400 italic">Unassigned</span>;
            }

            if (assignees.length === 1) {
              return (
                <div className="flex items-center gap-x-2 text-sm font-medium">
                  <MemberAvatar fallbackClassName="text-xs" className="size-6" name={assignees[0].name}/>
                  <p className="line-clamp-1">{assignees[0].name}</p>
                </div>
              );
            }

            const names = assignees.map(a => a.name).join(', ');
            return (
              <div className="flex items-center gap-x-2 text-sm font-medium" title={names}>
                <div className="flex items-center -space-x-2 overflow-hidden">
                  {assignees.slice(0, 3).map((a, i) => (
                    <MemberAvatar key={a.$id || a.id || i} fallbackClassName="text-[10px]" className="size-6 ring-2 ring-white" name={a.name}/>
                  ))}
                  {assignees.length > 3 && (
                    <span className="flex size-6 items-center justify-center rounded-full bg-neutral-100 ring-2 ring-white text-[10px] font-bold text-neutral-600">
                      +{assignees.length - 3}
                    </span>
                  )}
                </div>
                <p className="line-clamp-1 text-xs text-neutral-600">{assignees.length} members</p>
              </div>
            );
        },
    }),
    columnHelper.accessor('dueDate', {
        header: ({ column }) => {
            return (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Due Date
          <ArrowUpDown className="ml-2 h-4 w-4"/>
        </Button>);
        },
        cell: ({ row }) => {
            const dueDate = row.original.dueDate;
            return <TaskDate value={dueDate}/>;
        },
    }),
    columnHelper.accessor('status', {
        header: ({ column }) => {
            return (<Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Status
          <ArrowUpDown className="ml-2 h-4 w-4"/>
        </Button>);
        },
        cell: ({ row }) => {
            const status = row.original.status;
            return <Badge variant={status}>{snakeCaseToTitleCase(status)}</Badge>;
        },
    }),
    columnHelper.display({
        id: 'actions',
        cell: ({ row }) => {
            const id = row.original.$id;
            const projectId = row.original.projectId;
            return (<TaskActions id={id} projectId={projectId}>
          <Button variant="ghost" className="size-8 p-0">
            <MoreVertical className="size-4"/>
          </Button>
        </TaskActions>);
        },
    }),
]);
