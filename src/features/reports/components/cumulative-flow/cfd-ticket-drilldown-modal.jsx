import React, { useState, useEffect } from 'react';
import {
  X,
  Layers,
  Clock,
  Calendar,
  Search,
  Download,
  ExternalLink,
  ChevronRight,
  User,
  RefreshCw,
  Info,
} from 'lucide-react';
import { reportsApi } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';

export const CfdTicketDrilldownModal = ({
  isOpen,
  onClose,
  workspaceId,
  drillParams = {},
  onOpenTask = null,
}) => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ count: 0, date: '', status: '' });

  useEffect(() => {
    if (isOpen && workspaceId) {
      fetchDrilldown();
    }
  }, [isOpen, workspaceId, JSON.stringify(drillParams)]);

  const fetchDrilldown = async () => {
    try {
      setLoading(true);
      const getTicketsFn = reportsApi.getCFDTickets || reportsApi.getCumulativeFlowTickets;
      const res = getTicketsFn ? await getTicketsFn(workspaceId, drillParams) : null;
      if (res?.data) {
        setTickets(res.data.tickets || []);
        setMeta({
          count: res.data.count || res.data.tickets?.length || 0,
          date: res.data.date || drillParams.date || new Date().toISOString().slice(0, 10),
          status: res.data.status || drillParams.status || 'IN_PROGRESS',
        });
      }
    } catch (e) {
      console.error('Failed to load CFD tickets drill-down', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredTickets = tickets.filter((t) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      t.name?.toLowerCase().includes(s) ||
      t.key?.toLowerCase().includes(s) ||
      t.assigneeName?.toLowerCase().includes(s) ||
      t.projectName?.toLowerCase().includes(s)
    );
  });

  const exportToCSV = () => {
    if (!filteredTickets || filteredTickets.length === 0) return;

    const headers = ['Key', 'Title', 'Status', 'Current Status', 'Priority', 'Project', 'Assignee', 'Days In Stage', 'Status Entry Date', 'Created At'];
    const rows = filteredTickets.map((t) => [
      `"${t.key || ''}"`,
      `"${(t.name || '').replace(/"/g, '""')}"`,
      `"${t.status || ''}"`,
      `"${t.currentStatus || ''}"`,
      `"${t.priority || ''}"`,
      `"${t.projectName || ''}"`,
      `"${t.assigneeName || ''}"`,
      t.daysInStage ?? '',
      `"${t.statusEntryDate || ''}"`,
      `"${t.createdAt || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cfd-drilldown-${meta.status}-${meta.date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-neutral-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col border-l border-neutral-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-blue-600" />
              <h2 className="text-base font-bold text-neutral-900">
                Historical CFD Drill-Down
              </h2>
              <span className="rounded-full bg-blue-100 text-blue-800 px-2 py-0.2 text-[10px] font-bold">
                {meta.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Calendar className="size-3 text-neutral-400" />
                Snapshot Date: <strong className="text-neutral-800 font-mono">{meta.date}</strong>
              </span>
              <span>•</span>
              <span>
                Total Tickets: <strong className="text-neutral-800">{meta.count}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Historical Context Explainer */}
        <div className="bg-amber-50/70 border-b border-amber-200 px-5 py-2.5 flex items-center gap-2 text-xs text-amber-900">
          <Info className="size-4 text-amber-600 shrink-0" />
          <span>
            This list reconstructs tickets that were in <strong>{meta.status}</strong> on <strong>{meta.date}</strong> from audit logs, even if they have since moved forward or resolved.
          </span>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between gap-3 bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by ticket key, title, assignee, project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-neutral-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          <button
            onClick={exportToCSV}
            disabled={filteredTickets.length === 0}
            className="inline-flex items-center gap-1 rounded border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 transition shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <Download className="size-2.5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Tickets List View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-neutral-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-2 text-neutral-400">
              <RefreshCw className="size-5 animate-spin text-blue-600" />
              <span className="text-[11px]">Reconstructing historical tickets from audit history...</span>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-neutral-400 text-[11px]">
              <Layers className="size-8 text-neutral-300 mb-2" />
              <span>No tickets were in this status on {meta.date}.</span>
            </div>
          ) : (
            filteredTickets.map((t) => (
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
                className="pt-2.5 first:pt-0 p-3 hover:bg-neutral-50 rounded-xl transition cursor-pointer group flex items-start justify-between gap-3"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                      {t.key}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        t.priority === 'CRITICAL' || t.priority === 'HIGH'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-semibold truncate">
                      {t.projectName}
                    </span>
                  </div>

                  <h4 className="text-[11px] font-semibold text-neutral-900 group-hover:text-blue-600 transition truncate">
                    {t.name}
                  </h4>

                  <div className="flex flex-wrap items-center gap-3 text-[10px] text-neutral-400 pt-0.5">
                    <div className="flex items-center gap-1 text-neutral-600">
                      <User className="size-3 text-neutral-400" />
                      <span>{t.assigneeName || 'Unassigned'}</span>
                    </div>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-neutral-700">
                      <Clock className="size-3 text-amber-500" />
                      {t.daysInStage} days in status
                    </span>
                    <span>•</span>
                    <span>Entered: {t.statusEntryDate?.slice(0, 10)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-neutral-400 group-hover:text-blue-600 transition shrink-0 pt-2">
                  <ExternalLink className="size-3" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-200 bg-neutral-50/70 flex items-center justify-between text-[11px] text-neutral-500">
          <span>Showing {filteredTickets.length} of {meta.count} tickets</span>
          <button
            onClick={onClose}
            className="rounded border border-neutral-300 bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
