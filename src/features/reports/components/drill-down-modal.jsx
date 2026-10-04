import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  Filter,
  RefreshCw,
  Search,
  Briefcase,
  Users,
  UserCheck,
  Flame,
  Bug,
  AlertTriangle,
} from 'lucide-react';
import { reportsApi } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';

export const DrillDownModal = ({
  isOpen,
  onClose,
  workspaceId,
  drillParams = {},
  onOpenTask,
}) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [entityType, setEntityType] = useState('tasks');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchDrilldown();
    }
  }, [isOpen, workspaceId, JSON.stringify(drillParams)]);

  const fetchDrilldown = async () => {
    try {
      setLoading(true);
      const res = await reportsApi.getDrilldown(workspaceId, drillParams);
      if (res?.data) {
        const entType = res.data.entityType || drillParams.entityType || 'tasks';
        setEntityType(entType);
        setItems(res.data.items || res.data.tasks || []);
        setTotal(res.data.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.name?.toLowerCase().includes(s) ||
      item.key?.toLowerCase().includes(s) ||
      item.email?.toLowerCase().includes(s) ||
      item.assignee_name?.toLowerCase().includes(s) ||
      item.lead_name?.toLowerCase().includes(s) ||
      item.job_title?.toLowerCase().includes(s) ||
      item.department?.toLowerCase().includes(s)
    );
  });

  const getEntityIcon = () => {
    switch (entityType) {
      case 'projects':
      case 'active_projects':
        return <Briefcase className="size-4 text-indigo-600" />;
      case 'teams':
        return <Users className="size-4 text-purple-600" />;
      case 'members':
        return <UserCheck className="size-4 text-cyan-600" />;
      default:
        return <Layers className="size-4 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-neutral-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col border-l border-neutral-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              {getEntityIcon()}
              <h2 className="text-base font-bold text-neutral-900">
                {drillParams.title || 'Data Drill-Down'}
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Showing {filteredItems.length} of {total} records from database.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-neutral-100 flex items-center gap-2 bg-white">
          <Search className="size-4 text-neutral-400 ml-1" />
          <input
            type="text"
            placeholder={`Search ${entityType.replace(/_/g, ' ')}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs text-neutral-800 placeholder-neutral-400 focus:outline-hidden"
          />
        </div>

        {/* Body List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-neutral-100 p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-400 gap-2">
              <RefreshCw className="size-6 animate-spin text-blue-600" />
              <span className="text-xs">Loading database records...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-400 text-xs">
              <span>No records found matching this drill-down query.</span>
            </div>
          ) : (
            filteredItems.map((item) => {
              // 1. Projects & Active Projects Row Rendering
              if (entityType === 'projects' || entityType === 'active_projects') {
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onClose();
                      navigate(`/workspaces/${workspaceId}/projects/${item.id}`);
                    }}
                    className="p-3.5 hover:bg-neutral-50 rounded-xl transition cursor-pointer group flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200">
                        {item.key?.slice(0, 3) || 'PRJ'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition truncate">
                            {item.name}
                          </h4>
                          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-1.5 py-0.2 rounded">
                            {item.key}
                          </span>
                          {entityType === 'active_projects' && (
                            <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.2 text-[9px] font-bold flex items-center gap-1">
                              <Flame className="size-2.5" />
                              {item.active_tasks_count} in delivery
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-1">
                          <span>Lead: <strong className="text-neutral-600">{item.lead_name || 'Unassigned'}</strong></span>
                          <span>•</span>
                          <span>Category: <strong className="text-neutral-600">{item.category || 'Software'}</strong></span>
                          <span>•</span>
                          <span>Total Work: <strong className="text-neutral-700">{item.total_tasks || 0} items</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-neutral-900 block">{item.completionRate || 0}%</span>
                        <span className="text-[9px] text-neutral-400">Complete</span>
                      </div>
                      <ChevronRight className="size-4 text-neutral-300 group-hover:text-blue-600 transition" />
                    </div>
                  </div>
                );
              }

              // 2. Teams Row Rendering
              if (entityType === 'teams') {
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onClose();
                      navigate(`/workspaces/${workspaceId}/teams-admin`);
                    }}
                    className="p-3.5 hover:bg-neutral-50 rounded-xl transition cursor-pointer group flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs shrink-0 border border-purple-200">
                        {item.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition truncate">
                            {item.name}
                          </h4>
                          <span className="rounded-full bg-neutral-100 text-neutral-600 px-2 py-0.2 text-[9px] font-bold">
                            {item.member_count || 0} members
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-1">
                          <span>Lead: <strong className="text-neutral-600">{item.lead_name || 'Unassigned'}</strong></span>
                          <span>•</span>
                          <span>Total Tasks: <strong className="text-neutral-700">{item.total_tasks || 0}</strong></span>
                          <span>•</span>
                          <span>Completed: <strong className="text-emerald-600">{item.completed_tasks || 0}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-neutral-900 block">{item.completionRate || 0}%</span>
                        <span className="text-[9px] text-neutral-400">Throughput</span>
                      </div>
                      <ChevronRight className="size-4 text-neutral-300 group-hover:text-blue-600 transition" />
                    </div>
                  </div>
                );
              }

              // 3. Members Row Rendering
              if (entityType === 'members') {
                return (
                  <div
                    key={item.member_id || item.user_id}
                    onClick={() => {
                      onClose();
                      navigate(`/workspaces/${workspaceId}/users-admin`);
                    }}
                    className="p-3.5 hover:bg-neutral-50 rounded-xl transition cursor-pointer group flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="size-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold text-xs shrink-0 border border-cyan-200">
                        {item.avatar_url ? (
                          <img src={item.avatar_url} alt="" className="size-full rounded-full object-cover" />
                        ) : (
                          (item.name || 'U').slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition truncate">
                            {item.name}
                          </h4>
                          <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-[9px] font-bold text-neutral-600">
                            {item.role || 'MEMBER'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-neutral-400 mt-1">
                          <span className="truncate">{item.email}</span>
                          <span>•</span>
                          <span>Title: <strong className="text-neutral-600">{item.job_title || 'Collaborator'}</strong></span>
                          <span>•</span>
                          <span>Assigned: <strong className="text-neutral-700">{item.total_assigned || 0} tasks</strong></span>
                          {item.overdue_assigned > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-rose-600 font-bold">{item.overdue_assigned} overdue</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600 block">{item.completionRate || 0}%</span>
                        <span className="text-[9px] text-neutral-400">Done Rate</span>
                      </div>
                      <ChevronRight className="size-4 text-neutral-300 group-hover:text-blue-600 transition" />
                    </div>
                  </div>
                );
              }

              // 4. Default Tasks / Work Items Row Rendering
              const t = item;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (onOpenTask) {
                      onOpenTask(t.id);
                    } else {
                      onClose();
                      navigate(`/workspaces/${workspaceId}/tasks/${t.id}`);
                    }
                  }}
                  className="p-3.5 hover:bg-neutral-50 rounded-xl transition cursor-pointer group flex items-start justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-neutral-400 bg-neutral-100 px-1.5 py-0.5 rounded">
                        {t.key || 'TASK'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          t.status === 'DONE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'IN_PROGRESS'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {t.status}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-400">
                        {t.issue_type || 'Task'}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition truncate">
                      {t.name}
                    </h4>

                    <div className="flex items-center gap-3 text-[10px] text-neutral-400 pt-0.5">
                      <span>Project: <strong className="text-neutral-600">{t.project_name || 'General'}</strong></span>
                      <span>•</span>
                      <span>Assignee: <strong className="text-neutral-600">{t.assignee_name || 'Unassigned'}</strong></span>
                      {t.due_date && (
                        <>
                          <span>•</span>
                          <span>Due: {t.due_date.slice(0, 10)}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-neutral-400 group-hover:text-blue-600 transition shrink-0 pt-2">
                    <ExternalLink className="size-3.5" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-neutral-200 bg-neutral-50/70 flex items-center justify-between text-xs text-neutral-500">
          <span>Click any record to view details</span>
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 font-medium text-neutral-700 hover:bg-neutral-50 shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
