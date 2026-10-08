'use client';
import React from 'react';
import Link from 'next/link';
import { useLocation } from 'react-router-dom';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { LayoutDashboard, Columns3, CheckSquare, Plus, Menu } from 'lucide-react';

export const MobileBottomNav = () => {
  const workspaceId = useWorkspaceId();
  const location = useLocation();

  if (!workspaceId) return null;

  const pathname = location.pathname;

  const isHome = pathname === `/workspaces/${workspaceId}` || pathname === `/workspaces/${workspaceId}/`;
  const isBoards = pathname.includes('/boards');
  const isTasks = pathname.includes('/tasks');

  const handleOpenCreate = () => {
    window.dispatchEvent(new CustomEvent('klanservicehub-open-create-issue'));
  };

  const handleOpenMenu = () => {
    window.dispatchEvent(new CustomEvent('klanservicehub-open-mobile-sidebar'));
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 px-2 py-1 flex items-center justify-around lg:hidden shadow-lg select-none">
      {/* 1. Home / Summary */}
      <Link
        href={`/workspaces/${workspaceId}`}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          isHome ? 'text-blue-600 font-bold' : 'text-neutral-500 hover:text-neutral-900 font-medium'
        }`}
      >
        <LayoutDashboard className={`size-5 ${isHome ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
      </Link>

      {/* 2. Boards */}
      <Link
        href={`/workspaces/${workspaceId}/boards`}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          isBoards ? 'text-blue-600 font-bold' : 'text-neutral-500 hover:text-neutral-900 font-medium'
        }`}
      >
        <Columns3 className={`size-5 ${isBoards ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Boards</span>
      </Link>

      {/* 3. Center Quick Create Button */}
      <div className="flex flex-col items-center justify-center flex-1 -mt-5">
        <button
          type="button"
          onClick={handleOpenCreate}
          className="size-11 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md flex items-center justify-center ring-4 ring-[#F4F5F7] transition"
          title="Create Issue / Task"
        >
          <Plus className="size-6 stroke-[3]" />
        </button>
        <span className="text-[10px] mt-1 text-neutral-600 font-bold tracking-tight">Create</span>
      </div>

      {/* 4. Tasks */}
      <Link
        href={`/workspaces/${workspaceId}/tasks`}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition ${
          isTasks ? 'text-blue-600 font-bold' : 'text-neutral-500 hover:text-neutral-900 font-medium'
        }`}
      >
        <CheckSquare className={`size-5 ${isTasks ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Tasks</span>
      </Link>

      {/* 5. Menu / All Sections */}
      <button
        type="button"
        onClick={handleOpenMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 text-neutral-500 hover:text-neutral-900 font-medium transition active:scale-95"
      >
        <Menu className="size-5 stroke-2" />
        <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
      </button>
    </nav>
  );
};
