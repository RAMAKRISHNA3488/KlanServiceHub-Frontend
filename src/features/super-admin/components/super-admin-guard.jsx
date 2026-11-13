import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { ShieldX, ArrowLeft, RefreshCw, Lock } from 'lucide-react';
import { useSuperAdminCurrent } from '../api/super-admin-api';

export const SuperAdminGuard = () => {
  const { data: user, isLoading, isError } = useSuperAdminCurrent();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-3">
          <RefreshCw className="w-6 h-6 text-rose-500 animate-spin" />
        </div>
        <p className="text-xs font-mono tracking-wider text-slate-300">
          Verifying Super Admin Cryptographic Credentials...
        </p>
      </div>
    );
  }

  // Not logged in at all -> redirect to Super Admin Login
  if (!user || isError) {
    return <Navigate to="/super-admin/login" replace />;
  }

  // Logged in, but NOT a Super Admin or MFA not completed -> 403 Forbidden Screen
  if (!user.isSuperAdmin || !user.mfaVerified) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-rose-900/40 rounded-2xl p-7 text-center shadow-2xl relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
            <ShieldX className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-white mb-1.5">
            403 - Forbidden Access
          </h2>
          <p className="text-xs text-rose-300/80 mb-4 font-mono">
            SEC_ERR_SUPER_ADMIN_PRIVILEGE_REQUIRED
          </p>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Your current account (<span className="text-slate-200 font-semibold">{user.email}</span>) does not hold platform-level Super Administrator privileges or has not completed mandatory Multi-Factor Authentication.
          </p>

          <div className="space-y-2.5">
            <Link
              to="/"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Standard Workspace
            </Link>

            <Link
              to="/super-admin/login"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors shadow-lg shadow-rose-950/50"
            >
              <Lock className="w-4 h-4" />
              Authenticate with Super Admin Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

