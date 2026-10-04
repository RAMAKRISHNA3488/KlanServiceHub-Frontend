import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { rolesAdminApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  ShieldAlert,
  Shield,
  ShieldCheck,
  Plus,
  Lock,
  Save,
  Trash2,
  Check,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';

export const RolesAdminView = () => {
  const workspaceId = useWorkspaceId();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [activeTab, setActiveTab] = useState('COMPANY'); // COMPANY, PROJECT, ISSUE
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [ConfirmDialog, confirmAction] = useConfirm(
    'Delete Custom Role',
    'Are you sure you want to delete this custom role?',
    'destructive'
  );

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', permissions: [] });

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await rolesAdminApi.getRoles(workspaceId);
      if (res?.data) {
        setRoles(res.data.roles || []);
        setPermissions(res.data.allPermissions || []);
        if (res.data.roles && res.data.roles.length > 0) {
          const currentId = selectedRole ? selectedRole.id : res.data.roles[0].id;
          const found = res.data.roles.find((r) => r.id === currentId) || res.data.roles[0];
          setSelectedRole(found);
        }
      }
    } catch (e) {
      toast.error('Failed to load roles and permissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchRoles();
  }, [workspaceId]);

  const handleTogglePermission = (code) => {
    if (!selectedRole || selectedRole.name === 'Company Owner') return;

    setSelectedRole((prev) => {
      const perms = prev.permissions || [];
      const hasIt = perms.includes(code);
      const updated = hasIt ? perms.filter((p) => p !== code) : [...perms, code];
      return { ...prev, permissions: updated };
    });
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    try {
      setSaving(true);
      await rolesAdminApi.updatePermissions(workspaceId, selectedRole.id, selectedRole.permissions);
      toast.success(`Permissions for ${selectedRole.name} updated successfully!`);
      fetchRoles();
    } catch (err) {
      toast.error(err.message || 'Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    try {
      await rolesAdminApi.createRole(workspaceId, createForm);
      toast.success(`Role ${createForm.name} created!`);
      setCreateModalOpen(false);
      setCreateForm({ name: '', description: '', permissions: [] });
      fetchRoles();
    } catch (err) {
      toast.error(err.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (roleId, roleName = 'this custom role') => {
    const ok = await confirmAction({
      title: 'Delete Custom Role',
      message: `Are you sure you want to delete custom role "${roleName}"?`,
      variant: 'destructive',
      confirmText: 'Delete Role',
      warningNotice: 'Users assigned to this role will be downgraded to default workspace membership permissions.'
    });
    if (!ok) return;

    try {
      await rolesAdminApi.deleteRole(workspaceId, roleId);
      toast.success('Role deleted.');
      fetchRoles();
    } catch (err) {
      toast.error(err.message || 'Failed to delete role');
    }
  };

  const filteredPermissions = permissions.filter((p) => p.category === activeTab);

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
          <h1 className="text-lg font-bold text-neutral-900">Role Management & RBAC Matrix</h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Configure system and custom roles with granular permission mappings across Company, Project, and Issue scopes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
          >
            <Plus className="size-3.5" />
            New Custom Role
          </button>
        </div>
      </div>

      {/* Main Grid: Roles List (Left) + Permission Matrix (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Roles Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 px-1">Available Roles ({roles.length})</p>
          <div className="space-y-2">
            {roles.map((r) => {
              const isSelected = selectedRole?.id === r.id;
              const isOwner = r.name === 'Company Owner';
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r)}
                  className={`group relative flex cursor-pointer items-start justify-between rounded-xl border p-3.5 transition ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isOwner
                          ? 'bg-amber-100 text-amber-700'
                          : r.is_system
                          ? 'bg-neutral-100 text-neutral-700'
                          : 'bg-indigo-100 text-indigo-700'
                      }`}
                    >
                      {isOwner ? <Sparkles className="size-4" /> : <Shield className="size-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900">{r.name}</span>
                        {r.is_system ? (
                          <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-[9px] font-bold text-neutral-600">
                            SYSTEM
                          </span>
                        ) : (
                          <span className="rounded bg-purple-100 px-1.5 py-0.2 text-[9px] font-bold text-purple-700">
                            CUSTOM
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 line-clamp-2">{r.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-400">
                        <span>{r.permissions?.length || 0} Permissions</span>
                        <span>•</span>
                        <span>{r.userCount || 0} Users assigned</span>
                      </div>
                    </div>
                  </div>

                  {!r.is_system && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRole(r.id, r.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-600 rounded transition"
                      title="Delete Custom Role"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Permissions Matrix */}
        <div className="lg:col-span-8">
          {selectedRole ? (
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-neutral-100 bg-neutral-50/50">
                <div>
                  <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                    <span>{selectedRole.name}</span>
                    <span className="text-xs text-neutral-400 font-normal">Permissions Policy</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 mt-0.5">{selectedRole.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSavePermissions}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 transition"
                  >
                    {saving ? <RefreshCw className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Category Tabs */}
              <div className="flex border-b border-neutral-200 px-5 pt-3 gap-6 bg-white text-xs font-bold">
                {[
                  { id: 'COMPANY', label: 'Company & Admin' },
                  { id: 'PROJECT', label: 'Project Operations' },
                  { id: 'ISSUE', label: 'Issue & Workflows' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`pb-3 border-b-2 transition ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Permissions Checklist */}
              <div className="p-5 divide-y divide-neutral-100 max-h-[500px] overflow-y-auto">
                {filteredPermissions.map((p) => {
                  const permKey = p.id || p.code;
                  const isChecked = (selectedRole.permissions || []).includes(permKey);
                  return (
                    <div
                      key={permKey}
                      onClick={() => handleTogglePermission(permKey)}
                      className="flex items-start justify-between py-3 cursor-pointer hover:bg-neutral-50/70 px-2 rounded-lg transition"
                    >
                      <div className="pr-4">
                        <span className="text-xs font-bold text-neutral-900">{p.name}</span>
                        <p className="text-[11px] text-neutral-500 mt-0.5">{p.description}</p>
                        <span className="font-mono text-[9px] text-neutral-400">{permKey}</span>
                      </div>

                      <div
                        className={`size-5 rounded border flex items-center justify-center shrink-0 mt-0.5 transition ${
                          isChecked
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-neutral-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="size-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 text-xs text-neutral-400">
              Select a role from the left panel to configure permissions.
            </div>
          )}
        </div>
      </div>

      {/* Create Role Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Create Custom Security Role</h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Role Name *</label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Release Coordinator"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  rows={2}
                  placeholder="Responsibilities and purpose of this role..."
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
                  Create Role
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
