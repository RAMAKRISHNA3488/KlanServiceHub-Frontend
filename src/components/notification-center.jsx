import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, RefreshCw, Settings, Sparkles } from 'lucide-react';
import { notificationsApi } from '@/lib/api-client';
import { useWorkspaceId } from '@/features/workspaces/hooks/use-workspace-id';

export const NotificationCenter = () => {
  const workspaceId = useWorkspaceId();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await notificationsApi.getNotifications(workspaceId);
      if (res?.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchNotifications();
      const interval = setInterval(() => fetchNotifications(true), 30 * 60 * 1000); // 30 minutes
      return () => clearInterval(interval);
    }
  }, [workspaceId]);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.$id === id || n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead(workspaceId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (!open) fetchNotifications();
        }}
        className="relative flex size-8 items-center justify-center rounded-lg border border-neutral-200/90 bg-white text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900 shadow-2xs"
        title="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-4 h-4 px-1 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-2xs ring-1.5 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 z-50 w-80 sm:w-96 rounded-xl border border-neutral-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-neutral-100 bg-neutral-50/80 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-800 text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition"
                  >
                    <CheckCheck className="size-3.5" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="p-1 text-neutral-400 hover:text-neutral-700 rounded hover:bg-neutral-200/50 transition"
                  title="Refresh"
                >
                  <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            <div className="max-h-[380px] overflow-y-auto divide-y divide-neutral-100">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-neutral-400">
                  <Sparkles className="size-8 text-neutral-300 mb-2" />
                  <p className="text-sm font-medium text-neutral-600">All caught up!</p>
                  <p className="text-xs text-neutral-400 mt-1">No notifications at this moment.</p>
                </div>
              ) : (
                notifications.map((n) => {
                  const isRead = Boolean(n.is_read);
                  return (
                    <div
                      key={n.$id || n.id}
                      className={`flex items-start gap-3 p-3.5 text-left transition hover:bg-neutral-50/80 ${
                        !isRead ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div
                        className={`mt-0.5 size-2 rounded-full shrink-0 ${
                          !isRead ? 'bg-blue-600' : 'bg-transparent'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold text-neutral-900 truncate">{n.title}</p>
                          <span className="text-[10px] text-neutral-400 shrink-0">
                            {new Date(n.created_at || n.$createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                      {!isRead && (
                        <button
                          onClick={(e) => handleMarkAsRead(n.$id || n.id, e)}
                          title="Mark as read"
                          className="text-neutral-400 hover:text-blue-600 p-1 shrink-0"
                        >
                          <CheckCheck className="size-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
