import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useCurrent } from '@/features/auth/api/use-current';
import { useConfirm } from '@/hooks/use-confirm';
import { tasksApi, sprintsApi, workflowsAdminApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  X,
  CheckSquare,
  Bookmark,
  AlertCircle,
  Zap,
  List,
  TrendingUp,
  User,
  Calendar,
  Clock,
  MessageSquare,
  History,
  Send,
  Trash2,
  Paperclip,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles,
  Pencil,
  Check,
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
  CODE_REVIEW: 'bg-purple-50 text-purple-800 border-purple-200',
  REVIEW: 'bg-purple-50 text-purple-800 border-purple-200',
  TESTING: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  DONE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
};

const parseDateSafe = (dateVal) => {
  if (!dateVal) return null;
  if (dateVal instanceof Date) return isNaN(dateVal.getTime()) ? null : dateVal;
  let str = String(dateVal).trim();
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T') + (str.endsWith('Z') ? '' : 'Z');
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) return d;
  const d2 = new Date(dateVal);
  return isNaN(d2.getTime()) ? null : d2;
};

const formatCommentDate = (dateVal) => {
  const d = parseDateSafe(dateVal);
  if (!d) return '';

  const dateStr = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateStr} at ${timeStr}`;
};

export const KlanserviceHubIssueDetailModal = ({ taskId, open, onClose, onUpdated }) => {
  const workspaceId = useWorkspaceId();
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrent();
  const { data: membersData } = useGetMembers({ workspaceId });
  const members = membersData?.documents || [];

  const [task, setTask] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [workspaceIssueTypes, setWorkspaceIssueTypes] = useState([]);
  const [workflowStatuses, setWorkflowStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);

  const [DeleteCommentDialog, confirmDeleteComment] = useConfirm(
    'Delete Comment',
    'Are you sure you want to delete this comment? This action cannot be undone.',
    'destructive'
  );
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [activeTab, setActiveTab] = useState('COMMENTS'); // COMMENTS, SUBTASKS, WORKLOG

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

  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [logHoursInput, setLogHoursInput] = useState(1);
  const [storyPointsInput, setStoryPointsInput] = useState('1');

  useEffect(() => {
    if (task) {
      setStoryPointsInput(String(task.storyPoints ?? task.story_points ?? 1));
    }
  }, [task?.storyPoints, task?.story_points]);

  const fetchTaskDetails = async (targetId = taskId) => {
    if (!targetId) return;
    try {
      setLoading(true);
      const res = await tasksApi.getTask(targetId);
      if (res?.data && (res.data.$id === targetId || res.data.id === targetId)) {
        setTask(res.data);
        setComments(Array.isArray(res.data.comments) ? res.data.comments : []);
      }
    } catch (e) {
      toast.error('Failed to load issue details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && taskId) {
      // Immediately reset previous ticket state so data never bleeds or overlaps
      setTask(null);
      setComments([]);
      setNewComment('');
      setEditingCommentId(null);
      setEditingContent('');
      setSubtaskTitle('');
      setLoading(true);

      fetchTaskDetails(taskId);
      if (workspaceId) {
        sprintsApi.getSprints(workspaceId).then((res) => {
          if (res?.data?.sprints) setSprints(res.data.sprints);
        }).catch(() => {});

        Promise.all([
          workflowsAdminApi.getIssueTypes(workspaceId).catch(() => ({ data: [] })),
          workflowsAdminApi.getWorkflows(workspaceId).catch(() => ({ data: [] })),
        ]).then(([typesRes, wfRes]) => {
          if (typesRes?.data) setWorkspaceIssueTypes(typesRes.data);
          if (wfRes?.data?.[0]?.statuses) setWorkflowStatuses(wfRes.data[0].statuses);
        });
      }
    } else {
      setTask(null);
      setComments([]);
      setNewComment('');
      setEditingCommentId(null);
      setEditingContent('');
      setSubtaskTitle('');
    }
  }, [open, taskId, workspaceId]);

  if (!open || !taskId) return null;

  const handleUpdateProperty = async (fields) => {
    try {
      setTask((prev) => ({
        ...prev,
        ...fields,
        storyPoints: fields.storyPoints !== undefined ? fields.storyPoints : (prev?.storyPoints ?? prev?.story_points),
        story_points: fields.storyPoints !== undefined ? fields.storyPoints : (prev?.story_points ?? prev?.storyPoints),
      }));

      const res = await tasksApi.updateTask(taskId, fields);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['boards-view-data'] });
      queryClient.invalidateQueries({ queryKey: ['sprints'] });
      queryClient.invalidateQueries({ queryKey: ['dashboards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['team-workload'] });
      queryClient.invalidateQueries({ queryKey: ['dependencies-graph'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['capacity'] });
      queryClient.invalidateQueries({ queryKey: ['workload'] });
      window.dispatchEvent(new CustomEvent('klanservicehub-task-updated', { detail: { taskId, fields } }));
      if (res?.data) {
        setTask(res.data);
        if (res.data.storyPoints !== undefined || res.data.story_points !== undefined) {
          setStoryPointsInput(String(res.data.storyPoints ?? res.data.story_points ?? 1));
        }
        if (onUpdated) onUpdated(res.data);
      } else {
        if (onUpdated) onUpdated({ ...task, ...fields });
      }
      toast.success('Issue updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update issue');
      fetchTaskDetails();
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      setAddingComment(true);
      const res = await tasksApi.addComment(taskId, newComment.trim());
      if (res?.data) {
        setComments((prev) => [...prev, res.data]);
      }
      toast.success('Comment posted');
      setNewComment('');
      fetchTaskDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to post comment');
    } finally {
      setAddingComment(false);
    }
  };

  const handleStartEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditingContent(comment.content || '');
  };

  const handleSaveEditComment = async (commentId) => {
    if (!editingContent.trim()) {
      toast.error('Comment cannot be empty');
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
        projectId: task.project.$id,
        name: subtaskTitle.trim(),
        issueType: 'Sub-task',
        parentTaskId: taskId,
        status: 'TODO',
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['boards-view-data'] });
      toast.success('Sub-task added');
      setSubtaskTitle('');
      fetchTaskDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to add subtask');
    }
  };

  const handleLogWork = async (e) => {
    e.preventDefault();
    try {
      await tasksApi.updateTask(taskId, { loggedHours: Number(logHoursInput) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['boards-view-data'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(`Logged ${logHoursInput} hours`);
      fetchTaskDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to log work');
    }
  };

  const currentTypeName = task?.issueType || task?.issue_type || task?.type;
  const matchedType = workspaceIssueTypes.find(
    (it) => it.name?.toLowerCase() === String(currentTypeName || '').toLowerCase() || it.id === currentTypeName
  );

  const matchedColor = matchedType?.color || TYPE_ICONS[currentTypeName]?.color || '#0052CC';
  const rawIcon = matchedType?.icon || TYPE_ICONS[currentTypeName]?.icon;
  const TypeIcon = typeof rawIcon === 'function' ? rawIcon : (
    rawIcon === 'bookmark' ? Bookmark :
    rawIcon === 'zap' ? Zap :
    rawIcon === 'alert-circle' ? AlertCircle :
    rawIcon === 'list' ? List :
    rawIcon === 'trending-up' ? TrendingUp :
    CheckSquare
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-neutral-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Top Header & Breadcrumbs */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-neutral-200 bg-neutral-50/70 select-none">
          <div className="flex items-center gap-2">
            <TypeIcon className="size-4 shrink-0" style={{ color: matchedColor }} />
            <span className="font-mono text-xs font-bold text-neutral-500 hover:underline cursor-pointer">
              {task?.key || (task?.project?.key ? `${task.project.key}-1` : 'TASK-1')}
            </span>
            <span className="text-neutral-300">/</span>
            <span className="text-xs font-bold text-neutral-700">{task?.project?.name || 'Project'}</span>
            {matchedType && (
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-2xs ml-1"
                style={{ backgroundColor: matchedColor }}
              >
                {matchedType.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Status Dropdown */}
            {(() => {
              const currentStatus =
                task?.status === 'CODE_REVIEW' || task?.status === 'REVIEW'
                  ? 'IN_REVIEW'
                  : task?.status || 'TODO';

              const seen = new Set();
              const uniqueWorkflowStatuses = [];
              for (const st of (workflowStatuses || [])) {
                const sName = String(st.name || '').toUpperCase().trim().replace(/[\s-]+/g, '_');
                const canonicalKey = (sName === 'CODE_REVIEW' || sName === 'IN_REVIEW' || sName === 'REVIEW') ? 'IN_REVIEW' : sName;
                if (!seen.has(canonicalKey)) {
                  seen.add(canonicalKey);
                  uniqueWorkflowStatuses.push({
                    ...st,
                    name: canonicalKey,
                    displayName: canonicalKey === 'IN_REVIEW' ? 'IN REVIEW' : st.name.replace(/_/g, ' ')
                  });
                }
              }

              return (
                <select
                  value={currentStatus}
                  onChange={(e) => handleUpdateProperty({ status: e.target.value })}
                  className="rounded-lg px-3 py-1 text-xs font-bold border border-neutral-300 bg-white text-neutral-800 cursor-pointer focus:outline-none"
                >
                  {uniqueWorkflowStatuses.length > 0 ? (
                    uniqueWorkflowStatuses.map((st) => (
                      <option key={st.id || st.name} value={st.name}>
                        {st.displayName || st.name.replace(/_/g, ' ')}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="BACKLOG">BACKLOG</option>
                      <option value="TODO">TO DO</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="IN_REVIEW">IN REVIEW</option>
                      <option value="TESTING">TESTING</option>
                      <option value="DONE">DONE</option>
                    </>
                  )}
                </select>
              );
            })()}

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-neutral-200">
          {/* Left Main Details Column */}
          <div className="lg:col-span-8 p-6 space-y-6">
            {/* Issue Title Input & Timestamp Metadata */}
            <div className="space-y-1">
              <input
                type="text"
                value={task?.name || ''}
                onChange={(e) => setTask({ ...task, name: e.target.value })}
                onBlur={(e) => handleUpdateProperty({ name: e.target.value })}
                className="w-full text-lg font-bold text-neutral-900 border-b border-transparent hover:border-neutral-300 focus:border-blue-600 focus:outline-none py-1 transition"
                placeholder="Issue summary..."
              />
              <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-medium">
                <span
                  className="flex items-center gap-1"
                  title={
                    task?.created_at || task?.$createdAt
                      ? new Date(task.created_at || task.$createdAt).toLocaleString()
                      : ''
                  }
                >
                  <Calendar className="size-3 text-neutral-400" />
                  Created: {formatCommentDate(task?.created_at || task?.$createdAt) || 'Recently'}
                </span>
                {(task?.updated_at || task?.$updatedAt) && (
                  <>
                    <span>•</span>
                    <span
                      className="flex items-center gap-1"
                      title={new Date(task.updated_at || task.$updatedAt).toLocaleString()}
                    >
                      <Clock className="size-3 text-neutral-400" />
                      Updated: {formatCommentDate(task.updated_at || task.$updatedAt)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">Description</span>
              <textarea
                rows={5}
                value={task?.description || ''}
                onChange={(e) => setTask({ ...task, description: e.target.value })}
                onBlur={(e) => handleUpdateProperty({ description: e.target.value })}
                placeholder="Add a detailed description, acceptance criteria, or technical design notes..."
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50/50 p-3.5 text-xs text-neutral-800 focus:border-blue-600 focus:bg-white focus:outline-none shadow-inner transition"
              />
            </div>

            {/* Activity & Comments Tabs */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 border-b border-neutral-200 pb-2">
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
                  Sub-tasks ({task?.subtasks?.length || 0})
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
                  Time Tracking ({task?.logged_hours || 0}h logged)
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
                      placeholder="Add a comment... (Type your update here)"
                      className="flex-1 rounded-xl border border-neutral-300 px-3.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={addingComment || !newComment.trim()}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
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
                            className="group relative flex items-start gap-3 rounded-xl bg-neutral-50 p-3 border border-neutral-100 hover:border-neutral-200 transition"
                          >
                            {c.user_avatar ? (
                              <img
                                src={c.user_avatar}
                                alt={c.user_name || 'Member'}
                                className="size-7 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="size-7 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                                {c.user_name?.substring(0, 2).toUpperCase() ||
                                  c.userName?.substring(0, 2).toUpperCase() ||
                                  'U'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-neutral-900">
                                    {c.user_name || c.userName || 'Member'}
                                  </span>
                                  <span
                                    className="text-[10px] text-neutral-400"
                                    title={
                                      c.created_at || c.createdAt || c.$createdAt
                                        ? new Date(
                                            c.created_at || c.createdAt || c.$createdAt
                                          ).toLocaleString()
                                        : ''
                                    }
                                  >
                                    {formatCommentDate(c.created_at || c.createdAt || c.$createdAt)}
                                    {c.updated_at &&
                                      c.updated_at !== (c.created_at || c.createdAt || c.$createdAt) && (
                                        <span
                                          className="italic ml-1 text-neutral-400"
                                          title={`Edited: ${new Date(c.updated_at).toLocaleString()}`}
                                        >
                                          (edited)
                                        </span>
                                      )}
                                  </span>
                                </div>

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
                      placeholder="What needs to be done? (Add sub-task)"
                      className="flex-1 rounded-xl border border-neutral-300 px-3.5 py-2 text-xs focus:border-blue-600 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-neutral-800 transition"
                    >
                      Add Sub-task
                    </button>
                  </form>

                  <div className="divide-y divide-neutral-100 text-xs">
                    {(task?.subtasks || []).map((sub) => (
                      <div key={sub.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="size-3.5 text-blue-600" />
                          <span className="font-semibold text-neutral-800">{sub.name}</span>
                        </div>
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-600">
                          {sub.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Time Tracking */}
              {activeTab === 'WORKLOG' && (
                <div className="rounded-xl bg-neutral-50 p-4 border border-neutral-200/80 space-y-4">
                  <form onSubmit={handleLogWork} className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-neutral-700">Log Hours:</label>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={logHoursInput}
                        onChange={(e) => setLogHoursInput(e.target.value)}
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

          {/* Right Properties Column (KlanserviceHub Style Box) */}
          <div className="lg:col-span-4 p-6 bg-neutral-50/50 space-y-5 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500">Details</h3>

            {/* Assignees (Multi-assignee support) */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1.5">
                Assignees ({((task?.assignees && task.assignees.length > 0) ? task.assignees.length : (task?.assignee_id ? 1 : 0))})
              </label>

              {/* Current Assignees List */}
              <div className="space-y-1.5 mb-2">
                {task?.assignees && task.assignees.length > 0 ? (
                  task.assignees.map((a) => (
                    <div
                      key={a.$id || a.id}
                      className="flex items-center justify-between bg-white px-2 py-1.5 rounded-lg border border-neutral-200 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <div className="size-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                          {a.name?.substring(0, 1).toUpperCase() || 'M'}
                        </div>
                        <span className="text-xs font-semibold text-neutral-800">{a.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const currentIds = (task.assignees || []).map((x) => x.$id || x.id);
                          const nextIds = currentIds.filter((x) => x !== (a.$id || a.id));
                          handleUpdateProperty({ assigneeIds: nextIds });
                        }}
                        className="text-neutral-400 hover:text-red-500 text-xs px-1"
                        title="Remove assignee"
                      >
                        &times;
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-neutral-400 italic py-0.5">Unassigned</div>
                )}
              </div>

              {/* Add / Toggle Assignee Dropdown */}
              <div className="relative">
                <select
                  value=""
                  onChange={(e) => {
                    const memberId = e.target.value;
                    if (!memberId) return;
                    const currentIds = (task?.assignees || []).map((x) => x.$id || x.id);
                    if (!currentIds.includes(memberId)) {
                      const nextIds = [...currentIds, memberId];
                      handleUpdateProperty({ assigneeIds: nextIds });
                    }
                  }}
                  className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none"
                >
                  <option value="">+ Assign another member...</option>
                  {members
                    .filter((m) => !(task?.assignees || []).some((a) => (a.$id || a.id) === (m.$id || m.id)))
                    .map((m) => (
                      <option key={m.$id || m.id} value={m.$id || m.id}>
                        {m.name || m.email} ({m.role || 'MEMBER'})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Reporter */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1">Reporter</label>
              <div className="flex items-center gap-2 font-semibold text-neutral-800 px-1 py-0.5">
                <div className="size-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {task?.reporter?.name?.substring(0, 1) || 'R'}
                </div>
                <span>{task?.reporter?.name || 'System User'}</span>
              </div>
            </div>

            {/* Issue Type */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1">Issue Type</label>
              <select
                value={task?.issueType || 'Task'}
                onChange={(e) => handleUpdateProperty({ issueType: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none"
              >
                {workspaceIssueTypes.length > 0 ? (
                  workspaceIssueTypes.map((t) => (
                    <option key={t.id || t.name} value={t.name || t.id}>
                      {t.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Story">Story</option>
                    <option value="Task">Task</option>
                    <option value="Bug">Bug</option>
                    <option value="Epic">Epic</option>
                    <option value="Sub-task">Sub-task</option>
                    <option value="Improvement">Improvement</option>
                  </>
                )}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1">Priority</label>
              <select
                value={task?.priority || 'MEDIUM'}
                onChange={(e) => handleUpdateProperty({ priority: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="CRITICAL">P0 - Critical (🔥)</option>
                <option value="HIGH">P1 - High (⬆️)</option>
                <option value="MEDIUM">P2 - Medium (🟰)</option>
                <option value="LOW">P3 - Low (⬇️)</option>
                <option value="LOWEST">P4 - Lowest (⬇️⬇️)</option>
              </select>
            </div>

            {/* Story Points */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1">Story Points Estimate</label>
              <input
                type="number"
                min={0}
                value={storyPointsInput}
                onChange={(e) => setStoryPointsInput(e.target.value)}
                onBlur={() => {
                  const val = parseInt(storyPointsInput, 10);
                  if (!isNaN(val) && val >= 0) {
                    if (val !== (task?.storyPoints ?? task?.story_points ?? 1)) {
                      handleUpdateProperty({ storyPoints: val });
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
                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1">Due Date</label>
              <input
                type="date"
                value={task?.dueDate ? task.dueDate.split('T')[0] : ''}
                onChange={(e) => handleUpdateProperty({ dueDate: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none"
              />
            </div>

            {/* Sprint */}
            <div>
              <label className="block text-[11px] font-bold text-neutral-500 mb-1">Sprint</label>
              <select
                value={task?.sprintId || task?.sprint_id || ''}
                onChange={(e) => handleUpdateProperty({ sprintId: e.target.value || null })}
                className="w-full rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-none"
              >
                <option value="">Backlog (No Sprint)</option>
                {sprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Dates & Timestamps */}
            <div className="pt-3 border-t border-neutral-200/80 space-y-2 text-[11px]">
              <label className="block text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                Dates & Timestamps
              </label>
              <div className="flex items-center justify-between text-neutral-600 bg-white p-2 rounded-lg border border-neutral-200 shadow-2xs">
                <span className="flex items-center gap-1.5 text-neutral-500 font-medium">
                  <Calendar className="size-3 text-neutral-400" /> Created
                </span>
                <span
                  className="font-semibold text-neutral-800"
                  title={
                    task?.created_at || task?.$createdAt
                      ? new Date(task.created_at || task.$createdAt).toLocaleString()
                      : ''
                  }
                >
                  {formatCommentDate(task?.created_at || task?.$createdAt) || 'Recently'}
                </span>
              </div>
              <div className="flex items-center justify-between text-neutral-600 bg-white p-2 rounded-lg border border-neutral-200 shadow-2xs">
                <span className="flex items-center gap-1.5 text-neutral-500 font-medium">
                  <Clock className="size-3 text-neutral-400" /> Updated
                </span>
                <span
                  className="font-semibold text-neutral-800"
                  title={
                    task?.updated_at || task?.$updatedAt
                      ? new Date(task.updated_at || task.$updatedAt).toLocaleString()
                      : ''
                  }
                >
                  {formatCommentDate(task?.updated_at || task?.$updatedAt) || 'Recently'}
                </span>
              </div>
              {task?.dueDate && (
                <div className="flex items-center justify-between text-neutral-600 bg-white p-2 rounded-lg border border-neutral-200 shadow-2xs">
                  <span className="flex items-center gap-1.5 text-neutral-500 font-medium">
                    <Clock className="size-3 text-neutral-400" /> Due Date
                  </span>
                  <span className="font-semibold text-neutral-800">
                    {new Date(task.dueDate).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <DeleteCommentDialog />
    </div>
  );
};
