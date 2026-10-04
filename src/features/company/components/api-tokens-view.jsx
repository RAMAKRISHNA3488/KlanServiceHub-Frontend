import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { apiTokensApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  RefreshCw,
  X,
  ShieldAlert,
} from 'lucide-react';

export const ApiTokensView = () => {
  const workspaceId = useWorkspaceId();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Revoke API Token',
    'Are you sure you want to revoke this API token?',
    'destructive'
  );

  const [createModal, setCreateModal] = useState(false);
  const [revealModal, setRevealModal] = useState(false);
  const [createdSecret, setCreatedSecret] = useState(null);
  const [copied, setCopied] = useState(false);

  const [tokenForm, setTokenForm] = useState({
    name: '',
    scopes: ['*'],
    expiresDays: 90,
  });

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const res = await apiTokensApi.getTokens(workspaceId);
      if (res?.data) setTokens(res.data);
    } catch (e) {
      toast.error('Failed to load API tokens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchTokens();
  }, [workspaceId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await apiTokensApi.createToken(workspaceId, tokenForm);
      if (res?.data) {
        setCreatedSecret(res.data);
        setCreateModal(false);
        setRevealModal(true);
        setTokenForm({ name: '', scopes: ['*'], expiresDays: 90 });
        fetchTokens();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create token');
    }
  };

  const handleRevoke = async (id, name) => {
    const ok = await confirmAction({
      title: 'Revoke API Token',
      message: `Are you sure you want to revoke the API token "${name}"?`,
      variant: 'destructive',
      confirmText: 'Revoke Token',
      warningNotice: 'Any active integrations or CI/CD pipelines using this key will immediately fail authentication.'
    });
    if (!ok) return;
    try {
      await apiTokensApi.revokeToken(workspaceId, id);
      toast.success(`Token "${name}" revoked.`);
      fetchTokens();
    } catch (err) {
      toast.error(err.message || 'Failed to revoke token');
    }
  };

  const handleCopySecret = () => {
    if (!createdSecret?.cleartextToken) return;
    navigator.clipboard.writeText(createdSecret.cleartextToken);
    setCopied(true);
    toast.success('API token copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
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
          <h1 className="text-lg font-bold text-neutral-900">API & Access Tokens</h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Manage personal and service account API keys for CI/CD automation and external REST integrations.
          </p>
        </div>

        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
        >
          <Plus className="size-3.5" />
          Generate API Token
        </button>
      </div>

      {/* Warning Notice */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="size-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block">Secure Token Storage</span>
          Tokens are hashed with SHA-256 upon generation. Secret keys are displayed only once and cannot be retrieved later.
        </div>
      </div>

      {/* Tokens Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600">
            <thead className="border-b border-neutral-200 bg-neutral-50/80 font-bold uppercase tracking-wider text-neutral-500 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Token Name</th>
                <th className="px-4 py-3.5">Key Prefix</th>
                <th className="px-4 py-3.5">Scopes</th>
                <th className="px-4 py-3.5">Created By</th>
                <th className="px-4 py-3.5">Expires</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {tokens.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-neutral-400">
                    No active API tokens found.
                  </td>
                </tr>
              ) : (
                tokens.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50/70 transition">
                    <td className="px-5 py-3.5 font-bold text-neutral-900">{t.name}</td>
                    <td className="px-4 py-3.5 font-mono text-neutral-500">{t.token_prefix}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {(t.scopes || ['*']).map((s) => (
                          <span key={s} className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-neutral-700">{t.creator_name || 'Owner'}</td>
                    <td className="px-4 py-3.5 text-neutral-500">
                      {t.expires_at ? new Date(t.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleRevoke(t.id, t.name)}
                        className="rounded px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Token Modal */}
      {createModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Generate New API Token</h3>
              <button onClick={() => setCreateModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Token Name *</label>
                <input
                  type="text"
                  required
                  value={tokenForm.name}
                  onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
                  placeholder="e.g. GitHub Actions CI/CD"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Expiration Period</label>
                <select
                  value={tokenForm.expiresDays}
                  onChange={(e) => setTokenForm({ ...tokenForm, expiresDays: Number(e.target.value) })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days (Recommended)</option>
                  <option value={365}>1 Year</option>
                </select>
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
                  Generate Token
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reveal Secret Modal */}
      {revealModal && createdSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <div className="size-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <KeyRound className="size-4" />
              </div>
              <h3 className="text-base font-bold text-neutral-900">API Token Created</h3>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-neutral-600">
                Copy your token now. For security purposes, you will not be able to view this token again.
              </p>

              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={createdSecret.cleartextToken}
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2.5 font-mono text-xs text-neutral-900 focus:outline-none pr-20"
                />
                <button
                  onClick={handleCopySecret}
                  className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow transition hover:bg-blue-700"
                >
                  {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="flex justify-end pt-3 border-t border-neutral-100">
                <button
                  onClick={() => setRevealModal(false)}
                  className="rounded-lg bg-neutral-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-neutral-800"
                >
                  Done & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};
