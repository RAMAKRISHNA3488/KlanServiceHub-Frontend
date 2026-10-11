import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { TaskStatus } from '@/features/tasks/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { workflowsAdminApi } from '@/lib/api-client';
import { KanbanCard } from './kanban-card';
import { KanbanColumnHeader } from './kanban-column-header';

const DEFAULT_BOARDS = [
  { id: TaskStatus.BACKLOG, label: 'Backlog', color: '#94A3B8', category: 'TODO' },
  { id: TaskStatus.TODO, label: 'To Do', color: '#3B82F6', category: 'TODO' },
  { id: TaskStatus.IN_PROGRESS, label: 'In Progress', color: '#F59E0B', category: 'IN_PROGRESS' },
  { id: TaskStatus.IN_REVIEW, label: 'In Review', color: '#8B5CF6', category: 'IN_PROGRESS' },
  { id: TaskStatus.DONE, label: 'Done', color: '#10B981', category: 'DONE' },
];

export const DataKanban = ({ data, onChange, isAdmin }) => {
    const workspaceId = useWorkspaceId();
    const [workflows, setWorkflows] = useState([]);

    useEffect(() => {
        if (workspaceId) {
            workflowsAdminApi.getWorkflows(workspaceId)
                .then((res) => {
                    if (res?.data) setWorkflows(res.data);
                })
                .catch(() => {});
        }
    }, [workspaceId]);

    const defaultWorkflow = workflows[0];
    const workflowStatuses = defaultWorkflow?.statuses?.length > 0 ? defaultWorkflow.statuses : null;

    const columns = useMemo(() => {
        if (workflowStatuses && workflowStatuses.length > 0) {
            return workflowStatuses.map((st) => ({
                id: st.name,
                label: st.name.replace(/_/g, ' '),
                color: st.color || '#3B82F6',
                category: st.category || 'IN_PROGRESS',
            }));
        }
        return DEFAULT_BOARDS;
    }, [workflowStatuses]);

    const boardIds = useMemo(() => columns.map((c) => c.id), [columns]);

    const resolveKanbanColumnId = useCallback((task, bIds) => {
        if (!task || !bIds || bIds.length === 0) return null;
        const rawStatus = task.status;
        if (!rawStatus) return bIds[0];

        // Direct match
        if (bIds.includes(rawStatus)) return rawStatus;

        const clean = String(rawStatus).toUpperCase().trim().replace(/[\s-]+/g, '_');
        const exactNorm = bIds.find((b) => String(b).toUpperCase().trim().replace(/[\s-]+/g, '_') === clean);
        if (exactNorm) return exactNorm;

        const findBoard = (...aliases) =>
            bIds.find((b) => {
                const norm = String(b).toUpperCase().trim().replace(/[\s-]+/g, '_');
                return aliases.includes(norm);
            });

        if (clean === 'BACKLOG' || clean === 'BACK_LOG') {
            const b = findBoard('BACKLOG', 'BACK_LOG');
            if (b) return b;
        } else if (clean === 'TODO' || clean === 'TO_DO' || clean === 'OPEN') {
            const b = findBoard('TODO', 'TO_DO');
            if (b) return b;
        } else if (clean === 'IN_PROGRESS' || clean === 'INPROGRESS') {
            const b = findBoard('IN_PROGRESS', 'INPROGRESS');
            if (b) return b;
        } else if (clean === 'CODE_REVIEW' || clean === 'IN_REVIEW' || clean === 'REVIEW') {
            const b = findBoard('CODE_REVIEW', 'IN_REVIEW', 'REVIEW');
            if (b) return b;
        } else if (clean === 'TESTING' || clean === 'TEST' || clean === 'QA') {
            const b = findBoard('TESTING', 'TEST', 'QA');
            if (b) return b;
        } else if (clean === 'DONE' || clean === 'RESOLVED' || clean === 'CLOSED') {
            const b = findBoard('DONE', 'RESOLVED', 'CLOSED');
            if (b) return b;
        }

        return bIds[0];
    }, []);

    const buildTasksMap = useCallback((items, bIds) => {
        const result = {};
        bIds.forEach((b) => {
            result[b] = [];
        });

        // Deduplicate incoming tasks by ID and issue key
        const seen = new Set();
        const uniqueItems = (items || []).filter((task) => {
            const id1 = task?.$id;
            const id2 = task?.id;
            const key = task?.key;
            if (id1 && seen.has(id1)) return false;
            if (id2 && seen.has(id2)) return false;
            if (key && seen.has(`key_${key}`)) return false;
            if (id1) seen.add(id1);
            if (id2) seen.add(id2);
            if (key) seen.add(`key_${key}`);
            return true;
        });

        uniqueItems.forEach((task) => {
            const targetBoard = resolveKanbanColumnId(task, bIds);
            if (targetBoard && result[targetBoard]) {
                result[targetBoard].push(task);
            } else if (bIds.length > 0) {
                result[bIds[0]].push(task);
            }
        });

        Object.keys(result).forEach((status) => {
            result[status].sort((a, b) => (a.position || 0) - (b.position || 0));
        });
        return result;
    }, [resolveKanbanColumnId]);

    const [tasks, setTasks] = useState(() => buildTasksMap(data, boardIds));

    useEffect(() => {
        setTasks(buildTasksMap(data, boardIds));
    }, [data, boardIds, buildTasksMap]);

    const onDragEnd = useCallback((result) => {
        if (!result.destination)
            return;
        const { source, destination } = result;
        const sourceStatus = source.droppableId;
        const destStatus = destination.droppableId;

        // If dropped in the same position in the same column, do nothing
        if (sourceStatus === destStatus && source.index === destination.index) {
            return;
        }

        const targetColumn = columns.find((c) => c.id === destStatus);
        const isDone = targetColumn?.category === 'DONE' || destStatus === TaskStatus.DONE || destStatus === 'DONE';

        // Restriction: Only Admins can move tasks to DONE
        if (isDone && sourceStatus !== destStatus && !isAdmin) {
            toast.error('Permission denied: Only administrators can move issues to Done.');
            return;
        }

        // Clone current columns map synchronously
        const newTasks = {};
        boardIds.forEach((b) => {
            newTasks[b] = [...(tasks[b] || [])];
        });

        // Locate moved task
        const draggedId = result.draggableId;
        let movedTask = newTasks[sourceStatus]?.[source.index];
        let cleanId = draggedId || movedTask?.$id || movedTask?.id;

        // Fallback search across all columns if index mismatch
        if (!movedTask || (cleanId && (movedTask.$id || movedTask.id) !== cleanId)) {
            for (const b of boardIds) {
                const found = (newTasks[b] || []).find((t) => {
                    const id = t?.$id || t?.id;
                    return id === cleanId || String(id) === String(cleanId);
                });
                if (found) {
                    movedTask = found;
                    break;
                }
            }
        }
        if (!cleanId && movedTask) {
            cleanId = movedTask.$id || movedTask.id;
        }

        if (!movedTask || !cleanId) {
            console.error('No task found at the source index.');
            return;
        }

        const taskKey = movedTask.key;

        // ENFORCE: One ticket must be in ONE state only!
        // Strictly scrub this ticket from ALL columns on the board by ID and issue key
        boardIds.forEach((b) => {
            newTasks[b] = (newTasks[b] || []).filter((t) => {
                const tId = t?.$id || t?.id;
                if (tId === cleanId || String(tId) === String(cleanId)) return false;
                if (taskKey && t?.key === taskKey) return false;
                return true;
            });
        });

        // Update task status to target column
        const updatedMovedTask = { ...movedTask, status: destStatus };

        // Insert strictly into the destination column at destination index
        const destColumn = [...(newTasks[destStatus] || [])];
        destColumn.splice(destination.index, 0, updatedMovedTask);
        newTasks[destStatus] = destColumn;

        // Prepare minimal update payloads synchronously
        const updatesPayload = [];
        const movedNewPosition = Math.min((destination.index + 1) * 1000, 1_00_000);
        updatesPayload.push({
            $id: cleanId,
            status: destStatus,
            position: movedNewPosition,
        });

        // Update affected tasks positions in destination column
        newTasks[destStatus].forEach((task, index) => {
            const tId = task?.$id || task?.id;
            if (task && tId !== cleanId && String(tId) !== String(cleanId) && (!taskKey || task.key !== taskKey)) {
                const newPosition = Math.min((index + 1) * 1000, 1_00_000);
                if (task.position !== newPosition) {
                    updatesPayload.push({
                        $id: tId,
                        status: destStatus,
                        position: newPosition,
                    });
                }
            }
        });

        // If task moved between columns, update positions in source column
        if (sourceStatus !== destStatus && newTasks[sourceStatus]) {
            newTasks[sourceStatus].forEach((task, index) => {
                const tId = task?.$id || task?.id;
                if (task && tId !== cleanId && String(tId) !== String(cleanId) && (!taskKey || task.key !== taskKey)) {
                    const newPosition = Math.min((index + 1) * 1000, 1_00_000);
                    if (task.position !== newPosition) {
                        updatesPayload.push({
                            $id: tId,
                            status: sourceStatus,
                            position: newPosition,
                        });
                    }
                }
            });
        }

        // Synchronously update local UI state
        setTasks(newTasks);

        // Deduplicate updatesPayload by task ID to guarantee single update per task
        const uniquePayloadMap = new Map();
        updatesPayload.forEach((u) => {
            if (u?.$id) uniquePayloadMap.set(u.$id, u);
        });
        const finalPayload = Array.from(uniquePayloadMap.values());

        if (finalPayload.length > 0) {
            onChange(finalPayload);
        }
    }, [tasks, onChange, columns, isAdmin, boardIds]);

    return (
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="custom-scrollbar flex overflow-x-auto pb-4 gap-3">
          {columns.map((col) => (
            <div
              key={col.id}
              className="min-w-[240px] flex-1 rounded-xl bg-neutral-100/90 border border-neutral-200/80 p-2 shadow-2xs"
            >
              <KanbanColumnHeader
                board={col.id}
                label={col.label}
                color={col.color}
                category={col.category}
                taskCount={tasks[col.id]?.length || 0}
              />

              <Droppable droppableId={col.id}>
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[350px] py-1.5 space-y-2"
                  >
                    {(tasks[col.id] || []).map((task, index) => {
                      const taskId = String(task?.$id || task?.id || `task-${col.id}-${index}`);
                      return (
                        <Draggable key={taskId} draggableId={taskId} index={index}>
                          {(provided) => (
                            <div
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                            >
                              <KanbanCard task={task} />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    );
};
