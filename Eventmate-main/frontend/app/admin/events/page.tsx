"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/components/theme-provider"
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Search,
    Calendar,
    MapPin,
    Users,
    Eye,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCcw,
    AlertCircle,
    Trash2,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { adminApi } from '@/lib/api'

export default function AdminEventsPage() {
    const { theme } = useTheme()
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [eventToDelete, setEventToDelete] = useState<number | null>(null)

    const fetchEvents = useCallback(async () => {
        try {
            setLoading(true)
            const res = await adminApi.getEvents({
                page,
                limit: 10,
                status: statusFilter === 'all' ? undefined : statusFilter,
                category: categoryFilter === 'all' ? undefined : categoryFilter
            })
            if (res.success) {
                setEvents(res.data.events)
                setPagination(res.data.pagination)
            }
            setError(null)
        } catch (err: any) {
            console.error('Error fetching events:', err)
            setError(err.message || 'Failed to fetch events')
        } finally {
            setLoading(false)
        }
    }, [page, statusFilter, categoryFilter])

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    const handleUpdateStatus = async (eventId: number, status: string) => {
        try {
            const res = await adminApi.updateEventStatus(eventId, status)
            if (res.success) {
                setSuccessMessage(`Event ${status.toLowerCase()} successfully.`)
                setTimeout(() => setSuccessMessage(null), 3000)
                fetchEvents()
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update event status')
            setTimeout(() => setError(null), 5000)
        }
    }

    const handleDeleteEvent = async (eventId: number) => {
        try {
            const res = await adminApi.deleteEvent(eventId)
            if (res.success) {
                setSuccessMessage('Event deleted successfully.')
                setTimeout(() => setSuccessMessage(null), 3000)
                fetchEvents()
            }
        } catch (err: any) {
            setError(err.message || 'Failed to delete event')
            setTimeout(() => setError(null), 5000)
        }
    }

    const confirmDelete = async () => {
        if (eventToDelete) {
            await handleDeleteEvent(eventToDelete)
            setDeleteDialogOpen(false)
            setEventToDelete(null)
        }
    }

    const filteredEvents = events.filter(event => {
        const title = event.title || ''
        const location = event.location_venue || ''
        const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            location.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    })

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'Approved': theme === "dark" ? "bg-green-900/30 text-green-400 border-green-800 font-normal" : "bg-green-100 text-green-700 border-green-200 font-normal",
            'Pending': theme === "dark" ? "bg-yellow-900/30 text-yellow-400 border-yellow-800 font-normal" : "bg-yellow-100 text-yellow-700 border-yellow-200 font-normal",
            'Rejected': theme === "dark" ? "bg-red-900/30 text-red-400 border-red-800 font-normal" : "bg-red-100 text-red-700 border-red-200 font-normal",
            'Cancelled': theme === "dark" ? "bg-slate-800 text-slate-400 border-slate-700 font-normal" : "bg-slate-100 text-slate-700 border-slate-200 font-normal",
        };
        return styles[status] || styles.Pending;
    }

    if (error && events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-red-500 font-medium">{error}</p>
                <Button onClick={fetchEvents} className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Retry
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Notifications */}
            {successMessage && (
                <div className="bg-green-500/10 border border-green-500/50 text-green-500 px-4 py-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle className="h-4 w-4" />
                    <p className="text-sm font-medium">{successMessage}</p>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>Event Management</h1>
                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Review and manage platform events</p>
                </div>
                <Button onClick={fetchEvents} variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`} />
                            <Input
                                placeholder="Search events by title or location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-10 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className={`w-[180px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Rejected">Rejected</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className={`w-[180px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="Art">Art</SelectItem>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Food">Food</SelectItem>
                                <SelectItem value="Health">Health</SelectItem>
                                <SelectItem value="Music">Music</SelectItem>
                                <SelectItem value="Sports">Sports</SelectItem>
                                <SelectItem value="Technology">Technology</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Events Table */}
            <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                <CardHeader>
                    <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>All Events</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow className={theme === "dark" ? "border-slate-800 hover:bg-transparent" : "hover:bg-transparent"}>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Event</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Organizer</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Date</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Status</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Attendees</TableHead>
                                    <TableHead className={`text-right ${theme === "dark" ? "text-slate-400" : ""}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && events.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                            <p className="mt-2 text-muted-foreground text-sm">Loading events...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredEvents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                            No events found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredEvents.map((event) => (
                                        <TableRow key={event.id} className={theme === "dark" ? "border-slate-800" : ""}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{event.title}</span>
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                        <MapPin className="h-3 w-3" />
                                                        {event.location_venue}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{event.organizer_name}</TableCell>
                                            <TableCell className={theme === "dark" ? "text-slate-300" : ""}>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {new Date(event.date).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusBadge(event.status)}>
                                                    {event.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={theme === "dark" ? "text-slate-300" : ""}>
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3 text-muted-foreground" />
                                                    {event.registered_count || 0} / {event.capacity || '∞'}
                                                </div>
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
                                                                    setSelectedEvent(event)
                                                                    setViewDialogOpen(true)
                                                                }}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>View Details</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                                                                onClick={() => {
                                                                    setEventToDelete(event.id)
                                                                    setDeleteDialogOpen(true)
                                                                }}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Delete Event</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    {event.status === 'Pending' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                                                onClick={() => handleUpdateStatus(event.id, 'Approved')}
                                                                title="Approve Event"
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                                onClick={() => handleUpdateStatus(event.id, 'Rejected')}
                                                                title="Reject Event"
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800">
                        <div className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={pagination.page <= 1}
                                className={theme === "dark" ? "border-slate-700 hover:bg-slate-800" : ""}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous
                            </Button>
                            <span className={`text-sm ${theme === "dark" ? "text-slate-300" : ""}`}>
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                disabled={pagination.page >= pagination.totalPages}
                                className={theme === "dark" ? "border-slate-700 hover:bg-slate-800" : ""}
                            >
                                Next
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* View Event Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className={theme === "dark" ? "bg-slate-900 border-slate-800" : ""}>
                    <DialogHeader>
                        <DialogTitle>Event Details</DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            Complete information about this event
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                                <Badge className={`mt-2 ${getStatusBadge(selectedEvent.status)}`}>
                                    {selectedEvent.status}
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Category</p>
                                    <p className="font-medium">{selectedEvent.category}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Date</p>
                                    <p className="font-medium">{new Date(selectedEvent.date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Time</p>
                                    <p className="font-medium">{selectedEvent.time || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Capacity</p>
                                    <p className="font-medium">{selectedEvent.capacity || 'Unlimited'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Location</p>
                                    <p className="font-medium">{selectedEvent.location_venue}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Description</p>
                                    <p className="font-medium">{selectedEvent.description || 'No description'}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Organizer</p>
                                    <p className="font-medium">{selectedEvent.organizer_name || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Registered</p>
                                    <p className="font-medium">{selectedEvent.registered_count || 0} / {selectedEvent.capacity || '∞'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className={theme === "dark" ? "bg-slate-900 border-slate-800" : ""}>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            Are you sure you want to delete this event? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
