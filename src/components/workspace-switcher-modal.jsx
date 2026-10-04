import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { authApi } from '@/lib/api-client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Building2,
  Check,
  Plus,
  X,
  Crown,
  Shield,
  User,
  ExternalLink,
  ChevronRight,
  Globe,
} from 'lucide-react';

export const WorkspaceSwitcherModal = ({ open, onClose }) => {
  const currentWorkspaceId = useWorkspaceId();
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      setLoading(true);
      authApi.getCurrentUser().then((res) => {
        if (res?.data?.workspaces) {
          setWorkspaces(res.data.workspaces);
        }
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [open]);

  if (!open) return null;

  const handleSelectWorkspace = (wsId) => {
    navigate(`/workspaces/${wsId}`);
    onClose();
    toast.success('Switched workspace');
  };

  const getRoleBadge = (ws) => {
    if (ws.is_owner || ws.organization_role === 'COMPANY_OWNER') {
      return (
        <span className="flex items-center gap-1 rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-bold">
          <Crown className="size-3 text-amber-600" />
          <span>Owner</span>
        </span>
      );
    }
    if (ws.role === 'ADMIN' || ws.organization_role === 'COMPANY_ADMIN') {
      return (
        <span className="flex items-center gap-1 rounded-full bg-blue-100 text-blue-900 px-2 py-0.5 text-[10px] font-bold">
          <Shield className="size-3 text-blue-600" />
          <span>Admin</span>
        </span>
      );
    }
    if (ws.organization_role === 'GUEST') {
      return (
        <span className="rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5 text-[10px] font-bold">
          Guest
        </span>
      );
    }
    return (
      <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
        Member
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/70">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Switch Workspace</h3>
            <p className="text-xs text-neutral-500">Select an organization account to access</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition">
            <X className="size-5" />
          </button>
        </div>

        {/* Workspaces List */}
        <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
          {workspaces.map((ws) => {
            const isCurrent = ws.id === currentWorkspaceId;
            return (
              <button
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                  isCurrent
                    ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-600 shadow-xs'
                    : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {ws.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-neutral-900">{ws.name}</span>
                      {getRoleBadge(ws)}
                    </div>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {ws.domain_slug ? `${ws.domain_slug}.klanservicehub.io` : 'klanservicehub Cloud'}
                    </span>
                  </div>
                </div>

                {isCurrent && <Check className="size-4 text-blue-600 stroke-[3]" />}
              </button>
            );
          })}
        </div>

        {/* Footer: Create Workspace */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50/50">
          <button
            onClick={() => {
              onClose();
              navigate('/onboarding');
            }}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 py-2.5 text-xs font-bold text-white shadow-xs transition"
          >
            <Plus className="size-4" />
            <span>Create new company workspace</span>
          </button>
        </div>
      </div>
    </div>
  );
};
