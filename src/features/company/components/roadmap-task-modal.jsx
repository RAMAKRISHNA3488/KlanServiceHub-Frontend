import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { tasksApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  X,
  Edit3,
  Check,
  CheckSquare,
  Bookmark,
  AlertCircle,
  Zap,
  List,
  User,
  Calendar,
  Clock,
  Sparkles,
  MessageSquare,
  Send,
  Loader2,
  Tag,
  Hash,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';

const TYPE_ICONS = {
  Epic: { icon: Zap, color: 'text-purple-600', bg: 'bg-purple-100 border-purple-200' },
  Story: { icon: Bookmark, color: 'text-emerald-600', bg: 'bg-emerald-100 border-emerald-200' },
  Task: { icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-100 border-blue-200' },
  Bug: { icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-100 border-rose-200' },
  Subtask: { icon: List, color: 'text-cyan-600', bg: 'bg-cyan-100 border-cyan-200' },
};

const STATUS_CONFIG = {
  BACKLOG: { label: 'Backlog', bg: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
  TODO: { label: 'To Do', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  IN_PROGRESS: { label: 'In Progress', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
  IN_REVIEW: { label: 'In Review', bg: 'bg-purple-50 text-purple-800 border-purple-200' },
  TESTING: { label: 'Testing', bg: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  DONE: { label: 'Done', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  BLOCKED: { label: 'Blocked', bg: 'bg-rose-50 text-rose-800 border-rose-200' },
};

const PRIORITY_MAP = {
  P0: { id: 'P0', label: 'P0 - Critical', bg: 'bg-rose-100 text-rose-700 border border-rose-200', dot: '#EF4444' },
  CRITICAL: { id: 'P0', label: 'P0 - Critical', bg: 'bg-rose-100 text-rose-700 border border-rose-200', dot: '#EF4444' },
  URGENT: { id: 'P0', label: 'P0 - Critical', bg: 'bg-rose-100 text-rose-700 border border-rose-200', dot: '#EF4444' },
  HIGHEST: { id: 'P1', label: 'P1 - High', bg: 'bg-orange-100 text-orange-800 border border-orange-200', dot: '#F97316' },

  P1: { id: 'P1', label: 'P1 - High', bg: 'bg-orange-100 text-orange-800 border border-orange-200', dot: '#F97316' },
  HIGH: { id: 'P1', label: 'P1 - High', bg: 'bg-orange-100 text-orange-800 border border-orange-200', dot: '#F97316' },

  P2: { id: 'P2', label: 'P2 - Medium', bg: 'bg-amber-100 text-amber-800 border border-amber-200', dot: '#EAB308' },
  MEDIUM: { id: 'P2', label: 'P2 - Medium', bg: 'bg-amber-100 text-amber-800 border border-amber-200', dot: '#EAB308' },

  P3: { id: 'P3', label: 'P3 - Low', bg: 'bg-blue-100 text-blue-700 border border-blue-200', dot: '#3B82F6' },
  LOW: { id: 'P3', label: 'P3 - Low', bg: 'bg-blue-100 text-blue-700 border border-blue-200', dot: '#3B82F6' },

  P4: { id: 'P4', label: 'P4 - Lowest', bg: 'bg-slate-100 text-slate-700 border border-slate-200', dot: '#64748B' },
  LOWEST: { id: 'P4', label: 'P4 - Lowest', bg: 'bg-slate-100 text-slate-700 border border-slate-200', dot: '#64748B' },
};

const getPriorityConfig = (priority) => {
  const norm = (priority || 'P2').toString().toUpperCase().trim();
  return PRIORITY_MAP[norm] || PRIORITY_MAP.P2;
};

export const RoadmapTaskModal = ({
  taskId,
  initialTask,
  open,
  onClose,
  onUpdated,
}) => {
  const workspaceId = useWorkspaceId();
  const { data: membersData } = useGetMembers({ workspaceId });
  const members = membersData?.documents || [];

  const [task, setTask] = useState(initialTask || null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('read'); // 'read' | 'edit'
  const [updating, setUpdating] = useState(false);

  // Form State for Edit Mode
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    issueType: 'Task',
    dueDate: '',
    startDate: '',
    storyPoints: '',
    assigneeId: '',
  });

  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  // Load task details when opened
  const fetchDetails = async () => {
    if (!taskId && !initialTask?.$id && !initialTask?.id) return;
    const id = taskId || initialTask?.$id || initialTask?.id;
    try {
      setLoading(true);
      const res = await tasksApi.getTask(id);
      if (res?.data) {
        setTask(res.data);
        setComments(res.data.comments || []);
        syncFormData(res.data);
      }
    } catch (e) {
      if (initialTask) {
        setTask(initialTask);
        syncFormData(initialTask);
      }
    } finally {
      setLoading(false);
    }
  };

  const syncFormData = (t) => {
    if (!t) return;
    const due = t.dueDate || t.due_date;
    const start = t.startDate || t.created_at || t.$createdAt;
    setFormData({
      name: t.name || '',
      description: t.description || '',
      status: t.status || 'TODO',
      priority: t.priority || 'MEDIUM',
      issueType: t.issueType || 'Task',
      dueDate: due ? format(new Date(due), 'yyyy-MM-dd') : '',
      startDate: start ? format(new Date(start), 'yyyy-MM-dd') : '',
      storyPoints: t.storyPoints || t.story_points || '',
      assigneeId: t.assigneeId || t.assignee?.$id || t.assignee?.id || '',
    });
  };

  useEffect(() => {
    if (open) {
      setMode('read');
      if (initialTask) {
        setTask(initialTask);
        syncFormData(initialTask);
      }
      fetchDetails();
    }
  }, [open, taskId, initialTask]);

  if (!open) return null;

  const currentTask = task || initialTask;
  const typeKey = currentTask?.issueType || 'Task';
  const typeInfo = TYPE_ICONS[typeKey] || TYPE_ICONS.Task;
  const TypeIcon = typeInfo.icon;
  const statusInfo = STATUS_CONFIG[currentTask?.status] || STATUS_CONFIG.TODO;
  const priorityInfo = getPriorityConfig(currentTask?.priority);

  const handleStartEdit = () => {
    syncFormData(currentTask);
    setMode('edit');
  };

  const handleCancelEdit = () => {
    syncFormData(currentTask);
    setMode('read');
  };

  const handleSaveUpdate = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Task name cannot be empty');
      return;
    }

    const id = taskId || currentTask?.$id || currentTask?.id;
    if (!id) return;

    try {
      setUpdating(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        issueType: formData.issueType,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
        storyPoints: formData.storyPoints ? Number(formData.storyPoints) : null,
        assigneeId: formData.assigneeId || null,
      };

      await tasksApi.updateTask(id, payload);
      toast.success('Task updated successfully!');

      const updatedObj = {
        ...currentTask,
        ...payload,
        dueDate: formData.dueDate,
      };
      setTask(updatedObj);
      setMode('read');

      if (onUpdated) {
        onUpdated(updatedObj);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update task');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const id = taskId || currentTask?.$id || currentTask?.id;
    try {
      setAddingComment(true);
      await tasksApi.addComment(id, newComment.trim());
      toast.success('Comment posted');
      setNewComment('');
      fetchDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to add comment');
    } finally {
      setAddingComment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-neutral-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/80 select-none">
          <div className="flex items-center gap-2.5">
            <span className={`p-1.5 rounded-lg border ${typeInfo.bg} ${typeInfo.color}`}>
              <TypeIcon className="size-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-neutral-500">
                  {currentTask?.key || 'TASK'}
                </span>
                <span className="text-neutral-300">•</span>
                <span className="text-xs font-semibold text-neutral-600">
                  {currentTask?.project?.name || 'Project Roadmap'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'read' ? (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 font-bold text-xs shadow-2xs transition"
              >
                <Edit3 className="size-3.5" />
                <span>Edit Task</span>
              </button>
            ) : (
              <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[11px] font-bold border border-amber-200 animate-pulse">
                Editing Mode
              </span>
            )}

            <button
              onClick={onClose}
              className="rounded-xl p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition"
              title="Close"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Read Mode vs Edit Mode */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {mode === 'read' ? (
            /* ================= READ MODE ================= */
            <div className="space-y-6">
              {/* Task Title & Status Header */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border ${statusInfo.bg}`}
                  >
                    {statusInfo.label}
                  </span>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold ${priorityInfo.bg}`}
                  >
                    {priorityInfo.label} Priority
                  </span>
                  {currentTask?.storyPoints && (
                    <span className="rounded-lg bg-neutral-100 text-neutral-700 px-2.5 py-1 text-[11px] font-bold border border-neutral-200">
                      {currentTask.storyPoints} Story Points
                    </span>
                  )}
                </div>

                <h2 className="text-xl font-bold text-neutral-900 leading-snug">
                  {currentTask?.name || 'Untitled Work Item'}
                </h2>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50/80 p-4 rounded-xl border border-neutral-200">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Assignee
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {currentTask?.assignee?.name
                        ? currentTask.assignee.name.charAt(0).toUpperCase()
                        : 'U'}
                    </div>
                    <span className="text-xs font-semibold text-neutral-800 truncate">
                      {currentTask?.assignee?.name || 'Unassigned'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Due Date
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                    <Calendar className="size-3.5 text-neutral-400" />
                    <span>
                      {currentTask?.dueDate || currentTask?.due_date
                        ? format(
                            new Date(currentTask.dueDate || currentTask.due_date),
                            'MMM d, yyyy'
                          )
                        : 'No due date'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Issue Type
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                    <TypeIcon className={`size-3.5 ${typeInfo.color}`} />
                    <span>{typeKey}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                    Created
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-neutral-800">
                    <Clock className="size-3.5 text-neutral-400" />
                    <span>
                      {currentTask?.created_at || currentTask?.$createdAt
                        ? format(
                            new Date(currentTask.created_at || currentTask.$createdAt),
                            'MMM d, yyyy'
                          )
                        : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description View */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                  Description
                </span>
                {currentTask?.description ? (
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 text-xs text-neutral-800 whitespace-pre-wrap leading-relaxed">
                    {currentTask.description}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/30 p-6 text-center text-xs text-neutral-400 italic">
                    No description provided for this work item. Click "Edit Task" to add details.
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-neutral-500" />
                  <span className="text-xs font-bold text-neutral-700">
                    Comments & Activity ({comments.length})
                  </span>
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a quick comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="flex-1 rounded-xl border border-neutral-200 bg-neutral-50/60 px-3.5 py-2 text-xs text-neutral-800 placeholder-neutral-400 focus:bg-white focus:border-blue-600 focus:outline-hidden transition"
                  />
                  <button
                    type="submit"
                    disabled={addingComment || !newComment.trim()}
                    className="flex items-center gap-1 rounded-xl bg-neutral-900 px-3 py-2 text-xs font-bold text-white hover:bg-black disabled:opacity-50 transition"
                  >
                    {addingComment ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Send className="size-3.5" />
                    )}
                  </button>
                </form>

                {/* Comments List */}
                {comments.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {comments.map((c, idx) => (
                      <div
                        key={c.id || idx}
                        className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-neutral-400 font-semibold">
                          <span>{c.userName || c.user_name || 'Member'}</span>
                          <span>
                            {c.createdAt ? format(new Date(c.createdAt), 'MMM d, h:mm a') : ''}
                          </span>
                        </div>
                        <p className="text-neutral-700">{c.content || c.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ================= EDIT MODE ================= */
            <form onSubmit={handleSaveUpdate} className="space-y-5">
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 flex items-center gap-2.5 text-xs text-blue-800">
                <Sparkles className="size-4 text-blue-600 shrink-0" />
                <span>
                  Make your changes below and click <strong>Update Task</strong> to save updates to
                  the roadmap.
                </span>
              </div>

              {/* Task Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Task Name / Title *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter task name..."
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-900 focus:border-blue-600 focus:outline-hidden shadow-2xs transition"
                />
              </div>

              {/* Row: Status, Priority, Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-hidden shadow-2xs"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="TESTING">Testing</option>
                    <option value="DONE">Done</option>
                    <option value="BLOCKED">Blocked</option>
                    <option value="BACKLOG">Backlog</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-hidden shadow-2xs"
                  >
                    <option value="CRITICAL">P0 - Critical</option>
                    <option value="HIGH">P1 - High</option>
                    <option value="MEDIUM">P2 - Medium</option>
                    <option value="LOW">P3 - Low</option>
                    <option value="LOWEST">P4 - Lowest</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Issue Type</label>
                  <select
                    value={formData.issueType}
                    onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-hidden shadow-2xs"
                  >
                    <option value="Task">Task</option>
                    <option value="Story">Story</option>
                    <option value="Bug">Bug</option>
                    <option value="Epic">Epic</option>
                    <option value="Subtask">Subtask</option>
                  </select>
                </div>
              </div>

              {/* Row: Assignee, Due Date, Story Points */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Assignee</label>
                  <select
                    value={formData.assigneeId}
                    onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-hidden shadow-2xs"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.$id || m.id} value={m.$id || m.id}>
                        {m.name || m.user?.name || m.email || 'Member'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-hidden shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Story Points</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.storyPoints}
                    onChange={(e) => setFormData({ ...formData, storyPoints: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 focus:border-blue-600 focus:outline-hidden shadow-2xs"
                  />
                </div>
              </div>

              {/* Description Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the acceptance criteria, implementation notes, or context..."
                  className="w-full rounded-xl border border-neutral-300 bg-white p-3.5 text-xs text-neutral-800 focus:border-blue-600 focus:outline-hidden shadow-2xs transition"
                />
              </div>
            </form>
          )}
        </div>

        {/* Modal Bottom Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50/80">
          {mode === 'read' ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                Click <strong>Edit Task</strong> to modify details.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition shadow-2xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleStartEdit}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition shadow-xs"
                >
                  <Edit3 className="size-3.5" />
                  <span>Edit Task</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex items-center justify-between">
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={updating}
                className="px-4 py-2 rounded-xl border border-neutral-300 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition shadow-2xs"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveUpdate}
                  disabled={updating}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-xs"
                >
                  {updating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      <span>Update Task</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
