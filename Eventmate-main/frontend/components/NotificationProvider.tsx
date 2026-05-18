"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthContext";
import { notificationsApi, type Notification } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

const POLL_INTERVAL_MS = 15_000;

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);

  const showNewNotificationToasts = useCallback((incoming: Notification[]) => {
    const unread = incoming.filter((n) => !n.is_read);
    const fresh = unread.filter((n) => !knownIdsRef.current.has(n.id));

    fresh.forEach((notification) => {
      toast({
        title: "New notification",
        description: notification.message,
        duration: 6000,
      });
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      knownIdsRef.current = new Set();
      initializedRef.current = false;
      return;
    }

    try {
      setLoading(true);
      const response = await notificationsApi.getMyNotifications();
      if (!response.success) return;

      const list = response.data.notifications ?? [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.is_read).length);

      if (initializedRef.current) {
        showNewNotificationToasts(list);
      } else {
        initializedRef.current = true;
      }

      knownIdsRef.current = new Set(list.map((n) => n.id));
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [user, showNewNotificationToasts]);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await notificationsApi.markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      knownIdsRef.current = new Set();
      initializedRef.current = false;
      return;
    }

    void refresh();
    const interval = setInterval(() => void refresh(), POLL_INTERVAL_MS);

    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, refresh]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refresh,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}
