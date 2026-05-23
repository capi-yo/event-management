"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthNavbar from "@/components/AuthNavbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/AuthContext";
import { useNotifications } from "@/components/NotificationProvider";
import { Bell, Check, Loader2 } from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-crimson" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AuthNavbar />
      <main className="container mx-auto flex-1 px-4 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "You are all caught up"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => void refresh()}>
                Refresh
              </Button>
              {unreadCount > 0 && (
                <Button onClick={() => void markAllAsRead()}>Mark all read</Button>
              )}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-crimson" />
                Recent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && notifications.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No notifications yet.
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start justify-between gap-3 rounded-lg border p-4 ${
                      !notification.is_read ? "bg-muted/40" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm ${!notification.is_read ? "font-semibold" : "text-muted-foreground"}`}
                      >
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(notification.sent_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => void markAsRead(notification.id)}
                        aria-label="Mark as read"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
