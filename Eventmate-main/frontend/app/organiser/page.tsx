"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useTheme } from "@/components/theme-provider"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Users,
    Calendar,
    Ticket,
    Banknote,
    TrendingUp,
    Plus,
    Eye,
    Clock,
    CheckCircle2,
    CalendarDays,
    BarChart3,
    Bell,
    Loader2,
    PlusCircle,
} from "lucide-react"
import { eventsApi, notificationsApi } from "@/lib/api"
import Link from "next/link"

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const s = status ? status.toLowerCase() : 'unknown';
    const styles: Record<string, string> = {
        active: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
        approved: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
        upcoming: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
        draft: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
        confirmed: "bg-green-500/10 text-green-500",
        rsvped: "bg-green-500/10 text-green-500",
        purchased: "bg-blue-500/10 text-blue-500",
        pending: "bg-yellow-500/10 text-yellow-500",
        cancelled: "bg-red-500/10 text-red-500",
        success: "bg-green-500/10 text-green-500",
        info: "bg-blue-500/10 text-blue-500",
        warning: "bg-yellow-500/10 text-yellow-500",
    }

    return (
        <Badge className={styles[s] || styles.info}>
            {status ? (status.charAt(0).toUpperCase() + status.slice(1)) : 'Unknown'}
        </Badge>
    )
}

// Quick Action Button
function QuickAction({ icon: Icon, label, href }: { icon: React.ElementType, label: string, href: string }) {
    const { theme } = useTheme()

    return (
        <Button asChild variant="outline" className={`h-auto py-4 flex-col gap-2 ${theme === "dark" ? "border-slate-700 hover:bg-slate-800" : ""}`}>
            <Link href={href}>
                <Icon className={`h-5 w-5 ${theme === "dark" ? "text-slate-400" : ""}`} />
                <span className={`text-xs ${theme === "dark" ? "text-slate-400" : ""}`}>{label}</span>
            </Link>
        </Button>
    )
}

export default function OrganiserDashboard() {
    const { theme } = useTheme()
    const [stats, setStats] = useState<any>(null)
    const [myEvents, setMyEvents] = useState<any[]>([])
    const [recentAttendees, setRecentAttendees] = useState<any[]>([])
    const [notifications, setNotifications] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true)
                const [statsRes, eventsRes, attendeesRes, notifyRes] = await Promise.all([
                    eventsApi.getOrganizerStats(),
                    eventsApi.getOrganizerEvents({ limit: 5 }),
                    eventsApi.getOrganizerRegistrations({ limit: 5 }),
                    notificationsApi.getMyNotifications()
                ])
                setStats(statsRes.data)
                setMyEvents(eventsRes.data.events)
                setRecentAttendees(attendeesRes.data.registrations)
                setNotifications(notifyRes.data.notifications.slice(0, 5))
            } catch (error) {
                console.error("Failed to fetch dashboard data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchDashboardData()
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organizer Dashboard</h1>
                    <p className="text-muted-foreground">Welcome back! Here's how your events are performing.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild className="bg-[#AC1212] hover:bg-[#8a0f0f]">
                        <Link href="/organiser/create">
                            <Plus className="mr-2 h-4 w-4" /> Create Event
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <QuickAction icon={PlusCircle} label="New Event" href="/organiser/create" />
                <QuickAction icon={Users} label="View Attendees" href="/organiser/attendees" />
                <QuickAction icon={Ticket} label="View Tickets" href="/organiser/tickets" />
                <QuickAction icon={Bell} label="Notifications" href="/organiser/notifications" />
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-[#AC1212]" />
                    <p className="text-muted-foreground">Loading dashboard data...</p>
                </div>
            ) : (
                <>
                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className={theme === "dark" ? "border-slate-800 bg-slate-900/50" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total_events || 0}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats?.active_events || 0} active, {stats?.pending_events || 0} pending
                                </p>
                            </CardContent>
                        </Card>
                        <Card className={theme === "dark" ? "border-slate-800 bg-slate-900/50" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.total_attendees || 0}</div>
                            </CardContent>
                        </Card>
                        <Card className={theme === "dark" ? "border-slate-800 bg-slate-900/50" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                                <Banknote className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</div>
                            </CardContent>
                        </Card>
                        <Card className={theme === "dark" ? "border-slate-800 bg-slate-900/50" : ""}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
                                <Ticket className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {stats?.total_events > 0
                                        ? Math.round((stats.active_events / stats.total_events) * 100)
                                        : 0}%
                                </div>
                                <p className="text-xs text-muted-foreground">Based on all submissions</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-7">
                        {/* My Events Table */}
                        <Card className={`lg:col-span-4 ${theme === "dark" ? "border-slate-800 bg-slate-900/50" : ""}`}>
                            <CardHeader>
                                <CardTitle>My Events</CardTitle>
                                <CardDescription>Recent events you've created.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {myEvents.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-muted-foreground">No events found.</p>
                                        <Button asChild variant="link" className="mt-2">
                                            <Link href="/organiser/create">Create your first event</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Event</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {myEvents.map((event) => (
                                                <TableRow key={event.id}>
                                                    <TableCell className="font-medium">{event.title}</TableCell>
                                                    <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <StatusBadge status={event.status} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" asChild>
                                                            <Link href={`/events`}>
                                                                <Eye className="h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Attendees */}
                        <Card className={`lg:col-span-3 ${theme === "dark" ? "border-slate-800 bg-slate-900/50" : ""}`}>
                            <CardHeader>
                                <CardTitle>Recent Attendees</CardTitle>
                                <CardDescription>People who registered for your events.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentAttendees.length === 0 ? (
                                        <p className="text-center py-10 text-muted-foreground">No recent attendees.</p>
                                    ) : (
                                        recentAttendees.map((attendee) => (
                                            <div key={attendee.id} className="flex items-center gap-4">
                                                <Avatar>
                                                    <AvatarFallback>{attendee.user_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 space-y-1">
                                                    <p className="text-sm font-medium leading-none">{attendee.user_name}</p>
                                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                                        Registered for {attendee.event_title}
                                                    </p>
                                                </div>
                                                <StatusBadge status={attendee.status} />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Actions Banner - Gradient CTA */}
                    <Card className={theme === "dark" ? "border-slate-800 bg-slate-900/50" : "bg-slate-50 border-slate-200"}>
                        <CardContent className="pt-6 pb-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className={`text-xl font-bold ${theme === "dark" ? "text-slate-100" : "text-slate-900"}`}>Ready to grow your audience?</h3>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Create a new event and start selling tickets today.</p>
                                </div>
                                <Button asChild className="bg-[#AC1212] hover:bg-[#8a0f0f] text-white font-semibold">
                                    <Link href="/organiser/create">
                                        <Plus className="h-5 w-5 mr-2" />
                                        Create New Event
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
