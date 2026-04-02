"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Calendar,
    Search,
    MapPin,
    Users,
    Clock,
    Eye,
    Edit,
    Trash2,
    Plus,
    Ticket,
    Banknote,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { useAuth } from '@/components/AuthContext'
import { eventsApi } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import LocationPicker from '@/components/LocationPicker'

export default function OrganiserEventsPage() {
    const { theme } = useTheme()
    const { user, userData } = useAuth()
    const router = useRouter()
    const { toast } = useToast()
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalEventsCount, setTotalEventsCount] = useState(0)
    const [stats, setStats] = useState<any>({
        total_events: 0,
        total_attendees: 0,
        total_revenue: 0,
        active_events: 0,
        events_by_status: { Pending: 0 }
    })
    const ITEMS_PER_PAGE = 12
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const [detailsOpen, setDetailsOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [ticketsOpen, setTicketsOpen] = useState(false)
    const [editFormData, setEditFormData] = useState<any>({})
    const [uploading, setUploading] = useState(false)

    // Redirect if not organizer or admin
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        } else if (!loading && user && userData?.role !== 'Organizer' && userData?.role !== 'Administrator') {
            router.push('/')
        }
    }, [user, userData, loading, router])

    useEffect(() => {
        const fetchOrganizerEvents = async () => {
            if (!user || (userData?.role !== 'Organizer' && userData?.role !== 'Administrator')) {
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                // Fetch events and stats in parallel
                const [eventsResponse, statsResponse] = await Promise.all([
                    eventsApi.getOrganizerEvents({ page: currentPage, limit: ITEMS_PER_PAGE }),
                    eventsApi.getOrganizerStats()
                ])
                setEvents(eventsResponse.data.events || [])
                setTotalPages(eventsResponse.data.pagination?.totalPages || 1)
                setTotalEventsCount(statsResponse.data.total_events || 0)
                setStats(statsResponse.data)
            } catch (err: any) {
                console.error('Failed to fetch organizer events:', err)
                setError('Failed to load your events')
            } finally {
                setLoading(false)
            }
        }

        fetchOrganizerEvents()
    }, [user, userData, currentPage])

    const filteredEvents = events.filter(event => {
        const matchesSearch = event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.category?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || event.status?.toLowerCase() === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            Approved: theme === "dark" ? "bg-green-900/30 text-green-400 border-green-800" : "bg-green-100 text-green-700 border-green-200",
            Pending: theme === "dark" ? "bg-yellow-900/30 text-yellow-400 border-yellow-800" : "bg-yellow-100 text-yellow-700 border-yellow-200",
            Rejected: theme === "dark" ? "bg-red-900/30 text-red-400 border-red-800" : "bg-red-100 text-red-700 border-red-200",
        }
        return styles[status] || styles.Pending
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount || 0)
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setUploading(true)
            const res = await eventsApi.uploadImage(file)
            if (res.success) {
                setEditFormData({ ...editFormData, image_url: res.data.imageUrl })
                toast({ title: "Success", description: "Image uploaded successfully" })
            } else {
                toast({ title: "Error", description: "Failed to upload image", variant: "destructive" })
            }
        } catch (err: any) {
            console.error('Image upload error:', err)
            toast({ title: "Error", description: err.message || "Failed to upload image", variant: "destructive" })
        } finally {
            setUploading(false)
        }
    }


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#AC1212]"></div>
            </div>
        )
    }

    if (!user || (userData?.role !== 'Organizer' && userData?.role !== 'Administrator')) {
        return null
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>My Events</h1>
                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Manage and track your events</p>
                </div>
                <Link href="/organiser/create">
                    <Button className={theme === "dark" ? "bg-primary" : ""}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Event
                    </Button>
                </Link>
            </div>

            {/* Error State */}
            {error && (
                <Card className="border-red-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-red-500">
                            <AlertCircle className="h-5 w-5" />
                            <p>{error}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className={`border-none ${theme === "dark" ? "bg-slate-900 shadow-lg shadow-black/20" : "bg-white shadow-sm shadow-slate-200"}`}>
                    <CardContent className="p-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Total Events</p>
                            <p className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-slate-50" : "text-slate-900"}`}>{stats.total_events}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-none ${theme === "dark" ? "bg-slate-900 shadow-lg shadow-black/20" : "bg-white shadow-sm shadow-slate-200"}`}>
                    <CardContent className="p-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Approved</p>
                            <p className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-slate-50" : "text-slate-900"}`}>{stats.active_events}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-none ${theme === "dark" ? "bg-slate-900 shadow-lg shadow-black/20" : "bg-white shadow-sm shadow-slate-200"}`}>
                    <CardContent className="p-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Pending</p>
                            <p className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-slate-50" : "text-slate-900"}`}>{stats.events_by_status.Pending || 0}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-none ${theme === "dark" ? "bg-slate-900 shadow-lg shadow-black/20" : "bg-white shadow-sm shadow-slate-200"}`}>
                    <CardContent className="p-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Total Attendees</p>
                            <p className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-slate-50" : "text-slate-900"}`}>{stats.total_attendees}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-none ${theme === "dark" ? "bg-slate-900 shadow-lg shadow-black/20" : "bg-white shadow-sm shadow-slate-200"}`}>
                    <CardContent className="p-6">
                        <div className="space-y-1 text-center sm:text-left">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Total Revenue</p>
                            <p className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-slate-50" : "text-slate-900"}`}>{formatCurrency(stats.total_revenue)}</p>
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
                                placeholder="Search events..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-10 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className={`w-[180px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Events Table */}
            {filteredEvents.length === 0 ? (
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6 text-center py-12">
                        <Calendar className={`mx-auto h-12 w-12 mb-4 ${theme === "dark" ? "text-slate-500" : "text-muted-foreground"}`} />
                        <h2 className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-slate-100" : ""}`}>No events yet</h2>
                        <p className={`mb-4 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Create your first event to get started</p>
                        <Link href="/organiser/create">
                            <Button className="bg-[#AC1212] hover:bg-[#8a0f0f]">
                                <Plus className="h-4 w-4 mr-2" />
                                Create Event
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardHeader>
                        <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>All Events</CardTitle>
                        <CardDescription className={theme === "dark" ? "text-slate-400" : ""}>View and manage your events</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className={theme === "dark" ? "border-slate-800" : ""}>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Event</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Category</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Location</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Attendees</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Status</TableHead>
                                    <TableHead className={`text-right ${theme === "dark" ? "text-slate-400" : ""}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEvents.map((event) => (
                                    <TableRow key={event.id} className={theme === "dark" ? "border-slate-800" : ""}>
                                        <TableCell className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{event.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={theme === "dark" ? "border-slate-700 text-slate-300" : ""}>{event.category}</Badge>
                                        </TableCell>
                                        <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{event.location_venue || 'TBD'}</TableCell>
                                        <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{event.registration_count || 0}/{event.capacity || '∞'}</TableCell>
                                        <TableCell>
                                            <Badge className={`${getStatusBadge(event.status)} border capitalize`}>
                                                {event.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className={`h-8 w-8 ${theme === "dark" ? "text-slate-400 hover:bg-slate-800" : ""}`} onClick={() => { setSelectedEvent(event); setDetailsOpen(true); }}>
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View Details</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className={`h-8 w-8 ${theme === "dark" ? "text-slate-400 hover:bg-slate-800" : ""}`} onClick={() => {
                                                            // Format date and time for input fields
                                                            const eventCopy = { ...event };
                                                            if (eventCopy.date) {
                                                                eventCopy.date = eventCopy.date.split('T')[0];
                                                            }
                                                            if (eventCopy.time) {
                                                                // Ensure time is in HH:MM format for input
                                                                eventCopy.time = eventCopy.time.substring(0, 5);
                                                            }
                                                            setSelectedEvent(event);
                                                            setEditFormData(eventCopy);
                                                            setEditOpen(true);
                                                        }}>
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Edit Event</TooltipContent>
                                                </Tooltip>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button variant="ghost" size="icon" className={`h-8 w-8 ${theme === "dark" ? "text-slate-400 hover:bg-slate-800" : ""}`} onClick={() => { setSelectedEvent(event); setTicketsOpen(true); }}>
                                                            <Ticket className="h-4 w-4" />
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>View Tickets</TooltipContent>
                                                </Tooltip>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <div className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className={theme === "dark" ? "border-slate-700" : ""}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className={theme === "dark" ? "border-slate-700" : ""}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Event Details Dialog */}
            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className={theme === "dark" ? "bg-slate-900 border-slate-700" : ""}>
                    <DialogHeader>
                        <DialogTitle className={theme === "dark" ? "text-slate-100" : ""}>
                            {selectedEvent?.title}
                        </DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            Event Details
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="space-y-4 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Date</p>
                                    <p className={theme === "dark" ? "text-slate-100" : ""}>{selectedEvent.date}</p>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Time</p>
                                    <p className={theme === "dark" ? "text-slate-100" : ""}>{selectedEvent.time || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Location</p>
                                    <p className={theme === "dark" ? "text-slate-100" : ""}>{selectedEvent.location_venue || 'TBD'}</p>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Category</p>
                                    <Badge variant="outline" className={theme === "dark" ? "border-slate-700 text-slate-300" : ""}>
                                        {selectedEvent.category}
                                    </Badge>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Capacity</p>
                                    <p className={theme === "dark" ? "text-slate-100" : ""}>{selectedEvent.capacity || 'Unlimited'}</p>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Status</p>
                                    <Badge className={`${getStatusBadge(selectedEvent.status)} border capitalize`}>
                                        {selectedEvent.status}
                                    </Badge>
                                </div>
                            </div>
                            {selectedEvent.description && (
                                <div>
                                    <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Description</p>
                                    <p className={`mt-1 ${theme === "dark" ? "text-slate-100" : ""}`}>{selectedEvent.description}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Event Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className={`max-h-[90vh] overflow-y-auto ${theme === "dark" ? "bg-slate-900 border-slate-700" : ""}`}>
                    <DialogHeader>
                        <DialogTitle className={theme === "dark" ? "text-slate-100" : ""}>
                            Edit Event
                        </DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            Update event details for {selectedEvent?.title}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="space-y-4 mt-4">
                            <div>
                                <label className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Title</label>
                                <Input
                                    value={editFormData.title || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                                    className={`mt-1 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Date</label>
                                    <Input
                                        type="date"
                                        value={editFormData.date || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                                        className={`mt-1 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                                    />
                                </div>
                                <div>
                                    <label className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Time</label>
                                    <Input
                                        type="time"
                                        value={editFormData.time || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                                        className={`mt-1 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Location</label>
                                <Input
                                    value={editFormData.location_venue || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, location_venue: e.target.value })}
                                    className={`mt-1 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                                />
                            </div>
                            <div>
                                <label className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Category</label>
                                <Input
                                    value={editFormData.category || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                    className={`mt-1 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                                />
                            </div>
                            <div>
                                <label className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Description</label>
                                <Input
                                    value={editFormData.description || ''}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    className={`mt-1 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Event Location</label>
                                <p className="text-xs text-gray-500 mb-2">Click on the map to update the event location</p>
                                <LocationPicker
                                    latitude={editFormData.location_latitude}
                                    longitude={editFormData.location_longitude}
                                    onLocationSelect={(lat, lng) => {
                                        setEditFormData({ 
                                            ...editFormData, 
                                            location_latitude: lat,
                                            location_longitude: lng
                                        });
                                    }}
                                    height="300px"
                                />
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div>
                                        <label className="text-xs text-gray-500">Latitude</label>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={editFormData.location_latitude || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, location_latitude: parseFloat(e.target.value) })}
                                            className={`text-sm ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500">Longitude</label>
                                        <Input
                                            type="number"
                                            step="any"
                                            value={editFormData.location_longitude || ''}
                                            onChange={(e) => setEditFormData({ ...editFormData, location_longitude: parseFloat(e.target.value) })}
                                            className={`text-sm ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Event Image</label>
                                {editFormData.image_url && (
                                    <div className="aspect-video w-full rounded-lg overflow-hidden border">
                                        <img
                                            src={editFormData.image_url.startsWith('http') ? editFormData.image_url : `${API_BASE_URL}${editFormData.image_url}`}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}
                                <div className="flex gap-2">
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="edit-image-upload"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => document.getElementById('edit-image-upload')?.click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Plus className="h-4 w-4 mr-2" />
                                        )}
                                        {editFormData.image_url ? 'Change Image' : 'Upload Image'}
                                    </Button>
                                    <Input
                                        placeholder="Or image URL..."
                                        value={editFormData.image_url || ''}
                                        onChange={(e) => setEditFormData({ ...editFormData, image_url: e.target.value })}
                                        className={`flex-[2] h-9 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="outline" onClick={() => setEditOpen(false)} className={theme === "dark" ? "border-slate-700" : ""}>
                                    Cancel
                                </Button>
                                <Button
                                    className="bg-[#AC1212] hover:bg-[#8a0f0f]"
                                    onClick={async () => {
                                        try {
                                            await eventsApi.updateEvent(selectedEvent.id, editFormData)
                                            toast({ title: "Success", description: "Event updated successfully" })
                                            setEditOpen(false)
                                            // Refresh events list
                                            const response = await eventsApi.getOrganizerEvents({ page: currentPage, limit: ITEMS_PER_PAGE })
                                            setEvents(response.data.events || [])
                                        } catch (err: any) {
                                            let errorMsg = err.message || "Failed to update event"
                                            if (err.errors && Array.isArray(err.errors)) {
                                                errorMsg = `Validation failed: ${err.errors.map((e: any) => e.message).join('. ')}`
                                            }
                                            toast({ title: "Error", description: errorMsg, variant: "destructive" })
                                        }
                                    }}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* View Tickets Dialog */}
            <Dialog open={ticketsOpen} onOpenChange={setTicketsOpen}>
                <DialogContent className={theme === "dark" ? "bg-slate-900 border-slate-700" : ""}>
                    <DialogHeader>
                        <DialogTitle className={theme === "dark" ? "text-slate-100" : ""}>
                            Event Tickets
                        </DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            View tickets for {selectedEvent?.title}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="mt-4">
                            <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-gray-100"}`}>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                    Total Tickets Sold: <span className={theme === "dark" ? "text-slate-100" : ""}>{selectedEvent.ticket_count || 0}</span>
                                </p>
                                <p className={`text-sm mt-2 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                    Capacity: <span className={theme === "dark" ? "text-slate-100" : ""}>{selectedEvent.capacity || 'Unlimited'}</span>
                                </p>
                                <p className={`text-sm mt-2 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                    Registrations: <span className={theme === "dark" ? "text-slate-100" : ""}>{selectedEvent.registration_count || 0}</span>
                                </p>
                            </div>
                            <div className="flex justify-end mt-4">
                                <Button variant="outline" onClick={() => setTicketsOpen(false)} className={theme === "dark" ? "border-slate-700" : ""}>
                                    Close
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
