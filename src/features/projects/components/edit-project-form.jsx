'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ImageIcon, SlidersHorizontal, AlertTriangle, CheckCircle2, RotateCcw, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DottedSeparator } from '@/components/dotted-separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useDeleteProject } from '@/features/projects/api/use-delete-project';
import { useUpdateProject } from '@/features/projects/api/use-update-project';
import { updateProjectSchema } from '@/features/projects/schema';
import { useConfirm } from '@/hooks/use-confirm';
import { cn } from '@/lib/utils';
import { workflowsAdminApi } from '@/lib/api-client';

const OVERLOAD_COLOR_PRESETS = [
  { label: 'Crimson Red', value: '#EF4444' },
  { label: 'Flame Orange', value: '#F97316' },
  { label: 'Amber Alert', value: '#F59E0B' },
  { label: 'Violet Caution', value: '#8B5CF6' },
  { label: 'Rose Critical', value: '#EC4899' },
  { label: 'Indigo Heavy', value: '#6366F1' },
];

export const EditProjectForm = ({ onCancel, initialValues }) => {
    const router = useRouter();
    const inputRef = useRef(null);
    const [DeleteDialog, confirmDelete] = useConfirm('Delete project', 'This action cannot be undone.', 'destructive');
    const { mutate: updateProject, isPending: isUpdatingProject } = useUpdateProject();
    const { mutate: deleteProject, isPending: isDeletingProject } = useDeleteProject();

    const [stageLimits, setStageLimits] = useState(() => {
        return initialValues.stageLimits || initialValues.stage_limits || {};
    });
    const [workflowStatuses, setWorkflowStatuses] = useState([]);

    useEffect(() => {
        if (initialValues.workspaceId) {
            workflowsAdminApi.getWorkflows(initialValues.workspaceId)
                .then((res) => {
                    const statuses = res?.data?.[0]?.statuses || [];
                    setWorkflowStatuses(statuses);
                })
                .catch(() => {});
        }
    }, [initialValues.workspaceId]);

    const handleUpdateStageLimit = (stageName, field, value) => {
        setStageLimits((prev) => {
            const current = prev[stageName] || {};
            return {
                ...prev,
                [stageName]: {
                    ...current,
                    [field]: value,
                },
            };
        });
    };

    const handleResetStageLimit = (stageName) => {
        setStageLimits((prev) => {
            const next = { ...prev };
            delete next[stageName];
            return next;
        });
    };

    const handleSaveStageLimitsOnly = () => {
        updateProject({
            form: {
                stageLimits,
            },
            param: { projectId: initialValues.$id },
        }, {
            onSuccess: () => {
                toast.success(`WIP limits updated for ${initialValues.name}!`);
            }
        });
    };

    const updateProjectForm = useForm({
        resolver: zodResolver(updateProjectSchema),
        defaultValues: {
            ...initialValues,
            key: initialValues.key ?? '',
            image: initialValues.imageUrl ?? '',
        },
    });
    const onSubmit = (values) => {
        const finalValues = {
            ...values,
            key: values.key ? values.key.trim().toUpperCase() : '',
            image: values.image instanceof File ? values.image : '',
            stageLimits,
        };
        updateProject({
            form: finalValues,
            param: { projectId: initialValues.$id },
        });
    };
    const handleImageChange = (e) => {
        const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB in bytes;
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > MAX_FILE_SIZE)
                return toast.error('Image size cannot exceed 1 MB.');
            updateProjectForm.setValue('image', file);
        }
    };
    const handleDelete = async () => {
        const ok = await confirmDelete({
            title: 'Delete Project',
            subtitle: 'Permanent project removal',
            targetName: initialValues.name,
            message: 'Are you sure you want to delete this project and all its issues?',
            impactTitle: 'Permanent Project Impact',
            impactNotice: 'All tasks, sprints, Kanban boards, attachments, releases, and activity history belonging to this project will be permanently erased. This action cannot be reversed.',
            confirmText: 'Delete Project',
            variant: 'destructive',
        });
        if (!ok)
            return;
        deleteProject({
            param: { projectId: initialValues.$id },
        }, {
            onSuccess: ({ data }) => {
                window.location.href = `/workspaces/${data.workspaceId}`;
            },
        });
    };
    const isPending = isUpdatingProject || isDeletingProject;
    return (<div className="flex flex-col gap-y-4">
      <DeleteDialog />

      <Card className="size-full border-none shadow-none">
        <CardHeader className="flex flex-row items-center gap-x-4 space-y-0 p-7">
          <Button size="sm" variant="secondary" onClick={onCancel ? onCancel : () => router.push(`/workspaces/${initialValues.workspaceId}/projects/${initialValues.$id}`)} className="gap-x-1">
            <ArrowLeft className="size-4"/>
            Back
          </Button>

          <CardTitle className="text-xl font-bold">{initialValues.name}</CardTitle>
        </CardHeader>

        <div className="px-7">
          <DottedSeparator />
        </div>

        <CardContent className="p-7">
          <Form {...updateProjectForm}>
            <form onSubmit={updateProjectForm.handleSubmit(onSubmit)}>
              <div className="flex flex-col gap-y-4">
                <FormField disabled={isPending} control={updateProjectForm.control} name="name" render={({ field }) => (<FormItem>
                      <FormLabel>Project Name</FormLabel>

                      <FormControl>
                        <Input {...field} type="text" placeholder="Enter project name"/>
                      </FormControl>

                      <FormMessage />
                    </FormItem>)}/>

                <FormField disabled={isPending} control={updateProjectForm.control} name="key" render={({ field }) => (<FormItem>
                      <FormLabel className="flex items-center justify-between">
                        <span>Project Key</span>
                        <span className="text-[11px] text-muted-foreground font-normal">Issue ticket prefix (e.g. {field.value || 'PROJ'}-1)</span>
                      </FormLabel>

                      <FormControl>
                        <Input {...field} maxLength={8} onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} type="text" placeholder="e.g. SW, ECOM" className="font-mono uppercase font-bold tracking-wider"/>
                      </FormControl>

                      <FormMessage />
                    </FormItem>)}/>

                <FormField disabled={isPending} control={updateProjectForm.control} name="image" render={({ field }) => (<div className="flex flex-col gap-y-2">
                      <div className="flex items-center gap-x-5">
                        {field.value ? (<div className="relative size-[72px] overflow-hidden rounded-md">
                            <Image src={field.value instanceof File ? URL.createObjectURL(field.value) : field.value} alt="Project Logo" fill className="object-cover"/>
                          </div>) : (<Avatar className="size-[72px]">
                            <AvatarFallback>
                              <ImageIcon className="size-[36px] text-neutral-400"/>
                            </AvatarFallback>
                          </Avatar>)}

                        <div className="flex flex-col">
                          <p className="text-sm">Project Icon</p>
                          <p className="text-xs text-muted-foreground">JPG, PNG, or JPEG, max 1MB</p>

                          <input type="file" className="hidden" onChange={handleImageChange} accept=".jpg, .png, .jpeg" ref={inputRef} disabled={isPending}/>

                          {field.value ? (<Button type="button" disabled={isPending} variant="destructive" size="xs" className="mt-2 w-fit" onClick={() => {
                    field.onChange('');
                    if (inputRef.current)
                        inputRef.current.value = '';
                }}>
                              Remove Image
                            </Button>) : (<Button type="button" disabled={isPending} variant="tertiary" size="xs" className="mt-2 w-fit" onClick={() => inputRef.current?.click()}>
                              Upload Image
                            </Button>)}
                        </div>
                      </div>

                      <FormMessage />
                    </div>)}/>
              </div>

              <DottedSeparator className="py-7"/>

              <div className="flex items-center justify-between">
                <Button disabled={isPending} type="button" size="lg" variant="secondary" onClick={onCancel} className={cn(!onCancel && 'invisible')}>
                  Cancel
                </Button>

                <Button disabled={isPending} type="submit" size="lg">
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Kanban WIP Limits & Stage Overload Telemetry */}
      <Card className="size-full border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-7">
          <div className="flex items-center gap-x-3">
            <div className="size-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <SlidersHorizontal className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-neutral-900">
                Kanban WIP Limits & Stage Overload Telemetry
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize maximum ticket capacity and alert highlight colors per stage specifically for <span className="font-semibold text-neutral-800">{initialValues.name}</span>.
              </p>
            </div>
          </div>
        </CardHeader>

        <div className="px-7">
          <DottedSeparator />
        </div>

        <CardContent className="p-7 space-y-5">
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="size-4.5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Project-Specific Override Priority</p>
              <p className="text-blue-700 leading-relaxed text-[11.5px]">
                Settings configured here take precedence over workspace workflow defaults whenever viewing this project’s Kanban board.
                Completed stages (<code className="font-mono font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">DONE</code>) are strictly exempt from WIP limits.
              </p>
            </div>
          </div>

          {workflowStatuses.length === 0 ? (
            <div className="py-6 text-center text-xs text-neutral-400">
              Loading workflow stages...
            </div>
          ) : (
            <div className="space-y-4">
              {workflowStatuses.map((st) => {
                const isDone = (st.category || '').toUpperCase() === 'DONE' || st.name.toUpperCase().includes('DONE');
                const override = stageLimits[st.name] || stageLimits[st.id] || null;
                const defaultLimit = st.maxTasks !== undefined ? st.maxTasks : (st.max_tasks !== undefined ? st.max_tasks : 5);
                const currentLimit = isDone ? 0 : (override?.maxTasks !== undefined ? override.maxTasks : defaultLimit);
                const defaultColor = st.overloadColor || st.overload_color || '#EF4444';
                const currentColor = override?.overloadColor || defaultColor;
                const isCustomized = Boolean(override);

                return (
                  <div
                    key={st.id || st.name}
                    className={`rounded-xl border transition-all p-4 ${
                      isDone
                        ? 'bg-neutral-50/80 border-neutral-200/70'
                        : isCustomized
                        ? 'bg-blue-50/30 border-blue-200/80 shadow-2xs'
                        : 'bg-white border-neutral-200/80 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full border border-black/10 shrink-0"
                          style={{ backgroundColor: st.color || '#3B82F6' }}
                        />
                        <span className="text-sm font-bold text-neutral-900 uppercase tracking-wide">
                          {st.name.replace(/_/g, ' ')}
                        </span>
                        {isDone ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wide uppercase">
                            Done (Exempt)
                          </span>
                        ) : isCustomized ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 tracking-wide uppercase">
                            Project Override
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                            Workspace Default ({defaultLimit})
                          </span>
                        )}
                      </div>

                      {!isDone && isCustomized && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => handleResetStageLimit(st.name)}
                          className="text-[11px] text-neutral-500 hover:text-red-600 h-7 px-2 gap-1"
                        >
                          <RotateCcw className="size-3" />
                          Reset to Default
                        </Button>
                      )}
                    </div>

                    {isDone ? (
                      <p className="text-xs text-neutral-500 italic flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                        Completed tasks naturally accumulate in Done without triggering capacity overload alerts.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Capacity Limit Number Input */}
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Stage WIP Capacity Limit (Tickets)
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={currentLimit}
                              onChange={(e) => handleUpdateStageLimit(st.name, 'maxTasks', Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-24 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-bold focus:border-blue-500 focus:outline-none"
                            />
                            <span className="text-xs text-neutral-500">
                              (Threshold before stage alerts)
                            </span>
                          </div>
                        </div>

                        {/* Overload Alert Color */}
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Overload Alert Color
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-neutral-100/80 p-1 rounded-lg border border-neutral-200">
                              {OVERLOAD_COLOR_PRESETS.map((preset) => (
                                <button
                                  key={preset.value}
                                  type="button"
                                  title={preset.label}
                                  onClick={() => handleUpdateStageLimit(st.name, 'overloadColor', preset.value)}
                                  className={`size-5 rounded-full transition-transform border border-black/15 ${
                                    currentColor.toUpperCase() === preset.value.toUpperCase()
                                      ? 'scale-125 ring-2 ring-blue-500 ring-offset-1'
                                      : 'hover:scale-110'
                                  }`}
                                  style={{ backgroundColor: preset.value }}
                                />
                              ))}
                              <label
                                className="relative size-5 rounded-full border border-neutral-300 overflow-hidden cursor-pointer flex items-center justify-center bg-white hover:scale-110 transition-transform"
                                title="Custom Hex Color"
                              >
                                <input
                                  type="color"
                                  value={currentColor}
                                  onChange={(e) => handleUpdateStageLimit(st.name, 'overloadColor', e.target.value)}
                                  className="absolute opacity-0 inset-0 cursor-pointer size-full"
                                />
                                <span className="text-[9px] font-bold text-neutral-500">+</span>
                              </label>
                            </div>
                            <span className="text-xs font-mono font-semibold uppercase text-neutral-600">
                              {currentColor}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Board Preview Bar */}
                        <div className="md:col-span-2 pt-2 border-t border-neutral-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-neutral-500">
                            Live Kanban Line Preview:
                          </span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-10 rounded-full bg-emerald-500" />
                              <span className="text-[10px] text-neutral-500">≤ {currentLimit} (Green)</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-2 w-10 rounded-full animate-pulse shadow-2xs"
                                style={{ backgroundColor: currentColor }}
                              />
                              <span className="text-[10px] font-semibold" style={{ color: currentColor }}>
                                &gt; {currentLimit} (Alert)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              disabled={isPending}
              onClick={handleSaveStageLimitsOnly}
              size="sm"
              className="bg-neutral-900 hover:bg-neutral-800 text-white font-medium"
            >
              Save Project WIP Limits
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="size-full border-none shadow-none">
        <CardContent className="p-7">
          <div className="flex flex-col">
            <h3 className="font-bold">Danger Zone</h3>

            <p className="text-sm text-muted-foreground">Deleting a project is irreversible and will remove all associated data.</p>

            <DottedSeparator className="py-7"/>

            <Button size="sm" variant="destructive" type="button" disabled={isPending} onClick={handleDelete} className="ml-auto mt-6 w-fit">
              Delete Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>);
};
