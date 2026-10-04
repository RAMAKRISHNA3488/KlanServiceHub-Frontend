import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { dataManagementApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Database,
  Download,
  Upload,
  HardDrive,
  RotateCcw,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';

export const DataManagementView = () => {
  const workspaceId = useWorkspaceId();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Restore Snapshot',
    'Are you sure you want to restore from this snapshot?',
    'warning'
  );

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await dataManagementApi.getBackups(workspaceId);
      if (res?.data) setBackups(res.data);
    } catch (e) {
      toast.error('Failed to load backups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchBackups();
  }, [workspaceId]);

  const handleExportData = async () => {
    try {
      setExporting(true);
      const res = await dataManagementApi.exportData(workspaceId);
      if (res?.data) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `workspace-backup-${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success('Workspace data exported successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      await dataManagementApi.createBackup(workspaceId);
      toast.success('Snapshot backup created successfully!');
      fetchBackups();
    } catch (err) {
      toast.error(err.message || 'Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestore = async (backupId, backupName = 'this snapshot') => {
    const ok = await confirmAction({
      title: 'Restore Database Snapshot',
      message: `Are you sure you want to restore from snapshot "${backupName}"?`,
      variant: 'warning',
      confirmText: 'Restore Snapshot',
      warningNotice: 'All current workspace records created after this backup point will be overwritten and reverted.'
    });
    if (!ok) return;

    try {
      await dataManagementApi.restoreBackup(workspaceId, backupId);
      toast.success('Backup snapshot restored successfully.');
      fetchBackups();
    } catch (err) {
      toast.error(err.message || 'Failed to restore backup');
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="size-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">Data Management & Disaster Recovery</h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Export full organization JSON archives, manage automated database backups, and restore snapshots.
          </p>
        </div>

        <button
          onClick={handleCreateBackup}
          disabled={creatingBackup}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="size-3.5" />
          {creatingBackup ? 'Creating Snapshot...' : 'Create Snapshot'}
        </button>
      </div>

      {/* Export Card */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
            <Download className="size-4 text-blue-600" />
            Full Company Data Export
          </h3>
          <p className="text-[11px] text-neutral-500 mt-1 max-w-xl">
            Export a complete JSON bundle containing company settings, user directory, custom roles, workflows, agile sprints, issues, and comments.
          </p>
        </div>

        <button
          onClick={handleExportData}
          disabled={exporting}
          className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-neutral-800 transition disabled:opacity-50 shrink-0"
        >
          <Download className="size-4" />
          {exporting ? 'Generating Export...' : 'Download JSON Export'}
        </button>
      </div>

      {/* Snapshots Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="size-4 text-purple-600" />
            <h3 className="text-sm font-bold text-neutral-900">Snapshot Backups ({backups.length})</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600">
            <thead className="border-b border-neutral-200 bg-neutral-50/70 font-bold uppercase tracking-wider text-neutral-500 text-[10px]">
              <tr>
                <th className="px-4 py-3">Snapshot File</th>
                <th className="px-4 py-3">Created At</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-400">
                    No snapshot backups created yet. Click "Create Snapshot" above.
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50/70 transition">
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900">{b.file_name}</td>
                    <td className="px-4 py-3">{new Date(b.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-neutral-500">{((b.size_bytes || 2500000) / 1024 / 1024).toFixed(2)} MB</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRestore(b.id, b.file_name)}
                        className="flex items-center gap-1 ml-auto rounded px-2.5 py-1 text-xs font-semibold text-purple-600 hover:bg-purple-50 transition"
                      >
                        <RotateCcw className="size-3" />
                        Restore
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};
