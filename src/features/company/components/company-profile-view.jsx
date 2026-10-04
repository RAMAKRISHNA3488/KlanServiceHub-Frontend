import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { companyApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  Languages,
  Calendar,
  DollarSign,
  ShieldCheck,
  Crown,
  Users,
  FolderGit2,
  CheckCircle2,
  AlertTriangle,
  Save,
  Trash2,
  RefreshCw,
} from 'lucide-react';

export const CompanyProfileView = () => {
  const workspaceId = useWorkspaceId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Delete Organization Permanently',
    'Are you sure you want to permanently delete this company profile?',
    'destructive'
  );

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    timezone: 'UTC',
    locale: 'en',
    fiscalYearStart: 'January',
    currency: 'USD',
  });

  useEffect(() => {
    if (workspaceId) {
      setLoading(true);
      companyApi
        .getCompany(workspaceId)
        .then((res) => {
          if (res?.data) {
            setProfile(res.data);
            setFormData({
              name: res.data.name || '',
              description: res.data.description || '',
              website: res.data.website || '',
              contactEmail: res.data.contactEmail || '',
              contactPhone: res.data.contactPhone || '',
              address: res.data.address || '',
              timezone: res.data.timezone || 'UTC',
              locale: res.data.locale || 'en',
              fiscalYearStart: res.data.fiscalYearStart || 'January',
              currency: res.data.currency || 'USD',
            });
          }
        })
        .catch(() => toast.error('Failed to load company profile'))
        .finally(() => setLoading(false));
    }
  }, [workspaceId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await companyApi.updateCompany(workspaceId, formData);
      if (res?.data) {
        setProfile(res.data);
        toast.success('Company settings saved successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCompany = async () => {
    const ok = await confirmAction({
      title: 'Delete Organization Permanently',
      message: `Are you sure you want to permanently delete company "${formData.name || 'this organization'}"?`,
      variant: 'destructive',
      confirmText: 'Delete Organization',
      warningNotice: 'This action cannot be undone and will permanently cascade to all associated teams, projects, sprints, workflows, and issues.'
    });
    if (!ok) return;

    try {
      await companyApi.deleteCompany(workspaceId);
      toast.success('Company deleted.');
      window.location.href = '/';
    } catch (err) {
      toast.error(err.message || 'Failed to delete company');
    }
  };

  const handleStatusToggle = async (newStatus) => {
    try {
      await companyApi.updateStatus(workspaceId, newStatus);
      toast.success(`Company status updated to ${newStatus}`);
      const res = await companyApi.getCompany(workspaceId);
      if (res?.data) setProfile(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
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
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="rounded-2xl border border-neutral-200 bg-gradient-to-r from-blue-900 via-indigo-900 to-neutral-900 p-8 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 size-64 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="size-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-3xl text-white shadow-inner">
              {formData.image_url ? (
                <img src={formData.image_url} alt="Logo" className="size-full object-cover rounded-2xl" />
              ) : (
                formData.name.substring(0, 2).toUpperCase() || 'CO'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">{formData.name || 'Organization Profile'}</h2>
                <span className="flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold text-amber-300 border border-amber-400/30">
                  <Crown className="size-3 text-amber-300" /> Profile Owner
                </span>
              </div>
              <p className="text-blue-200 text-xs mt-1 max-w-xl">
                {formData.description || 'Enterprise klanservicehub Workspace & Organization Management Suite.'}
              </p>
              <div className="flex items-center gap-4 mt-2.5 text-[11px] text-neutral-300">
                <span>Owner: <strong className="text-white">{profile?.owner?.name}</strong> ({profile?.owner?.email})</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  Status: <span className="inline-block size-2 rounded-full bg-emerald-400"></span> {profile?.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              onClick={() => handleStatusToggle(profile?.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/20"
            >
              {profile?.status === 'ACTIVE' ? 'Deactivate Company' : 'Activate Company'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Total Users</span>
            <Users className="size-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-neutral-900 mt-1.5">{profile?.stats?.userCount || 1}</p>
          <span className="text-[10px] text-neutral-400">Active organization seats</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Projects</span>
            <FolderGit2 className="size-3.5 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-neutral-900 mt-1.5">{profile?.stats?.projectCount || 0}</p>
          <span className="text-[10px] text-neutral-400">Tracked agile projects</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Teams</span>
            <Building2 className="size-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-neutral-900 mt-1.5">{profile?.stats?.teamCount || 0}</p>
          <span className="text-[10px] text-neutral-400">Cross-functional units</span>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[11px] font-medium uppercase tracking-wider">Tasks / Issues</span>
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-neutral-900 mt-1.5">{profile?.stats?.taskCount || 0}</p>
          <span className="text-[10px] text-neutral-400">Total tracked work items</span>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-neutral-100 bg-neutral-50/70 px-5 py-3.5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-neutral-900">General Company Settings</h3>
            <p className="text-[11px] text-neutral-500 mt-0.5">Configure organization identity, localization, and branding.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Company / Organization Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. Acme Corporation"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Company Logo URL</label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">Company Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-lg border border-neutral-300 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Brief summary of your company or organization..."
              />
            </div>
          </div>

          <div className="h-px bg-neutral-100" />

          {/* Contact & Address */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Contact & Location</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Company Website</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 size-4 text-neutral-400" />
                  <input
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="https://company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 size-4 text-neutral-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="contact@company.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 size-4 text-neutral-400" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-neutral-700 mb-1">Headquarters Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 size-4 text-neutral-400" />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-neutral-300 pl-9 pr-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="100 Enterprise Way, Suite 400, San Francisco, CA 94105"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-neutral-100" />

          {/* Localization */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">Localization & Formatting</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Default Timezone</label>
                <select
                  name="timezone"
                  value={formData.timezone}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="UTC">UTC (GMT+0)</option>
                  <option value="America/New_York">Eastern Time (US/Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US/Canada)</option>
                  <option value="Europe/London">London (GMT+1)</option>
                  <option value="Asia/Tokyo">Tokyo (GMT+9)</option>
                  <option value="Asia/Kolkata">India (GMT+5:30)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">System Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="de-DE">German</option>
                  <option value="fr-FR">French</option>
                  <option value="ja-JP">Japanese</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Date Format</label>
                <select
                  name="date_format"
                  value={formData.date_format}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2026-09-01)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (01/09/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (09/01/2026)</option>
                  <option value="DD-MMM-YYYY">DD-MMM-YYYY (01-Sep-2026)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6">
        <div className="flex items-start gap-4">
          <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <AlertTriangle className="size-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-red-900">Danger Zone</h4>
            <p className="text-xs text-red-700 mt-1">
              Deleting or suspending the company profile is permanent and will cascade to all associated teams, projects, sprints, and issues.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleDeleteCompany}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-red-700"
              >
                <Trash2 className="size-3.5" />
                Delete Organization Permanently
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reusable Confirm Dialog */}
      <ConfirmDialog />
    </div>
  );
};
