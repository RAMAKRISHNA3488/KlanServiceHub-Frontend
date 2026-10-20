import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { useCurrent } from '@/features/auth/api/use-current';
import { boardsApi, tasksApi, workflowsAdminApi, teamsAdminApi, sprintsApi } from '@/lib/api-client';
import { KlanserviceHubIssueDetailModal } from '@/features/tasks/components/klanservicehub-issue-detail-modal';
import { BoardFilters } from './board-filters';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const queryProjectId = searchParams.get('projectId');
  const [filters, setFilters] = useState({
    dateRange: null,
    startDate: '',
    endDate: '',
    projectId: queryProjectId || 'ALL',
    teamId: 'ALL',
    assigneeId: 'ALL',
    workType: 'ALL',
    status: 'ALL',
    priority: 'ALL',
    sprintId: 'ALL',
  });
  const [teams, setTeams] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [issueTypes, setIssueTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetailTaskId, setSelectedDetailTaskId] = useState(null);
  const [draggedOverCol, setDraggedOverCol] = useState(null);

  useEffect(() => {
    if (queryProjectId && queryProjectId !== filters.projectId) {
      setFilters((prev) => ({ ...prev, projectId: queryProjectId }));
    }
  }, [queryProjectId]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'projectId') {
        const nextParams = new URLSearchParams(searchParams);
        if (value === 'ALL' || !value) {
          nextParams.delete('projectId');
        } else {
          nextParams.set('projectId', value);
        }
        setSearchParams(nextParams);
      }
      return updated;
    });
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: null,
      startDate: '',
      endDate: '',
      projectId: 'ALL',
      teamId: 'ALL',
      assigneeId: 'ALL',
      workType: 'ALL',
      status: 'ALL',
      priority: 'ALL',
      sprintId: 'ALL',
    });
    setSearchQuery('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('projectId');
    setSearchParams(nextParams);
  };

  const handleProjectChange = (newProjId) => {
    handleFilterChange('projectId', newProjId);
  };

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

  const queryClient = useQueryClient();

  const { data: boardsData, isLoading: isQueryLoading } = useQuery({
    queryKey: ['boards-view-data', workspaceId],
    queryFn: async () => {
      const [boardsRes, tasksRes, wfRes, typesRes, teamsRes, sprintsRes] = await Promise.all([
        boardsApi.getBoards(workspaceId),
        tasksApi.getTasks({ workspaceId }),
        workflowsAdminApi.getWorkflows(workspaceId).catch(() => ({ data: [] })),
        workflowsAdminApi.getIssueTypes(workspaceId).catch(() => ({ data: [] })),
        teamsAdminApi.getTeams(workspaceId).catch(() => ({ data: [] })),
        sprintsApi.getSprints(workspaceId).catch(() => ({ data: [] })),
      ]);
      return {
        boards: boardsRes?.data || [],
        tasks: tasksRes?.data?.documents || [],
        workflows: wfRes?.data || [],
        issueTypes: typesRes?.data || [],
        teams: Array.isArray(teamsRes?.data) ? teamsRes.data : (teamsRes?.data?.teams || []),
        sprints: Array.isArray(sprintsRes?.data) ? sprintsRes.data : (sprintsRes?.data?.sprints || []),
      };
    },
    enabled: !!workspaceId,
  });

  useEffect(() => {
    if (boardsData) {
      setBoards(boardsData.boards);
      setTasks(boardsData.tasks);
      setWorkflows(boardsData.workflows);
      setIssueTypes(boardsData.issueTypes);
      setTeams(boardsData.teams || []);
      setSprints(boardsData.sprints || []);
      if (boardsData.boards.length > 0 && !selectedBoardId) {
        setSelectedBoardId(boardsData.boards[0].id);
      }
      setLoading(false);
    }
  }, [boardsData]);

  const fetchBoardsAndTasks = async () => {
    await queryClient.invalidateQueries({ queryKey: ['boards-view-data', workspaceId] });
  };

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
      { id: 'BACKLOG', label: 'BACKLOG', color: '#94A3B8', category: 'TODO', icon: CircleDot, bg: 'bg-slate-50/70', border: 'border-slate-200' },
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

    const currentTask = tasks.find((t) => t.$id === taskId || t.id === taskId);
    const taskKey = currentTask?.key;

    try {
      // Optimistic update: strictly update all references in-place without duplicate entries
      setTasks((prev) =>
        prev.map((t) =>
          (t.$id === taskId || t.id === taskId || (taskKey && t.key === taskKey))
            ? { ...t, status: newStatus }
            : t
        )
      );

      await tasksApi.bulkUpdate([{ $id: taskId, status: newStatus }]);
      toast.success(`Moved to ${newStatus.replace(/_/g, ' ')}`);
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
    const targetProject = newTaskProject || (filters.projectId !== 'ALL' ? filters.projectId : (projects[0]?.$id || projects[0]?.id));
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
        const newTask = res.data;
        const newId = newTask.$id || newTask.id;
        setTasks((prev) => [newTask, ...prev.filter((t) => (t.$id || t.id) !== newId)]);
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

  const isWithinDateRange = (taskDateStr, range, startDate, endDate) => {
    if (!range || range === 'ALL') return true;
    if (!taskDateStr) return false;

    const taskDate = new Date(taskDateStr);
    if (isNaN(taskDate.getTime())) return false;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (range === 'today') {
      return taskDate >= startOfToday;
    }
    if (range === '7d') {
      const past7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return taskDate >= past7;
    }
    if (range === '30d') {
      const past30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return taskDate >= past30;
    }
    if (range === '90d') {
      const past90 = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return taskDate >= past90;
    }
    if (range === 'thisYear') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return taskDate >= startOfYear;
    }
    if (range === 'custom') {
      if (startDate && new Date(taskDateStr) < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(taskDateStr) > end) return false;
      }
      return true;
    }
    return true;
  };

  const uniqueTasks = useMemo(() => {
    const seen = new Set();
    return tasks.filter((t) => {
      const id1 = t?.$id;
      const id2 = t?.id;
      const key = t?.key;
      if (id1 && seen.has(id1)) return false;
      if (id2 && seen.has(id2)) return false;
      if (key && seen.has(`key_${key}`)) return false;
      if (id1) seen.add(id1);
      if (id2) seen.add(id2);
      if (key) seen.add(`key_${key}`);
      return true;
    });
  }, [tasks]);

  const filteredTasks = uniqueTasks.filter((task) => {
    // 1. Search Query
    const matchesSearch =
      !searchQuery ||
      task.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Project Filter
    const matchesProject =
      !filters.projectId ||
      filters.projectId === 'ALL' ||
      task.projectId === filters.projectId ||
      task.project_id === filters.projectId ||
      task.project?.$id === filters.projectId ||
      task.project?.id === filters.projectId;

    if (!matchesProject) return false;

    // 3. Team Filter
    if (filters.teamId && filters.teamId !== 'ALL') {
      const selectedTeam = teams.find((t) => t.id === filters.teamId);
      if (selectedTeam) {
        const teamMemberIds = new Set((selectedTeam.members || []).map((m) => m.id || m.userId || m.user_id));
        const teamProjectIds = new Set((selectedTeam.projects || []).map((p) => p.id || p.$id));
        const assigneeUserId = task.assignee?.userId || task.assignee?.user_id || task.assignee?.id || task.assigneeId;
        const taskProjId = task.projectId || task.project_id;
        const inTeamMembers = assigneeUserId && teamMemberIds.has(assigneeUserId);
        const inTeamProjects = taskProjId && teamProjectIds.has(taskProjId);
        if (!inTeamMembers && !inTeamProjects) return false;
      }
    }

    // 4. Assignee Filter
    if (filters.assigneeId && filters.assigneeId !== 'ALL') {
      if (filters.assigneeId === 'UNASSIGNED') {
        if (task.assigneeId || task.assignee) return false;
      } else {
        const matchesAssignee =
          task.assigneeId === filters.assigneeId ||
          task.assignee?.$id === filters.assigneeId ||
          task.assignee?.id === filters.assigneeId ||
          task.assignee?.userId === filters.assigneeId ||
          (Array.isArray(task.assignees) &&
            task.assignees.some(
              (a) =>
                a.id === filters.assigneeId ||
                a.memberId === filters.assigneeId ||
                a.userId === filters.assigneeId
            ));
        if (!matchesAssignee) return false;
      }
    }

    // 5. Work Type Filter
    if (filters.workType && filters.workType !== 'ALL') {
      const taskType = (task.issueType || task.issue_type || 'Task').toUpperCase();
      if (taskType !== filters.workType.toUpperCase()) return false;
    }

    // 6. Status Filter
    if (filters.status && filters.status !== 'ALL') {
      const taskStatus = (task.status || '').toUpperCase().trim();
      const filterStatus = filters.status.toUpperCase().trim();
      if (taskStatus !== filterStatus) return false;
    }

    // 7. Priority Filter
    if (filters.priority && filters.priority !== 'ALL') {
      const taskPriority = (task.priority || '').toUpperCase().trim();
      const filterPriority = filters.priority.toUpperCase().trim();
      if (taskPriority !== filterPriority) return false;
    }

    // 8. Sprint Filter
    if (filters.sprintId && filters.sprintId !== 'ALL') {
      const taskSprint = task.sprintId || task.sprint_id;
      if (taskSprint !== filters.sprintId) return false;
    }

    // 9. Date Range Filter
    if (filters.dateRange && filters.dateRange !== 'ALL') {
      const taskDates = [
        task.createdAt,
        task.created_at,
        task.updatedAt,
        task.updated_at,
        task.dueDate,
        task.due_date,
      ].filter(Boolean);

      if (taskDates.length > 0) {
        const anyMatches = taskDates.some((d) =>
          isWithinDateRange(d, filters.dateRange, filters.startDate, filters.endDate)
        );
        if (!anyMatches) return false;
      }
    }

    return true;
  });

  const resolveTaskColumnId = (task, cols) => {
    if (!task || !cols || cols.length === 0) return null;
    const rawStatus = task.status;
    if (!rawStatus) return cols[0]?.id;

    // 1. Direct match with column id or rawName
    const directMatch = cols.find(
      (c) => c.id === rawStatus || (c.rawName && c.rawName === rawStatus)
    );
    if (directMatch) return directMatch.id;

    // 2. Normalized uppercase string comparison
    const cleanStatus = String(rawStatus).toUpperCase().trim().replace(/[\s-]+/g, '_');
    const normalizedMatch = cols.find((c) => {
      const cId = String(c.id || '').toUpperCase().trim().replace(/[\s-]+/g, '_');
      const cRaw = String(c.rawName || '').toUpperCase().trim().replace(/[\s-]+/g, '_');
      return cId === cleanStatus || cRaw === cleanStatus;
    });
    if (normalizedMatch) return normalizedMatch.id;

    // Helper to find column matching any alias in order of precedence
    const findColumnByAliases = (...aliases) =>
      cols.find((c) => {
        const cId = String(c.id || '').toUpperCase().trim().replace(/[\s-]+/g, '_');
        const cRaw = String(c.rawName || '').toUpperCase().trim().replace(/[\s-]+/g, '_');
        return aliases.includes(cId) || aliases.includes(cRaw);
      });

    // 3. Known workflow status standard synonyms
    if (cleanStatus === 'BACKLOG' || cleanStatus === 'BACK_LOG') {
      const col = findColumnByAliases('BACKLOG', 'BACK_LOG');
      if (col) return col.id;
    } else if (cleanStatus === 'TODO' || cleanStatus === 'TO_DO' || cleanStatus === 'OPEN') {
      const col = findColumnByAliases('TODO', 'TO_DO');
      if (col) return col.id;
    } else if (cleanStatus === 'IN_PROGRESS' || cleanStatus === 'INPROGRESS') {
      const col = findColumnByAliases('IN_PROGRESS', 'INPROGRESS');
      if (col) return col.id;
    } else if (cleanStatus === 'CODE_REVIEW' || cleanStatus === 'IN_REVIEW' || cleanStatus === 'REVIEW') {
      const col = findColumnByAliases('CODE_REVIEW', 'IN_REVIEW', 'REVIEW');
      if (col) return col.id;
    } else if (cleanStatus === 'TESTING' || cleanStatus === 'TEST' || cleanStatus === 'QA') {
      const col = findColumnByAliases('TESTING', 'TEST', 'QA');
      if (col) return col.id;
    } else if (cleanStatus === 'DONE' || cleanStatus === 'RESOLVED' || cleanStatus === 'CLOSED') {
      const col = findColumnByAliases('DONE', 'RESOLVED', 'CLOSED');
      if (col) return col.id;
    }

    // 4. Category fallback (for generic workflow categories like IN_PROGRESS or DONE)
    // Strictly exclude BACKLOG and TODO so they are never conflated with each other
    if (cleanStatus !== 'BACKLOG' && cleanStatus !== 'TODO' && cleanStatus !== 'BACK_LOG' && cleanStatus !== 'TO_DO') {
      const catMatch = cols.find(
        (c) => c.category && String(c.category).toUpperCase().trim() === cleanStatus
      );
      if (catMatch) return catMatch.id;
    }

    // 5. Explicit fallback for BACKLOG and TODO columns
    if (cleanStatus === 'BACKLOG' || cleanStatus === 'BACK_LOG') {
      const backlogCol = cols.find((c) => {
        const str = String(c.id || c.name || c.label || '').toUpperCase();
        return str.includes('BACKLOG') || str.includes('BACK_LOG');
      });
      if (backlogCol) return backlogCol.id;
    }
    if (cleanStatus === 'TODO' || cleanStatus === 'TO_DO') {
      const todoCol = cols.find((c) => {
        const str = String(c.id || c.name || c.label || '').toUpperCase();
        return str.includes('TODO') || str.includes('TO_DO') || str.includes('TO DO');
      });
      if (todoCol) return todoCol.id;
    }

    // 6. Default fallback to first column
    return cols[0]?.id;
  };

  const tasksByColumn = useMemo(() => {
    const map = {};
    columns.forEach((col) => {
      map[col.id] = [];
    });

    // Deduplicate tasks by id and issue key to strictly ensure one task per column
    const seen = new Set();
    const uniqueTasks = (filteredTasks || []).filter((task) => {
      const tId = task?.$id || task?.id;
      const key = task?.key;
      if (tId && seen.has(tId)) return false;
      if (key && seen.has(`key_${key}`)) return false;
      if (tId) seen.add(tId);
      if (key) seen.add(`key_${key}`);
      return true;
    });

    uniqueTasks.forEach((task) => {
      const targetColumnId = resolveTaskColumnId(task, columns);
      if (targetColumnId && map[targetColumnId]) {
        map[targetColumnId].push(task);
      } else if (columns.length > 0) {
        map[columns[0].id].push(task);
      }
    });

    return map;
  }, [filteredTasks, columns]);

  const getTasksForColumn = (columnId) => {
    return tasksByColumn[columnId] || [];
  };

  if (loading && !boardsData && boards.length === 0) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="size-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  const activeBoard = boards.find((b) => b.id === selectedBoardId) || boards[0];
  const activeProjectObj = projects.find((p) => (p.$id || p.id) === filters.projectId);
  const boardDisplayName = activeProjectObj
    ? `${activeProjectObj.name} • Engineering Kanban Board`
    : (activeBoard?.name || 'Engineering Kanban Board');

  return (
    <div className="flex flex-col gap-y-5 max-w-7xl mx-auto pb-16">
      {/* Top Header & Project Engineering Kanban Board Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-neutral-200 pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-neutral-900 flex items-center gap-1.5 sm:gap-2">
              <Kanban className="size-3.5 sm:size-4 text-blue-600 shrink-0" />
              <span>{boardDisplayName}</span>
            </h1>
            <span className="rounded bg-blue-50 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-blue-700 shrink-0">
              {activeProjectObj ? 'PROJECT BOARD' : (activeBoard?.type || 'KANBAN')}
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5 line-clamp-1 sm:line-clamp-none">
            Dynamic engineering workflow syncing {columns.length} stages: {columns.map((c) => c.label).join(' ➔ ')}.
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Board Switcher Dropdown */}
          {boards.length > 1 && (
            <select
              value={selectedBoardId || ''}
              onChange={(e) => setSelectedBoardId(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-neutral-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-neutral-300 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-blue-600 transition"
              title="Edit Board Name and Settings"
            >
              <Pencil className="size-3 sm:size-3.5 text-neutral-500" />
              <span className="hidden sm:inline">Edit Board</span>
              <span className="sm:hidden">Edit</span>
            </button>
          )}

          {activeBoard && (
            <button
              onClick={(e) => handleDeleteBoard(activeBoard.id, activeBoard.name, e)}
              className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-red-200 bg-red-50/50 px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-red-600 shadow-xs hover:bg-red-100 hover:border-red-300 transition"
              title="Delete Board"
            >
              <Trash2 className="size-3 sm:size-3.5 text-red-600" />
              <span className="hidden sm:inline">Delete Board</span>
              <span className="sm:hidden">Delete</span>
            </button>
          )}

          <button
            onClick={() => navigate(`/workspaces/${workspaceId}/workflows-admin`)}
            className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-neutral-300 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 hover:text-blue-600 transition"
            title="Edit Workflows & Issue Types to reflect across all boards"
          >
            <Settings className="size-3 sm:size-3.5 text-blue-600" />
            <span className="hidden md:inline">Edit Workflows & Issue Types</span>
            <span className="md:hidden">Workflows</span>
          </button>

          <button
            onClick={() => setCreateBoardModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 rounded-lg bg-blue-600 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="size-3 sm:size-3.5" />
            <span className="hidden sm:inline">Create Board</span>
            <span className="sm:hidden">New</span>
          </button>

          <button
            onClick={fetchBoardsAndTasks}
            className="flex items-center gap-1 sm:gap-1.5 rounded-lg border border-neutral-300 bg-white px-2 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition cursor-pointer"
          >
            <RefreshCw className={`size-3 sm:size-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Project Selector Navigation Pills */}
      {projects.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1 mr-1 shrink-0">
            <Layers className="size-3 sm:size-3.5 text-neutral-500" />
            <span>Project Boards:</span>
          </span>
          <button
            onClick={() => handleProjectChange('ALL')}
            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition shrink-0 cursor-pointer ${
              filters.projectId === 'ALL'
                ? 'bg-neutral-900 text-white shadow-xs'
                : 'bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200'
            }`}
          >
            All Projects
          </button>
          {projects.map((p) => {
            const pId = p.$id || p.id;
            const isSelected = filters.projectId === pId;
            return (
              <button
                key={pId}
                onClick={() => handleProjectChange(pId)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200'
                }`}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: isSelected ? '#ffffff' : '#3B82F6' }} />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Board Filters Bar Matching Reference Image Exactly */}
      <BoardFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={handleResetFilters}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        projects={projects}
        teams={teams}
        members={members}
        sprints={sprints}
        statuses={columns}
        issueTypes={issueTypes}
      />

      {/* Interactive Kanban Board Columns */}
      <div className="flex overflow-x-auto gap-3 sm:gap-4 items-start pb-6 custom-scrollbar snap-x snap-mandatory">
        {columns.map((col, colIndex) => {
          const columnTasks = getTasksForColumn(col.id);
          const Icon = col.icon;

          const isOver = draggedOverCol === col.id;

          return (
            <div
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (draggedOverCol !== col.id) setDraggedOverCol(col.id);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) {
                  setDraggedOverCol(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDraggedOverCol(null);
                const droppedTaskId = e.dataTransfer.getData('text/plain');
                if (droppedTaskId) {
                  handleMoveStatus(droppedTaskId, col.id);
                }
              }}
              className={`flex flex-col rounded-xl sm:rounded-2xl border transition-all snap-center ${
                isOver
                  ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-400/40 shadow-md'
                  : `${col.border} ${col.bg}`
              } p-2.5 sm:p-3 min-w-[82vw] sm:min-w-[280px] flex-1 min-h-[480px] sm:min-h-[550px] shadow-xs shrink-0`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-neutral-200/80 mb-2.5 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Icon className="size-3.5 sm:size-4" style={{ color: col.color }} />
                  <span className="text-[11px] sm:text-xs font-bold text-neutral-800 tracking-wide uppercase">
                    {col.label}
                  </span>
                </div>
                <span className="flex items-center justify-center size-4.5 sm:size-5 rounded-full bg-white text-[10px] sm:text-[11px] font-bold text-neutral-600 shadow-xs">
                  {columnTasks.length}
                </span>
              </div>

              {/* Add Issue Quick Button */}
              {quickCreateOpen === col.id ? (
                <div className="mb-2.5 sm:mb-3 rounded-lg sm:rounded-xl bg-white p-2 sm:p-2.5 border border-neutral-200 shadow-sm space-y-2 animate-in fade-in">
                  <input
                    type="text"
                    autoFocus
                    placeholder="What needs to be done?"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickCreateTask(col.id)}
                    className="w-full rounded border border-neutral-300 p-1.5 text-[11px] sm:text-xs focus:border-blue-500 focus:outline-none"
                  />
                  {projects.length > 1 && (
                    <select
                      value={newTaskProject}
                      onChange={(e) => setNewTaskProject(e.target.value)}
                      className="w-full rounded border border-neutral-200 p-1 text-[10.5px] sm:text-[11px] bg-neutral-50"
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
                      className="px-2 py-0.5 sm:py-1 text-[9.5px] sm:text-[10px] font-medium text-neutral-500 hover:bg-neutral-100 rounded"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleQuickCreateTask(col.id)}
                      disabled={creatingTask || !newTaskName.trim()}
                      className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9.5px] sm:text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
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
                  className="mb-2.5 sm:mb-3 flex items-center justify-center gap-1 w-full rounded-lg sm:rounded-xl border border-dashed border-neutral-300 bg-white/70 py-1 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-neutral-600 hover:border-blue-400 hover:bg-white hover:text-blue-600 transition shadow-2xs"
                >
                  <Plus className="size-3 sm:size-3.5" />
                  <span>Create issue</span>
                </button>
              )}

              {/* Tasks List in Column */}
              <div className="flex flex-col gap-2.5 sm:gap-3 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                {columnTasks.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center py-8 sm:py-10 text-center text-[11px] sm:text-xs text-neutral-400">
                    No issues in {col.label}
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const taskId = task.$id || task.id;
                    const taskTypeName = task.issueType || task.issue_type || task.type;
                    const matchedType = issueTypes.find(
                      (it) => it.name?.toLowerCase() === String(taskTypeName || '').toLowerCase() || it.id === taskTypeName
                    );

                    return (
                      <div
                        key={taskId}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', taskId);
                          e.dataTransfer.effectAllowed = 'move';
                          e.currentTarget.style.opacity = '0.4';
                        }}
                        onDragEnd={(e) => {
                          e.currentTarget.style.opacity = '1';
                          setDraggedOverCol(null);
                        }}
                        onDoubleClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const nextCol = columns[colIndex + 1];
                          if (nextCol) {
                            const isDone = nextCol.category === 'DONE' || nextCol.id === 'DONE';
                            if (isDone && !isAdmin) {
                              toast.error('Permission denied: Only administrators can move issues to DONE.');
                              return;
                            }
                            handleMoveStatus(taskId, nextCol.id);
                            toast.success(`Moved ${task.key || 'issue'} to ${nextCol.label}`);
                          } else {
                            toast.info(`Ticket is already at the final stage (${col.label})`);
                          }
                        }}
                        className="shrink-0 w-full rounded-lg sm:rounded-xl border border-neutral-200 bg-white p-2.5 sm:p-3 shadow-xs hover:shadow-md hover:border-blue-400 transition-all space-y-1.5 sm:space-y-2 cursor-grab active:cursor-grabbing select-none"
                        title="Double-click to advance stage • Drag to move • Click to view details"
                      >
                        {/* Task Key, Issue Type Badge & Priority */}
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                            {matchedType && (
                              <span
                                className="inline-flex items-center gap-1 px-1 sm:px-1.5 py-0.5 rounded text-[8.5px] sm:text-[9px] font-bold text-white shadow-2xs"
                                style={{ backgroundColor: matchedType.color || '#4F46E5' }}
                                title={`Issue Type: ${matchedType.name}`}
                              >
                                <span>{matchedType.name}</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDetailTaskId(taskId);
                              }}
                              className="font-mono text-[9px] sm:text-[10px] font-bold text-blue-700 bg-blue-50 px-1 sm:px-1.5 py-0.5 rounded hover:bg-blue-100 transition cursor-pointer"
                              title="Click to view ticket details"
                            >
                              {task.key || 'TASK'}
                            </button>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-1.5">
                            <span
                              className={`px-1 sm:px-1.5 py-0.5 rounded text-[8.5px] sm:text-[9px] font-bold ${
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
                                ? 'P0'
                                : task.priority === 'HIGH' || task.priority === 'HIGHEST'
                                ? 'P1'
                                : task.priority === 'MEDIUM'
                                ? 'P2'
                                : task.priority === 'LOW'
                                ? 'P3'
                                : task.priority === 'LOWEST'
                                ? 'P4'
                                : (task.priority || 'P2')}
                            </span>
                            {/* Admin-Only Ticket Delete Button */}
                            {isAdmin && (
                              <button
                                title="Delete ticket (Admin Only)"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTask(taskId, task.key, task.name);
                                }}
                                className="p-0.5 sm:p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition"
                              >
                                <Trash2 className="size-3 sm:size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Task Summary */}
                        <p
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDetailTaskId(taskId);
                          }}
                          className="text-[11px] sm:text-xs font-semibold text-neutral-900 leading-snug break-words hover:text-blue-600 transition cursor-pointer"
                          title="Click to view ticket details"
                        >
                          {task.name}
                        </p>

                        {/* Footer: Assignee & Action Controls */}
                        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[10px] sm:text-[11px]">
                          <div className="flex items-center gap-1 sm:gap-1.5 text-neutral-500">
                            <div className="size-4 sm:size-5 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-[8.5px] sm:text-[9px] text-neutral-600 uppercase border">
                              {task.assignee?.name?.charAt(0) || <User className="size-2.5 sm:size-3" />}
                            </div>
                            <span className="truncate max-w-[75px] sm:max-w-[90px] text-[9.5px] sm:text-[10px]">
                              {task.assignee?.name || 'Unassigned'}
                            </span>
                          </div>

                          {/* Quick Workflow Transition Arrows */}
                          <div className="flex items-center gap-1">
                            {colIndex > 0 && (
                              <button
                                title={`Move back to ${columns[colIndex - 1].label}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStatus(taskId, columns[colIndex - 1].id);
                                }}
                                className="p-0.5 sm:p-1 rounded bg-neutral-50 hover:bg-neutral-200 text-neutral-600 transition"
                              >
                                <ArrowLeft className="size-2.5 sm:size-3" />
                              </button>
                            )}
                            {colIndex < columns.length - 1 && (columns[colIndex + 1].category !== 'DONE' || isAdmin) && (
                              <button
                                title={`Advance to ${columns[colIndex + 1].label}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveStatus(taskId, columns[colIndex + 1].id);
                                }}
                                className="p-0.5 sm:p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition"
                              >
                                <ArrowRight className="size-2.5 sm:size-3" />
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

      {/* Issue Detail Modal (Open on Double Click) */}
      {selectedDetailTaskId && (
        <KlanserviceHubIssueDetailModal
          taskId={selectedDetailTaskId}
          open={!!selectedDetailTaskId}
          onClose={() => setSelectedDetailTaskId(null)}
          onUpdated={(updatedTask) => {
            const uId = updatedTask?.$id || updatedTask?.id;
            setTasks((prev) =>
              prev.map((t) => ((t.$id || t.id) === uId ? { ...t, ...updatedTask } : t))
            );
          }}
        />
      )}

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};
