import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { usersAdminApi, rolesAdminApi, companyApi } from '@/lib/api-client';
import { toast } from 'sonner';
import {
  Users,
  UserPlus,
  Search,
  MoreVertical,
  Shield,
  Crown,
  CheckCircle,
  Ban,
  RotateCcw,
  Trash2,
  Mail,
  Building,
  RefreshCw,
  X,
  Lock,
  ArrowRightLeft,
  UserCheck,
} from 'lucide-react';

export const UsersAdminView = () => {
  const workspaceId = useWorkspaceId();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [targetNewOwnerId, setTargetNewOwnerId] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [reassignToUserId, setReassignToUserId] = useState('');

  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    roleName: 'Developer',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        usersAdminApi.getUsers(workspaceId),
        rolesAdminApi.getRoles(workspaceId),
      ]);
      if (usersRes?.data) setUsers(usersRes.data);
      if (rolesRes?.data?.roles) setRoles(rolesRes.data.roles);
    } catch (e) {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) fetchData();
  }, [workspaceId]);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await usersAdminApi.inviteUser(workspaceId, inviteForm);
      if (res?.emailSent) {
        toast.success(`✉️ Invitation email sent successfully to ${inviteForm.email}!`);
      } else {
        toast.success(`Invitation created for ${inviteForm.email}`);
      }
      setInviteModalOpen(false);
      setInviteForm({
        name: '',
        email: '',
        jobTitle: 'Software Engineer',
        department: 'Engineering',
        roleName: 'Developer',
      });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to invite user');
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await usersAdminApi.updateStatus(workspaceId, userId, nextStatus);
      toast.success(`User status updated to ${nextStatus}`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  const handleRoleChange = async (roleId) => {
    if (!selectedUser) return;
    try {
      await usersAdminApi.updateRole(workspaceId, selectedUser.id, roleId);
      toast.success('User role updated');
      setRoleModalOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to change user role');
    }
  };

  const handleTransferOwnership = async (e) => {
    e.preventDefault();
    if (!targetNewOwnerId || !ownerPassword) {
      toast.error('Please select new owner and enter your authorization password');
      return;
    }
    try {
      await companyApi.transferOwnership(workspaceId, {
        newOwnerUserId: targetNewOwnerId,
        password: ownerPassword,
      });
      toast.success('👑 Ownership transferred successfully!');
      setTransferModalOpen(false);
      setOwnerPassword('');
      setTargetNewOwnerId('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to transfer ownership');
    }
  };

  const handleReassignAndRemove = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const res = await usersAdminApi.reassignAndRemove(workspaceId, selectedUser.id, reassignToUserId);
      toast.success(`Member deactivated. ${res.reassignedTasksCount || 0} issues reassigned.`);
      setReassignModalOpen(false);
      setSelectedUser(null);
      setReassignToUserId('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">User Directory & Team Members</h1>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            Manage organization members, assign granular RBAC roles, invite new collaborators, and transfer ownership.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTransferModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-xs hover:bg-amber-100 transition"
          >
            <Crown className="size-3.5 text-amber-600" />
            Transfer Ownership
          </button>

          <button
            onClick={() => setInviteModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
          >
            <UserPlus className="size-3.5" />
            Invite User
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 size-4 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or department..."
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 pl-9 pr-3 py-1.5 text-xs focus:border-blue-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-neutral-500 font-medium">Status:</span>
          {['ALL', 'ACTIVE', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-600">
            <thead className="border-b border-neutral-200 bg-neutral-50/80 font-bold uppercase tracking-wider text-neutral-500 text-[10px]">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-4 py-3.5">Department / Title</th>
                <th className="px-4 py-3.5">Assigned Roles</th>
                <th className="px-4 py-3.5">Teams</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-neutral-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-50/70 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                            <span>{u.name}</span>
                            {u.isOwner && (
                              <span className="flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                                <Crown className="size-2.5 text-amber-600" /> Owner
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-400">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="text-neutral-800 font-medium">{u.jobTitle}</div>
                      <div className="text-[11px] text-neutral-400">{u.department}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 border border-blue-200/60"
                          >
                            {r.name}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {u.teams && u.teams.length > 0 ? (
                          u.teams.map((t) => (
                            <span
                              key={t.id}
                              className="rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200/60"
                            >
                              {t.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-neutral-400 italic">No teams</span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {!u.isOwner && (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setRoleModalOpen(true);
                            }}
                            className="rounded px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition"
                          >
                            Change Role
                          </button>

                          <button
                            onClick={() => handleStatusToggle(u.id, u.status)}
                            className="rounded p-1 text-neutral-400 hover:text-neutral-700 transition"
                            title={u.status === 'ACTIVE' ? 'Suspend User' : 'Restore User'}
                          >
                            {u.status === 'ACTIVE' ? <Ban className="size-3.5 text-amber-600" /> : <RotateCcw className="size-3.5 text-emerald-600" />}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setReassignModalOpen(true);
                            }}
                            className="rounded p-1 text-neutral-400 hover:text-red-600 transition"
                            title="Deactivate & Reassign Work"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transfer Ownership Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <Crown className="size-4 text-amber-600" />
                Transfer Company Ownership
              </h3>
              <button onClick={() => setTransferModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Select an existing team member to become the new 👑 Company Owner. You will transition to Company Admin.
            </p>

            <form onSubmit={handleTransferOwnership} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">New Owner *</label>
                <select
                  required
                  value={targetNewOwnerId}
                  onChange={(e) => setTargetNewOwnerId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Select team member...</option>
                  {users
                    .filter((u) => !u.isOwner && u.status === 'ACTIVE')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Confirm Your Current Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 size-4 text-neutral-400" />
                  <input
                    type="password"
                    required
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    placeholder="Enter current password..."
                    className="w-full rounded-xl border border-neutral-300 pl-9 pr-3 py-2 text-xs focus:border-blue-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Authorize Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe Reassignment Modal */}
      {reassignModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                <ArrowRightLeft className="size-4 text-blue-600" />
                Deactivate & Reassign Work
              </h3>
              <button onClick={() => setReassignModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500">
              Before removing <span className="font-bold text-neutral-900">{selectedUser.name}</span>, automatically reassign all their open klanservicehub issues and sprint tasks to another active member.
            </p>

            <form onSubmit={handleReassignAndRemove} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Reassign open work to:</label>
                <select
                  value={reassignToUserId}
                  onChange={(e) => setReassignToUserId(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs font-semibold focus:border-blue-600 focus:outline-none"
                >
                  <option value="">Do not reassign (Leave unassigned)</option>
                  {users
                    .filter((u) => u.id !== selectedUser.id && u.status === 'ACTIVE')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-xs"
                >
                  Confirm Deactivation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Invite Team Member</h3>
              <button onClick={() => setInviteModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleInvite} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={inviteForm.name}
                  onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  placeholder="john.doe@company.com"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={inviteForm.jobTitle}
                    onChange={(e) => setInviteForm({ ...inviteForm, jobTitle: e.target.value })}
                    placeholder="Developer"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={inviteForm.department}
                    onChange={(e) => setInviteForm({ ...inviteForm, department: e.target.value })}
                    placeholder="Engineering"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Initial Role</label>
                <select
                  value={inviteForm.roleName}
                  onChange={(e) => setInviteForm({ ...inviteForm, roleName: e.target.value })}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-blue-700"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Modal */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Change Role for {selectedUser.name}</h3>
              <button onClick={() => setRoleModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRoleChange(r.id)}
                  className="flex w-full items-start gap-2.5 rounded-xl border border-neutral-200 p-3 text-left transition hover:border-blue-500 hover:bg-blue-50/50"
                >
                  <Shield className="size-4 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-neutral-900">{r.name}</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{r.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
