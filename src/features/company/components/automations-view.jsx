import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { automationsApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Zap,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  X,
  History,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
} from 'lucide-react';

export const AutomationsView = () => {
  const workspaceId = useWorkspaceId();
  const [rules, setRules] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Delete Automation Rule',
    'Are you sure you want to delete this automation rule?',
    'destructive'
  );

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    triggerEvent: 'ON_STATUS_CHANGE_TO_DONE',
    actionType: 'NOTIFY_REPORTER',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await automationsApi.getAutomations(workspaceId);
      if (res?.data) {
        setRules(res.data.rules || []);
        setLogs(res.data.logs || []);
      }
    } catch (e) {
      toast.error('Failed to load automations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId]);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      await automationsApi.createAutomation(workspaceId, {
        name: ruleForm.name,
        description: ruleForm.description,
        triggerEvent: ruleForm.triggerEvent,
        actions: [{ type: ruleForm.actionType }],
      });
      toast.success(`Automation rule "${ruleForm.name}" created!`);
      setCreateModalOpen(false);
      setRuleForm({ name: '', description: '', triggerEvent: 'ON_STATUS_CHANGE_TO_DONE', actionType: 'NOTIFY_REPORTER' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create automation');
    }
  };

  const handleToggle = async (id) => {
    try {
      await automationsApi.toggleAutomation(workspaceId, id);
      toast.success('Automation rule toggled!');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle rule');
    }
  };

  const handleTestRun = async (id) => {
    try {
      await automationsApi.testRun(workspaceId, id);
      toast.success('Automation test executed successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to run test');
    }
  };

  const handleDelete = async (id, ruleName = 'this automation rule') => {
    const ok = await confirmAction({
      title: 'Delete Automation Rule',
      message: `Are you sure you want to delete automation rule "${ruleName}"?`,
      variant: 'destructive',
      confirmText: 'Delete Rule',
      warningNotice: 'Automatic triggers connected to this rule will cease executing immediately.'
    });
    if (!ok) return;
    try {
      await automationsApi.deleteAutomation(workspaceId, id);
      toast.success('Rule deleted.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to delete rule');
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
          <h1 className="text-lg font-bold text-neutral-900">Automation Rules Engine</h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Define trigger-condition-action workflow rules to eliminate repetitive operations and trigger instant alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
          >
            <Plus className="size-3.5" />
            Create Rule
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400">
            <Zap className="size-8 mx-auto mb-2 text-neutral-300" />
            <p className="text-sm font-semibold text-neutral-600">No automation rules created yet.</p>
            <p className="text-xs text-neutral-400 mt-1">Create your first rule above to automate issue assignments and notifications.</p>
          </div>
        ) : (
          rules.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
                r.isActive ? 'border-neutral-200' : 'border-neutral-200/60 bg-neutral-50/40 opacity-70'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                      <Zap className="size-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">{r.name}</h4>
                      <p className="text-xs text-neutral-500">{r.description || 'Custom workflow rule'}</p>
                    </div>
                  </div>

                  {/* Flow Diagram */}
                  <div className="flex items-center gap-2 text-xs pt-1">
                    <span className="rounded bg-blue-50 border border-blue-200 px-2 py-0.5 font-bold text-blue-700 text-[11px]">
                      WHEN: {r.trigger_event}
                    </span>
                    <ArrowRight className="size-3 text-neutral-400" />
                    <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-bold text-emerald-700 text-[11px]">
                      THEN: Execute configured action
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-neutral-400 mr-2">{r.execution_count || 0} runs</span>

                  <button
                    onClick={() => handleTestRun(r.id)}
                    className="flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 shadow-xs"
                  >
                    <Play className="size-3 text-emerald-600 fill-emerald-600" />
                    Test Run
                  </button>

                  <button
                    onClick={() => handleToggle(r.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      r.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {r.isActive ? 'Enabled' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => handleDelete(r.id, r.name)}
                    className="p-1 text-neutral-400 hover:text-red-600 rounded transition"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Execution History */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <History className="size-4 text-blue-600" />
          <h3 className="text-sm font-bold text-neutral-900">Recent Automation Execution Logs</h3>
        </div>

        <div className="divide-y divide-neutral-100 text-xs">
          {logs.length === 0 ? (
            <p className="text-neutral-400 italic py-4 text-center">No recent execution logs.</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                  <span className="font-semibold text-neutral-900">{log.rule_name || 'Rule'}</span>
                  <span className="text-neutral-500 truncate max-w-md">{log.details}</span>
                </div>
                <span className="text-[10px] text-neutral-400 shrink-0">
                  {new Date(log.executed_at || log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Rule Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Create Automation Rule</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Rule Name *</label>
                <input
                  type="text"
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                  placeholder="e.g. Notify Reporter when Issue Moves to DONE"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Trigger Event (WHEN)</label>
                <select
                  value={ruleForm.triggerEvent}
                  onChange={(e) => setRuleForm({ ...ruleForm, triggerEvent: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="ON_STATUS_CHANGE_TO_DONE">WHEN Issue moves to DONE</option>
                  <option value="ON_PRIORITY_CRITICAL">WHEN Issue priority = CRITICAL</option>
                  <option value="ON_ISSUE_ASSIGNED">WHEN Issue is assigned / reassigned</option>
                  <option value="ON_ISSUE_CREATED">WHEN New issue is created</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Action (THEN)</label>
                <select
                  value={ruleForm.actionType}
                  onChange={(e) => setRuleForm({ ...ruleForm, actionType: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="NOTIFY_REPORTER">Send in-app notification to Reporter</option>
                  <option value="NOTIFY_PROJECT_MANAGER">Send urgent notification to Project Manager</option>
                  <option value="SEND_SLACK_WEBHOOK">Post payload to connected Slack Channel</option>
                  <option value="AUTO_CLOSE_SUBTASKS">Automatically transition sub-tasks to DONE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  rows={2}
                  placeholder="Optional notes regarding this rule..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  Save & Activate
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
