import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { auditLogsApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  ScrollText,
  Search,
  Download,
  Filter,
  Shield,
  Clock,
  RefreshCw,
} from 'lucide-react';

export const AuditLogsView = () => {
  const workspaceId = useWorkspaceId();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (entityFilter) params.entityType = entityFilter;

      const res = await auditLogsApi.getLogs(workspaceId, params);
      if (res?.data) setLogs(res.data);
    } catch (e) {
      toast.error('Failed to load audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchLogs();
  }, [workspaceId, entityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleExportCsv = () => {
    window.open(auditLogsApi.exportCsvUrl(workspaceId), '_blank');
    toast.success('Downloading audit log CSV...');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Enterprise Audit Logs</h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Immutable organization activity trail documenting who performed what action, when, and from where.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm"
      >
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by actor, action, or keyword..."
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 pl-9 pr-3 py-1.5 text-xs focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-neutral-500 font-medium">Entity:</span>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 focus:outline-none"
          >
            <option value="">All Entities</option>
            <option value="COMPANY">Company</option>
            <option value="USER">User</option>
            <option value="ROLE">Role & RBAC</option>
            <option value="TEAM">Team</option>
            <option value="SPRINT">Sprint</option>
            <option value="SECURITY">Security</option>
            <option value="BILLING">Billing</option>
            <option value="INTEGRATION">Integration</option>
            <option value="AUTOMATION">Automation</option>
          </select>
        </div>
      </form>

      {/* Audit Logs Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600">
            <thead className="border-b border-neutral-200 bg-neutral-50/80 font-bold uppercase tracking-wider text-neutral-500 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Entity</th>
                <th className="px-4 py-3.5">IP Address</th>
                <th className="px-5 py-3.5">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-neutral-400">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50/70 transition">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-neutral-900 whitespace-nowrap">
                      {log.actor_name}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-700">
                        {log.entity_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-neutral-400">
                      {log.ip_address}
                    </td>
                    <td className="px-5 py-3.5 text-neutral-700 text-xs max-w-sm truncate">
                      {log.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
