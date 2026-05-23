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
import { io, type Socket } from "socket.io-client";

const POLL_INTERVAL_MS = 30_000; // Backup polling interval

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  socketConnected: boolean;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const knownIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);

  // Request browser notification permissions gracefully
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(console.error);
      }
    }
  }, []);

  // Browser Push Notification Helper
  const showPushNotification = useCallback((message: string) => {
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("EventMate", {
          body: message,
          icon: "/favicon.ico",
        });
      } catch (err) {
        console.error("Failed to show push notification:", err);
      }
    }
  }, []);

  const showNewNotificationToasts = useCallback((incoming: Notification[]) => {
    const unread = incoming.filter((n) => !n.is_read);
    const fresh = unread.filter((n) => !knownIdsRef.current.has(n.id));

    fresh.forEach((notification) => {
      // 1. Show Toast
      toast({
        title: "New Notification",
        description: notification.message,
        duration: 5000,
      });

      // 2. Show Desktop Push Notification
      showPushNotification(notification.message);
    });
  }, [showPushNotification]);

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
      const notifyRole = user.role === 'Registered User' ? 'User' : user.role;
      const response = await notificationsApi.getMyNotifications(notifyRole);
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

  // Socket.IO Setup
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setSocketConnected(false);
      return;
    }

    const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    
    // Connect to WebSocket Server
    const socket: Socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to real-time notification socket");
      setSocketConnected(true);
      socket.emit("join", user.id);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from real-time notification socket");
      setSocketConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("Socket connection error, using polling fallback:", err.message);
      setSocketConnected(false);
    });

    // Listen for new notifications in real-time
    socket.on("notification", (newNotif: Notification) => {
      console.log("Real-time notification received:", newNotif);

      setNotifications((prev) => {
        // Prevent duplicate real-time notifications
        if (prev.some((n) => n.id === newNotif.id)) return prev;
        
        const updated = [newNotif, ...prev];
        setUnreadCount(updated.filter((n) => !n.is_read).length);
        knownIdsRef.current.add(newNotif.id);
        
        // Show Toast
        toast({
          title: "New Notification",
          description: newNotif.message,
          duration: 5000,
        });

        // Show Push Notification
        showPushNotification(newNotif.message);

        return updated;
      });
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("notification");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, showPushNotification]);

  // Polling fallback when socket is not connected
  useEffect(() => {
    if (!user) return;

    // Run first refresh
    void refresh();

    const interval = setInterval(() => {
      // Only poll if socket is not active/connected
      if (!socketConnected) {
        console.log("Socket disconnected, polling notifications...");
        void refresh();
      }
    }, POLL_INTERVAL_MS);

    const onFocus = () => {
      // Refresh on tab focus
      void refresh();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [user, refresh, socketConnected]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refresh,
        markAsRead,
        markAllAsRead,
        socketConnected,
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
