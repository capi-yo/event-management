"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/components/theme-provider"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Users,
    Search,
    Mail,
    Download,
    Eye,
    MoreHorizontal,
    CheckCircle,
    XCircle,
    Clock,
    Calendar,
    Loader2,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { eventsApi } from '@/lib/api'

export default function OrganiserAttendeesPage() {
    const { theme } = useTheme()
    const { toast } = useToast()
    const [searchQuery, setSearchQuery] = useState('')
    const [eventFilter, setEventFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [attendees, setAttendees] = useState<any[]>([])
    const [myEvents, setMyEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [stats, setStats] = useState({
        confirmed: 0,
        checkedIn: 0,
        pending: 0,
        totalRevenue: 0,
        totalAttendees: 0,
        cancelled: 0
    })
    const [exporting, setExporting] = useState(false)
    const ITEMS_PER_PAGE = 10

    // Dialog states
    const [selectedAttendee, setSelectedAttendee] = useState<any>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [cancelOpen, setCancelOpen] = useState(false)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [eventsRes, regRes] = await Promise.all([
                    eventsApi.getOrganizerEvents(),
                    eventsApi.getOrganizerRegistrations({
                        event_id: eventFilter !== 'all' ? eventFilter : undefined,
                        status: statusFilter !== 'all' ? statusFilter : undefined,
                        page: currentPage,
                        limit: ITEMS_PER_PAGE
                    })
                ])
                setMyEvents(eventsRes.data.events)
                setAttendees(regRes.data.registrations)
                setTotalPages(regRes.data.pagination?.totalPages || 1)
                if ((regRes.data as any).stats) {
                    setStats((regRes.data as any).stats)
                }
            } catch (err) {
                console.error('Failed to fetch organiser data:', err)
                setError('Failed to load attendees data')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [eventFilter, statusFilter, currentPage])

    const filteredAttendees = attendees.filter(attendee => {
        const matchesSearch = attendee.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            attendee.user_email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    })

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        const styles: Record<string, string> = {
            confirmed: theme === "dark" ? "bg-green-900/30 text-green-400 border-green-800" : "bg-green-100 text-green-700 border-green-200",
            rsvped: theme === "dark" ? "bg-green-900/30 text-green-400 border-green-800" : "bg-green-100 text-green-700 border-green-200",
            purchased: theme === "dark" ? "bg-blue-900/30 text-blue-400 border-blue-800" : "bg-blue-100 text-blue-700 border-blue-200",
            pending: theme === "dark" ? "bg-yellow-900/30 text-yellow-400 border-yellow-800" : "bg-yellow-100 text-yellow-700 border-yellow-200",
            cancelled: theme === "dark" ? "bg-red-900/30 text-red-400 border-red-800" : "bg-red-100 text-red-700 border-red-200",
            'checked-in': theme === "dark" ? "bg-blue-900/30 text-blue-400 border-blue-800" : "bg-blue-100 text-blue-700 border-blue-200",
        };
        return styles[s] || styles.pending;
    }

    const formatCurrency = (amount: number | null) => {
        if (amount === null || amount === undefined) return 'ETB 0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount);
    }

    const handleExport = async () => {
        try {
            setExporting(true)
            // Fetch all filtered registrations (not just current page)
            const res = await eventsApi.getOrganizerRegistrations({
                event_id: eventFilter !== 'all' ? eventFilter : undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                limit: 1000 // High limit to get everything
            })

            if (!res.success || !res.data.registrations.length) {
                toast({ title: "No data", description: "No attendees found to export", variant: "destructive" })
                return
            }

            const data = res.data.registrations
            const headers = ["Name", "Email", "Event", "Ticket Type", "Purchase Date", "Amount", "Status"]

            const csvRows = [
                headers.join(','),
                ...data.map(row => [
                    `"${row.user_name.replace(/"/g, '""')}"`,
                    `"${row.user_email.replace(/"/g, '""')}"`,
                    `"${row.event_title.replace(/"/g, '""')}"`,
                    `"${(row.ticket_type || 'General').replace(/"/g, '""')}"`,
                    `"${new Date(row.created_at).toLocaleDateString()}"`,
                    `"${formatCurrency(row.paid_amount).replace(/"/g, '""')}"`,
                    `"${row.status.replace(/"/g, '""')}"`
                ].join(','))
            ]

            const csvContent = csvRows.join('\n')
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.setAttribute('href', url)
            link.setAttribute('download', `attendees_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast({ title: "Success", description: "Attendee list exported successfully" })
        } catch (err) {
            console.error('Export failed:', err)
            toast({ title: "Error", description: "Failed to export attendee list", variant: "destructive" })
        } finally {
            setExporting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>Attendees</h1>
                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Manage event attendees and registrations</p>
                </div>
                <Button
                    variant="outline"
                    className={theme === "dark" ? "border-slate-700 hover:bg-slate-800" : ""}
                    onClick={handleExport}
                    disabled={exporting}
                >
                    {exporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                    Export List
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className={`border-none ${theme === "dark" ? "bg-slate-900 shadow-lg shadow-black/20" : "bg-white shadow-sm shadow-slate-200"}`}>
                    <CardContent className="p-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Confirmed</p>
                            <p className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-slate-50" : "text-slate-900"}`}>{stats.confirmed}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-none ${theme === "dark" ? "bg-slate-900 shadow-lg shadow-black/20" : "bg-white shadow-sm shadow-slate-200"}`}>
                    <CardContent className="p-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Checked In</p>
                            <p className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-slate-50" : "text-slate-900"}`}>{stats.checkedIn}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-none ${theme === "dark" ? "bg-slate-900 shadow-lg shadow-black/20" : "bg-white shadow-sm shadow-slate-200"}`}>
                    <CardContent className="p-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Pending</p>
                            <p className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-slate-50" : "text-slate-900"}`}>{stats.pending}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-none ${theme === "dark" ? "bg-slate-900 shadow-lg shadow-black/20" : "bg-white shadow-sm shadow-slate-200"}`}>
                    <CardContent className="p-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Cancelled</p>
                            <p className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-slate-50" : "text-slate-900"}`}>{stats.cancelled}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-none ${theme === "dark" ? "bg-slate-900 shadow-lg shadow-black/20" : "bg-white shadow-sm shadow-slate-200"}`}>
                    <CardContent className="p-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Total Attendees</p>
                            <p className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-slate-50" : "text-slate-900"}`}>{stats.totalAttendees}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`} />
                            <Input
                                placeholder="Search attendees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-10 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                            />
                        </div>
                        <Select value={eventFilter} onValueChange={setEventFilter}>
                            <SelectTrigger className={`w-[200px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                                <SelectValue placeholder="Filter by event" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                {myEvents.map(event => (
                                    <SelectItem key={event.id} value={event.id.toString()}>{event.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className={`w-[180px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="RSVPed">RSVPed</SelectItem>
                                <SelectItem value="Purchased">Purchased</SelectItem>
                                <SelectItem value="Checked-In">Checked In</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Attendees Table */}
            <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                <CardHeader>
                    <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>All Attendees</CardTitle>
                    <CardDescription className={theme === "dark" ? "text-slate-400" : ""}>View and manage event attendees</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-[#AC1212] mb-4" />
                            <p className="text-muted-foreground">Loading attendees...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500">{error}</p>
                            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>Try Again</Button>
                        </div>
                    ) : filteredAttendees.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No attendees found
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className={theme === "dark" ? "border-slate-800" : ""}>
                                        <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Attendee</TableHead>
                                        <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Event</TableHead>
                                        <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Ticket Type</TableHead>
                                        <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Purchase Date</TableHead>
                                        <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Amount</TableHead>
                                        <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Status</TableHead>
                                        <TableHead className={`text-right ${theme === "dark" ? "text-slate-400" : ""}`}>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAttendees.map((attendee) => (
                                        <TableRow key={attendee.id} className={theme === "dark" ? "border-slate-800" : ""}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className={theme === "dark" ? "bg-slate-700" : ""}>
                                                        <AvatarFallback className={theme === "dark" ? "bg-slate-600 text-slate-200" : ""}>{attendee.user_name.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{attendee.user_name}</p>
                                                        <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>{attendee.user_email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{attendee.event_title}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={theme === "dark" ? "border-slate-700 text-slate-300" : ""}>{attendee.ticket_type || 'General'}</Badge>
                                            </TableCell>
                                            <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{new Date(attendee.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{formatCurrency(attendee.paid_amount)}</TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusBadge(attendee.status)} border capitalize`}>
                                                    {attendee.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={`h-8 w-8 ${theme === "dark" ? "text-slate-400 hover:bg-slate-800" : ""}`}
                                                                onClick={() => {
                                                                    setSelectedAttendee(attendee)
                                                                    setDetailsOpen(true)
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>View Details</TooltipContent>
                                                    </Tooltip>
                                                    {(attendee.status === 'Confirmed' || attendee.status === 'RSVPed' || attendee.status === 'Purchased') && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={`h-8 w-8 ${theme === "dark" ? "text-green-400 hover:bg-slate-800" : "text-green-600"}`}
                                                                    onClick={async () => {
                                                                        try {
                                                                            await eventsApi.updateRegistrationStatus(attendee.id, 'Checked-In')
                                                                            toast({ title: "Success", description: "Attendee checked in successfully" })
                                                                            // Refresh data
                                                                            const regRes = await eventsApi.getOrganizerRegistrations({
                                                                                event_id: eventFilter !== 'all' ? eventFilter : undefined,
                                                                                status: statusFilter !== 'all' ? statusFilter : undefined,
                                                                                page: currentPage,
                                                                                limit: ITEMS_PER_PAGE
                                                                            })
                                                                            setAttendees(regRes.data.registrations)
                                                                        } catch (err: any) {
                                                                            toast({ title: "Error", description: err.message || "Failed to check in attendee", variant: "destructive" })
                                                                        }
                                                                    }}
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Check In</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {attendee.status === 'Pending' && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className={`h-8 w-8 ${theme === "dark" ? "text-amber-400 hover:bg-slate-800" : "text-amber-600"}`}
                                                                    onClick={async () => {
                                                                        try {
                                                                            // Confirmed means the payment is approved
                                                                            await eventsApi.updateRegistrationStatus(attendee.id, 'Confirmed')
                                                                            toast({ title: "Payment Approved", description: "Attendee registration has been confirmed." })
                                                                            // Refresh data
                                                                            const regRes = await eventsApi.getOrganizerRegistrations({
                                                                                event_id: eventFilter !== 'all' ? eventFilter : undefined,
                                                                                status: statusFilter !== 'all' ? statusFilter : undefined,
                                                                                page: currentPage,
                                                                                limit: ITEMS_PER_PAGE
                                                                            })
                                                                            setAttendees(regRes.data.registrations)
                                                                        } catch (err: any) {
                                                                            toast({ title: "Error", description: err.message || "Failed to approve payment", variant: "destructive" })
                                                                        }
                                                                    }}
                                                                >
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Approve Payment</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    {(attendee.status === 'Confirmed' || attendee.status === 'RSVPed' || attendee.status === 'Purchased') && (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                                                    onClick={async () => {
                                                                        try {
                                                                            await eventsApi.updateRegistrationStatus(attendee.id, 'Cancelled')
                                                                            toast({ title: "Success", description: "Registration cancelled successfully" })
                                                                            // Refresh data
                                                                            const regRes = await eventsApi.getOrganizerRegistrations({
                                                                                event_id: eventFilter !== 'all' ? eventFilter : undefined,
                                                                                status: statusFilter !== 'all' ? statusFilter : undefined,
                                                                                page: currentPage,
                                                                                limit: ITEMS_PER_PAGE
                                                                            })
                                                                            setAttendees(regRes.data.registrations)
                                                                        } catch (err: any) {
                                                                            toast({ title: "Error", description: err.message || "Failed to cancel registration", variant: "destructive" })
                                                                        }
                                                                    }}
                                                                >
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Cancel Registration</TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className={theme === "dark" ? "border-slate-700" : ""}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage >= totalPages}
                                        className={theme === "dark" ? "border-slate-700" : ""}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* View Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className={theme === "dark" ? "bg-slate-900 border-slate-700" : ""}>
                    <DialogHeader>
                        <DialogTitle className={theme === "dark" ? "text-slate-100" : ""}>Attendee Details</DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            Complete registration information
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAttendee && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className={`h-16 w-16 ${theme === "dark" ? "bg-slate-700" : ""}`}>
                                    <AvatarFallback className={theme === "dark" ? "bg-slate-600 text-slate-200 text-xl" : ""}>
                                        {selectedAttendee.user_name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className={`text-lg font-semibold ${theme === "dark" ? "text-slate-100" : ""}`}>{selectedAttendee.user_name}</p>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>{selectedAttendee.user_email}</p>
                                </div>
                            </div>
                            <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-slate-50"}`}>
                                <div>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Event</p>
                                    <p className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{selectedAttendee.event_title}</p>
                                </div>
                                <div>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Ticket Type</p>
                                    <p className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{selectedAttendee.ticket_type || 'General'}</p>
                                </div>
                                <div>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Purchase Date</p>
                                    <p className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{new Date(selectedAttendee.created_at).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Amount Paid</p>
                                    <p className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{formatCurrency(selectedAttendee.paid_amount)}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Status</p>
                                    <Badge className={`mt-1 ${getStatusBadge(selectedAttendee.status)} border capitalize`}>
                                        {selectedAttendee.status}
                                    </Badge>
                                </div>
                                {(selectedAttendee.payment_method || selectedAttendee.transaction_ref) && (
                                    <>
                                        <div className="col-span-2 mt-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <p className={`text-sm font-bold mb-3 ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>Payment Details</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs uppercase tracking-widest font-bold ${theme === "dark" ? "text-slate-500" : "text-muted-foreground"}`}>Bank / Method</p>
                                            <p className={`font-medium mt-1 ${theme === "dark" ? "text-slate-100" : ""}`}>{selectedAttendee.payment_method}</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs uppercase tracking-widest font-bold ${theme === "dark" ? "text-slate-500" : "text-muted-foreground"}`}>Transaction Ref</p>
                                            <p className={`font-mono text-sm font-bold mt-1 text-[#AC1212]`}>{selectedAttendee.transaction_ref}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
