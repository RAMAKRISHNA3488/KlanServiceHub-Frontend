import React, { useState, useEffect } from 'react';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';
import { useGetProjects } from '@/features/projects/api/use-get-projects';
import { useGetWorkspaces } from '@/features/workspaces/api/use-get-workspaces';
import { tasksApi } from '@/lib/api-client';
import { NotificationCenter } from './notification-center';
import { UserButton } from '@/features/auth/components/user-button';
import { JiraCreateIssueModal } from '@/features/tasks/components/jira-create-issue-modal';
import { WorkspaceSwitcherModal } from './workspace-switcher-modal';
import Link from 'next/link';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Search,
  Plus,
  ChevronDown,
  Settings,
  HelpCircle,
  Bookmark,
  CheckSquare,
  AlertCircle,
  Zap,
  FolderGit2,
  Users,
  LayoutDashboard,
  Kanban,
  Sparkles,
  Command,
} from 'lucide-react';

export const JiraTopNavbar = () => {
  const workspaceId = useWorkspaceId();
  const navigate = useNavigate();
  const { data: projectsData } = useGetProjects({ workspaceId });
  const { data: workspacesData } = useGetWorkspaces();

  const projects = projectsData?.documents || [];
  const workspaces = workspacesData?.documents || [];

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [workspaceSwitcherOpen, setWorkspaceSwitcherOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Keyboard shortcut: Press 'c' to create issue
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === 'c' || e.key === 'C') &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        setCreateModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    try {
      const res = await tasksApi.getTasks({ workspaceId, search: val });
      if (res?.data?.documents) {
        setSearchResults(res.data.documents.slice(0, 6));
        setSearchOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  return (
    <>
      <header className="h-12 w-full bg-white border-b border-neutral-200/90 px-4 flex items-center justify-between text-neutral-700 text-xs font-semibold select-none sticky top-0 z-40 shadow-xs">
        {/* Left Section: App Switcher + Logo + Menus */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Klanvision 9-dots */}
          <button
            onClick={() => setWorkspaceSwitcherOpen(true)}
            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-600 transition"
            title="Switch Workspace / Organization"
          >
            <Grid className="size-4 text-neutral-600" />
          </button>

          {/* klanservicehub Logo & Switcher Trigger */}
          <button
            onClick={() => setWorkspaceSwitcherOpen(true)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-neutral-100 transition mr-2"
          >
            <div className="size-5 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-[11px] shadow-xs">
              K
            </div>
            <span className="font-extrabold text-neutral-900 text-sm tracking-tight hidden md:inline">
              klanservicehub
            </span>
            <ChevronDown className="size-3 text-neutral-400" />
          </button>

          {/* Top Menus */}
          <div className="hidden lg:flex items-center gap-0.5">
            {/* Projects Menu */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown('projects')}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 font-semibold transition"
              >
                <span>Projects</span>
                <ChevronDown className="size-3 text-neutral-500" />
              </button>

              {activeDropdown === 'projects' && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                  <div className="absolute left-0 mt-1 z-50 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-xl animate-in fade-in">
                    <p className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1">Recent Projects</p>
                    {projects.map((p) => (
                      <Link
                        key={p.$id}
                        href={`/workspaces/${workspaceId}/projects/${p.$id}`}
                        onClick={() => setActiveDropdown(null)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-neutral-100 transition text-xs font-semibold text-neutral-800"
                      >
                        <FolderGit2 className="size-4 text-blue-600" />
                        <div>
                          <p className="truncate">{p.name}</p>
                          <span className="text-[10px] text-neutral-400 font-mono">{p.key || 'PROJ'}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dashboards Menu */}
            <Link
              href={`/workspaces/${workspaceId}/dashboards`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 font-semibold transition"
            >
              Dashboards
            </Link>

            {/* Sprints & Backlog Menu */}
            <Link
              href={`/workspaces/${workspaceId}/sprints`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 font-semibold transition"
            >
              Sprints & Backlog
            </Link>

            {/* Teams Menu */}
            <Link
              href={`/workspaces/${workspaceId}/teams-admin`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md hover:bg-neutral-100 text-neutral-700 font-semibold transition"
            >
              Teams
            </Link>
          </div>

          {/* Primary Quick Create Button */}
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1 text-xs font-bold text-white shadow-xs transition ml-1"
          >
            <Plus className="size-3.5 stroke-[3]" />
            <span>Create</span>
            <span className="hidden sm:inline-block font-mono text-[9px] bg-blue-700/80 px-1 rounded text-blue-100 ml-1">
              C
            </span>
          </button>
        </div>

        {/* Right Section: Search Bar + Notification + Settings + User */}
        <div className="flex items-center gap-2">
          {/* Global Jira Search */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 size-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setSearchOpen(true);
                }}
                placeholder="Search issues, boards... (/)"
                className="w-36 sm:w-56 rounded-md border border-neutral-200 bg-neutral-100/70 pl-8 pr-2.5 py-1 text-xs font-medium focus:w-72 focus:bg-white focus:border-blue-600 focus:outline-none transition-all shadow-inner"
              />
            </div>

            {/* Search Dropdown Results */}
            {searchOpen && searchResults.length > 0 && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSearchOpen(false)} />
                <div className="absolute right-0 mt-1.5 z-50 w-80 sm:w-96 rounded-xl border border-neutral-200 bg-white p-2 shadow-2xl animate-in fade-in">
                  <p className="text-[10px] uppercase font-bold text-neutral-400 px-3 py-1">Matching Issues</p>
                  <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
                    {searchResults.map((t) => (
                      <Link
                        key={t.$id || t.id}
                        href={`/workspaces/${workspaceId}/tasks/${t.$id || t.id}`}
                        onClick={() => setSearchOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-lg hover:bg-blue-50/60 transition group"
                      >
                        <div className="flex items-center gap-2">
                          <CheckSquare className="size-3.5 text-blue-600" />
                          <div>
                            <p className="font-bold text-neutral-900 group-hover:text-blue-600 transition truncate max-w-[200px]">
                              {t.name}
                            </p>
                            <span className="font-mono text-[10px] text-neutral-400">{t.key || 'TASK'}</span>
                          </div>
                        </div>
                        <span className="rounded bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-700">
                          {t.status}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <NotificationCenter />

          {/* Settings Quick Link */}
          <Link
            href={`/workspaces/${workspaceId}/company-profile`}
            className="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-600 transition"
            title="klanservicehub Settings"
          >
            <Settings className="size-4" />
          </Link>

          <div className="h-5 w-px bg-neutral-200 mx-1" />

          <UserButton />
        </div>
      </header>

      {/* Global Jira Issue Creation Modal */}
      <JiraCreateIssueModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreated={(issue) => {
          // If in tasks/board view, reload or trigger event
          window.dispatchEvent(new CustomEvent('jira-issue-created', { detail: issue }));
        }}
      />

      {/* Multi-Organization Workspace Switcher */}
      <WorkspaceSwitcherModal
        open={workspaceSwitcherOpen}
        onClose={() => setWorkspaceSwitcherOpen(false)}
      />
    </>
  );
};
