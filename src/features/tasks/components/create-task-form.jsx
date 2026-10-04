'use client';
import React, { useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Search, X, Users, Check } from 'lucide-react';
import { DatePicker } from '@/components/date-picker';
import { DottedSeparator } from '@/components/dotted-separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { useCreateTask } from '@/features/tasks/api/use-create-task';
import { createTaskSchema } from '@/features/tasks/schema';
import { TaskStatus } from '@/features/tasks/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { cn } from '@/lib/utils';
export const CreateTaskForm = ({ initialStatus, onCancel, memberOptions, projectOptions }) => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const { mutate: createTask, isPending } = useCreateTask();
    const createTaskForm = useForm({
        resolver: zodResolver(createTaskSchema),
        defaultValues: {
            name: '',
            dueDate: undefined,
            assigneeId: undefined,
            description: '',
            projectId: undefined,
            status: initialStatus ?? undefined,
            workspaceId,
        },
    });
    const onSubmit = (values) => {
        createTask({
            json: values,
        }, {
            onSuccess: ({ data }) => {
                createTaskForm.reset();
                onCancel?.();
                if (data?.workspaceId && (data.$id || data.id)) {
                  router.push(`/workspaces/${data.workspaceId}/tasks/${data.$id || data.id}`);
                }
            },
        });
    };
    return (<Card className="size-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Create a new task</CardTitle>
      </CardHeader>

      <div className="px-7">
        <DottedSeparator />
      </div>

      <CardContent className="p-7">
        <Form {...createTaskForm}>
          <form onSubmit={createTaskForm.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              <FormField disabled={isPending} control={createTaskForm.control} name="name" render={({ field }) => (<FormItem>
                    <FormLabel>Task Name</FormLabel>

                    <FormControl>
                      <Input {...field} type="text" placeholder="Enter task name"/>
                    </FormControl>

                    <FormMessage />
                  </FormItem>)}/>

              <FormField disabled={isPending} control={createTaskForm.control} name="dueDate" render={({ field }) => (<FormItem>
                    <FormLabel>Due Date</FormLabel>

                    <FormControl>
                      <DatePicker {...field} disabled={isPending} placeholder="Select due date"/>
                    </FormControl>

                    <FormMessage />
                  </FormItem>)}/>

              <FormField disabled={isPending} control={createTaskForm.control} name="assigneeIds" render={({ field }) => {
                const selectedIds = field.value || (createTaskForm.watch('assigneeId') ? [createTaskForm.watch('assigneeId')] : []);
                const [assigneeSearch, setAssigneeSearch] = useState('');
                const toggleMember = (id) => {
                  const exists = selectedIds.includes(id);
                  const next = exists ? selectedIds.filter((item) => item !== id) : [...selectedIds, id];
                  field.onChange(next);
                  createTaskForm.setValue('assigneeId', next[0] || null);
                };

                const searchResults = assigneeSearch.trim()
                  ? memberOptions.filter((m) =>
                      m.name.toLowerCase().includes(assigneeSearch.toLowerCase().trim())
                    )
                  : [];

                return (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Assignees (Multiple Allowed)</FormLabel>
                      {selectedIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange([]);
                            createTaskForm.setValue('assigneeId', null);
                          }}
                          className="text-[11px] font-medium text-neutral-400 hover:text-red-500 transition"
                        >
                          Clear all ({selectedIds.length})
                        </button>
                      )}
                    </div>

                    {/* Selected assignees pills */}
                    {selectedIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 p-2 bg-neutral-50 rounded-lg border border-neutral-200">
                        {selectedIds.map((id) => {
                          const m = memberOptions.find((mem) => mem.id === id);
                          if (!m) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full text-xs font-medium text-neutral-800 border border-neutral-200 shadow-xs"
                            >
                              <MemberAvatar className="size-4" name={m.name} />
                              <span className="truncate max-w-[120px]">{m.name}</span>
                              <button
                                type="button"
                                onClick={() => toggleMember(id)}
                                className="text-neutral-400 hover:text-red-500 rounded-full ml-0.5"
                              >
                                &times;
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Search bar for assigning employees */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-neutral-400" />
                      <Input
                        type="text"
                        value={assigneeSearch}
                        onChange={(e) => setAssigneeSearch(e.target.value)}
                        placeholder="Search employee name to assign..."
                        disabled={isPending}
                        className="pl-8 pr-8 h-8 text-xs bg-white"
                      />
                      {assigneeSearch && (
                        <button
                          type="button"
                          onClick={() => setAssigneeSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Search results or prompt */}
                    {assigneeSearch.trim() ? (
                      <div className="rounded-lg border border-neutral-200 bg-white max-h-44 overflow-y-auto divide-y divide-neutral-100 shadow-xs">
                        {searchResults.map((member) => {
                          const isSelected = selectedIds.includes(member.id);
                          return (
                            <div
                              key={member.id}
                              onClick={() => toggleMember(member.id)}
                              className={`flex items-center justify-between px-3 py-2 cursor-pointer transition select-none ${
                                isSelected ? 'bg-blue-50/80 text-blue-900 font-semibold' : 'hover:bg-neutral-50 text-neutral-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <MemberAvatar className="size-5" name={member.name} />
                                <span className="text-xs">{member.name}</span>
                              </div>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="size-4 rounded text-blue-600 focus:ring-blue-500 border-neutral-300 pointer-events-none"
                              />
                            </div>
                          );
                        })}
                        {searchResults.length === 0 && (
                          <div className="py-3 px-3 text-center text-xs text-neutral-400 bg-neutral-50/50">
                            No employees found matching &quot;{assigneeSearch}&quot;
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-2.5 px-3 text-center text-[11px] text-neutral-400 bg-neutral-50/50 rounded-lg border border-dashed border-neutral-200">
                        <Users className="size-3.5 mx-auto mb-1 text-neutral-400" />
                        <span>Type an employee name in the search box above to find and add assignees</span>
                      </div>
                    )}

                    <FormMessage />
                  </FormItem>
                );
              }}/>

              <FormField disabled={isPending} control={createTaskForm.control} name="status" render={({ field }) => (<FormItem>
                    <FormLabel>Status</FormLabel>

                    <Select disabled={isPending} defaultValue={field.value} value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>{field.value ? <SelectValue placeholder="Select status"/> : 'Select status'}</SelectTrigger>
                      </FormControl>

                      <FormMessage />

                      <SelectContent>
                        <SelectItem value={TaskStatus.BACKLOG}>Backlog</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.IN_REVIEW}>In Review</SelectItem>
                        <SelectItem value={TaskStatus.TODO}>Todo</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>)}/>

              <FormField disabled={isPending} control={createTaskForm.control} name="projectId" render={({ field }) => (<FormItem>
                    <FormLabel>Project</FormLabel>

                    <Select disabled={isPending} defaultValue={field.value} value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>{field.value ? <SelectValue placeholder="Select project"/> : 'Select project'}</SelectTrigger>
                      </FormControl>

                      <FormMessage />

                      <SelectContent>
                        {projectOptions.map((project) => (<SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-x-2">
                              <ProjectAvatar className="size-6" name={project.name} image={project.imageUrl}/>
                              {project.name}
                            </div>
                          </SelectItem>))}
                      </SelectContent>
                    </Select>
                  </FormItem>)}/>
            </div>

            <DottedSeparator className="py-7"/>

            <FormMessage />

            <div className="flex items-center justify-between">
              <Button disabled={isPending} type="button" size="lg" variant="secondary" onClick={onCancel} className={cn(!onCancel && 'invisible')}>
                Cancel
              </Button>

              <Button disabled={isPending} type="submit" size="lg">
                Create Task
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>);
};
