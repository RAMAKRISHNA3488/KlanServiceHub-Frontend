import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { useCurrent } from '@/features/auth/api/use-current';
import { boardsApi, tasksApi, workflowsAdminApi } from '@/lib/api-client';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { toast } from 'sonner';
import {
  Kanban,
  Plus,
  Trash2,
  Pencil,
  Edit2,
  RefreshCw,
  X,
  Search,
  CheckCircle2,
  Clock,
  Code2,
  CircleDot,
  ArrowRight,
  ArrowLeft,
  Filter,
  User,
  ShieldAlert,
  AlertCircle,
  Settings,
  Layers,
} from 'lucide-react';

export const BoardsView = () => {
  const navigate = useNavigate();
  const workspaceId = useWorkspaceId();
  const { data: currentUser } = useCurrent();

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Confirm Action',
    'Are you sure you want to proceed?',
    'destructive'
  );

  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');

  const { data: projectsData } = useGetProjects({ workspaceId });
  const { data: membersData } = useGetMembers({ workspaceId });

  const projects = projectsData?.documents || [];
  const members = membersData?.documents || [];

  // Determine if current user has Admin privileges in this workspace
  const currentMember = members.find(
    (m) => m.userId === currentUser?.$id || m.userId === currentUser?.id || m.user_id === currentUser?.$id
  );
  const isAdmin =
    currentUser?.role === 'ADMIN' ||
    currentMember?.role === 'ADMIN' ||
    currentMember?.role === 'OWNER' ||
    currentUser?.isOwner;

  const [createBoardModal, setCreateBoardModal] = useState(false);
  const [boardForm, setBoardForm] = useState({ name: '', type: 'KANBAN', projectId: '' });

  const [editBoardModal, setEditBoardModal] = useState(false);
  const [editBoardForm, setEditBoardForm] = useState({ name: '', type: 'KANBAN', projectId: '' });

  const [quickCreateOpen, setQuickCreateOpen] = useState(null); // column id
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskProject, setNewTaskProject] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);

  const fetchBoardsAndTasks = async () => {
    try {
      setLoading(true);
      const [boardsRes, tasksRes, wfRes] = await Promise.all([
        boardsApi.getBoards(workspaceId),
        tasksApi.getTasks({ workspaceId }),
        workflowsAdminApi.getWorkflows(workspaceId).catch(() => ({ data: [] })),
      ]);

      const loadedBoards = boardsRes?.data || [];
      setBoards(loadedBoards);

      if (loadedBoards.length > 0 && !selectedBoardId) {
        setSelectedBoardId(loadedBoards[0].id);
      }

      if (tasksRes?.data?.documents) {
        setTasks(tasksRes.data.documents);
      }

      if (wfRes?.data) {
        setWorkflows(wfRes.data);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load board data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchBoardsAndTasks();
    }
  }, [workspaceId]);

  // Derive dynamic board columns from active workflow statuses
  const defaultWorkflow = workflows[0];
  const workflowStatuses = defaultWorkflow?.statuses?.length > 0 ? defaultWorkflow.statuses : null;

  const columns = useMemo(() => {
    if (workflowStatuses && workflowStatuses.length > 0) {
      return workflowStatuses.map((st) => {
        const id = st.name;
        const cat = (st.category || 'IN_PROGRESS').toUpperCase();
        let Icon = Clock;
        let bg = 'bg-amber-50/70';
        let border = 'border-amber-200';

        if (cat === 'TODO' || id.includes('TODO') || id.includes('BACKLOG')) {
          Icon = CircleDot;
          bg = 'bg-blue-50/70';
          border = 'border-blue-200';
        } else if (cat === 'DONE' || id.includes('DONE') || id.includes('RESOLVED') || id.includes('CLOSED')) {
          Icon = CheckCircle2;
          bg = 'bg-emerald-50/70';
          border = 'border-emerald-200';
        } else if (id.includes('REVIEW') || id.includes('TEST') || id.includes('QA')) {
          Icon = Code2;
          bg = 'bg-purple-50/70';
          border = 'border-purple-200';
        }

        return {
          id,
          rawName: st.name,
          label: st.name.replace(/_/g, ' '),
          color: st.color || '#3B82F6',
          category: cat,
          icon: Icon,
          bg,
          border,
        };
      });
    }

    // Default fallback columns if no custom workflow configured
    return [
      { id: 'TODO', label: 'TO DO', color: '#3B82F6', category: 'TODO', icon: CircleDot, bg: 'bg-blue-50/70', border: 'border-blue-200' },
      { id: 'IN_PROGRESS', label: 'IN PROGRESS', color: '#F59E0B', category: 'IN_PROGRESS', icon: Clock, bg: 'bg-amber-50/70', border: 'border-amber-200' },
      { id: 'CODE_REVIEW', label: 'CODE REVIEW', color: '#8B5CF6', category: 'IN_PROGRESS', icon: Code2, bg: 'bg-purple-50/70', border: 'border-purple-200' },
      { id: 'DONE', label: 'DONE', color: '#10B981', category: 'DONE', icon: CheckCircle2, bg: 'bg-emerald-50/70', border: 'border-emerald-200' },
    ];
  }, [workflowStatuses]);

  const handleCreateBoard = async (e) => {
    e.preventDefault();
    try {
      const res = await boardsApi.createBoard(workspaceId, boardForm);
      toast.success(`Board "${boardForm.name}" created!`);
      setCreateBoardModal(false);
      setBoardForm({ name: '', type: 'KANBAN', projectId: '' });
      await fetchBoardsAndTasks();
      if (res?.data?.id) setSelectedBoardId(res.data.id);
    } catch (err) {
      toast.error(err.message || 'Failed to create board');
    }
  };

  const handleOpenEditBoard = (b = activeBoard) => {
    if (!b) return;
    setEditBoardForm({
      name: b.name || '',
      type: b.type || 'KANBAN',
      projectId: b.projectId || b.project_id || '',
    });
    setEditBoardModal(true);
  };

  const handleSaveEditBoard = async (e) => {
    e.preventDefault();
    if (!activeBoard) return;
    try {
      await boardsApi.updateBoard(workspaceId, activeBoard.id, editBoardForm);
      toast.success(`Board "${editBoardForm.name}" updated successfully!`);
      setEditBoardModal(false);
      await fetchBoardsAndTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to update board');
    }
  };

  const handleDeleteBoard = async (id, boardName = 'this board', e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!isAdmin) {
      toast.error('Permission denied: Only administrators can delete boards.');
      return;
    }
    const ok = await confirmAction({
      title: 'Delete Kanban Board',
      message: `Are you sure you want to delete the board "${boardName}"?`,
      variant: 'destructive',
      confirmText: 'Delete Board',
      warningNotice: 'Tasks associated with this workspace will remain intact, but this board configuration and layout will be removed.'
    });
    if (!ok) return;
    try {
      await boardsApi.deleteBoard(workspaceId, id);
      toast.success('Board deleted.');
      const remaining = boards.filter((b) => b.id !== id);
      setBoards(remaining);
      if (selectedBoardId === id) {
        setSelectedBoardId(remaining[0]?.id || null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete board');
    }
  };

  const handleMoveStatus = async (taskId, newStatus) => {
    const targetCol = columns.find((c) => c.id === newStatus);
    const isDone = targetCol?.category === 'DONE' || newStatus === 'DONE';

    if (isDone && !isAdmin) {
      toast.error('Permission denied: Only administrators can move issues to DONE.');
      return;
    }

    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.$id === taskId || t.id === taskId ? { ...t, status: newStatus } : t))
      );

      await tasksApi.bulkUpdate([{ $id: taskId, status: newStatus }]);
      toast.success(`Moved to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update task status');
      fetchBoardsAndTasks();
    }
  };

  const handleDeleteTask = async (taskId, taskKey, taskName) => {
    if (!isAdmin) {
      toast.error('Permission denied: Only administrators can delete tickets.');
      return;
    }

    const ok = await confirmAction({
      title: 'Permanently Delete Issue',
      message: `Are you sure you want to permanently delete ticket ${taskKey || 'item'} ("${taskName}")?`,
      variant: 'destructive',
      confirmText: 'Delete Ticket',
      warningNotice: 'This action cannot be undone. All ticket comments, attachments, and activity logs will be permanently deleted.'
    });
    if (!ok) return;

    try {
      // Optimistic update
      setTasks((prev) => prev.filter((t) => t.$id !== taskId && t.id !== taskId));
      await tasksApi.deleteTask(taskId);
      toast.success(`Ticket ${taskKey || ''} permanently deleted.`);
    } catch (err) {
      toast.error(err.message || 'Failed to delete ticket');
      fetchBoardsAndTasks();
    }
  };

  const handleQuickCreateTask = async (status) => {
    if (!newTaskName.trim()) return;
    const targetProject = newTaskProject || projects[0]?.$id || projects[0]?.id;
    if (!targetProject) {
      toast.error('Please create a project first before adding tasks.');
      return;
    }

    try {
      setCreatingTask(true);
      const res = await tasksApi.createTask({
        name: newTaskName.trim(),
        workspaceId,
        projectId: targetProject,
        status,
      });

      if (res?.data) {
        setTasks((prev) => [res.data, ...prev]);
        toast.success(`Created issue in ${status.replace(/_/g, ' ')}`);
        setNewTaskName('');
        setQuickCreateOpen(null);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create task');
    } finally {
      setCreatingTask(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      !searchQuery ||
      task.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProject =
      selectedProject === 'ALL' ||
      task.projectId === selectedProject ||
      task.project_id === selectedProject ||
      task.project?.$id === selectedProject;

    const matchesPriority =
      selectedPriority === 'ALL' || task.priority === selectedPriority;

    return matchesSearch && matchesProject && matchesPriority;
  });

  const getTasksForColumn = (columnId) => {
    const normCol = String(columnId || '').toUpperCase().replace(/\s+/g, '_');
    return filteredTasks.filter((t) => {
      const st = String(t.status || '').toUpperCase().replace(/\s+/g, '_');
      if (st === normCol) return true;
      if (normCol === 'TODO' && (st === 'TO_DO' || st === 'BACKLOG')) return true;
      if (normCol === 'IN_PROGRESS' && (st === 'INPROGRESS' || st === 'IN_PROGRESS')) return true;
      if ((normCol === 'IN_REVIEW' || normCol === 'CODE_REVIEW') && (st === 'IN_REVIEW' || st === 'CODE_REVIEW' || st === 'REVIEW')) return true;
      return false;
    });
  };

  if (loading && boards.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="size-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const activeBoard = boards.find((b) => b.id === selectedBoardId) || boards[0];

  return (
    <div className="flex flex-col gap-y-5 max-w-7xl mx-auto pb-16">
      {/* Top Header & Board Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-2">
              <Kanban className="size-4 text-blue-600" />
              {activeBoard ? activeBoard.name : 'Engineering Kanban Board'}
            </h1>
            <span className="rounded bg-blue-50 px-2 py-0.2 text-[10px] font-bold text-blue-700">
              {activeBoard?.type || 'KANBAN'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Dynamic workflow board syncing {columns.length} stages: {columns.map((c) => c.label).join(' ➔ ')}.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Board Switcher Dropdown */}
          {boards.length > 1 && (
            <select
              value={selectedBoardId || ''}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {boards.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.type})
                </option>
              ))}
            </select>
          )}

          {activeBoard && (
            <button
              onClick={() => handleOpenEditBoard(activeBoard)}
              className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-blue-600 transition"
              title="Edit Board Name and Settings"
            >
              <Pencil className="size-3.5 text-neutral-500" />
              <span>Edit Board</span>
            </button>
          )}

          {activeBoard && (
            <button
              onClick={(e) => handleDeleteBoard(activeBoard.id, activeBoard.name, e)}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-3 py-1.5 text-xs font-semibold text-red-600 shadow-xs hover:bg-red-100 hover:border-red-300 transition"
              title="Delete Board"
            >
              <Trash2 className="size-3.5 text-red-600" />
              <span>Delete Board</span>
            </button>
          )}

          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/workflows-admin`)}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
            title="Configure workflow statuses and lifecycle rules"
          >
            <Settings className="size-3.5 text-neutral-500" />
            <span>Workflow Settings</span>
          </button>

          <button
            onClick={() => setCreateBoardModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="size-3.5" />
            Create Board
          </button>

          <button
            onClick={fetchBoardsAndTasks}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
          >
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Board Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-neutral-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-neutral-400" />
            <input
              type="text"
              placeholder="Filter board by summary or key..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 pl-8 pr-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Project Filter */}
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-700"
          >
            <option value="ALL">All Projects</option>
            {projects.map((p) => (
              <option key={p.$id || p.id} value={p.$id || p.id}>
                {p.name} ({p.key || 'PROJ'})
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs font-medium text-neutral-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">P0 - Critical</option>
            <option value="HIGH">P1 - High</option>
            <option value="MEDIUM">P2 - Medium</option>
            <option value="LOW">P3 - Low</option>
            <option value="LOWEST">P4 - Lowest</option>
          </select>
        </div>
      </div>

      {/* Interactive Kanban Board Columns */}
      <div className="flex overflow-x-auto gap-4 items-start pb-6 custom-scrollbar">
        {columns.map((col, colIndex) => {
          const columnTasks = getTasksForColumn(col.id);
          const Icon = col.icon;

          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl border ${col.border} ${col.bg} p-3 min-w-[280px] flex-1 min-h-[550px] shadow-xs shrink-0`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="size-4" style={{ color: col.color }} />
                  <span className="text-xs font-bold text-neutral-800 tracking-wide uppercase">
                    {col.label}
                  </span>
                </div>
                <span className="flex items-center justify-center size-5 rounded-full bg-white text-[11px] font-bold text-neutral-600 shadow-xs">
                  {columnTasks.length}
                </span>
              </div>

              {/* Add Issue Quick Button */}
              {quickCreateOpen === col.id ? (
                <div className="mb-3 rounded-xl bg-white p-2.5 border border-neutral-200 shadow-sm space-y-2 animate-in fade-in">
                  <input
                    type="text"
                    autoFocus
                    placeholder="What needs to be done?"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickCreateTask(col.id)}
                    className="w-full rounded border border-neutral-300 p-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                  {projects.length > 1 && (
                    <select
                      value={newTaskProject}
                      onChange={(e) => setNewTaskProject(e.target.value)}
                      className="w-full rounded border border-neutral-200 p-1 text-[11px] bg-neutral-50"
                    >
                      {projects.map((p) => (
                        <option key={p.$id || p.id} value={p.$id || p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      onClick={() => setQuickCreateOpen(null)}
                      className="px-2 py-1 text-[10px] font-medium text-neutral-500 hover:bg-neutral-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleQuickCreateTask(col.id)}
                      disabled={creatingTask || !newTaskName.trim()}
                      className="px-2.5 py-1 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                    >
                      {creatingTask ? 'Adding...' : 'Create'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setQuickCreateOpen(col.id);
                    setNewTaskName('');
                    setNewTaskProject(projects[0]?.$id || projects[0]?.id || '');
                  }}
                  className="mb-3 flex items-center justify-center gap-1 w-full rounded-xl border border-dashed border-neutral-300 bg-white/70 py-1.5 text-xs font-semibold text-neutral-600 hover:border-blue-400 hover:bg-white hover:text-blue-600 transition shadow-2xs"
                >
                  <Plus className="size-3.5" />
                  <span>Create issue</span>
                </button>
              )}

              {/* Tasks List in Column */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                {columnTasks.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center py-10 text-center text-xs text-neutral-400">
                    No issues in {col.label}
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const taskId = task.$id || task.id;
                    return (
                      <div
                        key={taskId}
                        className="shrink-0 w-full rounded-xl border border-neutral-200 bg-white p-3 shadow-xs hover:shadow-md hover:border-blue-300 transition-all space-y-2"
                      >
                        {/* Task Key & Priority */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            {task.key || 'TASK'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                task.priority === 'CRITICAL' || task.priority === 'HIGHEST' || task.priority === 'P0'
                                  ? 'bg-red-100 text-red-700'
                                  : task.priority === 'HIGH' || task.priority === 'P1'
                                  ? 'bg-amber-100 text-amber-700'
                                  : task.priority === 'LOW' || task.priority === 'P3'
                                  ? 'bg-blue-100 text-blue-700'
                                  : task.priority === 'LOWEST' || task.priority === 'P4'
                                  ? 'bg-slate-100 text-slate-700'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                            >
                              {task.priority === 'CRITICAL'
                                ? 'P0 - Critical'
                                : task.priority === 'HIGH' || task.priority === 'HIGHEST'
                                ? 'P1 - High'
                                : task.priority === 'MEDIUM'
                                ? 'P2 - Medium'
                                : task.priority === 'LOW'
                                ? 'P3 - Low'
                                : task.priority === 'LOWEST'
                                ? 'P4 - Lowest'
                                : (task.priority || 'P2 - Medium')}
                            </span>
                            {/* Admin-Only Ticket Delete Button */}
                            {isAdmin && (
                              <button
                                title="Delete ticket (Admin Only)"
                                onClick={() => handleDeleteTask(taskId, task.key, task.name)}
                                className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Task Summary */}
                        <p className="text-xs font-semibold text-neutral-900 leading-snug break-words">
                          {task.name}
                        </p>

                        {/* Footer: Assignee & Action Controls */}
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[11px]">
                          <div className="flex items-center gap-1.5 text-neutral-500">
                            <div className="size-5 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-[9px] text-neutral-600 uppercase border">
                              {task.assignee?.name?.charAt(0) || <User className="size-3" />}
                            </div>
                            <span className="truncate max-w-[90px] text-[10px]">
                              {task.assignee?.name || 'Unassigned'}
                            </span>
                          </div>

                          {/* Quick Workflow Transition Arrows */}
                          <div className="flex items-center gap-1">
                            {colIndex > 0 && (
                              <button
                                title={`Move back to ${columns[colIndex - 1].label}`}
                                onClick={() => handleMoveStatus(taskId, columns[colIndex - 1].id)}
                                className="p-1 rounded bg-neutral-50 hover:bg-neutral-200 text-neutral-600 transition"
                              >
                                <ArrowLeft className="size-3" />
                              </button>
                            )}
                            {colIndex < columns.length - 1 && (columns[colIndex + 1].category !== 'DONE' || isAdmin) && (
                              <button
                                title={`Advance to ${columns[colIndex + 1].label}`}
                                onClick={() => handleMoveStatus(taskId, columns[colIndex + 1].id)}
                                className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition"
                              >
                                <ArrowRight className="size-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Board Modal */}
      {createBoardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Create New Visual Board</h3>
              <button onClick={() => setCreateBoardModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Board Name *</label>
                <input
                  type="text"
                  required
                  value={boardForm.name}
                  onChange={(e) => setBoardForm({ ...boardForm, name: e.target.value })}
                  placeholder="e.g. Core Engineering Board"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Board Type</label>
                <select
                  value={boardForm.type}
                  onChange={(e) => setBoardForm({ ...boardForm, type: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="KANBAN">Kanban (Continuous Flow: TO DO ➔ IN PROGRESS ➔ CODE REVIEW ➔ DONE)</option>
                  <option value="SCRUM">Scrum (Sprint Iterations)</option>
                </select>
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Target Project (Optional)</label>
                  <select
                    value={boardForm.projectId}
                    onChange={(e) => setBoardForm({ ...boardForm, projectId: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Workspace Projects</option>
                    {projects.map((p) => (
                      <option key={p.$id || p.id} value={p.$id || p.id}>
                        {p.name} ({p.key || 'PROJ'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setCreateBoardModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  Create Board
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      {editBoardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Kanban className="size-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Edit Board Configuration</h3>
                  <p className="text-[11px] text-neutral-500">Update board metadata and target settings</p>
                </div>
              </div>
              <button onClick={() => setEditBoardModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBoard} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Board Name *</label>
                <input
                  type="text"
                  required
                  value={editBoardForm.name}
                  onChange={(e) => setEditBoardForm({ ...editBoardForm, name: e.target.value })}
                  placeholder="e.g. Engineering Kanban Board"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Board Type</label>
                <select
                  value={editBoardForm.type}
                  onChange={(e) => setEditBoardForm({ ...editBoardForm, type: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="KANBAN">Kanban (Continuous Flow)</option>
                  <option value="SCRUM">Scrum (Sprint Iterations)</option>
                </select>
              </div>

              {projects.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Target Project (Optional)</label>
                  <select
                    value={editBoardForm.projectId || ''}
                    onChange={(e) => setEditBoardForm({ ...editBoardForm, projectId: e.target.value })}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">All Workspace Projects</option>
                    {projects.map((p) => (
                      <option key={p.$id || p.id} value={p.$id || p.id}>
                        {p.name} ({p.key || 'PROJ'})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditBoardModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};
