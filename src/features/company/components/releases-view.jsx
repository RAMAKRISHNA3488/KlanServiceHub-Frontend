import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { releasesApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Tag,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';

export const ReleasesView = () => {
  const workspaceId = useWorkspaceId();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Delete Release Version',
    'Are you sure you want to delete this release version?',
    'destructive'
  );

  const [createModal, setCreateModal] = useState(false);
  const [releaseForm, setReleaseForm] = useState({ name: '', description: '', releaseDate: '' });

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const res = await releasesApi.getReleases(workspaceId);
      if (res?.data) setReleases(res.data);
    } catch (e) {
      toast.error('Failed to load releases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchReleases();
  }, [workspaceId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await releasesApi.createRelease(workspaceId, releaseForm);
      toast.success(`Release version ${releaseForm.name} created!`);
      setCreateModal(false);
      setReleaseForm({ name: '', description: '', releaseDate: '' });
      fetchReleases();
    } catch (err) {
      toast.error(err.message || 'Failed to create release');
    }
  };

  const handleMarkReleased = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'RELEASED' ? 'UNRELEASED' : 'RELEASED';
    try {
      await releasesApi.updateRelease(workspaceId, id, { status: nextStatus });
      toast.success(`Version marked as ${nextStatus}`);
      fetchReleases();
    } catch (err) {
      toast.error(err.message || 'Failed to update release');
    }
  };

  const handleDelete = async (id, versionName = 'this release version') => {
    const ok = await confirmAction({
      title: 'Delete Release Version',
      message: `Are you sure you want to delete release version "${versionName}"?`,
      variant: 'destructive',
      confirmText: 'Delete Version',
      warningNotice: 'Issues tagged with this fix version will retain their status but will be unlinked from this release milestone.'
    });
    if (!ok) return;

    try {
      await releasesApi.deleteRelease(workspaceId, id);
      toast.success('Version deleted.');
      fetchReleases();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
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
          <h2 className="text-lg font-bold text-neutral-900">Releases & Version Tracking</h2>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Track software release packages, deployment milestones, and delivery progress against versions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-blue-700"
          >
            <Plus className="size-4" />
            Create Version
          </button>
        </div>
      </div>

      {/* Releases Grid */}
      <div className="space-y-3">
        {releases.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400">
            <Tag className="size-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-sm font-semibold text-neutral-600">No software releases defined yet.</p>
            <p className="text-xs text-neutral-400 mt-1">Create your first milestone (e.g. v1.0.0-MVP) above.</p>
          </div>
        ) : (
          releases.map((rel) => (
            <div
              key={rel.id}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-4 hover:border-neutral-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                    <Tag className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-neutral-900">{rel.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          rel.status === 'RELEASED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {rel.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{rel.description || 'Target software milestone'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {rel.release_date && (
                    <div className="flex items-center gap-1 text-xs text-neutral-500">
                      <Calendar className="size-3.5" />
                      <span>{new Date(rel.release_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleMarkReleased(rel.id, rel.status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      rel.status === 'RELEASED'
                        ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                    }`}
                  >
                    {rel.status === 'RELEASED' ? 'Unrelease' : 'Release Version'}
                  </button>

                  <button
                    onClick={() => handleDelete(rel.id, rel.name)}
                    className="p-1 text-neutral-400 hover:text-red-600 rounded transition"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-neutral-500">
                  <span>{rel.completedIssues || 0} of {rel.totalIssues || 0} issues completed</span>
                  <span className="font-bold text-neutral-800">{rel.progressPercent || 0}%</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${rel.progressPercent || 0}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Version Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Create Release Version</h3>
              <button onClick={() => setCreateModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Version Name *</label>
                <input
                  type="text"
                  required
                  value={releaseForm.name}
                  onChange={(e) => setReleaseForm({ ...releaseForm, name: e.target.value })}
                  placeholder="e.g. 2.4.0-GA"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  value={releaseForm.description}
                  onChange={(e) => setReleaseForm({ ...releaseForm, description: e.target.value })}
                  rows={2}
                  placeholder="Milestone goals and release notes..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Target Release Date</label>
                <input
                  type="date"
                  value={releaseForm.releaseDate}
                  onChange={(e) => setReleaseForm({ ...releaseForm, releaseDate: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  Create Version
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
