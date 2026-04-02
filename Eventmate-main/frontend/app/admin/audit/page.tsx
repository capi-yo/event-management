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
    Search,
    Download,
    User,
    Calendar,
    LogIn,
    Edit,
    Shield,
    Settings,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    RefreshCcw,
    ChevronLeft,
    ChevronRight
} from "lucide-react"
import { adminApi } from '@/lib/api'

export default function AdminAuditPage() {
    const { theme } = useTheme()
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [page, setPage] = useState(1)
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
    const [stats, setStats] = useState({
        success: 0,
        warning: 0,
        error: 0,
        total: 0
    })

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true)
            const res = await adminApi.getAuditLogs({
                page,
                limit: 10,
                category: categoryFilter === 'all' ? undefined : categoryFilter,
                status: statusFilter === 'all' ? undefined : statusFilter
            })
            if (res.success) {
                setLogs(res.data.logs)
                setPagination(res.data.pagination)
                setStats({
                    success: parseInt(res.data.stats.success_count || 0),
                    warning: parseInt(res.data.stats.warning_count || 0),
                    error: parseInt(res.data.stats.error_count || 0),
                    total: parseInt(res.data.stats.total || 0)
                })
            }
            setError(null)
        } catch (err: any) {
            console.error('Error fetching logs:', err)
            setError(err.message || 'Failed to fetch audit logs')
        } finally {
            setLoading(false)
        }
    }, [page, categoryFilter, statusFilter])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const filteredLogs = logs.filter(log => {
        const action = log.action || ''
        const user = log.user_email || 'unknown'
        const ip = log.ip_address || ''
        const matchesSearch = action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ip.includes(searchQuery);
        return matchesSearch;
    })

    const getStatusBadge = (log: any) => {
        const status = log.details?.status || 'success'
        const styles: Record<string, string> = {
            success: theme === "dark" ? "bg-green-900/30 text-green-400 border-green-800 font-normal" : "bg-green-100 text-green-700 border-green-200 font-normal",
            warning: theme === "dark" ? "bg-yellow-900/30 text-yellow-400 border-yellow-800 font-normal" : "bg-yellow-100 text-yellow-700 border-yellow-200 font-normal",
            error: theme === "dark" ? "bg-red-900/30 text-red-400 border-red-800 font-normal" : "bg-red-100 text-red-700 border-red-200 font-normal",
        };
        return styles[status] || styles.success;
    }

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, any> = {
            Authentication: LogIn,
            Events: Calendar,
            Users: User,
            Content: Edit,
            Settings: Settings,
            Security: Shield,
        };
        return icons[category] || LogIn;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>Audit Trail</h1>
                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Track and monitor system activities</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchLogs} variant="outline" size="sm" className="flex items-center gap-2">
                        <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="outline" size="sm" className={theme === "dark" ? "border-slate-700 hover:bg-slate-800" : ""}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats.success}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Successful</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-yellow-500/10">
                                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats.warning}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Warnings</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-500/10">
                                <XCircle className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats.error}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Errors</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Clock className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats.total}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Total Logs</p>
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
                                placeholder="Search by action, user, or IP..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`pl-10 ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}
                            />
                        </div>
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                            <SelectTrigger className={`w-[180px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="Authentication">Authentication</SelectItem>
                                <SelectItem value="Events">Events</SelectItem>
                                <SelectItem value="Users">Users</SelectItem>
                                <SelectItem value="Content">Content</SelectItem>
                                <SelectItem value="Settings">Settings</SelectItem>
                                <SelectItem value="Security">Security</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className={`w-[180px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="success">Success</SelectItem>
                                <SelectItem value="warning">Warning</SelectItem>
                                <SelectItem value="error">Error</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Audit Logs Table */}
            <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                <CardHeader>
                    <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>System Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow className={theme === "dark" ? "border-slate-800 hover:bg-transparent" : "hover:bg-transparent"}>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Action</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Category</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>User</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>IP Address</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Timestamp</TableHead>
                                    <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading && logs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                            <p className="mt-2 text-muted-foreground text-sm">Loading logs...</p>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                                            No logs found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => {
                                        const CategoryIcon = getCategoryIcon(log.entity_type)
                                        return (
                                            <TableRow key={log.id} className={theme === "dark" ? "border-slate-800" : ""}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}>
                                                            <CategoryIcon className="h-4 w-4" />
                                                        </div>
                                                        <span className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{log.action}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{log.entity_type}</TableCell>
                                                <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{log.user_email || 'System'}</TableCell>
                                                <TableCell className={`font-mono text-sm ${theme === "dark" ? "text-slate-400" : ""}`}>{log.ip_address || 'N/A'}</TableCell>
                                                <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{new Date(log.created_at).toLocaleString()}</TableCell>
                                                <TableCell>
                                                    <Badge className={`${getStatusBadge(log)} border capitalize`}>
                                                        {log.details?.status || 'success'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
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
        </div>
    )
}
