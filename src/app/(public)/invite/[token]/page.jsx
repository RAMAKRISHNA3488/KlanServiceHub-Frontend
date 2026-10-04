import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invitationsApi, authApi } from '@/lib/api-client';
import { toast } from 'sonner';
import Link from 'next/link';
import { LandingFooter } from '@/components/landing-footer';
import {
  Building2,
  FolderGit2,
  CheckCircle2,
  Users,
  ArrowRight,
  Shield,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export const InvitationAcceptancePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [inviteRes, userRes] = await Promise.allSettled([
          invitationsApi.getInvitationByToken(token),
          authApi.getCurrentUser(),
        ]);

        if (inviteRes.status === 'fulfilled' && inviteRes.value?.data) {
          setInvitation(inviteRes.value.data);
        } else {
          toast.error('Invitation link is invalid or expired.');
        }

        if (userRes.status === 'fulfilled' && userRes.value?.data) {
          setCurrentUser(userRes.value.data);
        }
      } catch (err) {
        toast.error('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const handleAccept = async () => {
    try {
      setAccepting(true);
      const res = await invitationsApi.acceptInvitation(token);
      toast.success(`Welcome to ${invitation.organizationName}!`);
      window.location.href = `/workspaces/${res.workspaceId}`;
    } catch (err) {
      toast.error(err.message || 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#091E42] flex items-center justify-center text-white">
        <RefreshCw className="size-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-[#091E42] flex flex-col items-center justify-between text-white">
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md rounded-3xl border border-white/20 bg-neutral-900/90 p-8 text-center space-y-4 shadow-2xl">
            <AlertTriangle className="size-12 mx-auto text-amber-400" />
            <h2 className="text-xl font-bold">Invalid Invitation Link</h2>
            <p className="text-xs text-neutral-400">
              This invitation link has expired, been revoked, or does not exist. Please contact your organization administrator.
            </p>
            <Link
              href="/sign-in"
              className="inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow"
            >
              Go to Login
            </Link>
          </div>
        </div>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#091E42] flex flex-col justify-between text-white select-none">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 py-16">
        <div className="w-full max-w-md rounded-3xl border border-white/20 bg-neutral-900/95 p-8 shadow-2xl space-y-6 text-neutral-200">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="size-12 rounded-2xl bg-blue-600 text-white font-black text-xl flex items-center justify-center mx-auto shadow-md">
              K
            </div>
            <h1 className="text-2xl font-black text-white">You've been invited!</h1>
            <p className="text-xs text-neutral-400">
              <span className="font-bold text-white">{invitation.inviterName}</span> has invited you to collaborate on klanservicehub.
            </p>
          </div>

          {/* Organization & Project Context Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3.5 text-xs">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                <Building2 className="size-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-400 block">Organization</span>
                <span className="text-sm font-bold text-white">{invitation.organizationName}</span>
              </div>
            </div>

            {invitation.projectName && (
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className="size-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <FolderGit2 className="size-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Assigned Project</span>
                  <span className="text-sm font-bold text-white">{invitation.projectName}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
              <span className="text-neutral-400">Your Assigned Role:</span>
              <span className="rounded-full bg-blue-500/20 text-blue-400 px-2.5 py-0.5 font-bold">
                {invitation.organizationRole}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            {currentUser ? (
              <button
                onClick={handleAccept}
                disabled={accepting}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {accepting ? <RefreshCw className="size-4 animate-spin" /> : <span>Accept & Join {invitation.organizationName}</span>}
                {!accepting && <ArrowRight className="size-4" />}
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  href={`/sign-in?token=${token}`}
                  className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold text-white shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Log in to Accept</span>
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href={`/sign-up?token=${token}`}
                  className="w-full rounded-xl border border-white/20 hover:bg-white/10 py-3 text-sm font-bold text-neutral-200 transition flex items-center justify-center"
                >
                  Create an Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <LandingFooter />
    </div>
  );
};
