import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { securityApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Lock,
  ShieldCheck,
  Smartphone,
  Globe,
  Key,
  LogOut,
  Save,
  Laptop,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export const SecurityView = () => {
  const workspaceId = useWorkspaceId();
  const [policy, setPolicy] = useState(null);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Terminate User Session',
    'Are you sure you want to terminate this user session?',
    'destructive'
  );

  const [form, setForm] = useState({
    minPasswordLength: 8,
    requireSpecialChar: true,
    requireNumbers: true,
    sessionTimeoutMins: 1440,
    mfaRequired: false,
    ipAllowlist: '',
    ssoEnabled: false,
    ssoProvider: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await securityApi.getSecurity(workspaceId);
      if (res?.data) {
        setPolicy(res.data.policy);
        setActiveSessions(res.data.activeSessions || []);
        if (res.data.policy) {
          setForm({
            minPasswordLength: res.data.policy.min_password_length || 8,
            requireSpecialChar: Boolean(res.data.policy.require_special_char),
            requireNumbers: Boolean(res.data.policy.require_numbers),
            sessionTimeoutMins: res.data.policy.session_timeout_mins || 1440,
            mfaRequired: Boolean(res.data.policy.mfa_required),
            ipAllowlist: res.data.policy.ip_allowlist || '',
            ssoEnabled: Boolean(res.data.policy.sso_enabled),
            ssoProvider: res.data.policy.sso_provider || '',
          });
        }
      }
    } catch (e) {
      toast.error('Failed to load security settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId]);

  const handleSavePolicy = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await securityApi.updatePolicy(workspaceId, form);
      toast.success('Security policies updated successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update security policy');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId, userName = 'this user') => {
    const ok = await confirmAction({
      title: 'Terminate User Session',
      message: `Are you sure you want to terminate the active session for ${userName}?`,
      variant: 'destructive',
      confirmText: 'Terminate Session',
      warningNotice: 'The user will be immediately logged out and all in-flight requests from this token will be rejected.'
    });
    if (!ok) return;

    try {
      await securityApi.revokeSession(workspaceId, sessionId);
      toast.success('Session terminated successfully.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to terminate session');
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
          <h1 className="text-lg font-bold text-neutral-900">Security & Session Governance</h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Configure password strength policies, multi-factor authentication, IP restrictions, and manage active sessions.
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

      {/* Security Policies Form */}
      <form onSubmit={handleSavePolicy} className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-neutral-100 bg-neutral-50/70 px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-blue-600" />
            <h3 className="text-sm font-bold text-neutral-900">Organization Security Policies</h3>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="size-3.5" />
            {saving ? 'Saving...' : 'Save Policies'}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Password Policy */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Password & Authentication</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Minimum Password Length</label>
                <input
                  type="number"
                  min={8}
                  max={32}
                  value={form.minPasswordLength}
                  onChange={(e) => setForm({ ...form, minPasswordLength: Number(e.target.value) })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Session Inactivity Timeout</label>
                <select
                  value={form.sessionTimeoutMins}
                  onChange={(e) => setForm({ ...form, sessionTimeoutMins: Number(e.target.value) })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value={60}>1 Hour</option>
                  <option value={480}>8 Hours (Work Day)</option>
                  <option value={1440}>24 Hours (1 Day)</option>
                  <option value={10080}>7 Days</option>
                  <option value={43200}>30 Days</option>
                </select>
              </div>

              <div className="flex flex-col justify-end space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requireSpecialChar}
                    onChange={(e) => setForm({ ...form, requireSpecialChar: e.target.checked })}
                    className="size-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  Require Special Characters (!@#$)
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requireNumbers}
                    onChange={(e) => setForm({ ...form, requireNumbers: e.target.checked })}
                    className="size-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  Require Numerical Digits (0-9)
                </label>
              </div>
            </div>
          </div>

          <div className="h-px bg-neutral-100" />

          {/* MFA & SSO */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Two-Factor & Enterprise SSO</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="size-4 text-purple-600" />
                    <span className="text-xs font-bold text-neutral-900">Enforce Two-Factor Authentication (2FA)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.mfaRequired}
                    onChange={(e) => setForm({ ...form, mfaRequired: e.target.checked })}
                    className="size-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Require all organization members to configure TOTP authenticator apps (Google Authenticator, Authy).
                </p>
              </div>

              <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="size-4 text-blue-600" />
                    <span className="text-xs font-bold text-neutral-900">Single Sign-On (SAML / OAuth SSO)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={form.ssoEnabled}
                    onChange={(e) => setForm({ ...form, ssoEnabled: e.target.checked })}
                    className="size-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>
                <select
                  disabled={!form.ssoEnabled}
                  value={form.ssoProvider}
                  onChange={(e) => setForm({ ...form, ssoProvider: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-xs bg-white focus:outline-none disabled:opacity-50"
                >
                  <option value="">-- Select Identity Provider --</option>
                  <option value="OKTA">Okta SAML 2.0</option>
                  <option value="GOOGLE">Google Workspace SSO</option>
                  <option value="AZURE">Microsoft Azure Active Directory</option>
                </select>
              </div>
            </div>
          </div>

          <div className="h-px bg-neutral-100" />

          {/* IP Allowlist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">IP Address Allowlisting</h4>
            <textarea
              rows={2}
              value={form.ipAllowlist}
              onChange={(e) => setForm({ ...form, ipAllowlist: e.target.value })}
              placeholder="Enter comma-separated CIDR or IP addresses (e.g. 192.168.1.1/24, 10.0.0.1). Leave empty to allow all."
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-xs font-mono focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </form>

      {/* Active User Sessions */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">Active User Sessions ({activeSessions.length})</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Manage authenticated user sessions and terminate suspicious device logins.</p>
          </div>
        </div>

        <div className="divide-y divide-neutral-100 text-xs">
          {activeSessions.length === 0 ? (
            <p className="text-neutral-400 italic py-4 text-center">No active sessions found.</p>
          ) : (
            activeSessions.map((sess) => (
              <div key={sess.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-neutral-100 text-neutral-600 flex items-center justify-center">
                    <Laptop className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-neutral-900">{sess.user_name || 'User'}</span>
                      <span className="text-neutral-400">({sess.user_email})</span>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-500">
                      IP: {sess.ip_address} • {sess.user_agent}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-neutral-400">
                    Expires: {new Date(sess.expires_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleRevokeSession(sess.id, sess.user_name || sess.user_email || 'this user')}
                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1 rounded transition"
                  >
                    <LogOut className="size-3" />
                    Force Logout
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};
