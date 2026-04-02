"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    TrendingUp,
    TrendingDown,
    Users,
    Ticket,
    Banknote,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Eye,
    MousePointer,
    Clock,
    CheckCircle,
    Loader2
} from "lucide-react"
import { eventsApi } from '@/lib/api'

export default function OrganiserAnalyticsPage() {
    const { theme } = useTheme()
    const [timeRange, setTimeRange] = useState('7days')
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true)
                const response = await eventsApi.getOrganizerStats()
                if (response.success) {
                    setStats(response.data)
                }
            } catch (err: any) {
                console.error('Failed to fetch analytics:', err)
                setError('Failed to load analytics data')
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(amount || 0);
    }

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US').format(num || 0);
    }

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
                    <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>Analytics</h1>
                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Track your event performance</p>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className={`w-[180px] ${theme === "dark" ? "bg-slate-800 border-slate-700" : ""}`}>
                        <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7days">Last 7 Days</SelectItem>
                        <SelectItem value="30days">Last 30 Days</SelectItem>
                        <SelectItem value="90days">Last 90 Days</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Error State */}
            {error && (
                <Card className="border-red-500">
                    <CardContent className="pt-6">
                        <p className="text-red-500">{error}</p>
                    </CardContent>
                </Card>
            )}

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Active Events</p>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""} mt-1`}>{formatNumber(stats?.active_events)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Calendar className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Total Attendees</p>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""} mt-1`}>{formatNumber(stats?.total_attendees)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-500/10">
                                <Users className="h-6 w-6 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Pending Approval</p>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""} mt-1`}>{stats?.pending_events || 0}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-yellow-500/10">
                                <Clock className="h-6 w-6 text-yellow-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Total Revenue</p>
                                <p className={`text-2xl font-bold ${theme === "dark" ? "text-slate-100" : ""} mt-1`}>{formatCurrency(stats?.total_revenue)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Banknote className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Revenue Overview */}
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardHeader>
                        <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>Revenue Overview</CardTitle>
                        <CardDescription className={theme === "dark" ? "text-slate-400" : ""}>Platform revenue summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className={`h-[300px] flex flex-col items-center justify-center rounded-lg ${theme === "dark" ? "bg-slate-800/50" : "bg-muted/30"}`}>
                            <div className="text-center space-y-2">
                                <TrendingUp className={`h-12 w-12 mx-auto ${theme === "dark" ? "text-slate-600" : "text-muted-foreground/50"}`} />
                                <p className={`text-lg font-semibold ${theme === "dark" ? "text-slate-300" : ""}`}>{formatCurrency(stats?.total_revenue)}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-500" : "text-muted-foreground"}`}>Total revenue accumulated from all events</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Attendee Overview */}
                <Card className={theme === "dark" ? "border-slate-800 bg-slate-900" : ""}>
                    <CardHeader>
                        <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>Attendee Overview</CardTitle>
                        <CardDescription className={theme === "dark" ? "text-slate-400" : ""}>Total registration summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className={`h-[300px] flex flex-col items-center justify-center rounded-lg ${theme === "dark" ? "bg-slate-800/50" : "bg-muted/30"}`}>
                            <div className="text-center space-y-2">
                                <Users className={`h-12 w-12 mx-auto ${theme === "dark" ? "text-slate-600" : "text-muted-foreground/50"}`} />
                                <p className={`text-lg font-semibold ${theme === "dark" ? "text-slate-300" : ""}`}>{formatNumber(stats?.total_attendees)}</p>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-500" : "text-muted-foreground"}`}>Total registrations across all events</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
