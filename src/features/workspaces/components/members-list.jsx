'use client';
import React, { useState, Fragment } from 'react';
import { ArrowLeft, MoreVertical, UserPlus, Mail, X, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { DottedSeparator } from '@/components/dotted-separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { useDeleteMember } from '@/features/members/api/use-delete-member';
import { useGetMembers } from '@/features/members/api/use-get-members';
import { useUpdateMember } from '@/features/members/api/use-update-member';
import { MemberAvatar } from '@/features/members/components/member-avatar';
import { MemberRole } from '@/features/members/types';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useConfirm } from '@/hooks/use-confirm';
import { usersAdminApi } from '@/lib/api-client';
import { toast } from 'sonner';

export const MembersList = () => {
  const workspaceId = useWorkspaceId();
  const [ConfirmDialog, confirm] = useConfirm('Remove member', 'This member will be removed from this workspace.', 'destructive');
  const { data: members, refetch: refetchMembers } = useGetMembers({ workspaceId });
  const { mutate: deleteMember, isPending: isDeletingMember } = useDeleteMember();
  const { mutate: updateMember, isPending: isUpdatingMember } = useUpdateMember();

  // Invite Modal State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('Developer');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [sentInviteData, setSentInviteData] = useState(null);

  const handleDeleteMember = async (memberId) => {
    const ok = await confirm();
    if (!ok) return;
    deleteMember(
      { param: { memberId } },
      {
        onSuccess: () => {
          window.location.reload();
        },
      },
    );
  };

  const handleUpdateMember = (memberId, role) => {
    updateMember({
      json: { role },
      param: { memberId },
    });
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid work email address.');
      return;
    }

    try {
      setSendingInvite(true);
      const res = await usersAdminApi.inviteUser(workspaceId, {
        email: inviteEmail.trim(),
        name: inviteName.trim() || inviteEmail.split('@')[0],
        roleName: inviteRole,
        jobTitle: 'Team Member',
        department: 'General',
      });

      if (res?.emailSent) {
        toast.success(`✉️ Invitation email sent successfully to ${inviteEmail}!`);
      } else {
        toast.success(`Invitation created for ${inviteEmail}`);
      }

      setSentInviteData({ email: inviteEmail, inviteUrl: res.inviteUrl });
      refetchMembers();
    } catch (err) {
      toast.error(err.message || 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const isPending = isDeletingMember || isUpdatingMember || members?.documents?.length === 1;

  return (
    <Card className="size-full border-none shadow-none">
      <ConfirmDialog />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-7">
        <div className="flex items-center gap-x-4">
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/workspaces/${workspaceId}`}>
              <ArrowLeft className="mr-2 size-4" />
              Back
            </Link>
          </Button>

          <CardTitle className="text-xl font-bold">Members list</CardTitle>
        </div>

        <Button size="sm" onClick={() => setInviteModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
          <UserPlus className="mr-2 size-4" />
          Invite Member
        </Button>
      </CardHeader>

      <div className="px-7">
        <DottedSeparator />
      </div>

      <CardContent className="p-7">
        {members?.documents?.map((member, i) => (
          <Fragment key={member.$id || member.id}>
            <div className="flex items-center gap-3">
              <MemberAvatar name={member.name} className="size-10" fallbackClassName="text-lg" />

              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{member.name || member.email}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${member.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-100 text-neutral-700'}`}>
                    {member.role}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">{member.email}</p>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger disabled={isPending} asChild>
                  <Button title="View options" className="ml-auto" variant="secondary" size="icon">
                    <MoreVertical className="size-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent side="bottom" align="end">
                  <DropdownMenuItem className="font-medium" onClick={() => handleUpdateMember(member.$id, MemberRole.ADMIN)} disabled={isPending}>
                    Set as Administrator
                  </DropdownMenuItem>

                  <DropdownMenuItem className="font-medium" onClick={() => handleUpdateMember(member.$id, MemberRole.MEMBER)} disabled={isPending}>
                    Set as Member
                  </DropdownMenuItem>

                  <DropdownMenuItem className="font-medium text-amber-700" onClick={() => handleDeleteMember(member.$id)} disabled={isPending}>
                    Remove {member.name}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {i < members.documents.length - 1 && <Separator className="my-3" />}
          </Fragment>
        ))}

        {(!members?.documents || members.documents.length === 0) && (
          <p className="py-8 text-center text-xs text-neutral-400">No members found in this workspace.</p>
        )}
      </CardContent>

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-neutral-200 space-y-4 text-neutral-800">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Mail className="size-4" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">Invite Employee or Member</h3>
              </div>
              <button onClick={() => setInviteModalOpen(false)} className="text-neutral-400 hover:text-neutral-700">
                <X className="size-4" />
              </button>
            </div>

            {sentInviteData ? (
              <div className="space-y-4 py-2">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-2">
                  <CheckCircle2 className="size-10 text-emerald-600 mx-auto" />
                  <h4 className="text-sm font-bold text-emerald-950">Invitation Email Dispatched!</h4>
                  <p className="text-xs text-emerald-800">
                    An email was sent to <strong>{sentInviteData.email}</strong> via Gmail.
                  </p>
                  <p className="text-[11px] text-emerald-700 bg-emerald-100/60 rounded p-2 text-left">
                    💡 <strong>Note:</strong> Automated invitation emails may sometimes land in the recipient's <strong>Spam / Junk</strong> folder or <strong>Updates</strong> tab. Please advise them to check there if not in primary inbox.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-neutral-700">Direct Invitation Link:</label>
                  <div className="flex gap-2">
                    <input
                      readOnly
                      value={sentInviteData.inviteUrl}
                      className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-xs bg-neutral-50 text-neutral-600 select-all"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(sentInviteData.inviteUrl);
                        toast.success('Invitation link copied to clipboard!');
                      }}
                    >
                      Copy Link
                    </Button>
                  </div>
                </div>

                <Button
                  type="button"
                  className="w-full mt-2"
                  onClick={() => {
                    setInviteModalOpen(false);
                    setSentInviteData(null);
                    setInviteEmail('');
                    setInviteName('');
                  }}
                >
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Full Name (Optional)</label>
                  <input
                    type="text"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Jane Smith"
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm focus:border-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Assigned Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full rounded-xl border border-neutral-300 px-3.5 py-2.5 text-sm bg-white focus:border-blue-600 focus:outline-none font-medium"
                  >
                    <option value="Developer">Developer (Standard Member)</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Company Admin">Company Admin (Full Access)</option>
                    <option value="QA Engineer">QA Engineer</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-neutral-100">
                  <Button type="button" variant="secondary" onClick={() => setInviteModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={sendingInvite || !inviteEmail} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                    {sendingInvite ? <RefreshCw className="mr-2 size-4 animate-spin" /> : <Mail className="mr-2 size-4" />}
                    <span>Send Invitation</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

export default MembersList;
