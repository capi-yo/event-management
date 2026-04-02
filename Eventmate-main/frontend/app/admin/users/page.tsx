"use client"

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
    Users,
    Search,
    Shield,
    User,
    Eye,
    Edit,
    Ban,
    CheckCircle,
    Loader2,
    RefreshCcw,
    AlertCircle,
    Calendar,
    Mail,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { adminApi } from '@/lib/api'

export default function AdminUsersPage() {
    const { theme } = useTheme()
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
    const [stats, setStats] = useState({
        active: 0,
        organizer: 0,
        attendee: 0,
        total: 0
    })
    const [selectedUser, setSelectedUser] = useState<{ id: number, name: string, status: string, role?: string } | null>(null)
    const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null)
    const [userDetailsLoading, setUserDetailsLoading] = useState(false)
    const [editName, setEditName] = useState<string>('')
    const [editRole, setEditRole] = useState<string>('')
    const [editStatus, setEditStatus] = useState<string>('')
    const [editLoading, setEditLoading] = useState(false)
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [viewDialogOpen, setViewDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true)
            const [usersRes, statsRes] = await Promise.all([
                adminApi.getUsers({
                    page,
                    limit: 10,
                    role: roleFilter === 'all' ? undefined : roleFilter,
                    status: statusFilter === 'all' ? undefined : statusFilter
                } as any),
                adminApi.getStats()
            ])

            if (usersRes.success) {
                setUsers(usersRes.data.users)
                setPagination(usersRes.data.pagination)
            }
            if (statsRes.success) {
                const s = statsRes.data.stats
                setStats({
                    total: s.total_users,
                    active: s.total_users - (s.users_by_role.find((r: any) => r.status === 'Suspended')?.count || 0),
                    organizer: s.users_by_role.find((r: any) => r.role === 'Organizer')?.count || 0,
                    attendee: s.users_by_role.find((r: any) => r.role === 'Registered User')?.count || 0
                })
            }
            setError(null)
        } catch (err: any) {
            console.error('Error fetching users:', err)
            setError(err.message || 'Failed to fetch users')
        } finally {
            setLoading(false)
        }
    }, [page, roleFilter, statusFilter])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const handleUpdateStatus = async () => {
        if (!selectedUser) return
        const newStatus = selectedUser.status === 'Active' ? 'Suspended' : 'Active'
        try {
            const res = await adminApi.updateUserStatus(selectedUser.id, newStatus)
            if (res.success) {
                setSuccessMessage(`User account has been ${newStatus.toLowerCase()} successfully.`)
                setTimeout(() => setSuccessMessage(null), 3000)
                fetchUsers()
            }
        } catch (err: any) {
            setError(err.message || 'Failed to update user status')
            setTimeout(() => setError(null), 5000)
        } finally {
            setConfirmDialogOpen(false)
            setSelectedUser(null)
        }
    }

    const handleViewUser = async (user: any) => {
        setSelectedUser({ id: user.id, name: user.name, status: user.status })
        setViewDialogOpen(true)
        setUserDetailsLoading(true)
        try {
            const res = await adminApi.getUserDetails(user.id)
            if (res.success) {
                setSelectedUserDetails(res.data)
            }
        } catch (err) {
            console.error('Error fetching user details:', err)
        } finally {
            setUserDetailsLoading(false)
        }
    }

    const handleEditUser = (user: any) => {
        setSelectedUser({ id: user.id, name: user.name, status: user.status, role: user.role } as any)
        setEditName(user.name || '')
        setEditRole(user.role || 'Registered User')
        setEditStatus(user.status || 'Active')
        setEditDialogOpen(true)
    }

    const handleSaveEdit = async () => {
        if (!selectedUser) return
        setEditLoading(true)
        try {
            // Get current user data from users list
            const currentUser = users.find(u => u.id === selectedUser.id)
            if (!currentUser) {
                throw new Error('User not found')
            }

            // Prepare update data
            const updateData: { name?: string; role?: string; status?: string } = {}

            if (editName && editName.trim() !== currentUser.name) {
                updateData.name = editName.trim()
            }
            if (editRole && editRole !== currentUser.role) {
                updateData.role = editRole
            }
            if (editStatus && editStatus !== currentUser.status) {
                updateData.status = editStatus
            }

            // Only call API if there are changes
            if (Object.keys(updateData).length > 0) {
                await adminApi.updateUser(selectedUser.id, updateData)
            }

            setSuccessMessage('User updated successfully')
            setTimeout(() => setSuccessMessage(null), 3000)
            fetchUsers()
            setEditDialogOpen(false)
        } catch (err: any) {
            setError(err.message || 'Failed to update user')
            setTimeout(() => setError(null), 5000)
        } finally {
            setEditLoading(false)
        }
    }

    const handleConfirmStatusChange = (user: any) => {
        setSelectedUser({ id: user.id, name: user.name, status: user.status })
        setConfirmDialogOpen(true)
    }

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    })

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            Active: theme === "dark" ? "bg-green-900/30 text-green-400 border-green-800" : "bg-green-100 text-green-700 border-green-200",
            Suspended: theme === "dark" ? "bg-red-900/30 text-red-400 border-red-800" : "bg-red-100 text-red-700 border-red-200",
        };
        return styles[status] || styles.Active;
    }

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            Administrator: theme === "dark" ? "bg-purple-900/30 text-purple-400 border-purple-800" : "bg-purple-100 text-purple-700 border-purple-200",
            Organizer: theme === "dark" ? "bg-blue-900/30 text-blue-400 border-blue-800" : "bg-blue-100 text-blue-700 border-blue-200",
            'Registered User': theme === "dark" ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200",
        };
        return styles[role] || (theme === "dark" ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200");
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <p className="text-red-500 font-medium">{error}</p>
                <Button onClick={fetchUsers} className="flex items-center gap-2">
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
                    <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>User Management</h1>
                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Manage and monitor platform users</p>
                </div>
                <Button onClick={fetchUsers} variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                    <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Users className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats.active}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Active Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Shield className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats.organizer}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Organizers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-purple-500/10">
                                <User className="h-6 w-6 text-purple-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats.attendee}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Attendees</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-slate-500/10">
                                <Users className="h-6 w-6 text-slate-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats.total}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Total Users</p>
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
                                placeholder="Search users by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-10 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className={`w-[190px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="Administrator">Admin</SelectItem>
                                <SelectItem value="Organizer">Organizer</SelectItem>
                                <SelectItem value="Registered User">Attendee</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className={`w-[190px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                <CardHeader>
                    <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>All Users</CardTitle>
                    <CardDescription className={theme === "dark" ? "text-slate-400" : ""}>Manage user accounts and permissions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow className={theme === "dark" ? "border-slate-800 hover:bg-transparent" : "hover:bg-transparent"}>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>User</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Role</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Events</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Joined</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Status</TableHead>
                                    <TableHead className={`text-right ${theme === "dark" ? "text-slate-400" : ""}`}>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                            <p className="mt-2 text-muted-foreground text-sm">Loading users...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id} className={theme === "dark" ? "border-slate-800" : ""}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className={theme === "dark" ? "bg-slate-700" : ""}>
                                                        <AvatarFallback className={theme === "dark" ? "bg-slate-600 text-slate-200" : ""}>
                                                            {user.name.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{user.name}</p>
                                                        <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${getRoleBadge(user.role)} border capitalize font-normal`}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{user.events_count || 0}</TableCell>
                                            <TableCell className={theme === "dark" ? "text-slate-300" : ""}>
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={`${getStatusBadge(user.status)} border capitalize font-normal`}>
                                                    {user.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleViewUser(user)}
                                                                className={`h-8 w-8 ${theme === "dark" ? "text-slate-400 hover:bg-slate-800" : ""}`}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>View User Details</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleEditUser(user)}
                                                                className={`h-8 w-8 ${theme === "dark" ? "text-slate-400 hover:bg-slate-800" : ""}`}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Edit User</TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleConfirmStatusChange(user)}
                                                                className={`h-8 w-8 ${user.status === 'Active' ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}`}
                                                            >
                                                                {user.status === 'Active' ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>{user.status === 'Active' ? 'Suspend User' : 'Activate User'}</TooltipContent>
                                                    </Tooltip>
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

            {/* View User Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={(open) => {
                setViewDialogOpen(open)
                if (!open) {
                    setSelectedUserDetails(null)
                    setSelectedUser(null)
                }
            }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                        <DialogDescription>
                            View detailed information about this user.
                        </DialogDescription>
                    </DialogHeader>
                    {userDetailsLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : selectedUserDetails ? (
                        <div className="space-y-6 py-4">
                            {/* Basic Info */}
                            <div className="flex items-center gap-4">
                                <Avatar className={`h-16 w-16 ${theme === "dark" ? "bg-slate-700" : ""}`}>
                                    <AvatarFallback className={`text-lg ${theme === "dark" ? "bg-slate-600 text-slate-200" : ""}`}>
                                        {selectedUserDetails.user.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className={`text-xl font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{selectedUserDetails.user.name}</p>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>{selectedUserDetails.user.email}</p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Events Organized</p>
                                    <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{selectedUserDetails.stats.events_organized_count}</p>
                                </div>
                                <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Events Booked</p>
                                    <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{selectedUserDetails.stats.events_booked_count}</p>
                                </div>
                            </div>

                            {/* User Info Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Role</p>
                                    <Badge className={`${getRoleBadge(selectedUserDetails.user.role)} border capitalize font-normal mt-1`}>
                                        {selectedUserDetails.user.role}
                                    </Badge>
                                </div>
                                <div>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Status</p>
                                    <Badge className={`${getStatusBadge(selectedUserDetails.user.status)} border capitalize font-normal mt-1`}>
                                        {selectedUserDetails.user.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Member Since</p>
                                    <p className={`${theme === "dark" ? "text-slate-100" : ""}`}>
                                        {new Date(selectedUserDetails.user.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Last Updated</p>
                                    <p className={`${theme === "dark" ? "text-slate-100" : ""}`}>
                                        {new Date(selectedUserDetails.user.updated_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Events Organized */}
                            {selectedUserDetails.events_organized && selectedUserDetails.events_organized.length > 0 && (
                                <div>
                                    <p className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-slate-300" : ""}`}>Events Organized</p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedUserDetails.events_organized.map((event: any) => (
                                            <div key={event.id} className={`p-3 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{event.title}</p>
                                                        <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                                            {new Date(event.date).toLocaleDateString()} at {event.time}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {event.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Events Booked */}
                            {selectedUserDetails.events_booked && selectedUserDetails.events_booked.length > 0 && (
                                <div>
                                    <p className={`text-sm font-medium mb-2 ${theme === "dark" ? "text-slate-300" : ""}`}>Events Booked</p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                        {selectedUserDetails.events_booked.map((reg: any) => (
                                            <div key={reg.registration_id} className={`p-3 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{reg.title}</p>
                                                        <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                                            {new Date(reg.date).toLocaleDateString()} at {reg.time}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="text-xs">
                                                        {reg.registration_status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : selectedUser ? (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4">
                                <Avatar className={theme === "dark" ? "bg-slate-700" : ""}>
                                    <AvatarFallback className={theme === "dark" ? "bg-slate-600 text-slate-200" : ""}>
                                        {selectedUser.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{selectedUser.name}</p>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>ID: {selectedUser.id}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Status</p>
                                <Badge className={`${getStatusBadge(selectedUser.status)} border capitalize font-normal`}>
                                    {selectedUser.status}
                                </Badge>
                            </div>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Modify user role and account status.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4 mb-6">
                                <Avatar className={`h-12 w-12 ${theme === "dark" ? "bg-slate-700" : ""}`}>
                                    <AvatarFallback className={theme === "dark" ? "bg-slate-600 text-slate-200" : ""}>
                                        {selectedUser.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{selectedUser.name}</p>
                                    <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>ID: {selectedUser.id}</p>
                                </div>
                            </div>

                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${theme === "dark" ? "text-slate-300" : ""}`}>
                                    Name
                                </label>
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Enter user name"
                                    className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}
                                />
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${theme === "dark" ? "text-slate-300" : ""}`}>
                                    Role
                                </label>
                                <Select value={editRole} onValueChange={setEditRole}>
                                    <SelectTrigger className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}>
                                        <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Visitor">Visitor</SelectItem>
                                        <SelectItem value="Registered User">Registered User</SelectItem>
                                        <SelectItem value="Organizer">Organizer</SelectItem>
                                        <SelectItem value="Administrator">Administrator</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className={`text-xs ${theme === "dark" ? "text-slate-500" : "text-muted-foreground"}`}>
                                    Changing role affects user permissions on the platform
                                </p>
                            </div>

                            {/* Status Selection */}
                            <div className="space-y-2">
                                <label className={`text-sm font-medium ${theme === "dark" ? "text-slate-300" : ""}`}>
                                    Account Status
                                </label>
                                <Select value={editStatus} onValueChange={setEditStatus}>
                                    <SelectTrigger className={theme === "dark" ? "bg-slate-800 border-slate-700" : ""}>
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className={`text-xs ${theme === "dark" ? "text-slate-500" : "text-muted-foreground"}`}>
                                    Suspended users cannot log in to the platform
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveEdit} disabled={editLoading}>
                            {editLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Status Change Dialog */}
            <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Status Change</DialogTitle>
                        <DialogDescription>
                            {selectedUser?.status === 'Active'
                                ? `Are you sure you want to suspend ${selectedUser?.name}? This user will no longer be able to access their account.`
                                : `Are you sure you want to activate ${selectedUser?.name}? This user will regain access to their account.`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                        <Button
                            variant={selectedUser?.status === 'Active' ? 'destructive' : 'default'}
                            onClick={handleUpdateStatus}
                        >
                            {selectedUser?.status === 'Active' ? 'Suspend User' : 'Activate User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
