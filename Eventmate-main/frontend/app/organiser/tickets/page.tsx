"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "@/components/theme-provider"
import { useRouter } from 'next/navigation'
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import PriceDisplay from "@/components/PriceDisplay"
import {
    discountFieldsFromPercentage,
    validateDiscountPercentage,
} from "@/lib/pricing"
import {
    Ticket,
    Search,
    Download,
    Eye,
    MoreHorizontal,
    Banknote,
    Users,
    CheckCircle,
    Clock,
    XCircle,
    Loader2,
    Edit,
    Trash2,
    AlertCircle,
} from "lucide-react"
import { useAuth } from '@/components/AuthContext'
import { eventsApi } from '@/lib/api'
import { FeedbackButton } from '@/components/FeedbackButton'
import { useButtonFeedback } from '@/hooks/useButtonFeedback'

export default function OrganiserTicketsPage() {
    const { user, loading: authLoading } = useAuth()
    const { theme } = useTheme()
    const router = useRouter()
    const [tickets, setTickets] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [eventFilter, setEventFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [exporting, setExporting] = useState(false)
    const [selectedTicket, setSelectedTicket] = useState<any | null>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [saving, setSaving] = useState(false)
    const saveEditFeedback = useButtonFeedback()
    const [editForm, setEditForm] = useState({ name: '', price: '', capacity: '', discountPercentage: '0' })
    const [editDiscountError, setEditDiscountError] = useState<string | null>(null)
    const { toast } = useToast()

    const fetchTickets = async () => {
        try {
            setLoading(true)
            const res = await eventsApi.getOrganizerTickets({ limit: 100 }) // Fetch more for initial view
            if (res.success) {
                setTickets(res.data.tickets)
            }
        } catch (err: any) {
            console.error('Error fetching tickets:', err)
            setError('Failed to fetch ticket data')
        } finally {
            setLoading(false)
        }
    }

    const handleViewTicket = (ticket: any) => {
        setSelectedTicket(ticket)
        setViewDialogOpen(true)
    }

    const handleEditTicket = (ticket: any) => {
        setSelectedTicket(ticket)
        const pct =
            ticket.discount_type === 'percentage'
                ? String(ticket.discount_value ?? ticket.discount_percentage ?? 0)
                : '0'
        setEditForm({
            name: ticket.type,
            price: ticket.price.toString(),
            capacity: ticket.capacity?.toString() || '0',
            discountPercentage: pct,
        })
        setEditDiscountError(null)
        setEditDialogOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!selectedTicket) return

        const discountErr = validateDiscountPercentage(editForm.discountPercentage)
        if (discountErr) {
            setEditDiscountError(discountErr)
            return
        }

        const discount = discountFieldsFromPercentage(editForm.discountPercentage)

        try {
            setSaving(true)
            await eventsApi.updateTicketCategory(selectedTicket.id, {
                name: editForm.name,
                price: editForm.price,
                capacity: editForm.capacity,
                discount_percentage: String(discount.discount_value),
                discount_type: discount.discount_type,
                discount_value: String(discount.discount_value),
            })
            
            toast({
                title: "Ticket Updated",
                description: "The ticket category has been updated successfully.",
            })

            saveEditFeedback.showSaved()
            fetchTickets()
            setTimeout(() => {
                setEditDialogOpen(false)
                setSelectedTicket(null)
            }, 1000)
        } catch (err: any) {
            toast({
                title: "Update Failed",
                description: err.message || "Failed to update ticket category",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteTicket = (ticket: any) => {
        setSelectedTicket(ticket)
        setDeleteDialogOpen(true)
    }

    const confirmDelete = async () => {
        if (!selectedTicket) return

        try {
            setDeleting(true)
            await eventsApi.deleteTicketCategory(selectedTicket.id)
            
            toast({
                title: "Ticket Deleted",
                description: "The ticket category has been removed.",
            })
            
            setDeleteDialogOpen(false)
            setSelectedTicket(null)
            fetchTickets() // Refresh the list
        } catch (err: any) {
            toast({
                title: "Delete Failed",
                description: err.message || "Failed to delete ticket category",
                variant: "destructive"
            })
        } finally {
            setDeleting(false)
        }
    }

    const handleExport = async () => {
        try {
            setExporting(true)
            toast({
                title: "Exporting Report",
                description: "Preparing your CSV file...",
            })

            // Fetch all tickets for export (use a high limit)
            const res = await eventsApi.getOrganizerTickets({ limit: 1000 })

            if (!res.success || !res.data.tickets) {
                throw new Error("Failed to fetch tickets for export")
            }

            const exportData = res.data.tickets.filter((ticket: any) => {
                const matchesSearch = ticket.id?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ticket.type.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesEvent = eventFilter === 'all' || ticket.event === eventFilter;
                const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
                return matchesSearch && matchesEvent && matchesStatus;
            })

            if (exportData.length === 0) {
                toast({
                    title: "No Data",
                    description: "No tickets found matching current filters.",
                    variant: "destructive"
                })
                return
            }

            // Define CSV headers
            const headers = ["Ticket ID", "Event", "Ticket Type", "Price", "Sold", "Revenue", "Status"]

            // Map data to rows
            const csvRows = exportData.map((t: any) => [
                `TKT-${t.id}`,
                `"${t.event.replace(/"/g, '""')}"`,
                `"${t.type.replace(/"/g, '""')}"`,
                t.price,
                t.sold,
                t.revenue,
                t.status
            ])

            // Combine headers and rows
            const csvContent = [
                headers.join(","),
                ...csvRows.map(row => row.join(","))
            ].join("\n")

            // Create blob and download
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.setAttribute("href", url)
            link.setAttribute("download", `ticket_report_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = "hidden"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)

            toast({
                title: "Export Successful",
                description: `Exported ${exportData.length} ticket types to CSV.`,
            })
        } catch (err: any) {
            console.error('Export error:', err)
            toast({
                title: "Export Failed",
                description: "An error occurred while generating the CSV.",
                variant: "destructive"
            })
        } finally {
            setExporting(false)
        }
    }

    useEffect(() => {
        if (authLoading || !user || (user.role !== 'Organizer' && user.role !== 'Administrator')) {
            return
        }
        fetchTickets()
    }, [user, authLoading])

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.id?.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.type.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesEvent = eventFilter === 'all' || ticket.event === eventFilter;
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
        return matchesSearch && matchesEvent && matchesStatus;
    })

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            active: theme === "dark" ? "bg-green-900/30 text-green-400 border-green-800" : "bg-green-100 text-green-700 border-green-200",
            soldout: theme === "dark" ? "bg-red-900/30 text-red-400 border-red-800" : "bg-red-100 text-red-700 border-red-200",
            draft: theme === "dark" ? "bg-slate-800 text-slate-400 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200",
        };
        return styles[status] || styles.draft;
    }

    const formatCurrency = (amount: number) => {
        // Handle string revenue from SQL aggregate
        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(value || 0);
    }

    const uniqueEvents = [...new Set(tickets.map(t => t.event))]
    const activeTickets = tickets.filter(t => t.status === 'active').length
    const totalSold = tickets.reduce((sum, t) => sum + parseInt(t.sold || 0), 0)
    const totalRevenue = tickets.reduce((sum, t) => sum + parseFloat(t.revenue || 0), 0)

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-12 w-12 animate-spin text-crimson" />
            </div>
        )
    }

    if (!user || (user.role !== 'Organizer' && user.role !== 'Administrator')) {
        return null
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>Tickets</h1>
                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Manage ticket types and pricing</p>
                </div>
                <Button
                    variant="outline"
                    className={theme === "dark" ? "border-slate-700 hover:bg-slate-800" : ""}
                    onClick={handleExport}
                    disabled={exporting || tickets.length === 0}
                >
                    {exporting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4 mr-2" />
                    )}
                    Export Report
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Ticket className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{tickets.length}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Total Ticket Types</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Ticket className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{activeTickets}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/10">
                                <Users className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{totalSold}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Tickets Sold</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Banknote className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{formatCurrency(totalRevenue)}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Total Revenue</p>
                            </div>
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
                                placeholder="Search tickets..."
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
                                {uniqueEvents.map(event => (
                                    <SelectItem key={event} value={event}>{event}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className={`w-[180px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="soldout">Sold Out</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets Table */}
            <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                <CardHeader>
                    <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>Ticket Types</CardTitle>
                    <CardDescription className={theme === "dark" ? "text-slate-400" : ""}>Manage your ticket types and track sales</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className={theme === "dark" ? "border-slate-800" : ""}>
                                <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Ticket ID</TableHead>
                                <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Event</TableHead>
                                <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Type</TableHead>
                                <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Price</TableHead>
                                <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Sold</TableHead>
                                <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Revenue</TableHead>
                                <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Status</TableHead>
                                <TableHead className={`text-right ${theme === "dark" ? "text-slate-400" : ""}`}>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && tickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                        <p className="mt-2 text-muted-foreground text-sm">Loading tickets...</p>
                                    </TableCell>
                                </TableRow>
                            ) : filteredTickets.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20 text-muted-foreground">
                                        No ticket types found.
                                    </TableCell>
                                </TableRow>
                            ) : filteredTickets.map((ticket) => (
                                <TableRow key={ticket.id} className={theme === "dark" ? "border-slate-800" : ""}>
                                    <TableCell className={`font-mono text-sm ${theme === "dark" ? "text-slate-300" : ""}`}>TKT-{ticket.id}</TableCell>
                                    <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{ticket.event}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={theme === "dark" ? "border-slate-700 text-slate-300" : ""}>{ticket.type}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <PriceDisplay
                                            price={ticket.price}
                                            discountType={ticket.discount_type}
                                            discountValue={ticket.discount_value ?? ticket.discount_percentage}
                                            size="sm"
                                        />
                                    </TableCell>
                                    <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{ticket.sold}</TableCell>
                                    <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{formatCurrency(ticket.revenue)}</TableCell>
                                    <TableCell>
                                        <Badge className={`${getStatusBadge(ticket.status)} border capitalize`}>
                                            {ticket.status === 'soldout' && <XCircle className="w-3 h-3 mr-1" />}
                                            {ticket.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                                            {ticket.status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
                                            {ticket.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className={`h-8 w-8 ${theme === "dark" ? "text-slate-400 hover:bg-slate-800" : ""}`}
                                                onClick={() => handleViewTicket(ticket)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className={`h-8 w-8 ${theme === "dark" ? "text-slate-400 hover:bg-slate-800" : ""}`}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className={theme === "dark" ? "bg-slate-900 border-slate-800" : ""}>
                                                    <DropdownMenuLabel className={theme === "dark" ? "text-slate-300" : ""}>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator className={theme === "dark" ? "bg-slate-800" : ""} />
                                                    <DropdownMenuItem 
                                                        onClick={() => handleViewTicket(ticket)}
                                                        className={theme === "dark" ? "text-slate-300 focus:bg-slate-800" : ""}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                        onClick={() => handleEditTicket(ticket)}
                                                        className={theme === "dark" ? "text-slate-300 focus:bg-slate-800" : ""}
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit Ticket
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className={theme === "dark" ? "bg-slate-800" : ""} />
                                                    <DropdownMenuItem 
                                                        onClick={() => handleDeleteTicket(ticket)}
                                                        className={theme === "dark" ? "text-red-400 focus:bg-slate-800 focus:text-red-400" : "text-red-600 focus:text-red-600"}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* View Ticket Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className={theme === "dark" ? "bg-slate-900 border-slate-800" : ""}>
                    <DialogHeader>
                        <DialogTitle className={theme === "dark" ? "text-slate-100" : ""}>Ticket Details</DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            View detailed information about this ticket category
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTicket && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Ticket ID</p>
                                    <p className={`font-mono ${theme === "dark" ? "text-slate-200" : ""}`}>TKT-{selectedTicket.id}</p>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Status</p>
                                    <Badge className={`${getStatusBadge(selectedTicket.status)} border capitalize mt-1`}>
                                        {selectedTicket.status}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Event</p>
                                <p className={theme === "dark" ? "text-slate-200" : ""}>{selectedTicket.event}</p>
                            </div>
                            <div>
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Ticket Type</p>
                                <p className={theme === "dark" ? "text-slate-200" : ""}>{selectedTicket.type}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Price</p>
                                    <PriceDisplay
                                        price={selectedTicket.price}
                                        discountType={selectedTicket.discount_type}
                                        discountValue={selectedTicket.discount_value ?? selectedTicket.discount_percentage}
                                        size="md"
                                    />
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Tickets Sold</p>
                                    <p className={`text-lg font-bold ${theme === "dark" ? "text-slate-200" : ""}`}>{selectedTicket.sold}</p>
                                </div>
                            </div>
                            <div>
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Total Revenue</p>
                                <p className={`text-2xl font-bold text-green-600 ${theme === "dark" ? "text-green-400" : ""}`}>{formatCurrency(selectedTicket.revenue)}</p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button 
                            onClick={() => setViewDialogOpen(false)} 
                            className="bg-[#DC143C] hover:bg-[#B01030] text-white"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Ticket Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className={theme === "dark" ? "bg-slate-900 border-slate-800" : ""}>
                    <DialogHeader>
                        <DialogTitle className={theme === "dark" ? "text-slate-100" : ""}>Edit Ticket Category</DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            Update the ticket category details
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTicket && (
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="ticket-name" className={theme === "dark" ? "text-slate-300" : ""}>Ticket Name</Label>
                                <Input
                                    id="ticket-name"
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                    className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}
                                    placeholder="e.g., VIP, General Admission"
                                />
                            </div>
                            <div>
                                <Label htmlFor="ticket-price" className={theme === "dark" ? "text-slate-300" : ""}>Price (ETB)</Label>
                                <Input
                                    id="ticket-price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                    className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <Label htmlFor="ticket-discount" className={theme === "dark" ? "text-slate-300" : ""}>Discount Percentage (%)</Label>
                                <Input
                                    id="ticket-discount"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    value={editForm.discountPercentage}
                                    onChange={(e) => {
                                        setEditForm({ ...editForm, discountPercentage: e.target.value })
                                        setEditDiscountError(validateDiscountPercentage(e.target.value))
                                    }}
                                    className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}
                                    placeholder="0"
                                />
                                {editDiscountError && (
                                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {editDiscountError}
                                    </p>
                                )}
                            </div>
                            {parseFloat(editForm.price) > 0 && (
                                <div className={`p-3 rounded-lg flex items-center justify-between gap-4 ${theme === "dark" ? "bg-slate-800" : "bg-muted"}`}>
                                    <p className={`text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                        Price preview
                                    </p>
                                    <PriceDisplay
                                        price={editForm.price}
                                        discountType={discountFieldsFromPercentage(editForm.discountPercentage).discount_type}
                                        discountValue={discountFieldsFromPercentage(editForm.discountPercentage).discount_value}
                                        size="sm"
                                    />
                                </div>
                            )}
                            <div>
                                <Label htmlFor="ticket-capacity" className={theme === "dark" ? "text-slate-300" : ""}>Capacity</Label>
                                <Input
                                    id="ticket-capacity"
                                    type="number"
                                    min="0"
                                    value={editForm.capacity}
                                    onChange={(e) => setEditForm({ ...editForm, capacity: e.target.value })}
                                    className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}
                                    placeholder="0 for unlimited"
                                />
                            </div>
                            <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-muted"}`}>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                    Event: <span className={`font-medium ${theme === "dark" ? "text-slate-200" : "text-foreground"}`}>{selectedTicket.event}</span>
                                </p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                    Tickets Sold: <span className={`font-medium ${theme === "dark" ? "text-slate-200" : "text-foreground"}`}>{selectedTicket.sold}</span>
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setEditDialogOpen(false)}
                            disabled={saving}
                            className={theme === "dark" ? "border-slate-700" : ""}
                        >
                            Cancel
                        </Button>
                        <FeedbackButton
                            onClick={handleSaveEdit}
                            disabled={!editForm.name || !editForm.price || !!editDiscountError}
                            loading={saving}
                            feedback={saveEditFeedback.feedback}
                            defaultLabel="Save Changes"
                            loadingLabel="Saving..."
                            savedLabel="Saved"
                            className="bg-[#DC143C] hover:bg-[#B01030] text-white"
                        />
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className={theme === "dark" ? "bg-slate-900 border-slate-800" : ""}>
                    <DialogHeader>
                        <DialogTitle className={theme === "dark" ? "text-slate-100" : ""}>Delete Ticket Category</DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            Are you sure you want to delete this ticket category? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTicket && (
                        <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-muted"}`}>
                            <p className={`font-medium ${theme === "dark" ? "text-slate-200" : ""}`}>{selectedTicket.type}</p>
                            <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>{selectedTicket.event}</p>
                            <p className={`text-sm mt-2 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                {selectedTicket.sold} tickets sold • {formatCurrency(selectedTicket.revenue)} revenue
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button 
                            variant="outline" 
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleting}
                            className={theme === "dark" ? "border-slate-700" : ""}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-[#DC143C] hover:bg-[#B01030] text-white"
                        >
                            {deleting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
