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
  Zap,
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
    <div className="min-h-screen bg-[#F4F5F7] text-neutral-900 flex font-sans selection:bg-blue-600 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. DEDICATED MASTER SUPER ADMIN SIDEBAR (IMAGE-MATCHED LIGHT THEME) */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-64 xl:w-70 flex-col bg-white border-r border-neutral-200/90 shrink-0 select-none shadow-sm">
        {/* Brand & Badge Header */}
        <div className="h-16 px-5 border-b border-neutral-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-neutral-900">
                  klanservicehub
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  SUPER ADMIN
                </span>
                <span className="text-[10px] text-neutral-500 font-medium">Master Plane</span>
              </div>
            </div>
          </div>
        </div>

        {/* Master Navigation Links */}
        <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto scrollbar-none">
          {navSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                {section.title}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = location.pathname === item.path || (item.path === '/super-admin/dashboard' && location.pathname === '/super-admin');
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                      active
                        ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200/80'
                        : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : 'text-neutral-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Master Footer: User Profile Card & Sign Out */}
        <div className="p-3 border-t border-neutral-200/80 bg-neutral-50/50">
          <div className="p-3 rounded-xl bg-white border border-neutral-200/90 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'SA'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-neutral-900 truncate">{user?.name || 'Super Administrator'}</div>
                <div className="text-[11px] text-neutral-500 truncate">{user?.email || 'superadmin@klanservicehub.com'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[11px]">
              <span className="text-emerald-700 font-mono text-[10px] font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Master Auth
              </span>
              <button
                onClick={handleLogout}
                className="text-xs text-neutral-500 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors"
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
      {/* 2. MOBILE DRAWER (RESPONSIVE LIGHT THEME) */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative w-72 bg-white border-r border-neutral-200 flex flex-col h-full z-10 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
                <span className="font-bold text-sm text-neutral-900">Super Admin Control</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-neutral-500 p-1 hover:text-neutral-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 py-4 space-y-5 overflow-y-auto">
              {navSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-[10px] font-bold uppercase text-neutral-400 px-2">{sec.title}</div>
                  {sec.items.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                    >
                      <item.icon className="w-4 h-4 text-neutral-500" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-neutral-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-neutral-100 text-xs font-semibold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="w-4 h-4" />
                <span>Exit Master Console</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MAIN WORKSPACE / CONTROL PLANE BODY (MATCHING IMAGE BACKGROUND) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Master Control Top Bar */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200/90 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200"
            >
              <Menu className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                  {currentNavItem?.label || 'Super Admin Console'}
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Global Tenant Master
                </span>
              </div>
              <p className="hidden md:block text-xs text-neutral-500">
                Multi-tenant governance, live commercial revenue & profit margins, and billing customization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Live Cloudflare D1 & Edge Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono font-medium text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Edge Live:</span>
              <span className="font-bold text-emerald-700">
                {health?.database?.latencyMs ? `${health.database.latencyMs}ms` : 'Cloudflare D1'}
              </span>
              <span className="text-emerald-300">•</span>
              <span className="text-emerald-700">MFA Enforced</span>
            </div>

            <button
              onClick={() => refetchHealth()}
              title="Refresh Live Telemetry"
              className="p-2 rounded-xl bg-white border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 shadow-sm transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleLogout}
              title="Terminate Master Session"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 border border-neutral-200 text-xs font-semibold text-neutral-700 shadow-sm transition"
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
