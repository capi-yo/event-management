"use client"

import { useEffect, useState } from 'react'
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
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import {
    Search,
    Users,
    Eye,
    CheckCircle,
    XCircle,
    Loader2,
    RefreshCcw,
    CreditCard,
    DollarSign,
    Ticket,
    Calendar,
    Mail
} from "lucide-react"
import { adminApi } from '@/lib/api'
import { useToast } from "@/components/ui/use-toast"

export default function AdminRegistrationsPage() {
    const { theme } = useTheme()
    const { toast } = useToast()
    const [registrations, setRegistrations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [eventFilter, setEventFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
    const [selectedRegistration, setSelectedRegistration] = useState<any>(null)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [updating, setUpdating] = useState<number | null>(null)

    const fetchRegistrations = async () => {
        try {
            setLoading(true)
            const res = await adminApi.getRegistrations({
                page,
                limit: 10,
                status: statusFilter === 'all' ? undefined : statusFilter,
                event_id: eventFilter === 'all' ? undefined : parseInt(eventFilter),
            })
            if (res.success) {
                setRegistrations(res.data.registrations)
                setPagination(res.data.pagination)
            }
            setError(null)
        } catch (err: any) {
            console.error('Error fetching registrations:', err)
            setError(err.message || 'Failed to fetch registrations')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRegistrations()
    }, [page, statusFilter, eventFilter])

    const handleUpdateStatus = async (registrationId: number, newStatus: string) => {
        try {
            setUpdating(registrationId)
            const res = await adminApi.updateRegistrationStatus(registrationId, newStatus)
            if (res.success) {
                toast({
                    title: "Status Updated",
                    description: `Registration status updated to ${newStatus}`,
                    variant: "success",
                })
                fetchRegistrations()
                setViewDialogOpen(false)
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || 'Failed to update status',
                variant: "destructive",
            })
        } finally {
            setUpdating(null)
        }
    }

    const filteredRegistrations = registrations.filter(reg => {
        const matchesSearch =
            reg.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reg.user_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reg.event_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            reg.transaction_ref?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'Confirmed': theme === "dark" ? "bg-green-900/30 text-green-400 border-green-800" : "bg-green-100 text-green-700 border-green-200",
            'Pending': theme === "dark" ? "bg-yellow-900/30 text-yellow-400 border-yellow-800" : "bg-yellow-100 text-yellow-700 border-yellow-200",
            'Cancelled': theme === "dark" ? "bg-red-900/30 text-red-400 border-red-800" : "bg-red-100 text-red-700 border-red-200",
            'Checked-In': theme === "dark" ? "bg-blue-900/30 text-blue-400 border-blue-800" : "bg-blue-100 text-blue-700 border-blue-200",
            'RSVPed': theme === "dark" ? "bg-purple-900/30 text-purple-400 border-purple-800" : "bg-purple-100 text-purple-700 border-purple-200",
            'Purchased': theme === "dark" ? "bg-cyan-900/30 text-cyan-400 border-cyan-800" : "bg-cyan-100 text-cyan-700 border-cyan-200",
        };
        return styles[status] || styles.Pending;
    }

    const getPaymentMethodIcon = (method: string) => {
        switch (method?.toLowerCase()) {
            case 'cbe':
            case 'commercial bank of ethiopia':
                return <CreditCard className="h-4 w-4" />
            case 'telebirr':
                return <DollarSign className="h-4 w-4" />
            case 'abyssinia bank':
            case 'abyssinia':
                return <CreditCard className="h-4 w-4" />
            default:
                return <CreditCard className="h-4 w-4" />
        }
    }

    if (error && registrations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-red-500 font-medium">{error}</p>
                <Button onClick={fetchRegistrations} className="flex items-center gap-2">
                    <RefreshCcw className="h-4 w-4" />
                    Retry
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>Registrations</h1>
                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Manage event registrations and payment approvals</p>
                </div>
                <Button onClick={fetchRegistrations} variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Total</p>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{pagination.total}</p>
                            </div>
                            <Users className={`h-8 w-8 ${theme === "dark" ? "text-slate-600" : "text-muted-foreground"}`} />
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Pending</p>
                                <p className="text-2xl font-bold text-yellow-500">
                                    {registrations.filter(r => r.status === 'Pending').length}
                                </p>
                            </div>
                            <Loader2 className={`h-8 w-8 text-yellow-500`} />
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Confirmed</p>
                                <p className="text-2xl font-bold text-green-500">
                                    {registrations.filter(r => r.status === 'Confirmed').length}
                                </p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Cancelled</p>
                                <p className="text-2xl font-bold text-red-500">
                                    {registrations.filter(r => r.status === 'Cancelled').length}
                                </p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
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
                                placeholder="Search by name, email, event or transaction ref..."
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
                                <SelectItem value="Confirmed">Confirmed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                <SelectItem value="Checked-In">Checked-In</SelectItem>
                                <SelectItem value="RSVPed">RSVPed</SelectItem>
                                <SelectItem value="Purchased">Purchased</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Registrations Table */}
            <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                <CardHeader>
                    <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>All Registrations</CardTitle>
                    <CardDescription className={theme === "dark" ? "text-slate-400" : ""}>
                        View and manage event registrations and payment verifications
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow className={theme === "dark" ? "border-slate-800 hover:bg-transparent" : "hover:bg-transparent"}>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>User</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Event</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Payment</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Status</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Date</TableHead>
                                    <TableHead className={`text-right ${theme === "dark" ? "text-slate-400" : ""}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && registrations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                            <p className="mt-2 text-muted-foreground text-sm">Loading registrations...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredRegistrations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                            No registrations found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRegistrations.map((reg) => (
                                        <TableRow key={reg.id} className={theme === "dark" ? "border-slate-800" : ""}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>
                                                        {reg.user_name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {reg.user_email}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className={theme === "dark" ? "text-slate-300" : ""}>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{reg.event_title}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(reg.event_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getPaymentMethodIcon(reg.payment_method)}
                                                    <div className="flex flex-col">
                                                        <span className={`text-sm font-medium ${theme === "dark" ? "text-slate-300" : ""}`}>
                                                            {reg.payment_method || 'N/A'}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {reg.transaction_ref ? `${reg.transaction_ref.substring(0, 12)}...` : 'No ref'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getStatusBadge(reg.status)}>
                                                    {reg.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={theme === "dark" ? "text-slate-300" : ""}>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {new Date(reg.created_at).toLocaleDateString()}
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
                                                                    setSelectedRegistration(reg)
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
                                                    {reg.status === 'Pending' && (
                                                        <>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                                                        onClick={() => handleUpdateStatus(reg.id, 'Confirmed')}
                                                                        disabled={updating === reg.id}
                                                                    >
                                                                        {updating === reg.id ? (
                                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                                        ) : (
                                                                            <CheckCircle className="h-4 w-4" />
                                                                        )}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Approve Payment</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                                        onClick={() => handleUpdateStatus(reg.id, 'Cancelled')}
                                                                        disabled={updating === reg.id}
                                                                    >
                                                                        <XCircle className="h-4 w-4" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Reject Payment</p>
                                                                </TooltipContent>
                                                            </Tooltip>
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
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* View Registration Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className={theme === "dark" ? "bg-slate-900 border-slate-800" : ""}>
                    <DialogHeader>
                        <DialogTitle>Registration Details</DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            Complete information about this registration
                        </DialogDescription>
                    </DialogHeader>
                    {selectedRegistration && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>User Name</p>
                                    <p className="font-medium">{selectedRegistration.user_name}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Email</p>
                                    <p className="font-medium">{selectedRegistration.user_email}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Event</p>
                                    <p className="font-medium">{selectedRegistration.event_title}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Event Date</p>
                                    <p className="font-medium">{new Date(selectedRegistration.event_date).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Ticket Type</p>
                                    <p className="font-medium">{selectedRegistration.ticket_type || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Amount Paid</p>
                                    <p className="font-medium">ETB {parseFloat(selectedRegistration.paid_amount || 0).toFixed(2)}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Payment Method</p>
                                    <p className="font-medium">{selectedRegistration.payment_method || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Transaction Ref</p>
                                    <p className="font-medium">{selectedRegistration.transaction_ref || 'N/A'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Status</p>
                                    <Badge className={`mt-1 ${getStatusBadge(selectedRegistration.status)}`}>
                                        {selectedRegistration.status}
                                    </Badge>
                                </div>
                                <div className="col-span-2">
                                    <p className={theme === "dark" ? "text-slate-400" : "text-gray-500"}>Registration Date</p>
                                    <p className="font-medium">{new Date(selectedRegistration.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Action Buttons for Pending Payments */}
                            {selectedRegistration.status === 'Pending' && (
                                <div className="flex gap-2 pt-4 border-t border-slate-700">
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                        onClick={() => handleUpdateStatus(selectedRegistration.id, 'Confirmed')}
                                        disabled={updating === selectedRegistration.id}
                                    >
                                        {updating === selectedRegistration.id ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                        )}
                                        Approve Payment
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        className="flex-1"
                                        onClick={() => handleUpdateStatus(selectedRegistration.id, 'Cancelled')}
                                        disabled={updating === selectedRegistration.id}
                                    >
                                        {updating === selectedRegistration.id ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                            <XCircle className="mr-2 h-4 w-4" />
                                        )}
                                        Reject Payment
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
