'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { DottedSeparator } from '@/components/dotted-separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCreateProject } from '@/features/projects/api/use-create-project';
import { createProjectSchema } from '@/features/projects/schema';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { cn } from '@/lib/utils';
export const CreateProjectForm = ({ onCancel }) => {
    const router = useRouter();
    const workspaceId = useWorkspaceId();
    const inputRef = useRef(null);
    const { mutate: createProject, isPending } = useCreateProject();
    const createProjectForm = useForm({
        resolver: zodResolver(createProjectSchema),
        defaultValues: {
            name: '',
            key: '',
            image: undefined,
            workspaceId,
        },
    });

    const handleNameChange = (e, fieldOnChange) => {
        const val = e.target.value;
        fieldOnChange(val);
        // Only auto-generate key if key field is dirty/not manually customized or empty
        const currentKey = createProjectForm.getValues('key');
        if (!currentKey || currentKey.length <= 4) {
            const words = val.trim().split(/[^a-zA-Z0-9]+/).filter(Boolean);
            let suggested = '';
            if (words.length >= 2) {
                suggested = words.map(w => w[0]).join('').substring(0, 4).toUpperCase();
            } else if (words.length === 1) {
                suggested = words[0].substring(0, 4).toUpperCase();
            }
            if (suggested) {
                createProjectForm.setValue('key', suggested);
            }
        }
    };

    const onSubmit = (values) => {
        const finalValues = {
            ...values,
            workspaceId,
            key: values.key ? values.key.trim().toUpperCase() : '',
            image: values.image instanceof File ? values.image : '',
        };
        createProject({
            form: finalValues,
        }, {
            onSuccess: ({ data }) => {
                createProjectForm.reset();
                router.push(`/workspaces/${workspaceId}/projects/${data.$id}`);
            },
        });
    };
    const handleImageChange = (e) => {
        const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB in bytes;
        const file = e.target.files?.[0];
        if (file) {
            const validImageTypes = ['image/png', 'image/jpg', 'image/jpeg'];
            if (!validImageTypes.includes(file.type))
                return toast.error('File is not a valid image.');
            if (file.size > MAX_FILE_SIZE)
                return toast.error('Image size cannot exceed 1 MB.');
            createProjectForm.setValue('image', file);
        }
    };
    return (<Card className="size-full border-none shadow-none">
      <CardHeader className="flex p-7">
        <CardTitle className="text-xl font-bold">Create a new project</CardTitle>
      </CardHeader>

      <div className="px-7">
        <DottedSeparator />
      </div>

      <CardContent className="p-7">
        <Form {...createProjectForm}>
          <form onSubmit={createProjectForm.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-y-4">
              <FormField disabled={isPending} control={createProjectForm.control} name="name" render={({ field }) => (<FormItem>
                    <FormLabel>Project Name</FormLabel>

                    <FormControl>
                      <Input {...field} onChange={(e) => handleNameChange(e, field.onChange)} type="text" placeholder="Enter project name"/>
                    </FormControl>

                    <FormMessage />
                  </FormItem>)}/>

              <FormField disabled={isPending} control={createProjectForm.control} name="key" render={({ field }) => (<FormItem>
                    <FormLabel className="flex items-center justify-between">
                      <span>Project Key (Issue Prefix)</span>
                      <span className="text-[11px] text-muted-foreground font-normal">e.g. {field.value || 'PROJ'}-1, {field.value || 'PROJ'}-2</span>
                    </FormLabel>

                    <FormControl>
                      <Input {...field} maxLength={8} onChange={(e) => field.onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))} type="text" placeholder="e.g. SW, ECOM, DEV" className="font-mono uppercase font-bold tracking-wider"/>
                    </FormControl>

                    <FormMessage />
                  </FormItem>)}/>

              <FormField disabled={isPending} control={createProjectForm.control} name="image" render={({ field }) => (<div className="flex flex-col gap-y-2">
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
                    field.onChange(null);
                    if (inputRef.current)
                        inputRef.current.value = '';
                }}>
                            Remove Image
                          </Button>) : (<Button type="button" disabled={isPending} variant="tertiary" size="xs" className="mt-2 w-fit" onClick={() => inputRef.current?.click()}>
                            Upload Image
                          </Button>)}
                      </div>
                    </div>
                  </div>)}/>
            </div>

            <DottedSeparator className="py-7"/>

            <div className="flex items-center justify-between">
              <Button disabled={isPending} type="button" size="lg" variant="secondary" onClick={onCancel} className={cn(!onCancel && 'invisible')}>
                Cancel
              </Button>

              <Button disabled={isPending} type="submit" size="lg">
                Create Project
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>);
};
