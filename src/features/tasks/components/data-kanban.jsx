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

    const [tasks, setTasks] = useState(() => {
        const initialTasks = {};
        boardIds.forEach((b) => {
            initialTasks[b] = [];
        });
        (data || []).forEach((task) => {
            const taskStatus = String(task.status || '').toUpperCase().replace(/\s+/g, '_');
            const matchedBoard = boardIds.find((b) => b === taskStatus) || 
                                (taskStatus === 'TODO' || taskStatus === 'BACKLOG' ? boardIds[0] : boardIds[0]);
            if (matchedBoard && initialTasks[matchedBoard]) {
                initialTasks[matchedBoard].push(task);
            }
        });
        Object.keys(initialTasks).forEach((status) => {
            initialTasks[status].sort((a, b) => (a.position || 0) - (b.position || 0));
        });
        return initialTasks;
    });

    useEffect(() => {
        const newTasks = {};
        boardIds.forEach((b) => {
            newTasks[b] = [];
        });
        (data || []).forEach((task) => {
            const taskStatus = String(task.status || '').toUpperCase().replace(/\s+/g, '_');
            let matchedBoard = boardIds.find((b) => b === taskStatus);
            if (!matchedBoard) {
                if (taskStatus === 'TODO' && boardIds.includes('TODO')) matchedBoard = 'TODO';
                else if (taskStatus === 'IN_PROGRESS' && boardIds.includes('IN_PROGRESS')) matchedBoard = 'IN_PROGRESS';
                else if ((taskStatus === 'CODE_REVIEW' || taskStatus === 'IN_REVIEW') && (boardIds.includes('CODE_REVIEW') || boardIds.includes('IN_REVIEW'))) {
                    matchedBoard = boardIds.includes('CODE_REVIEW') ? 'CODE_REVIEW' : 'IN_REVIEW';
                } else if (taskStatus === 'DONE' && boardIds.includes('DONE')) matchedBoard = 'DONE';
                else matchedBoard = boardIds[0];
            }
            if (matchedBoard && newTasks[matchedBoard]) {
                newTasks[matchedBoard].push(task);
            }
        });
        Object.keys(newTasks).forEach((status) => {
            newTasks[status].sort((a, b) => (a.position || 0) - (b.position || 0));
        });
        setTasks(newTasks);
    }, [data, boardIds]);

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
