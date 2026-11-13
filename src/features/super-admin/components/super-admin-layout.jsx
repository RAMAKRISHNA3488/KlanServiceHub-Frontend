import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Server,
  LogOut,
  Building2,
  Users,
  LayoutDashboard,
  FileText,
  Activity,
  Radio,
} from 'lucide-react';
import { useSuperAdminCurrent, useSuperAdminHealth } from '../api/super-admin-api';
import { platformAdminApi } from '@/lib/api-client';

export const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useSuperAdminCurrent();
  const { data: health } = useSuperAdminHealth();

  const handleLogout = async () => {
    try {
      await platformAdminApi.logout();
    } finally {
      navigate('/super-admin/login', { replace: true });
    }
  };

  const navItems = [
    { label: 'Overview & Telemetry', path: '/super-admin/dashboard', icon: LayoutDashboard },
    { label: 'Organizations', path: '/super-admin/organizations', icon: Building2 },
    { label: 'Users Directory', path: '/super-admin/users', icon: Users },
    { label: 'Platform Audit Trail', path: '/super-admin/audit-logs', icon: FileText },
    { label: 'System Diagnostics', path: '/super-admin/system-health', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Master Control Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 p-0.5 shadow-lg shadow-rose-950/40">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">KlanServiceHub</span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Master Plane
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Platform Governance & Enterprise Telemetry</p>
            </div>
          </div>

          {/* Center: Live Edge Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300">Edge Live:</span>
            <span className="text-emerald-400 font-semibold">
              {health?.database?.latencyMs ? `${health.database.latencyMs}ms` : 'Cloudflare D1'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">MFA Active</span>
          </div>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-white">{user?.name || 'Super Administrator'}</div>
              <div className="text-[10px] font-mono text-slate-400">{user?.email || 'admin@klanservicehub.com'}</div>
            </div>

            <div className="w-9 h-9 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-xs font-bold text-rose-300">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SA'}
            </div>

            <button
              onClick={handleLogout}
              title="Terminate Super Admin Session"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-700/80 text-slate-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/50 flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.path || (item.path === '/super-admin/dashboard' && location.pathname === '/super-admin');
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  active
                    ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${active ? 'text-rose-400' : 'text-slate-500'}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};
