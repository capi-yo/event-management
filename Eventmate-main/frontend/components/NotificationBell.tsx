'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, Check, Info, CheckCircle, AlertTriangle, XCircle, BellOff } from 'lucide-react';
import { notificationsApi, Notification } from '@/lib/api';
import { useTheme } from '@/components/theme-provider';

export default function NotificationBell() {
    const { user } = useAuth();
    const { theme } = useTheme();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Poll for notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const fetchNotifications = async () => {
        try {
            const response = await notificationsApi.getMyNotifications();
            if (response.success) {
                setNotifications(response.data.notifications);
                setUnreadCount(response.data.notifications.filter(n => !n.is_read).length);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationsApi.markAsRead(id);
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead();
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getTypeIcon = (message: string) => {
        const msg = message.toLowerCase();
        if (msg.includes('approved') || msg.includes('success') || msg.includes('received')) return CheckCircle;
        if (msg.includes('warning') || msg.includes('refund')) return AlertTriangle;
        if (msg.includes('error') || msg.includes('failed')) return XCircle;
        return Info;
    };

    const getTypeStyles = (message: string) => {
        const msg = message.toLowerCase();
        if (msg.includes('approved') || msg.includes('success') || msg.includes('received'))
            return "text-green-500 bg-green-500/10";
        if (msg.includes('warning') || msg.includes('refund'))
            return "text-yellow-500 bg-yellow-500/10";
        if (msg.includes('error') || msg.includes('failed'))
            return "text-red-500 bg-red-500/10";
        return "text-blue-500 bg-blue-500/10";
    };

    if (!user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-[#AC1212] transition-colors">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-[#AC1212] text-white border-0 text-[10px] animate-in zoom-in duration-300">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={`w-80 sm:w-96 ${theme === "dark" ? "bg-slate-900 border-slate-800" : ""}`}>
                <div className="flex items-center justify-between p-4 pb-2">
                    <h3 className={`font-bold text-base ${theme === "dark" ? "text-slate-100" : ""}`}>Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs h-auto p-0 hover:bg-transparent text-[#AC1212] font-semibold"
                        >
                            Mark all as read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator className={theme === "dark" ? "bg-slate-800" : ""} />
                <div className="max-h-[400px] overflow-y-auto scrollbar-hide py-1">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => {
                            const Icon = getTypeIcon(notification.message);
                            return (
                                <div
                                    key={notification.id}
                                    className={`group px-4 py-3 flex gap-3 transition-colors ${!notification.is_read
                                            ? theme === "dark" ? "bg-slate-800/40" : "bg-muted/30"
                                            : "hover:bg-muted/20"
                                        }`}
                                >
                                    <div className={`mt-0.5 p-1.5 rounded-full h-fit ${getTypeStyles(notification.message)}`}>
                                        <Icon className="h-3.5 w-3.5" />
                                    </div>
                                    <div className="flex-1 space-y-1 overflow-hidden">
                                        <p className={`text-sm leading-snug break-words ${!notification.is_read ? 'font-semibold' : 'text-muted-foreground'}`}>
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5">
                                            <span>{new Date(notification.sent_at).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                            <span>{new Date(notification.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 mt-0.5 text-muted-foreground hover:text-[#AC1212] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleMarkAsRead(notification.id);
                                            }}
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                                <BellOff className="h-6 w-6 text-muted-foreground/60" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">No new notifications yet.</p>
                        </div>
                    )}
                </div>
                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator className={theme === "dark" ? "bg-slate-800" : ""} />
                        <Link href={user.role === 'Organizer' ? "/organiser/notifications" : "/profile"} className="block p-2">
                            <Button variant="ghost" className="w-full text-xs font-semibold py-1 h-8 text-muted-foreground hover:text-[#AC1212]">
                                View all notifications
                            </Button>
                        </Link>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
