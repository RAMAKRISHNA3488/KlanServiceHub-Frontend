'use client';
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTaskId } from '@/features/tasks/hooks/use-task-id';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useCurrent } from '@/features/auth/api/use-current';
import { useConfirm } from '@/hooks/use-confirm';
import { tasksApi, sprintsApi } from '@/lib/api-client';
import { PageLoader } from '@/components/page-loader';
import { PageError } from '@/components/page-error';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  Bookmark,
  CheckSquare,
  AlertCircle,
  Zap,
  List,
  TrendingUp,
  MessageSquare,
  Clock,
  ChevronRight,
  Send,
  Calendar,
  User,
  Tag,
  ArrowLeft,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';

const TYPE_ICONS = {
  Story: { icon: Bookmark, color: '#36B37E' },
  Task: { icon: CheckSquare, color: '#0052CC' },
  Bug: { icon: AlertCircle, color: '#FF5630' },
  Epic: { icon: Zap, color: '#6554C0' },
  'Sub-task': { icon: List, color: '#00B8D9' },
  Improvement: { icon: TrendingUp, color: '#FFAB00' },
};

const STATUS_COLORS = {
  BACKLOG: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  TODO: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-amber-50 text-amber-800 border-amber-200',
  IN_REVIEW: 'bg-purple-50 text-purple-800 border-purple-200',
  TESTING: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  DONE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

export const TaskIdClient = () => {
  const taskId = useTaskId();
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrent();
  const { data: membersData } = useGetMembers({ workspaceId });
  const members = membersData?.documents || [];

  const [task, setTask] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [logHours, setLogHours] = useState(1);
  const [activeTab, setActiveTab] = useState('COMMENTS');
  const [storyPointsInput, setStoryPointsInput] = useState('1');

  const [DeleteCommentDialog, confirmDeleteComment] = useConfirm(
    'Delete Comment',
    'Are you sure you want to delete this comment? This action cannot be undone.',
    'destructive'
  );

  // Determine current user permissions
  const currentMember = members.find(
    (m) =>
      m.userId === currentUser?.$id ||
      m.user_id === currentUser?.$id ||
      m.$id === currentUser?.$id
  );
  const isAdmin =
    currentMember?.role === 'ADMIN' ||
    currentUser?.role === 'ADMIN' ||
    task?.workspace?.user_id === currentUser?.$id;

  const fetchTask = async () => {
    try {
      setLoading(true);
      const res = await tasksApi.getTask(taskId);
      if (res?.data) {
        setTask(res.data);
        setComments(res.data.comments || []);
        setStoryPointsInput(String(res.data.storyPoints ?? res.data.story_points ?? 1));
      }
    } catch (e) {
      toast.error('Failed to load issue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTask();
      if (workspaceId) {
        sprintsApi
          .getSprints(workspaceId)
          .then((res) => {
            if (res?.data?.sprints) setSprints(res.data.sprints);
          })
          .catch(() => {});
      }
    }
  }, [taskId, workspaceId]);

  const handleUpdate = async (fields) => {
    try {
      // Optimistic update
      setTask((prev) => ({
        ...prev,
        ...fields,
        storyPoints: fields.storyPoints !== undefined ? fields.storyPoints : (prev?.storyPoints ?? prev?.story_points),
        story_points: fields.storyPoints !== undefined ? fields.storyPoints : (prev?.story_points ?? prev?.storyPoints),
        assignee_id: fields.assigneeId !== undefined ? fields.assigneeId : prev?.assignee_id,
        assigneeId: fields.assigneeId !== undefined ? fields.assigneeId : prev?.assigneeId,
        sprint_id: fields.sprintId !== undefined ? fields.sprintId : prev?.sprint_id,
        sprintId: fields.sprintId !== undefined ? fields.sprintId : prev?.sprintId,
      }));

      const res = await tasksApi.updateTask(taskId, fields);
      if (res?.data) {
        setTask(res.data);
        if (res.data.storyPoints !== undefined || res.data.story_points !== undefined) {
          setStoryPointsInput(String(res.data.storyPoints ?? res.data.story_points ?? 1));
        }
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['team-workload'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success('Updated successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to update issue');
      fetchTask();
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await tasksApi.addComment(taskId, newComment.trim());
      toast.success('Comment posted');
      setNewComment('');
      fetchTask();
    } catch (err) {
      toast.error(err.message || 'Failed to add comment');
    }
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content || '');
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingContent.trim()) {
      toast.error('Comment content cannot be empty');
      return;
    }
    try {
      await tasksApi.updateComment(taskId, commentId, editingContent.trim());
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, content: editingContent.trim(), updated_at: new Date().toISOString() } : c
        )
      );
      setEditingCommentId(null);
      setEditingContent('');
      toast.success('Comment updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    const ok = await confirmDeleteComment({
      title: 'Delete Comment',
      subtitle: 'Permanent deletion',
      message: 'Are you sure you want to delete this comment? This action cannot be undone.',
      confirmText: 'Delete Comment',
    });
    if (!ok) return;
    try {
      await tasksApi.deleteComment(taskId, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err.message || 'Failed to delete comment');
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!subtaskTitle.trim()) return;
    try {
      await tasksApi.createTask({
        workspaceId,
        projectId: task.project?.$id || task.project_id,
        name: subtaskTitle.trim(),
        issueType: 'Sub-task',
        parentTaskId: taskId,
        status: 'TODO',
      });
      toast.success('Sub-task created');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
      setSubtaskTitle('');
      fetchTask();
    } catch (err) {
      toast.error(err.message || 'Failed to create subtask');
    }
  };

  const handleLogWork = async (e) => {
    e.preventDefault();
    try {
      await tasksApi.updateTask(taskId, { loggedHours: Number(logHours) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(`Logged ${logHours} hours`);
      fetchTask();
    } catch (err) {
      toast.error(err.message || 'Failed to log work');
    }
  };

  if (loading && !task) return <PageLoader />;
  if (!task && !loading) return <PageError message="Issue not found." />;

  const typeConfig = TYPE_ICONS[task.issueType || task.issue_type] || TYPE_ICONS.Task;
  const TypeIcon = typeConfig.icon;

  const currentAssigneeId =
    task.assignee?.$id ||
    task.assignee?.id ||
    task.assigneeId ||
    task.assignee_id ||
    '';

  const currentSprintId = task.sprintId || task.sprint_id || '';

  const dueDateFormatted = task.dueDate
    ? task.dueDate.split('T')[0]
    : task.due_date
    ? task.due_date.split('T')[0]
    : '';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
          <Link
            href={`/workspaces/${workspaceId}/tasks`}
            className="flex items-center gap-1 hover:text-blue-600 transition"
          >
            <ArrowLeft className="size-3.5" />
            <span>Issues</span>
          </Link>
          <span>/</span>
          <span className="text-neutral-800">{task.project?.name || 'Project'}</span>
          <span>/</span>
          <span className="font-mono text-neutral-900 font-bold">{task.key || 'TASK'}</span>
        </div>

        {/* Status Dropdown */}
        <select
          value={task.status || 'TODO'}
          onChange={(e) => handleUpdate({ status: e.target.value })}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold border cursor-pointer focus:outline-none shadow-xs ${
            STATUS_COLORS[task.status] || STATUS_COLORS.TODO
          }`}
        >
          <option value="BACKLOG">BACKLOG</option>
          <option value="TODO">TO DO</option>
          <option value="IN_PROGRESS">IN PROGRESS</option>
          <option value="IN_REVIEW">IN REVIEW</option>
          <option value="TESTING">TESTING</option>
          <option value="DONE">DONE</option>
        </select>
      </div>

      {/* Main Grid: Details + KlanserviceHub Properties Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Summary, Description, Comments, Subtasks */}
        <div className="lg:col-span-8 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <TypeIcon className="size-5 shrink-0" style={{ color: typeConfig.color }} />
            <input
              type="text"
              value={task.name || ''}
              onChange={(e) => setTask({ ...task, name: e.target.value })}
              onBlur={(e) => handleUpdate({ name: e.target.value })}
              className="text-xl font-bold text-neutral-900 border-b border-transparent hover:border-neutral-300 focus:border-blue-600 focus:outline-none w-full py-1 transition"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Description
            </span>
            <textarea
              rows={5}
              value={task.description || ''}
              onChange={(e) => setTask({ ...task, description: e.target.value })}
              onBlur={(e) => handleUpdate({ description: e.target.value })}
              placeholder="Add acceptance criteria, technical requirements, or steps to reproduce..."
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 text-xs text-neutral-800 focus:border-blue-600 focus:bg-white focus:outline-none shadow-inner"
            />
          </div>

          {/* Activity Section */}
          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-5 border-b border-neutral-200 pb-2">
              <button
                onClick={() => setActiveTab('COMMENTS')}
                className={`text-xs font-bold flex items-center gap-1.5 pb-2 -mb-2.5 transition border-b-2 ${
                  activeTab === 'COMMENTS'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <MessageSquare className="size-3.5" />
                Comments ({comments.length})
              </button>
              <button
                onClick={() => setActiveTab('SUBTASKS')}
                className={`text-xs font-bold flex items-center gap-1.5 pb-2 -mb-2.5 transition border-b-2 ${
                  activeTab === 'SUBTASKS'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <List className="size-3.5" />
                Sub-tasks ({task.subtasks?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('WORKLOG')}
                className={`text-xs font-bold flex items-center gap-1.5 pb-2 -mb-2.5 transition border-b-2 ${
                  activeTab === 'WORKLOG'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Clock className="size-3.5" />
                Time Tracking ({task.logged_hours || 0}h logged)
              </button>
            </div>

            {/* Tab: Comments */}
            {activeTab === 'COMMENTS' && (
              <div className="space-y-4">
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment... (Type here to reply)"
                    className="flex-1 rounded-xl border border-neutral-300 px-4 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 transition"
                  >
                    Save
                  </button>
                </form>

                <div className="space-y-3 pt-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-2">No comments yet.</p>
                  ) : (
                    comments.map((c) => {
                      const isAuthor =
                        c.user_id === currentUser?.$id ||
                        c.userId === currentUser?.$id;
                      const canModify = isAdmin || isAuthor;

                      return (
                        <div
                          key={c.id}
                          className="group relative flex items-start gap-3 rounded-xl bg-neutral-50 p-3.5 border border-neutral-100 hover:border-neutral-200 transition"
                        >
                          <div className="size-7 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                            {c.user_name?.substring(0, 2).toUpperCase() ||
                              c.userName?.substring(0, 2).toUpperCase() ||
                              'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-neutral-900">
                                  {c.user_name || c.userName || 'Member'}
                                </span>
                                <span className="text-[10px] text-neutral-400">
                                  {c.created_at
                                    ? new Date(c.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })
                                    : ''}
                                  {c.updated_at && c.updated_at !== c.created_at && (
                                    <span className="italic ml-1 text-neutral-400">
                                      (edited)
                                    </span>
                                  )}
                                </span>
                              </div>

                              {/* Edit & Delete Actions for Admin or Author */}
                              {canModify && editingCommentId !== c.id && (
                                <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditComment(c)}
                                    title="Edit comment"
                                    className="p-1 rounded-md text-neutral-400 hover:text-blue-600 hover:bg-neutral-200/60 transition"
                                  >
                                    <Pencil className="size-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteComment(c.id)}
                                    title="Delete comment"
                                    className="p-1 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                                  >
                                    <Trash2 className="size-3" />
                                  </button>
                                </div>
                              )}
                            </div>

                            {editingCommentId === c.id ? (
                              <div className="mt-2 space-y-2">
                                <textarea
                                  rows={2}
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="w-full rounded-lg border border-blue-400 bg-white p-2 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-sm"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveEditComment(c.id)}
                                    className="flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 transition"
                                  >
                                    <Check className="size-3" />
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditingContent('');
                                    }}
                                    className="flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-600 hover:bg-neutral-50 transition"
                                  >
                                    <X className="size-3" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-neutral-700 mt-1 whitespace-pre-wrap">
                                {c.content}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Tab: Subtasks */}
            {activeTab === 'SUBTASKS' && (
              <div className="space-y-3">
                <form onSubmit={handleAddSubtask} className="flex gap-2">
                  <input
                    type="text"
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    placeholder="Add sub-task..."
                    className="flex-1 rounded-xl border border-neutral-300 px-3.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-neutral-800"
                  >
                    Add Sub-task
                  </button>
                </form>

                <div className="divide-y divide-neutral-100 text-xs">
                  {(task.subtasks || []).length === 0 ? (
                    <p className="text-xs text-neutral-400 italic py-2">No sub-tasks yet.</p>
                  ) : (
                    (task.subtasks || []).map((sub) => (
                      <div key={sub.id || sub.$id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="size-3.5 text-blue-600" />
                          <span className="font-semibold text-neutral-800">{sub.name}</span>
                        </div>
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                          {sub.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab: Worklog */}
            {activeTab === 'WORKLOG' && (
              <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-200/80 space-y-4">
                <form onSubmit={handleLogWork} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-neutral-700">Log Hours:</label>
                    <input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={logHours}
                      onChange={(e) => setLogHours(e.target.value)}
                      className="w-20 rounded-lg border border-neutral-300 px-2.5 py-1 text-xs focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow hover:bg-blue-700"
                  >
                    Log Work
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Properties Panel (ISSUE DETAILS) */}
        <div className="lg:col-span-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-5 text-xs">
          <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500">
            Issue Details
          </h3>

          {/* Assignee */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 mb-1">Assignee</label>
            <select
              value={currentAssigneeId}
              onChange={(e) => handleUpdate({ assigneeId: e.target.value || null })}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.$id || m.id} value={m.$id || m.id}>
                  {m.name} ({m.role || 'MEMBER'})
                </option>
              ))}
            </select>
          </div>

          {/* Reporter */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 mb-1">Reporter</label>
            <div className="flex items-center gap-2 font-semibold text-neutral-800 p-2 rounded-lg bg-neutral-50 border border-neutral-100">
              <div className="size-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                {task.reporter?.name?.substring(0, 1) || 'R'}
              </div>
              <span>{task.reporter?.name || 'System User'}</span>
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 mb-1">Priority</label>
            <select
              value={task.priority || 'MEDIUM'}
              onChange={(e) => handleUpdate({ priority: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="CRITICAL">Critical (P0)</option>
              <option value="HIGH">High (P1)</option>
              <option value="MEDIUM">Medium (P2)</option>
              <option value="LOW">Low (P3)</option>
              <option value="LOWEST">Lowest (P4)</option>
            </select>
          </div>

          {/* Story Points */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 mb-1">
              Story Points Estimate
            </label>
            <input
              type="number"
              min={0}
              value={storyPointsInput}
              onChange={(e) => setStoryPointsInput(e.target.value)}
              onBlur={() => {
                const val = parseInt(storyPointsInput, 10);
                if (!isNaN(val) && val >= 0) {
                  if (val !== (task?.storyPoints ?? task?.story_points ?? 1)) {
                    handleUpdate({ storyPoints: val });
                  }
                } else {
                  setStoryPointsInput(String(task?.storyPoints ?? task?.story_points ?? 1));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDateFormatted}
              onChange={(e) => handleUpdate({ dueDate: e.target.value || null })}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Sprint */}
          <div>
            <label className="block text-[11px] font-bold text-neutral-500 mb-1">Sprint</label>
            <select
              value={currentSprintId}
              onChange={(e) => handleUpdate({ sprintId: e.target.value || null })}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="">Backlog (No Sprint)</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <DeleteCommentDialog />
    </div>
  );
};

export default TaskIdClient;
