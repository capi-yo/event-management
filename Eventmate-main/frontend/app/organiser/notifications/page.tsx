"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import {
    Bell,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Users,
    Ticket,
    Banknote,
    AlertTriangle,
    Info,
    CheckSquare,
    Trash2,
    Eye,
    Loader2,
    Plus,
    Send,
    MessageSquare,
    ChevronRight
} from "lucide-react"
import { notificationsApi, Notification, eventsApi } from '@/lib/api'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export default function OrganiserNotificationsPage() {
    const { theme } = useTheme()
    const { toast } = useToast()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState<'all' | 'unread'>('all')

    // Details Dialog State
    const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    // Compose State
    const [isComposeOpen, setIsComposeOpen] = useState(false)
    const [events, setEvents] = useState<any[]>([])
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedEventId, setSelectedEventId] = useState<string>('')
    const [message, setMessage] = useState('')
    const [sending, setSending] = useState(false)

    useEffect(() => {
        fetchNotifications()
        fetchInitialData()
    }, []);

    const fetchInitialData = async () => {
        try {
            const [eventsRes, templatesRes] = await Promise.all([
                eventsApi.getOrganizerEvents({ limit: 100 }),
                notificationsApi.getTemplates()
            ])
            if (eventsRes.success) setEvents(eventsRes.data.events)
            if (templatesRes.success) setTemplates(templatesRes.data.templates)
        } catch (err) {
            console.error('Failed to fetch initial data:', err)
        }
    }

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const response = await notificationsApi.getMyNotifications()
            if (response.success) {
                setNotifications(response.data.notifications)
            }
        } catch (err: any) {
            console.error('Failed to fetch notifications:', err)
            setError('Failed to load notifications')
        } finally {
            setLoading(false)
        }
    }

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.is_read;
        return true;
    })

    const getTypeIcon = (message: string) => {
        const msg = message.toLowerCase();
        if (msg.includes('approved') || msg.includes('success') || msg.includes('received')) return CheckCircle;
        if (msg.includes('warning') || msg.includes('refund')) return AlertTriangle;
        if (msg.includes('error') || msg.includes('failed')) return XCircle;
        return Info;
    }

    const getTypeStyles = (message: string) => {
        const msg = message.toLowerCase();
        if (msg.includes('approved') || msg.includes('success') || msg.includes('received'))
            return theme === "dark" ? "bg-green-900/20 text-green-400" : "bg-green-100 text-green-600";
        if (msg.includes('warning') || msg.includes('refund'))
            return theme === "dark" ? "bg-yellow-900/20 text-yellow-400" : "bg-yellow-100 text-yellow-600";
        if (msg.includes('error') || msg.includes('failed'))
            return theme === "dark" ? "bg-red-900/20 text-red-400" : "bg-red-100 text-red-600";
        return theme === "dark" ? "bg-blue-900/20 text-blue-400" : "bg-blue-100 text-blue-600";
    }

    const markAsRead = async (id: number) => {
        try {
            await notificationsApi.markAsRead(id)
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
        } catch (err) {
            console.error('Failed to mark as read:', err)
        }
    }

    const markAllAsRead = async () => {
        try {
            await notificationsApi.markAllAsRead()
            setNotifications(notifications.map(n => ({ ...n, is_read: true })))
        } catch (err) {
            console.error('Failed to mark all as read:', err)
        }
    }

    const handleViewDetails = (notification: Notification) => {
        setSelectedNotification(notification)
        setIsDetailsOpen(true)
        if (!notification.is_read) {
            markAsRead(notification.id)
        }
    }

    const handleSend = async () => {
        if (!selectedEventId || !message.trim()) {
            toast({
                title: "Error",
                description: "Please select an event and enter a message.",
                variant: "destructive"
            })
            return
        }

        try {
            setSending(true)
            await notificationsApi.send(null, parseInt(selectedEventId), message)
            toast({
                title: "Success",
                description: "Notifications sent to all attendees."
            })
            setIsComposeOpen(false)
            setMessage('')
            setSelectedEventId('')
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to send notifications",
                variant: "destructive"
            })
        } finally {
            setSending(false)
        }
    }

    const applyTemplate = (templateMsg: string) => {
        const event = events.find(e => e.id.toString() === selectedEventId)
        let processedMsg = templateMsg

        if (event) {
            processedMsg = processedMsg
                .replace('{event_title}', event.title)
                .replace('{event_date}', new Date(event.date).toLocaleDateString())
                .replace('{event_time}', event.time)
        } else {
            // Keep placeholders if no event selected yet
        }

        setMessage(processedMsg)
    }

    const unreadCount = notifications.filter(n => !n.is_read).length

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#AC1212]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>Notifications</h1>
                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Stay updated with your activities</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#AC1212] hover:bg-[#8a0f0f] text-white shadow-lg shadow-red-900/10">
                                <Plus className="h-4 w-4 mr-2" />
                                Compose
                            </Button>
                        </DialogTrigger>
                        <DialogContent className={`sm:max-w-[500px] ${theme === "dark" ? "bg-slate-900 border-slate-800" : ""}`}>
                            <DialogHeader>
                                <DialogTitle className={theme === "dark" ? "text-slate-100" : ""}>Compose Notification</DialogTitle>
                                <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                                    Send a message to all attendees of one of your events.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className={`text-sm font-semibold ${theme === "dark" ? "text-slate-200" : ""}`}>Select Event</label>
                                    <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                                        <SelectTrigger className={theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-100" : ""}>
                                            <SelectValue placeholder="Chose an event" />
                                        </SelectTrigger>
                                        <SelectContent className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}>
                                            {events
                                                .filter(event => parseInt(event.registration_count) > 0)
                                                .map((event) => (
                                                    <SelectItem key={event.id} value={event.id.toString()}>
                                                        {event.title}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className={`text-sm font-semibold ${theme === "dark" ? "text-slate-200" : ""}`}>Message</label>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-[#AC1212] hover:bg-[#AC1212]/10 transition-colors">
                                                    Use Template
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className={`w-64 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                                                <div className="p-2">
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 px-2`}>Quick Templates</p>
                                                    {templates.map((template) => (
                                                        <DropdownMenuItem
                                                            key={template.id}
                                                            onClick={() => applyTemplate(template.message)}
                                                            className={`text-xs cursor-pointer ${theme === "dark" ? "hover:bg-slate-700 text-slate-300" : ""}`}
                                                        >
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="font-semibold">{template.name}</span>
                                                                <span className="text-[10px] text-muted-foreground line-clamp-1">{template.message}</span>
                                                            </div>
                                                        </DropdownMenuItem>
                                                    ))}
                                                </div>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <Textarea
                                        placeholder="Type your message here..."
                                        className={`min-h-[120px] resize-none ${theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-red-600" : "focus:ring-[#AC1212]"}`}
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 px-1 py-1 bg-muted/30 rounded">
                                        <Info className="h-3 w-3" />
                                        <span>Use placeholders like {`{event_title}`} to personalize.</span>
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsComposeOpen(false)}
                                    disabled={sending}
                                    className={theme === "dark" ? "border-slate-700 text-slate-300 hover:bg-slate-800" : ""}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSend}
                                    disabled={sending || !selectedEventId || !message.trim()}
                                    className="bg-[#AC1212] hover:bg-[#8a0f0f] text-white min-w-[100px]"
                                >
                                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Send</>}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={markAllAsRead} className={theme === "dark" ? "border-slate-700 text-slate-300 hover:bg-slate-800" : ""}>
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Mark All Read
                        </Button>
                    )}
                </div>
            </div>

            {/* Error State */}
            {error && (
                <Card className="border-red-500">
                    <CardContent className="pt-6">
                        <p className="text-red-500">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Notifications List */}
            <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>All Notifications</CardTitle>
                        <CardDescription className={theme === "dark" ? "text-slate-400" : ""}>Your recent notifications</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={filter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('all')}
                            className={theme === "dark" ? (filter === 'all' ? "bg-primary" : "border-slate-700") : ""}
                        >
                            All
                        </Button>
                        <Button
                            variant={filter === 'unread' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilter('unread')}
                            className={theme === "dark" ? (filter === 'unread' ? "bg-primary" : "border-slate-700") : ""}
                        >
                            Unread ({unreadCount})
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredNotifications.map((notification) => {
                            const TypeIcon = getTypeIcon(notification.message)
                            return (
                                <div
                                    key={notification.id}
                                    className={`flex items-start gap-4 p-4 rounded-lg border transition-colors cursor-pointer ${theme === "dark"
                                        ? notification.is_read
                                            ? "border-slate-800 hover:bg-slate-800/50"
                                            : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/70"
                                        : notification.is_read
                                            ? "border-gray-200 hover:bg-gray-50"
                                            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                                        }`}
                                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                                >
                                    <div className={`p-2 rounded-full ${getTypeStyles(notification.message)}`}>
                                        <TypeIcon className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>
                                                {notification.message.split(':')[0].split('.')[0]}
                                            </p>
                                            {!notification.is_read && (
                                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                            )}
                                        </div>
                                        <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"} mt-1 line-clamp-1`}>
                                            {notification.message}
                                        </p>
                                        <p className={`text-xs ${theme === "dark" ? "text-slate-500" : "text-muted-foreground"} mt-2`}>
                                            {new Date(notification.sent_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className={`h-8 w-8 ${theme === "dark" ? "text-slate-400 hover:bg-slate-800" : ""}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewDetails(notification);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}>
                                                    <p>View Details</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                </div>
                            )
                        })}
                        {filteredNotifications.length === 0 && (
                            <div className="text-center py-12">
                                <Bell className={`h-12 w-12 mx-auto mb-4 ${theme === "dark" ? "text-slate-600" : "text-muted-foreground"}`} />
                                <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>No notifications</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className={`sm:max-w-[500px] ${theme === "dark" ? "bg-slate-900 border-slate-800" : ""}`}>
                    <DialogHeader>
                        <DialogTitle className={`flex items-center gap-2 ${theme === "dark" ? "text-slate-100" : ""}`}>
                            <Bell className="h-5 w-5 text-[#AC1212]" />
                            Notification Details
                        </DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            Full message content and details.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedNotification && (
                        <div className="space-y-6 py-4">
                            <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-slate-800/50 border border-slate-700" : "bg-muted/50 border border-muted-foreground/10"}`}>
                                <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-slate-200" : "text-foreground"}`}>
                                    {selectedNotification.message}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Type</p>
                                    <Badge className={getTypeStyles(selectedNotification.message)}>
                                        {selectedNotification.message.toLowerCase().includes('approved') ? 'System' :
                                            selectedNotification.message.toLowerCase().includes('update') ? 'Event' : 'General'}
                                    </Badge>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Received</p>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-300" : ""}`}>
                                        {new Date(selectedNotification.sent_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            onClick={() => setIsDetailsOpen(false)}
                            className="bg-[#AC1212] hover:bg-[#8a0f0f] text-white"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
