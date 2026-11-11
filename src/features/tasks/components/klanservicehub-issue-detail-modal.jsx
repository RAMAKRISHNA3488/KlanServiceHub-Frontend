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
  ArrowLeft,
  ChevronRight,
  Pencil,
  Check,
  Image,
  Upload,
  Timer,
  ZoomIn,
  Heart,
  Star,
  Share2,
} from 'lucide-react';
import { TaskShareModal } from './task-share-modal';

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

  const [activeTaskId, setActiveTaskId] = useState(taskId);
  const [historyStack, setHistoryStack] = useState([]); // [{ id, key, name }]
  const currentId = activeTaskId || taskId;

  const [task, setTask] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [workspaceIssueTypes, setWorkspaceIssueTypes] = useState([]);
  const [workflowStatuses, setWorkflowStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  const [DeleteCommentDialog, confirmDeleteComment] = useConfirm(
    'Delete Comment',
    'Are you sure you want to delete this comment? This action cannot be undone.',
    'destructive'
  );
  const [newComment, setNewComment] = useState('');
  const [commentImages, setCommentImages] = useState([]);
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);

  const handleToggleLike = async () => {
    if (!currentId || isLiking) return;
    setIsLiking(true);
    const prevLiked = !!task?.hasLiked;
    const prevCount = task?.likesCount || 0;
    setTask((prev) => ({
      ...prev,
      hasLiked: !prevLiked,
      likesCount: prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1,
    }));

    try {
      const res = await tasksApi.toggleLike(currentId);
      if (res?.success) {
        setTask((prev) => ({
          ...prev,
          hasLiked: res.liked,
          likesCount: res.likesCount,
        }));
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    } catch (e) {
      setTask((prev) => ({
        ...prev,
        hasLiked: prevLiked,
        likesCount: prevCount,
      }));
      toast.error('Failed to update like');
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentId || isFavoriting) return;
    setIsFavoriting(true);
    const prevFav = !!task?.isFavorite;
    setTask((prev) => ({
      ...prev,
      isFavorite: !prevFav,
    }));

    try {
      const res = await tasksApi.toggleFavorite(currentId);
      if (res?.success) {
        setTask((prev) => ({
          ...prev,
          isFavorite: res.isFavorite,
        }));
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        toast.success(res.isFavorite ? 'Saved to your favorites' : 'Removed from favorites');
      }
    } catch (e) {
      setTask((prev) => ({
        ...prev,
        isFavorite: prevFav,
      }));
      toast.error('Failed to update favorite status');
    } finally {
      setIsFavoriting(false);
    }
  };

  useEffect(() => {
    if (task) {
      setStoryPointsInput(String(task.storyPoints ?? task.story_points ?? 1));
    }
  }, [task?.storyPoints, task?.story_points]);

  // Sync activeTaskId whenever taskId or modal open state changes
  useEffect(() => {
    setActiveTaskId(taskId);
    setHistoryStack([]);
  }, [taskId, open]);

  const fetchTaskDetails = async (targetId = currentId) => {
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

  const fetchAttachments = async (targetId = currentId) => {
    if (!targetId) return;
    try {
      const res = await tasksApi.getAttachments(targetId);
      if (res?.data) setAttachments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {}
  };

  useEffect(() => {
    if (open && currentId) {
      // Immediately reset previous ticket state so data never bleeds or overlaps
      setTask(null);
      setComments([]);
      setAttachments([]);
      setNewComment('');
      setCommentImages([]);
      setEditingCommentId(null);
      setEditingContent('');
      setSubtaskTitle('');
      setLoading(true);

      fetchTaskDetails(currentId);
      fetchAttachments(currentId);
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
      setAttachments([]);
      setNewComment('');
      setCommentImages([]);
      setEditingCommentId(null);
      setEditingContent('');
      setSubtaskTitle('');
    }
  }, [open, currentId, workspaceId]);

  if (!open || !currentId) return null;

  const handleOpenSubtask = (sub) => {
    const subId = sub.id || sub.$id;
    if (!subId) return;
    setHistoryStack((prev) => [
      ...prev,
      {
        id: currentId,
        key: task?.key || (task?.project?.key ? `${task.project.key}-1` : 'TASK'),
        name: task?.name || 'Parent Task',
      },
    ]);
    setActiveTaskId(subId);
    setActiveTab('COMMENTS');
  };

  const handleBackToParent = (parentItem) => {
    if (parentItem?.id) {
      const idx = historyStack.findIndex((h) => h.id === parentItem.id);
      if (idx !== -1) {
        setHistoryStack((prev) => prev.slice(0, idx));
      } else {
        setHistoryStack([]);
      }
      setActiveTaskId(parentItem.id);
      return;
    }
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack((h) => h.slice(0, -1));
      setActiveTaskId(prev.id);
    } else if (task?.parentTask?.id || task?.parent_task_id || task?.parentTaskId) {
      setActiveTaskId(task.parentTask?.id || task.parent_task_id || task.parentTaskId);
    }
  };

  const handleUpdateProperty = async (fields) => {
    try {
      setTask((prev) => ({
        ...prev,
        ...fields,
        storyPoints: fields.storyPoints !== undefined ? fields.storyPoints : (prev?.storyPoints ?? prev?.story_points),
        story_points: fields.storyPoints !== undefined ? fields.storyPoints : (prev?.story_points ?? prev?.storyPoints),
      }));

      const res = await tasksApi.updateTask(currentId, fields);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', currentId] });
      if (currentId !== taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      }
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
      window.dispatchEvent(new CustomEvent('klanservicehub-task-updated', { detail: { taskId: currentId, fields } }));
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
      fetchTaskDetails(currentId);
    }
  };

  const handleCommentImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        setCommentImages((prev) => [
          ...prev,
          {
            id: String(Date.now()) + Math.random().toString(36).substring(2, 7),
            name: file.name,
            size: file.size,
            fileType: file.type,
            dataUrl: loadEvt.target.result,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleCommentPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (loadEvt) => {
            setCommentImages((prev) => [
              ...prev,
              {
                id: String(Date.now()) + Math.random().toString(36).substring(2, 7),
                name: `screenshot-${Date.now()}.png`,
                size: file.size,
                fileType: file.type,
                dataUrl: loadEvt.target.result,
              },
            ]);
            toast.info('Image attached to comment from clipboard');
          };
          reader.readAsDataURL(file);
        }
      }
    }
  };

  const handleRemoveCommentImage = (imgId) => {
    setCommentImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && commentImages.length === 0) return;
    try {
      setAddingComment(true);
      const res = await tasksApi.addComment(currentId, newComment.trim(), commentImages);
      if (res?.data) {
        setComments((prev) => [...prev, res.data]);
      }
      toast.success('Comment posted');
      setNewComment('');
      setCommentImages([]);
      fetchTaskDetails(currentId);
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
      await tasksApi.updateComment(currentId, commentId, editingContent.trim());
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
      await tasksApi.deleteComment(currentId, commentId);
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
        projectId: task?.project?.$id || task?.project_id,
        name: subtaskTitle.trim(),
        issueType: 'Sub-task',
        parentTaskId: currentId,
        status: 'TODO',
      });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', currentId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['boards-view-data'] });
      toast.success('Sub-task added');
      setSubtaskTitle('');
      fetchTaskDetails(currentId);
    } catch (err) {
      toast.error(err.message || 'Failed to add subtask');
    }
  };

  const handleLogWork = async (e) => {
    e.preventDefault();
    try {
      await tasksApi.updateTask(currentId, { loggedHours: Number(logHoursInput) });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', currentId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['project-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['boards-view-data'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(`Logged ${logHoursInput} hours`);
      fetchTaskDetails(currentId);
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
        <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 bg-neutral-50/70 select-none">
          <div className="flex items-center gap-2 flex-wrap">
            {/* If we have navigated into a subtask, show Back button */}
            {(historyStack.length > 0 || task?.parentTask || task?.parent_task_id) && (
              <button
                type="button"
                onClick={() => handleBackToParent()}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-100 hover:text-blue-600 transition mr-1 shadow-2xs cursor-pointer"
                title="Go back to parent ticket"
              >
                <ArrowLeft className="size-3.5" />
                <span>Back</span>
              </button>
            )}

            {/* Parent breadcrumb trail if in history */}
            {historyStack.map((hist) => (
              <React.Fragment key={hist.id}>
                <button
                  type="button"
                  onClick={() => handleBackToParent(hist)}
                  className="font-mono text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  title={`Back to ${hist.name}`}
                >
                  {hist.key}
                </button>
                <span className="text-neutral-300">/</span>
              </React.Fragment>
            ))}

            {historyStack.length === 0 && task?.parentTask && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTaskId(task.parentTask.id || task.parentTask.$id)}
                  className="font-mono text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  title={`Parent: ${task.parentTask.name}`}
                >
                  {task.parentTask.key || 'PARENT'}
                </button>
                <span className="text-neutral-300">/</span>
              </>
            )}

            <TypeIcon className="size-4 shrink-0" style={{ color: matchedColor }} />
            <span className="font-mono text-xs font-bold text-neutral-500 hover:underline cursor-pointer">
              {task?.key || (task?.project?.key ? `${task.project.key}-1` : 'TASK-1')}
            </span>
            <span className="text-neutral-300">/</span>
            <span className="text-xs font-bold text-neutral-700 truncate max-w-[200px]">{task?.project?.name || 'Project'}</span>
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
            {/* Quick Actions: Like, Favorite, Share */}
            <div className="flex items-center gap-1 bg-neutral-100/80 p-0.5 rounded-xl border border-neutral-200/80 shadow-2xs">
              <button
                type="button"
                onClick={handleToggleLike}
                disabled={isLiking}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  task?.hasLiked
                    ? 'bg-rose-50 text-rose-600 border border-rose-200/80 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-rose-600 hover:bg-white'
                }`}
                title={task?.hasLiked ? 'Unlike this issue' : 'Like this issue'}
              >
                <Heart className={`size-3.5 ${task?.hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{task?.likesCount || 0}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={isFavoriting}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  task?.isFavorite
                    ? 'bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-amber-600 hover:bg-white'
                }`}
                title={task?.isFavorite ? 'Remove from favorites' : 'Save to favorites'}
              >
                <Star className={`size-3.5 ${task?.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                <span>{task?.isFavorite ? 'Saved' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-600 hover:text-blue-600 hover:bg-white transition"
                title="Share this ticket"
              >
                <Share2 className="size-3.5" />
                <span>Share</span>
              </button>
            </div>

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
              <div className="flex items-center gap-4 border-b border-neutral-200 pb-2 flex-wrap">
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
                <button
                  onClick={() => { setActiveTab('ATTACHMENTS'); fetchAttachments(currentId); }}
                  className={`text-xs font-bold flex items-center gap-1.5 pb-2 -mb-2.5 transition border-b-2 ${
                    activeTab === 'ATTACHMENTS'
                      ? 'border-violet-600 text-violet-600'
                      : 'border-transparent text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Image className="size-3.5" />
                  Images ({attachments.length})
                </button>
              </div>

              {/* Tab: Comments */}
              {activeTab === 'COMMENTS' && (
                <div className="space-y-4">
                  <form onSubmit={handleAddComment} className="space-y-2">
                    <div className="relative rounded-xl border border-neutral-300 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-500 bg-white transition shadow-2xs">
                      <textarea
                        rows={2}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onPaste={handleCommentPaste}
                        onDrop={(e) => {
                          e.preventDefault();
                          const files = Array.from(e.dataTransfer?.files || []);
                          if (files.length) handleCommentImageUpload({ target: { files, value: '' } });
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        placeholder="Add a comment... (Type here, paste screenshot with Ctrl+V, or click Attach Image)"
                        className="w-full bg-transparent p-3 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none resize-none"
                      />
                      <div className="flex items-center justify-between border-t border-neutral-100 px-3 py-2 bg-neutral-50/70 rounded-b-xl">
                        <label
                          title="Attach images"
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-100 hover:text-blue-600 shadow-2xs transition"
                        >
                          <Image className="size-3.5 text-blue-600" />
                          <span>Attach Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleCommentImageUpload}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={addingComment || (!newComment.trim() && commentImages.length === 0)}
                          className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
                        >
                          {addingComment ? 'Saving...' : 'Save Comment'}
                        </button>
                      </div>
                    </div>

                    {/* Pre-post image previews */}
                    {commentImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
                        {commentImages.map((img) => (
                          <div key={img.id} className="relative group rounded-lg overflow-hidden border border-neutral-300 bg-white size-16 shrink-0">
                            <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => handleRemoveCommentImage(img.id)}
                              className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-600 text-white rounded-full p-0.5 transition"
                            >
                              <X className="size-3" />
                            </button>
                          </div>
                        ))}
                        <span className="text-[10px] text-neutral-400 self-center pl-1 italic">
                          {commentImages.length} image{commentImages.length > 1 ? 's' : ''} attached (will expire 6 days after ticket is completed)
                        </span>
                      </div>
                    )}
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
                                <div>
                                  {c.content && (
                                    <p className="text-xs text-neutral-700 mt-1 whitespace-pre-wrap">
                                      {c.content}
                                    </p>
                                  )}

                                  {/* Comment Images */}
                                  {c.images && Array.isArray(c.images) && c.images.length > 0 && (
                                    <div className="mt-2 space-y-1.5">
                                      <div className="flex flex-wrap gap-2">
                                        {c.images.map((img, imgIdx) => {
                                          const imgSrc = img.dataUrl || img.url || img.fileUrl;
                                          return (
                                            <div
                                              key={img.id || imgIdx}
                                              onClick={() => setLightboxSrc(imgSrc)}
                                              className="group/img relative rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 size-20 cursor-pointer shadow-2xs hover:shadow transition"
                                            >
                                              <img
                                                src={imgSrc}
                                                alt={img.name || 'Comment image'}
                                                className="w-full h-full object-cover group-hover/img:scale-105 transition"
                                              />
                                              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 flex items-center justify-center transition">
                                                <ZoomIn className="size-4 text-white opacity-0 group-hover/img:opacity-100 drop-shadow" />
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      {/* Expiration badge */}
                                      <div className="flex items-center gap-1.5 text-[10px] text-amber-700 font-medium bg-amber-50/80 border border-amber-200/60 rounded-md px-2 py-0.5 w-fit">
                                        <Clock className="size-3" />
                                        <span>{c.imagesStatus || (task?.status === 'DONE' ? 'Expires 6 days after ticket done' : 'Active (expires 6 days after ticket is completed)')}</span>
                                      </div>
                                    </div>
                                  )}

                                  {c.imagesExpired && (
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-neutral-400 italic bg-neutral-100 px-2 py-0.5 rounded-md w-fit">
                                      <Clock className="size-3 text-neutral-400" />
                                      <span>Image attachments expired 6 days after ticket completion.</span>
                                    </div>
                                  )}
                                </div>
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
                    {(task?.subtasks || []).length === 0 ? (
                      <p className="text-xs text-neutral-400 italic py-3">No sub-tasks yet. Use the form above to add one.</p>
                    ) : (
                      (task?.subtasks || []).map((sub) => {
                        const isDone = sub.status === 'DONE';
                        return (
                          <div
                            key={sub.id || sub.$id}
                            onClick={() => handleOpenSubtask(sub)}
                            className="py-2.5 px-3 -mx-3 rounded-xl flex items-center justify-between hover:bg-neutral-100/80 cursor-pointer group transition select-none"
                            title="Click to open sub-task in this ticket"
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-3">
                              <CheckSquare
                                className={`size-4 shrink-0 transition ${
                                  isDone ? 'text-emerald-600' : 'text-blue-600 group-hover:scale-110'
                                }`}
                              />
                              <span
                                className={`font-semibold transition truncate ${
                                  isDone
                                    ? 'text-neutral-500 line-through decoration-neutral-400'
                                    : 'text-neutral-800 group-hover:text-blue-600'
                                }`}
                              >
                                {sub.name}
                              </span>
                              {sub.key && (
                                <span className="text-[10px] font-mono font-bold text-neutral-400 bg-neutral-100 group-hover:bg-blue-100 group-hover:text-blue-700 px-1.5 py-0.5 rounded shrink-0 transition">
                                  {sub.key}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold border transition ${
                                  STATUS_COLORS[sub.status] || 'bg-neutral-100 text-neutral-600 border-neutral-200'
                                }`}
                              >
                                {sub.status}
                              </span>
                              <ChevronRight className="size-3.5 text-neutral-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                            </div>
                          </div>
                        );
                      })
                    )}
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

              {/* Tab: Image Attachments */}
              {activeTab === 'ATTACHMENTS' && (
                <div className="space-y-4">
                  {/* Drag & Drop Upload Zone */}
                  <div
                    className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
                      isDragOver
                        ? 'border-violet-500 bg-violet-50/60 scale-[1.01]'
                        : 'border-neutral-300 hover:border-violet-400 hover:bg-violet-50/30'
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
                      if (files.length === 0) { toast.error('Please drop image files only (PNG, JPG, GIF, WebP)'); return; }
                      setUploadingImage(true);
                      for (const file of files) {
                        try {
                          const reader = new FileReader();
                          const imageData = await new Promise((resolve, reject) => {
                            reader.onload = (ev) => resolve(ev.target.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(file);
                          });
                          await tasksApi.uploadImage(currentId, {
                            fileName: file.name,
                            imageData,
                            fileType: file.type,
                            fileSize: file.size,
                          });
                          toast.success(`Uploaded: ${file.name}`);
                        } catch (err) {
                          toast.error(`Failed to upload ${file.name}`);
                        }
                      }
                      setUploadingImage(false);
                      fetchAttachments(currentId);
                    }}
                    onClick={() => document.getElementById(`attach-file-input-${currentId}`)?.click()}
                  >
                    <input
                      id={`attach-file-input-${currentId}`}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        setUploadingImage(true);
                        for (const file of files) {
                          try {
                            const reader = new FileReader();
                            const imageData = await new Promise((resolve, reject) => {
                              reader.onload = (ev) => resolve(ev.target.result);
                              reader.onerror = reject;
                              reader.readAsDataURL(file);
                            });
                            await tasksApi.uploadImage(currentId, {
                              fileName: file.name,
                              imageData,
                              fileType: file.type,
                              fileSize: file.size,
                            });
                            toast.success(`Uploaded: ${file.name}`);
                          } catch (err) {
                            toast.error(`Failed to upload ${file.name}`);
                          }
                        }
                        setUploadingImage(false);
                        fetchAttachments(currentId);
                        e.target.value = '';
                      }}
                    />
                    {uploadingImage ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="size-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                        <p className="text-xs font-semibold text-violet-600">Uploading images...</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-center mb-3">
                          <div className={`size-12 rounded-2xl flex items-center justify-center transition-all ${
                            isDragOver ? 'bg-violet-100 scale-110' : 'bg-neutral-100'
                          }`}>
                            <Upload className={`size-5 transition-colors ${isDragOver ? 'text-violet-600' : 'text-neutral-400'}`} />
                          </div>
                        </div>
                        <p className="text-xs font-bold text-neutral-700">
                          {isDragOver ? 'Drop images here' : 'Drag & drop images, or click to browse'}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-1">PNG, JPG, GIF, WebP · Auto-expires in 6 days</p>
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-1.5 text-[11px] font-bold text-white shadow-xs">
                          <Plus className="size-3" />
                          Add Images
                        </div>
                      </>
                    )}
                  </div>

                  {/* Expiry Note Banner */}
                  {attachments.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-700">
                      <Timer className="size-3.5 text-amber-500 shrink-0" />
                      Images automatically expire and are deleted 6 days after upload.
                    </div>
                  )}

                  {/* Image Gallery Grid */}
                  {attachments.length === 0 ? (
                    <div className="text-center py-8">
                      <Image className="size-10 text-neutral-300 mx-auto mb-2" />
                      <p className="text-xs text-neutral-400 italic">No images attached yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {attachments.map((att) => {
                        const imgSrc = att.imageData || att.image_data || att.fileUrl || att.file_url;
                        const expiresAt = att.expiresAt || att.expires_at;
                        const expiryDate = expiresAt ? new Date(expiresAt) : null;
                        const msLeft = expiryDate ? expiryDate.getTime() - Date.now() : null;
                        const daysLeft = msLeft !== null ? Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24))) : null;
                        const isExpiringSoon = daysLeft !== null && daysLeft <= 2;

                        return (
                          <div
                            key={att.id}
                            className="group relative rounded-xl overflow-hidden border border-neutral-200 shadow-xs hover:shadow-md transition-all bg-neutral-100 aspect-square"
                          >
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                alt={att.fileName || att.file_name || 'Attachment'}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                onClick={() => setLightboxSrc(imgSrc)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Image className="size-8 text-neutral-300" />
                              </div>
                            )}

                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                              {imgSrc && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setLightboxSrc(imgSrc); }}
                                  className="p-1.5 rounded-lg bg-white/90 text-neutral-700 hover:bg-white shadow transition"
                                  title="Preview"
                                >
                                  <ZoomIn className="size-3.5" />
                                </button>
                              )}
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    await tasksApi.deleteAttachment(currentId, att.id);
                                    setAttachments((prev) => prev.filter((a) => a.id !== att.id));
                                    toast.success('Image removed');
                                  } catch (err) {
                                    toast.error('Failed to remove image');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-red-600/90 text-white hover:bg-red-700 shadow transition"
                                title="Delete"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>

                            {/* Expiry Badge */}
                            {daysLeft !== null && (
                              <div className={`absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm ${
                                isExpiringSoon
                                  ? 'bg-red-500 text-white'
                                  : 'bg-black/50 text-white'
                              }`}>
                                <Timer className="size-2.5" />
                                {daysLeft === 0 ? 'Expires today' : `${daysLeft}d left`}
                              </div>
                            )}

                            {/* Filename label */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
                              <p className="text-[10px] font-semibold text-white truncate">
                                {att.fileName || att.file_name || 'image'}
                              </p>
                              <p className="text-[9px] text-white/70">
                                {att.uploaderName || att.uploader_name || 'Member'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Lightbox */}
              {lightboxSrc && (
                <div
                  className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                  onClick={() => setLightboxSrc(null)}
                >
                  <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                    <img
                      src={lightboxSrc}
                      alt="Preview"
                      className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
                    />
                    <button
                      onClick={() => setLightboxSrc(null)}
                      className="absolute top-2 right-2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Properties Column (KlanserviceHub Style Box) */}
          <div className="lg:col-span-4 p-6 bg-neutral-50/50 space-y-5 text-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-500">Details</h3>

            {/* Parent Ticket card if this is a subtask */}
            {(task?.parentTask || (historyStack.length > 0 && historyStack[historyStack.length - 1])) && (
              <div className="rounded-xl border border-blue-200/80 bg-blue-50/60 p-3 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Parent Ticket</span>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">
                    {task?.parentTask?.key || historyStack[historyStack.length - 1]?.key}
                  </span>
                </div>
                <p className="text-xs font-semibold text-neutral-800 line-clamp-1">
                  {task?.parentTask?.name || historyStack[historyStack.length - 1]?.name}
                </p>
                <button
                  type="button"
                  onClick={() => handleBackToParent(task?.parentTask ? { id: task.parentTask.id } : null)}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 rounded-lg bg-white border border-blue-200 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100/70 transition shadow-2xs cursor-pointer"
                >
                  <ArrowLeft className="size-3" />
                  Open Parent Ticket
                </button>
              </div>
            )}

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
      <TaskShareModal
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        task={task}
        workspaceId={workspaceId}
      />
      <DeleteCommentDialog />
    </div>
  );
};
