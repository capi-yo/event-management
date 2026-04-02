"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import Link from "next/link"
import {
    Users,
    Calendar,
    Ticket,
    Banknote,
    TrendingUp,
    TrendingDown,
    Eye,
    Edit,
    Trash2,
    MoreHorizontal,
    FileText,
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    Download,
    ArrowRight,
    History,
    FileEdit
} from "lucide-react"
import { adminApi, AdminStats } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

function StatusBadge({ status }: { status: string }) {
    const s = status.toLowerCase();
    const styles: Record<string, string> = {
        active: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
        approved: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
        pending: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
        rejected: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
        draft: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
        success: "bg-green-500/10 text-green-500",
        warning: "bg-yellow-500/10 text-yellow-500",
        error: "bg-red-500/10 text-red-500",
    }

    return (
        <Badge className={styles[s] || styles.active} >
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    )
}

export default function AdminDashboard() {
    const { theme } = useTheme()
    const { toast } = useToast()
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [pendingEvents, setPendingEvents] = useState<any[]>([]);
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [statsRes, pendingRes, logsRes] = await Promise.all([
                    adminApi.getStats(),
                    adminApi.getPendingEvents(),
                    adminApi.getAuditLogs()
                ]);

                setStats(statsRes.data.stats);
                setPendingEvents(pendingRes.data.events);
                setLogs(logsRes.data.logs);
            } catch (err: any) {
                console.error("Dashboard fetch error:", err);
                setError("Failed to load dashboard data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleExportReport = async () => {
        try {
            setExporting(true);

            // Use data already loaded in the dashboard
            const reportData = {
                generatedAt: new Date().toISOString(),
                stats: stats || {},
                pendingEvents: pendingEvents,
                logs: logs
            };

            // Create CSV content
            const csvLines: string[] = [];

            // Add header section
            csvLines.push('EventMate Admin Report');
            csvLines.push(`Generated: ${new Date().toLocaleString()}`);
            csvLines.push('');

            // Add stats
            csvLines.push('=== PLATFORM STATISTICS ===');
            const s = reportData.stats as AdminStats || {};
            csvLines.push(`Total Users,${s?.total_users || 0}`);
            csvLines.push(`Total Events,${s?.total_events || 0}`);
            csvLines.push(`Total Registrations,${s?.total_registrations || 0}`);
            csvLines.push(`Pending Events,${reportData.pendingEvents?.length || 0}`);
            csvLines.push('');

            // Add pending events
            csvLines.push('=== PENDING EVENTS ===');
            csvLines.push('Title,Organizer,Date,Category');
            reportData.pendingEvents.forEach((event: any) => {
                csvLines.push(`"${event.title}","${event.organizer_name}","${event.date}","${event.category}"`);
            });
            csvLines.push('');

            // Add recent activity logs
            csvLines.push('=== RECENT ACTIVITY LOGS ===');
            csvLines.push('Action,User,IP Address,Timestamp');
            reportData.logs.slice(0, 50).forEach((log: any) => {
                csvLines.push(`"${log.action}","${log.user_email || 'System'}","${log.ip_address || 'N/A'}","${log.created_at}"`);
            });

            // Create and download file
            const csvContent = csvLines.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `admin-report-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast({
                title: "Report Exported",
                description: "The admin report has been downloaded successfully.",
                variant: "success",
            });
        } catch (err: any) {
            console.error('Export error:', err);
            toast({
                title: "Export Failed",
                description: err.message || "Failed to export report",
                variant: "destructive",
            });
        } finally {
            setExporting(false);
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await adminApi.updateEventStatus(id, 'Approved');
            setPendingEvents(prev => prev.filter(e => e.id !== id));
            // Refresh stats
            const statsRes = await adminApi.getStats();
            setStats(statsRes.data.stats);
            toast({
                title: "Event Approved",
                description: "The event has been successfully approved.",
                variant: "success",
            });
        } catch (err: any) {
            toast({
                title: "Approval Failed",
                description: err.message || "Failed to approve event",
                variant: "destructive",
            });
        }
    };

    const handleReject = async (id: number) => {
        try {
            await adminApi.updateEventStatus(id, 'Rejected');
            setPendingEvents(prev => prev.filter(e => e.id !== id));
            // Refresh stats
            const statsRes = await adminApi.getStats();
            setStats(statsRes.data.stats);
            toast({
                title: "Event Rejected",
                description: "The event has been rejected.",
                variant: "default",
            });
        } catch (err: any) {
            toast({
                title: "Rejection Failed",
                description: err.message || "Failed to reject event",
                variant: "destructive",
            });
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#AC1212]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header - Visual Hierarchy */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>Admin Dashboard</h1>
                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Monitor and manage your platform</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className={theme === "dark" ? "border-slate-700 hover:bg-slate-800 text-slate-200" : ""}
                        onClick={handleExportReport}
                        disabled={exporting}
                    >
                        <Download className={`h-4 w-4 mr-2 ${exporting ? 'animate-spin' : ''}`} />
                        {exporting ? 'Exporting...' : 'Export Report'}
                    </Button>
                </div>
            </div>

            {/* Stats Grid - 30-60-10 Design */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className={`border-l-4 border-l-blue-500 transition-all duration-200 hover:shadow-lg ${theme === "dark" ? "border-slate-800 bg-slate-900" : ""}`}>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Total Users</p>
                                <p className={`text-3xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats?.total_users || 0}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 border-l-green-500 transition-all duration-200 hover:shadow-lg ${theme === "dark" ? "border-slate-800 bg-slate-900" : ""}`}>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Total Registrations</p>
                                <p className={`text-3xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats?.total_registrations || 0}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <TrendingUp className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 border-l-purple-500 transition-all duration-200 hover:shadow-lg ${theme === "dark" ? "border-slate-800 bg-slate-900" : ""}`}>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Total Events</p>
                                <p className={`text-3xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats?.total_events || 0}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/10">
                                <Calendar className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 border-l-orange-500 transition-all duration-200 hover:shadow-lg ${theme === "dark" ? "border-slate-800 bg-slate-900" : ""}`}>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Pending Approval</p>
                                <p className={`text-3xl font-bold ${theme === "dark" ? "text-slate-100" : ""}`}>{stats?.pending_events || 0}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-orange-500/10">
                                <Banknote className="h-6 w-6 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Access Navigation Links */}
            <div>
                <h2 className={`text-xl font-semibold mb-4 ${theme === "dark" ? "text-slate-100" : ""}`}>Quick Access</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href="/admin/events" className="block h-full">
                        <Card className={`h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-900" : ""}`}>
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Events</p>
                                        <p className={`text-lg font-semibold ${theme === "dark" ? "text-slate-100" : ""}`}>Manage Events</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-purple-500/10">
                                        <Calendar className="h-6 w-6 text-purple-500" />
                                    </div>
                                </div>
                                <div className={`mt-auto pt-4 flex items-center text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                    <span>View and manage all events</span>
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/users" className="block h-full">
                        <Card className={`h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-900" : ""}`}>
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Users</p>
                                        <p className={`text-lg font-semibold ${theme === "dark" ? "text-slate-100" : ""}`}>User Management</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-blue-500/10">
                                        <Users className="h-6 w-6 text-blue-500" />
                                    </div>
                                </div>
                                <div className={`mt-auto pt-4 flex items-center text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                    <span>Manage user accounts</span>
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/content" className="block h-full">
                        <Card className={`h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-900" : ""}`}>
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Content</p>
                                        <p className={`text-lg font-semibold ${theme === "dark" ? "text-slate-100" : ""}`}>Content Moderation</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-green-500/10">
                                        <FileEdit className="h-6 w-6 text-green-500" />
                                    </div>
                                </div>
                                <div className={`mt-auto pt-4 flex items-center text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                    <span>Review and moderate content</span>
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/audit" className="block h-full">
                        <Card className={`h-full transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${theme === "dark" ? "border-slate-800 bg-slate-900" : ""}`}>
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Audit Trail</p>
                                        <p className={`text-lg font-semibold ${theme === "dark" ? "text-slate-100" : ""}`}>Activity Logs</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-orange-500/10">
                                        <History className="h-6 w-6 text-orange-500" />
                                    </div>
                                </div>
                                <div className={`mt-auto pt-4 flex items-center text-sm ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                    <span>View system activity logs</span>
                                    <ArrowRight className="h-4 w-4 ml-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>

            <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>Pending Event Approvals</CardTitle>
                        <CardDescription className={theme === "dark" ? "text-slate-400" : ""}>Events waiting for admin review</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className={theme === "dark" ? "border-slate-800" : ""}>
                                <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Event</TableHead>
                                <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Organizer</TableHead>
                                <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Date</TableHead>
                                <TableHead className={theme === "dark" ? "text-slate-400" : ""}>Category</TableHead>
                                <TableHead className={`text-right ${theme === "dark" ? "text-slate-400" : ""}`}>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingEvents.map((event) => (
                                <TableRow key={event.id} className={theme === "dark" ? "border-slate-800" : ""}>
                                    <TableCell className={`font-medium ${theme === "dark" ? "text-slate-100" : ""}`}>{event.title}</TableCell>
                                    <TableCell className={theme === "dark" ? "text-slate-300" : ""}>{event.organizer_name}</TableCell>
                                    <TableCell className={theme === "dark" ? "text-slate-400" : ""}>{new Date(event.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={theme === "dark" ? "border-slate-700 text-slate-300" : ""}>{event.category}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(event.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleReject(event.id)}
                                                className={theme === "dark" ? "border-red-800 text-red-400 hover:bg-red-900/20" : "text-red-600 border-red-200 hover:bg-red-50"}
                                            >
                                                <XCircle className="h-4 w-4 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {pendingEvents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No pending events to review
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

