import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import './data-calendar.css';
import { EventCard } from './event-card';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const DataCalendar = ({ data = [] }) => {
  // Initialize with earliest task due date or today
  const initialDate = useMemo(() => {
    if (data.length > 0 && data[0]?.dueDate) {
      const d = new Date(data[0].dueDate);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  }, [data]);

  const [currentDate, setCurrentDate] = useState(initialDate);

  // Group tasks by their normalized date key (yyyy-MM-dd)
  const { tasksByDate, monthTasksCount } = useMemo(() => {
    const map = new Map();
    let countInMonth = 0;

    for (const task of data) {
      const due = task?.dueDate || task?.due_date;
      if (!due) continue;
      const parsed = new Date(due);
      if (isNaN(parsed.getTime())) continue;

      const key = format(parsed, 'yyyy-MM-dd');
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(task);

      if (isSameMonth(parsed, currentDate)) {
        countInMonth++;
      }
    }
    return { tasksByDate: map, monthTasksCount: countInMonth };
  }, [data, currentDate]);

  // Compute all days in the full calendar grid (including leading/trailing days)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 }); // Saturday

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const handlePrevMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));
  const handleToday = () => setCurrentDate(new Date());

  return (
    <div className="flex flex-col h-full w-full rounded-2xl border border-neutral-200 bg-white shadow-xs">
      {/* Top Calendar Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-neutral-100 bg-neutral-50/50 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            title="Previous Month"
            onClick={handlePrevMonth}
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-neutral-200 bg-white hover:bg-neutral-100"
          >
            <ChevronLeft className="size-4 text-neutral-600" />
          </Button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white shadow-xs">
            <CalendarIcon className="size-4 text-blue-600" />
            <span className="text-sm font-bold text-neutral-800">
              {format(currentDate, 'MMMM yyyy')}
            </span>
          </div>

          <Button
            type="button"
            title="Next Month"
            onClick={handleNextMonth}
            variant="outline"
            size="icon"
            className="size-8 rounded-lg border-neutral-200 bg-white hover:bg-neutral-100"
          >
            <ChevronRight className="size-4 text-neutral-600" />
          </Button>

          <Button
            type="button"
            onClick={handleToday}
            variant="ghost"
            size="sm"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 h-8 rounded-lg"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200/60">
            <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
            {monthTasksCount} {monthTasksCount === 1 ? 'task' : 'tasks'} this month
          </span>
        </div>
      </div>

      {/* Scrollable Calendar Body with horizontal and vertical overflow support */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto custom-scrollbar">
        <div className="min-w-[760px] flex flex-col h-full">
          {/* Weekdays Header Row - Sticky at top of calendar scroll */}
          <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 text-center sticky top-0 z-10 shadow-2xs">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="py-2.5 text-[11px] font-bold uppercase tracking-wider text-neutral-500 border-r last:border-r-0 border-neutral-200"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 auto-rows-fr bg-neutral-200 gap-[1px] flex-1">
            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayTasks = tasksByDate.get(dateKey) || [];
              const inCurrentMonth = isSameMonth(day, currentDate);
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={dateKey}
                  className={`flex flex-col min-h-[140px] sm:min-h-[155px] p-1.5 transition-colors ${
                    inCurrentMonth ? 'bg-white hover:bg-neutral-50/60' : 'bg-neutral-50/80 text-neutral-400'
                  }`}
                >
                  {/* Day Cell Header */}
                  <div className="flex items-center justify-between mb-1 px-1 shrink-0">
                    <span
                      className={`text-xs font-bold transition-all ${
                        isCurrentDay
                          ? 'flex size-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-xs'
                          : inCurrentMonth
                          ? 'text-neutral-700'
                          : 'text-neutral-400 font-normal'
                      }`}
                    >
                      {format(day, 'dd')}
                    </span>

                    {dayTasks.length > 0 && (
                      <span className="text-[10px] font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded-full border border-neutral-200/60">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Day Tasks Container: Scrollable for each day independently */}
                  <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 custom-calendar-scrollbar max-h-[115px]">
                    {dayTasks.map((task) => (
                      <EventCard
                        key={task.$id || task.id}
                        id={task.$id || task.id}
                        title={task.name}
                        assignee={task.assignee}
                        assignees={task.assignees || (task.assignee ? [task.assignee] : [])}
                        project={task.project}
                        status={task.status}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
