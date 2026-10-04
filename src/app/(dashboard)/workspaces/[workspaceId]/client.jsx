'use client';
import React, { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  CalendarIcon,
  PlusIcon,
  SettingsIcon,
  CheckCircle2,
  FolderGit2,
  Users2,
  Clock,
  ArrowRight,
  UserPlus,
  Mail,
  X,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { Analytics } from '@/components/analytics';
import { DottedSeparator } from '@/components/dotted-separator';
import { PageLoader } from '@/components/page-loader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { ProjectAvatar } from '@/features/projects/components/project-avatar';
import { useCreateProjectModal } from '@/features/projects/hooks/use-create-project-modal';
import { useGetTasks } from '@/features/tasks/api/use-get-tasks';
import { useCreateTaskModal } from '@/features/tasks/hooks/use-create-task-modal';
import { useGetWorkspaceAnalytics } from '@/features/workspaces/api/use-get-workspace-analytics';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { usersAdminApi } from '@/lib/api-client';
import { toast } from 'sonner';

// Helper for safe relative date parsing
const safeFormatDistance = (dateStr) => {
  if (!dateStr) return 'No due date';
  try {
    const raw = String(dateStr).trim();
    // Normalize SQLite timestamps 'YYYY-MM-DD HH:MM:SS' to ISO string
    const normalized = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') + 'Z' : raw;
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return 'No due date';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'No due date';
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'DONE':
      return <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">DONE</span>;
    case 'IN_PROGRESS':
      return <span className="rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">IN PROGRESS</span>;
    case 'IN_REVIEW':
      return <span className="rounded bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">IN REVIEW</span>;
    case 'BACKLOG':
      return <span className="rounded bg-neutral-200 px-2 py-0.5 text-[10px] font-bold text-neutral-700">BACKLOG</span>;
    default:
      return <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">TO DO</span>;
  }
};

export const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId();
  const { open: createTask } = useCreateTaskModal();
  const { open: createProject } = useCreateProjectModal();

  const { data: workspaceAnalytics, isLoading: isLoadingAnalytics } = useGetWorkspaceAnalytics({ workspaceId });
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({ workspaceId });
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
  const { data: members, isLoading: isLoadingMembers, refetch: refetchMembers } = useGetMembers({ workspaceId });

  // Quick Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [sentInviteData, setSentInviteData] = useState(null);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid work email address.');
      return;
    }

    try {
      setSendingInvite(true);
      const res = await usersAdminApi.inviteUser(workspaceId, {
        email: inviteEmail.trim(),
        name: inviteName.trim() || inviteEmail.split('@')[0],
        roleName: inviteRole,
        jobTitle: 'Team Member',
        department: 'General',
      });

      if (res?.emailSent) {
        toast.success(`✉️ Invitation email sent successfully to ${inviteEmail}!`);
      } else {
        toast.success(`Invitation created for ${inviteEmail}`);
      }

      setSentInviteData({ email: inviteEmail, inviteUrl: res.inviteUrl });
      refetchMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const isLoading = (isLoadingAnalytics || isLoadingTasks || isLoadingProjects || isLoadingMembers) && !tasks && !projects;

  // Compute safe fallback analytics
  const safeAnalytics = useMemo(() => {
    if (workspaceAnalytics) return workspaceAnalytics;

    const taskDocs = tasks?.documents || [];
    const total = tasks?.total || taskDocs.length;
    const completed = taskDocs.filter((t) => t.status === 'DONE').length;
    const incomplete = total - completed;

    return {
      taskCount: total,
      taskDifference: 0,
      assignedTaskCount: taskDocs.filter((t) => !!t.assigneeId).length,
      assignedTaskDifference: 0,
      completedTaskCount: completed,
      completedTaskDifference: 0,
      incompleteTaskCount: incomplete,
      incompleteTaskDifference: 0,
      overdueTaskCount: 0,
      overdueTaskDifference: 0,
    };
  }, [workspaceAnalytics, tasks]);

  if (isLoading) {
    return <PageLoader />;
  }

  const taskDocs = tasks?.documents || [];
  const projectDocs = projects?.documents || [];
  const memberDocs = members?.documents || [];

  return (
    <div className="flex h-full flex-col space-y-4 select-none">
      {/* Top Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <span>Workspace Planning Summary</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[10px] font-bold text-blue-700">Live</span>
          </h1>
          <p className="text-[11px] text-neutral-500">
            Real-time delivery progress, active sprints, projects, and workload across your workspace.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setInviteModalOpen(true)} className="text-[11px] h-7 px-2.5 font-semibold">
            <UserPlus className="mr-1 size-3 text-blue-600" /> Invite Member
          </Button>
          <Button size="sm" variant="secondary" onClick={() => createProject()} className="text-[11px] h-7 px-2.5 font-semibold">
            <PlusIcon className="mr-1 size-3" /> New Project
          </Button>
          <Button size="sm" onClick={() => createTask()} className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] h-7 px-2.5 font-semibold">
            <PlusIcon className="mr-1 size-3" /> Create Task
          </Button>
        </div>
      </div>

      {/* Analytics KPI Bar */}
      <Analytics data={safeAnalytics} />

      {/* Main Grid: Tasks, Projects, Members */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <TaskList data={taskDocs} total={tasks?.total ?? taskDocs.length} />
        <ProjectList data={projectDocs} total={projects?.total ?? projectDocs.length} />
        <div className="xl:col-span-2">
          <MemberList
            data={memberDocs}
            total={members?.total ?? memberDocs.length}
            onOpenInvite={() => setInviteModalOpen(true)}
          />
        </div>
      </div>

      {/* Quick Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4 text-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Mail className="size-4" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">Invite Employee or Member</h3>
              </div>
              <button onClick={() => setInviteModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            {sentInviteData ? (
              <div className="space-y-4 py-2">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
                  <CheckCircle2 className="size-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-950">Invitation Email Dispatched!</h4>
                  <p className="text-xs text-emerald-800">
                    An email was sent to <strong>{sentInviteData.email}</strong> via Gmail.
                  </p>
                  <p className="text-[11px] text-emerald-700 bg-emerald-100/60 rounded p-2 text-left">
                    💡 <strong>Note:</strong> Automated invitation emails may sometimes land in the recipient's <strong>Spam / Junk</strong> folder or <strong>Updates</strong> tab. Please advise them to check there if not in primary inbox.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700">Direct Invitation Link:</label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={sentInviteData.inviteUrl}
                      className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-xs bg-neutral-50 text-neutral-600 select-all"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(sentInviteData.inviteUrl);
                        toast.success('Invitation link copied to clipboard!');
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full mt-2"
                  onClick={() => {
                    setInviteModalOpen(false);
                    setSentInviteData(null);
                    setInviteEmail('');
                    setInviteName('');
                  }}
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="employee@company.com"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name (Optional)</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm bg-white focus:border-blue-600 focus:outline-none font-medium"
                  >
                    <option value="Developer">Developer (Standard Member)</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Company Admin">Company Admin (Full Access)</option>
                    <option value="QA Engineer">QA Engineer</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                  <Button type="button" variant="secondary" onClick={() => setInviteModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={sendingInvite || !inviteEmail} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    {sendingInvite ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-4" />}
                    <span>Send Invitation</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const TaskList = ({ data = [], total = 0 }) => {
  const workspaceId = useWorkspaceId();
  const { open: createTask } = useCreateTaskModal();
  const [showAll, setShowAll] = useState(false);

  // Sort tasks by most recent creation/update time descending
  const sortedTasks = useMemo(() => {
    return [...data].sort((a, b) => {
      const dateA = new Date(
        a.createdAt || a.$createdAt || a.created_at || a.updatedAt || a.$updatedAt || 0
      ).getTime();
      const dateB = new Date(
        b.createdAt || b.$createdAt || b.created_at || b.updatedAt || b.$updatedAt || 0
      ).getTime();
      return dateB - dateA;
    });
  }, [data]);

  const displayedTasks = showAll ? sortedTasks : sortedTasks.slice(0, 5);
  const totalCount = total || sortedTasks.length;
  const hasMoreThan5 = sortedTasks.length > 5;

  return (
    <div className="flex flex-col gap-y-2.5">
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-blue-600" />
            <p className="text-sm font-bold text-neutral-900">
              Recent Issues &amp; Tasks{' '}
              <span className="text-xs font-medium text-neutral-500">
                ({showAll ? `All ${sortedTasks.length}` : `5 of ${totalCount}`})
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {hasMoreThan5 && (
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded transition"
              >
                {showAll ? 'Show 5' : `View All (${sortedTasks.length})`}
              </button>
            )}
            <Button
              title="Create Task"
              variant="ghost"
              size="icon"
              onClick={() => createTask()}
              className="h-7 w-7 text-neutral-500 hover:text-blue-600"
            >
              <PlusIcon className="size-3.5" />
            </Button>
          </div>
        </div>

        <DottedSeparator className="my-2.5" />

        <ul
          className={`flex flex-col gap-y-2 transition-all ${
            showAll && hasMoreThan5 ? 'max-h-[460px] overflow-y-auto pr-1' : ''
          }`}
        >
          {displayedTasks.map((task) => (
            <li key={task.$id || task.id}>
              <Link href={`/workspaces/${workspaceId}/tasks/${task.$id || task.id}`}>
                <div className="rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-2.5 transition hover:bg-neutral-100/70 hover:border-neutral-300">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-neutral-900">{task.name || 'Untitled Issue'}</p>
                    {getStatusBadge(task.status)}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 text-[11px] text-neutral-500">
                    <span className="font-medium text-neutral-700">{task.project?.name || 'Workspace Issue'}</span>
                    <span className="text-neutral-300">•</span>
                    <div className="flex items-center">
                      <Clock className="mr-1 size-2.5 text-neutral-400" />
                      <span>{safeFormatDistance(task.dueDate || task.due_date)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}

          {displayedTasks.length === 0 && (
            <li className="py-6 text-center text-xs text-neutral-400">
              No tasks found in this workspace yet. Click &quot;Create Task&quot; above to create one.
            </li>
          )}
        </ul>

        {/* Footer Actions */}
        {totalCount > 0 && (
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-2">
            {hasMoreThan5 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="w-full sm:w-auto text-[11px] h-7 font-semibold text-neutral-700 hover:text-blue-600"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="mr-1 size-3 text-blue-600" /> Collapse to 5 Recent
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 size-3 text-blue-600" /> View All ({sortedTasks.length} Tasks)
                  </>
                )}
              </Button>
            ) : <div />}

            <Button
              variant="ghost"
              size="sm"
              className="w-full sm:w-auto text-[11px] h-7 font-semibold text-blue-600 hover:text-blue-700"
              asChild
            >
              <Link href={`/workspaces/${workspaceId}/tasks`}>
                Open Tasks Workspace <ArrowRight className="ml-1 size-3" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export const ProjectList = ({ data = [], total = 0 }) => {
  const workspaceId = useWorkspaceId();
  const { open: createProject } = useCreateProjectModal();

  return (
    <div className="flex flex-col gap-y-2.5">
      <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 className="size-4 text-indigo-600" />
            <p className="text-sm font-bold text-neutral-900">Projects ({total})</p>
          </div>

          <Button title="Create Project" variant="ghost" size="icon" onClick={() => createProject()} className="h-7 w-7 text-neutral-500 hover:text-indigo-600">
            <PlusIcon className="size-3.5" />
          </Button>
        </div>

        <DottedSeparator className="my-2.5" />

        <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {data.map((project) => (
            <li key={project.$id || project.id}>
              <Link href={`/workspaces/${workspaceId}/projects/${project.$id || project.id}`}>
                <div className="rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-2.5 transition hover:bg-neutral-100/70 hover:border-neutral-300 flex items-center gap-2.5">
                  <ProjectAvatar
                    name={project.name || 'Project'}
                    image={project.imageUrl || project.image_url}
                    className="size-8"
                    fallbackClassName="text-xs font-bold bg-indigo-100 text-indigo-700"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-neutral-900">{project.name || 'Untitled Project'}</p>
                    <p className="text-[10px] text-neutral-400 uppercase font-semibold">{project.key || 'PROJECT'}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}

          {data.length === 0 && (
            <li className="col-span-full py-6 text-center text-xs text-neutral-400">
              No projects created yet. Click &quot;New Project&quot; above to get started.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export const MemberList = ({ data = [], total = 0, onOpenInvite }) => {
  const workspaceId = useWorkspaceId();

  return (
    <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users2 className="size-4 text-blue-600" />
          <p className="text-sm font-bold text-neutral-900">Workspace Members & Collaborators ({total})</p>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenInvite && (
            <Button size="sm" variant="outline" onClick={onOpenInvite} className="h-7 text-[11px] px-2.5 font-semibold">
              <UserPlus className="mr-1 size-3 text-blue-600" /> Invite
            </Button>
          )}
          <Button title="Manage Members" variant="ghost" size="icon" className="h-7 w-7 text-neutral-500 hover:text-neutral-900" asChild>
            <Link href={`/workspaces/${workspaceId}/members`}>
              <SettingsIcon className="size-3.5" />
            </Link>
          </Button>
        </div>
      </div>

      <DottedSeparator className="my-2.5" />

      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {data.map((member) => {
          const name = member.name || member.email?.split('@')[0] || 'Team Member';
          const email = member.email || '';
          const role = member.role || 'MEMBER';

          return (
            <li key={member.$id || member.id} className="rounded-xl border border-neutral-200/60 bg-neutral-50/50 p-2.5 transition hover:bg-neutral-100/70">
              <div className="flex items-center gap-2.5">
                <MemberAvatar name={name} className="size-7 shrink-0 text-[10px] font-bold" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-[11px] font-bold text-neutral-900">{name}</p>
                    <span className={`text-[8px] font-bold px-1 py-0.2 rounded ${role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-200 text-neutral-700'}`}>
                      {role}
                    </span>
                  </div>
                  <p className="truncate text-[10px] text-neutral-400">{email}</p>
                </div>
              </div>
            </li>
          );
        })}

        {data.length === 0 && (
          <li className="col-span-full py-4 text-center text-xs text-neutral-400">
            No members loaded.
          </li>
        )}
      </ul>
    </div>
  );
};

export default WorkspaceIdClient;
