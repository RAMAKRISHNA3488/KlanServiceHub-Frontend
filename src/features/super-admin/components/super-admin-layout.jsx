import React, { useState } from 'react';
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
  TrendingUp,
  CreditCard,
  Menu,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useSuperAdminCurrent, useSuperAdminHealth } from '../api/super-admin-api';
import { platformAdminApi } from '@/lib/api-client';

export const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useSuperAdminCurrent();
  const { data: health, refetch: refetchHealth } = useSuperAdminHealth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await platformAdminApi.logout();
    } finally {
      navigate('/super-admin/login', { replace: true });
    }
  };

  const navSections = [
    {
      title: 'COMMERCIALS & TELEMETRY',
      items: [
        { label: 'Platform Summary', path: '/super-admin/dashboard', icon: LayoutDashboard },
        { label: 'Revenue & Profits', path: '/super-admin/financials', icon: TrendingUp },
        { label: 'Customize Billing', path: '/super-admin/billing', icon: CreditCard },
      ],
    },
    {
      title: 'TENANT GOVERNANCE',
      items: [
        { label: 'All Organizations', path: '/super-admin/organizations', icon: Building2 },
        { label: 'Users Directory', path: '/super-admin/users', icon: Users },
      ],
    },
    {
      title: 'SECURITY & INFRASTRUCTURE',
      items: [
        { label: 'Platform Audit Trail', path: '/super-admin/audit-logs', icon: FileText },
        { label: 'System Diagnostics', path: '/super-admin/system-health', icon: Activity },
      ],
    },
  ];

  const currentNavItem = navSections
    .flatMap((s) => s.items)
    .find((item) => location.pathname === item.path || (item.path === '/super-admin/dashboard' && location.pathname === '/super-admin'));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-rose-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. DEDICATED MASTER SUPER ADMIN SIDEBAR (DESKTOP) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-64 xl:w-72 flex-col bg-slate-950 border-r border-slate-850 shrink-0 select-none">
        {/* Brand & Badge Header */}
        <div className="h-16 px-5 border-b border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 p-0.5 shadow-lg shadow-rose-950/50">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-tight text-white">KlanServiceHub</span>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  SUPER ADMIN
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Master Plane</span>
              </div>
            </div>
          </div>
        </div>

        {/* Master Navigation Links */}
        <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto scrollbar-none">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold mb-2">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path || (item.path === '/super-admin/dashboard' && location.pathname === '/super-admin');
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                      active
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-md shadow-rose-950/20 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-rose-400' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Master Footer: User Profile Card & Sign Out */}
        <div className="p-3 border-t border-slate-850 bg-slate-950/80">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-xs font-bold text-rose-300 shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SA'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{user?.name || 'Super Administrator'}</div>
                <div className="text-[10px] font-mono text-slate-400 truncate">{user?.email || 'superadmin@klanservicehub.com'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
              <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Master Auth
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 font-medium transition-colors"
                title="Terminate Master Session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Session</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MOBILE DRAWER (RESPONSIVE) */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 bg-slate-950 border-r border-slate-800 flex flex-col h-full z-10 p-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-rose-500" />
                <span className="font-bold text-sm text-white">Super Admin Control</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 space-y-5 overflow-y-auto">
              {navSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-[10px] font-mono uppercase text-slate-500 px-2">{sec.title}</div>
                  {sec.items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-900"
                    >
                      <item.icon className="w-4 h-4 text-slate-400" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 text-xs font-semibold text-rose-400 hover:bg-slate-850"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Master Console</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE / CONTROL PLANE BODY */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Master Control Top Bar */}
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-850 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 hover:text-white"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {currentNavItem?.label || 'Super Admin Console'}
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  Global Tenant Master
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400">
                Cross-tenant governance, revenue, profit ledger, billing customization, and platform security.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Cloudflare D1 & Edge Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-400">Edge D1:</span>
              <span className="text-emerald-400 font-bold">
                {health?.database?.latencyMs ? `${health.database.latencyMs}ms` : 'Operational'}
              </span>
              <span className="text-slate-700">•</span>
              <span className="text-slate-400">MFA Enforced</span>
            </div>

            <button
              onClick={() => refetchHealth()}
              title="Refresh Edge Health"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              title="Terminate Master Session"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/50 hover:text-rose-400 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
