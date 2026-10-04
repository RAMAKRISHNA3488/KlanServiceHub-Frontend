import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { integrationsApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Cable,
  CheckCircle2,
  AlertCircle,
  Plus,
  Send,
  Trash2,
  RefreshCw,
  X,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { FaGithub, FaGitlab, FaBitbucket, FaSlack } from 'react-icons/fa';

const LOGO_MAP = {
  GITHUB: FaGithub,
  GITLAB: FaGitlab,
  BITBUCKET: FaBitbucket,
  SLACK: FaSlack,
  WEBHOOK: Cable,
};

export const IntegrationsView = () => {
  const workspaceId = useWorkspaceId();
  const [integrations, setIntegrations] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Disconnect Integration',
    'Are you sure you want to disconnect this service?',
    'destructive'
  );

  const [configureModal, setConfigureModal] = useState(false);
  const [selectedInteg, setSelectedInteg] = useState(null);
  const [configForm, setConfigForm] = useState({ webhookUrl: '', apiKey: '', repoName: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await integrationsApi.getIntegrations(workspaceId);
      if (res?.data) {
        setIntegrations(res.data.integrations || []);
        setLogs(res.data.logs || []);
      }
    } catch (e) {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId]);

  const handleOpenConfig = (integ) => {
    setSelectedInteg(integ);
    setConfigForm({
      webhookUrl: integ.config?.webhookUrl || '',
      apiKey: integ.config?.apiKey || '',
      repoName: integ.config?.repoName || '',
    });
    setConfigureModal(true);
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      await integrationsApi.configure(workspaceId, selectedInteg.id, configForm);
      toast.success(`${selectedInteg.name} connected successfully!`);
      setConfigureModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save configuration');
    }
  };

  const handleTestPing = async (id, name) => {
    try {
      await integrationsApi.testDelivery(workspaceId, id);
      toast.success(`Test webhook delivered to ${name}!`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to deliver test payload');
    }
  };

  const handleDisconnect = async (id, name) => {
    const ok = await confirmAction({
      title: 'Disconnect Integration',
      message: `Are you sure you want to disconnect ${name}?`,
      variant: 'destructive',
      confirmText: 'Disconnect Service',
      warningNotice: 'Real-time synchronization, webhook events, and external triggers will stop functioning immediately.'
    });
    if (!ok) return;

    try {
      await integrationsApi.disconnect(workspaceId, id);
      toast.success(`${name} disconnected.`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to disconnect');
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
          <h1 className="text-lg font-bold text-neutral-900">Integrations & Webhooks</h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Connect source control repositories, chat channels, and external event streams directly to your klanservicehub workflows.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
        >
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {integrations.map((item) => {
          const Logo = LOGO_MAP[item.type] || Cable;
          return (
            <div
              key={item.type}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-xl bg-neutral-900 text-white flex items-center justify-center text-xl shadow-xs">
                      <Logo />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-900">{item.name}</h3>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          item.isConnected ? 'text-emerald-600' : 'text-neutral-400'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            item.isConnected ? 'bg-emerald-500' : 'bg-neutral-300'
                          }`}
                        />
                        {item.isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 mt-3">{item.description}</p>

                {item.lastSyncAt && (
                  <p className="text-[10px] text-neutral-400 mt-2">
                    Last activity: {new Date(item.lastSyncAt).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
                {item.isConnected ? (
                  <>
                    <button
                      onClick={() => handleTestPing(item.id, item.name)}
                      className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition"
                    >
                      <Send className="size-3" />
                      Test Event
                    </button>

                    <button
                      onClick={() => handleDisconnect(item.id, item.name)}
                      className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleOpenConfig(item)}
                    className="w-full rounded-lg bg-neutral-900 py-2 text-xs font-bold text-white shadow transition hover:bg-neutral-800"
                  >
                    Connect {item.name}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delivery Logs */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-neutral-900">Recent Webhook Deliveries</h3>
        <div className="divide-y divide-neutral-100 text-xs">
          {logs.length === 0 ? (
            <p className="text-neutral-400 italic py-4 text-center">No webhook delivery logs.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span className="font-semibold text-neutral-900">{log.integration_name}</span>
                  <span className="text-neutral-500">{log.payload}</span>
                </div>
                <span className="text-[10px] text-neutral-400 shrink-0">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Configure Modal */}
      {configureModal && selectedInteg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Connect {selectedInteg.name}</h3>
              <button onClick={() => setConfigureModal(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConnect} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Webhook Endpoint URL *</label>
                <input
                  type="url"
                  required
                  value={configForm.webhookUrl}
                  onChange={(e) => setConfigForm({ ...configForm, webhookUrl: e.target.value })}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">API Key / Token (Optional)</label>
                <input
                  type="password"
                  value={configForm.apiKey}
                  onChange={(e) => setConfigForm({ ...configForm, apiKey: e.target.value })}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Repository Name / Channel</label>
                <input
                  type="text"
                  value={configForm.repoName}
                  onChange={(e) => setConfigForm({ ...configForm, repoName: e.target.value })}
                  placeholder="e.g. acme-org/core-backend or #klanservicehub-alerts"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setConfigureModal(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  Save & Connect
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
