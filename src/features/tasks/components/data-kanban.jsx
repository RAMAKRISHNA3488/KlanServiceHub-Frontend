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

        // Deduplicate incoming tasks by ID
        const seen = new Set();
        const uniqueItems = (items || []).filter((task) => {
            const id = task?.$id || task?.id;
            if (!id) return true;
            if (seen.has(id)) return false;
            seen.add(id);
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

        const targetColumn = columns.find((c) => c.id === destStatus);
        const isDone = targetColumn?.category === 'DONE' || destStatus === TaskStatus.DONE || destStatus === 'DONE';

        // Restriction: Only Admins can move tasks to DONE
        if (isDone && sourceStatus !== destStatus && !isAdmin) {
            toast.error('Permission denied: Only administrators can move issues to Done.');
            return;
        }

        let updatesPayload = [];
        setTasks((prevTasks) => {
            const newTasks = { ...prevTasks };
            // Safely remove the task from the source column
            const sourceColumn = [...(newTasks[sourceStatus] || [])];
            const [movedTask] = sourceColumn.splice(source.index, 1);
            // If there is no moved task, return the previous state
            if (!movedTask) {
                console.error('No task found at the source index.');
                return prevTasks;
            }
            // Create a new task object with updated status
            const updatedMovedTask = sourceStatus !== destStatus ? { ...movedTask, status: destStatus } : movedTask;
            // Update the source column
            newTasks[sourceStatus] = sourceColumn;
            // Add the task to the destination column
            const destColumn = [...(newTasks[destStatus] || [])];
            destColumn.splice(destination.index, 0, updatedMovedTask);
            newTasks[destStatus] = destColumn;
            // Prepare minimal update payloads
            updatesPayload = [];
            updatesPayload.push({
                $id: updatedMovedTask.$id,
                status: destStatus,
                position: Math.min((destination.index + 1) * 1000, 1_00_000),
            });
            // Update affected tasks positions in the destination column
            newTasks[destStatus].forEach((task, index) => {
                if (task && task.$id !== updatedMovedTask.$id) {
                    const newPosition = Math.min((index + 1) * 1000, 1_00_000);
                    if (task.position !== newPosition) {
                        updatesPayload.push({
                            $id: task.$id,
                            status: destStatus,
                            position: newPosition,
                        });
                    }
                }
            });
            // If the task moved between columns, update positions in the source column
            if (sourceStatus !== destStatus) {
                newTasks[sourceStatus].forEach((task, index) => {
                    const newPosition = Math.min((index + 1) * 1000, 1_00_000);
                    if (task.position !== newPosition) {
                        updatesPayload.push({
                            $id: task.$id,
                            status: sourceStatus,
                            position: newPosition,
                        });
                    }
                });
            }
            return newTasks;
        });
        onChange(updatesPayload);
    }, [onChange, columns, isAdmin]);

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
                    {(tasks[col.id] || []).map((task, index) => (
                      <Draggable key={task.$id} draggableId={task.$id} index={index}>
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
                    ))}

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
