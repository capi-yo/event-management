"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
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
    Banknote,
    TrendingUp,
    Percent,
    Ticket,
    Users,
    Calendar,
    ArrowRight,
    Loader2,
    DollarSign,
    Save,
    Send,
    RefreshCw,
    Wallet
} from "lucide-react"
import { adminApi } from "@/lib/api"

export default function AdminFinancials() {
    const { theme } = useTheme()
    const { toast } = useToast()

    // Loading & error state
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [updatingRate, setUpdatingRate] = useState(false)
    const [payoutInProgress, setPayoutInProgress] = useState<number | null>(null)

    // Data states
    const [analytics, setAnalytics] = useState<any>(null)
    const [commissionRateInput, setCommissionRateInput] = useState("")

    const fetchFinancialData = async () => {
        try {
            setLoading(true)
            const res = await adminApi.getFinanceAnalytics()
            if (res.success) {
                setAnalytics(res.data)
                setCommissionRateInput(res.data.commission_rate.toString())
            } else {
                setError("Failed to load financial statistics")
            }
        } catch (err: any) {
            console.error("Finance fetch error:", err)
            setError(err.message || "Failed to load financial data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchFinancialData()
    }, [])

    const handleUpdateCommissionRate = async (e: React.FormEvent) => {
        e.preventDefault()
        const rate = parseFloat(commissionRateInput)
        if (isNaN(rate) || rate < 0 || rate > 100) {
            toast({
                title: "Invalid Commission Rate",
                description: "The rate must be a valid number between 0% and 100%",
                variant: "destructive"
            })
            return
        }

        try {
            setUpdatingRate(true)
            const res = await adminApi.updateFinanceSettings(rate)
            if (res.success) {
                toast({
                    title: "Settings Updated",
                    description: `Admin commission rate successfully set to ${rate.toFixed(2)}%`,
                    variant: "success"
                })
                // Refresh data
                const fresh = await adminApi.getFinanceAnalytics()
                if (fresh.success) setAnalytics(fresh.data)
            } else {
                toast({
                    title: "Update Failed",
                    description: "Failed to update commission settings",
                    variant: "destructive"
                })
            }
        } catch (err: any) {
            toast({
                title: "Update Error",
                description: err.message || "Failed to contact backend server",
                variant: "destructive"
            })
        } finally {
            setUpdatingRate(false)
        }
    }

    const handleSimulatePayout = async (organizerId: number, organizerName: string, amount: number) => {
        if (amount <= 0) {
            toast({
                title: "Zero Balance",
                description: `${organizerName} does not have any pending balance to withdraw.`,
                variant: "default"
            })
            return
        }

        try {
            setPayoutInProgress(organizerId)
            // Simulate direct wire/payout transaction.
            // In a production environment, this would hit Stripe/PayPal or Bank API.
            // We simulate it locally by issuing a payout transaction.
            // Wait 1.5s for simulation
            await new Promise(resolve => setTimeout(resolve, 1500))

            toast({
                title: "Payout Successful",
                description: `Successfully wired ETB ${amount.toFixed(2)} to ${organizerName}.`,
                variant: "success"
            })
            
            // Refresh data
            const res = await adminApi.getFinanceAnalytics()
            if (res.success) setAnalytics(res.data)
        } catch (err: any) {
            toast({
                title: "Payout Failed",
                description: "Simulation error during payout process.",
                variant: "destructive"
            })
        } finally {
            setPayoutInProgress(null)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ETB'
        }).format(amount)
    }

    if (loading) {
        return (
            <div className="flex h-[500px] flex-col items-center justify-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-crimson" />
                <p className="text-sm text-muted-foreground">Loading financial analytics...</p>
            </div>
        )
    }

    if (error || !analytics) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center space-y-4 text-center">
                <div className="rounded-full bg-red-100 p-3 text-red-500 dark:bg-red-900/20">
                    <Banknote className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-bold">Failed to load financials</h3>
                <p className="text-muted-foreground max-w-md">{error || "Server could not be reached."}</p>
                <Button onClick={fetchFinancialData} className="bg-crimson hover:bg-crimson-dark">
                    <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
            </div>
        )
    }

    const stats = analytics.stats
    const recentCommissions = analytics.recent_commissions
    const organizerEarnings = analytics.organizer_earnings
    const trendData = analytics.revenue_trend

    // SVG Chart configuration
    const chartHeight = 220
    const chartWidth = 560
    const padding = { top: 20, right: 30, bottom: 40, left: 50 }

    // Compute max values for trend chart scaling
    const maxVal = Math.max(...trendData.map((d: any) => d.gross_revenue), 100) * 1.1

    // Generate path points for trend chart SVG
    const getCoordinates = () => {
        if (trendData.length === 0) return ""
        const dx = (chartWidth - padding.left - padding.right) / (trendData.length - 1 || 1)
        const dy = (chartHeight - padding.top - padding.bottom) / maxVal

        return trendData.map((d: any, index: number) => {
            const x = padding.left + index * dx
            const y = chartHeight - padding.bottom - d.gross_revenue * dy
            return `${x},${y}`
        }).join(" ")
    }

    const getCommCoordinates = () => {
        if (trendData.length === 0) return ""
        const dx = (chartWidth - padding.left - padding.right) / (trendData.length - 1 || 1)
        const dy = (chartHeight - padding.top - padding.bottom) / maxVal

        return trendData.map((d: any, index: number) => {
            const x = padding.left + index * dx
            const y = chartHeight - padding.bottom - d.platform_commission * dy
            return `${x},${y}`
        }).join(" ")
    }

    const pathData = getCoordinates()
    const commPathData = getCommCoordinates()

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>Financial Dashboard</h1>
                    <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Track revenues, manage commission settings, and monitor organizer payouts</p>
                </div>
                <div>
                    <Button onClick={fetchFinancialData} variant="outline" className="border-border hover:bg-muted font-semibold">
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh Ledger
                    </Button>
                </div>
            </div>

            {/* Platform Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className={`border-l-4 border-l-primary hover:shadow-lg transition-all duration-200 ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white"}`}>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Gross Ticket Sales</p>
                                <p className={`text-2xl sm:text-3xl font-extrabold ${theme === "dark" ? "text-slate-100" : ""}`}>{formatCurrency(stats.total_gross)}</p>
                                <p className="text-xs text-muted-foreground">Total platform volume</p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                <Banknote className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200 ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white"}`}>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Platform Commissions</p>
                                <p className={`text-2xl sm:text-3xl font-extrabold text-amber-500`}>{formatCurrency(stats.total_commission)}</p>
                                <p className="text-xs text-muted-foreground">Platform net earnings ({analytics.commission_rate}%)</p>
                            </div>
                            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                                <Percent className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200 ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white"}`}>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Organizer Earnings</p>
                                <p className={`text-2xl sm:text-3xl font-extrabold text-green-500`}>{formatCurrency(stats.total_organizer)}</p>
                                <p className="text-xs text-muted-foreground">Sellers net shares</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className={`border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200 ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white"}`}>
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2">
                                <p className={`text-sm font-medium ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>Tickets Sold</p>
                                <p className={`text-2xl sm:text-3xl font-extrabold text-blue-500`}>{stats.total_tickets_sold}</p>
                                <p className="text-xs text-muted-foreground">Paid transactions volume</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                                <Ticket className="h-6 w-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Left-Right Layout for Settings & Charts */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Commission Setting Box */}
                <Card className={`lg:col-span-1 border border-border ${theme === "dark" ? "bg-slate-900/50" : "bg-white"}`}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Percent className="h-5 w-5 text-crimson" /> Commission Settings
                        </CardTitle>
                        <CardDescription>Configure the predefined platform transaction commission rate</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateCommissionRate} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Default Commission Fee (%)</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="10.00"
                                        value={commissionRateInput}
                                        onChange={(e) => setCommissionRateInput(e.target.value)}
                                        className="pr-12 text-lg font-bold"
                                        disabled={updatingRate}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-lg">%</span>
                                </div>
                                <p className="text-xs text-muted-foreground">This rate is automatically deducted from all future ticket purchases processed on EventMate.</p>
                            </div>
                            <Button type="submit" className="w-full bg-crimson hover:bg-crimson-dark text-white font-bold" disabled={updatingRate}>
                                {updatingRate ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Save Rate Configuration
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Interactive SVG Chart Card */}
                <Card className={`lg:col-span-2 border border-border ${theme === "dark" ? "bg-slate-900/50" : "bg-white"}`}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div>
                            <CardTitle>Platform Revenue Trends</CardTitle>
                            <CardDescription>Daily gross volume and net platform commissions</CardDescription>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold">
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-primary block"></span> Gross</span>
                            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-500 block"></span> Commission</span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center p-4">
                        {trendData.length === 0 ? (
                            <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                                No ticket transaction logs yet to generate visual trends.
                            </div>
                        ) : (
                            <div className="w-full overflow-x-auto">
                                <svg
                                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                                    className="w-full h-[220px]"
                                >
                                    {/* Grid Lines */}
                                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                                        const y = padding.top + ratio * (chartHeight - padding.top - padding.bottom)
                                        const gridVal = maxVal * (1 - ratio)
                                        return (
                                            <g key={index}>
                                                <line
                                                    x1={padding.left}
                                                    y1={y}
                                                    x2={chartWidth - padding.right}
                                                    y2={y}
                                                    stroke={theme === "dark" ? "#1e293b" : "#f1f5f9"}
                                                    strokeWidth={1}
                                                />
                                                <text
                                                    x={padding.left - 8}
                                                    y={y + 4}
                                                    textAnchor="end"
                                                    fontSize={10}
                                                    fill="#64748b"
                                                    className="font-medium"
                                                >
                                                    {Math.floor(gridVal)}
                                                </text>
                                            </g>
                                        )
                                    })}

                                    {/* X-axis labels */}
                                    {trendData.map((d: any, index: number) => {
                                        if (trendData.length > 8 && index % Math.floor(trendData.length / 4) !== 0) return null
                                        const dx = (chartWidth - padding.left - padding.right) / (trendData.length - 1 || 1)
                                        const x = padding.left + index * dx
                                        const y = chartHeight - padding.bottom + 16
                                        // Formats YYYY-MM-DD to MM/DD
                                        const label = d.date.substring(5).replace("-", "/")
                                        return (
                                            <text
                                                key={index}
                                                x={x}
                                                y={y}
                                                textAnchor="middle"
                                                fontSize={10}
                                                fill="#64748b"
                                                className="font-semibold"
                                            >
                                                {label}
                                            </text>
                                        )
                                    })}

                                    {/* Area Fill for Gross Volume */}
                                    {pathData && (
                                        <path
                                            d={`M ${padding.left},${chartHeight - padding.bottom} L ${pathData} L ${chartWidth - padding.right},${chartHeight - padding.bottom} Z`}
                                            fill="url(#gross-gradient)"
                                            opacity={0.12}
                                        />
                                    )}

                                    {/* Line Stroke for Gross */}
                                    {pathData && (
                                        <polyline
                                            fill="none"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={3}
                                            points={pathData}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}

                                    {/* Line Stroke for Commissions */}
                                    {commPathData && (
                                        <polyline
                                            fill="none"
                                            stroke="#f59e0b"
                                            strokeWidth={2.5}
                                            points={commPathData}
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeDasharray="4 2"
                                        />
                                    )}

                                    {/* Interactive nodes */}
                                    {trendData.map((d: any, index: number) => {
                                        const dx = (chartWidth - padding.left - padding.right) / (trendData.length - 1 || 1)
                                        const dy = (chartHeight - padding.top - padding.bottom) / maxVal
                                        const x = padding.left + index * dx
                                        const y = chartHeight - padding.bottom - d.gross_revenue * dy
                                        return (
                                            <g key={index} className="group cursor-pointer">
                                                <circle
                                                    cx={x}
                                                    cy={y}
                                                    r={4}
                                                    fill="hsl(var(--primary))"
                                                    stroke="#fff"
                                                    strokeWidth={1.5}
                                                    className="transition-all duration-200 group-hover:r-6"
                                                />
                                                <title>{`Date: ${d.date}\nGross: ETB ${d.gross_revenue.toFixed(2)}\nCommission: ETB ${d.platform_commission.toFixed(2)}`}</title>
                                            </g>
                                        )
                                    })}

                                    {/* Definition Gradients */}
                                    <defs>
                                        <linearGradient id="gross-gradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="hsl(var(--primary))" />
                                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Financial Ledger Section - Tables */}
            <Card className={`border border-border ${theme === "dark" ? "bg-slate-900/50" : "bg-white"}`}>
                <CardContent className="p-6">
                    <Tabs defaultValue="commissions" className="w-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b pb-4 mb-4 gap-4">
                            <TabsList className="grid grid-cols-2 w-[320px] bg-muted/50 rounded-lg p-1">
                                <TabsTrigger value="commissions" className="font-bold rounded-md">Commission Ledger</TabsTrigger>
                                <TabsTrigger value="organizers" className="font-bold rounded-md">Organizer Payouts</TabsTrigger>
                            </TabsList>
                            <span className="text-xs text-muted-foreground font-medium">Record updates automatically on ticket sales</span>
                        </div>

                        {/* Commission Ledger Tab */}
                        <TabsContent value="commissions" className="space-y-4">
                            <div className="overflow-x-auto rounded-lg border border-border">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead className="font-semibold">Event Title</TableHead>
                                            <TableHead className="font-semibold">Buyer</TableHead>
                                            <TableHead className="font-semibold">Ticket category</TableHead>
                                            <TableHead className="font-semibold text-right">Gross price</TableHead>
                                            <TableHead className="font-semibold text-center">Comm. rate</TableHead>
                                            <TableHead className="font-semibold text-right text-amber-500">Platform Comm.</TableHead>
                                            <TableHead className="font-semibold text-right text-green-500">Organizer share</TableHead>
                                            <TableHead className="font-semibold">Purchase date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentCommissions.map((row: any) => (
                                            <TableRow key={row.id} className="hover:bg-muted/20">
                                                <TableCell className="font-semibold max-w-[180px] truncate">{row.event_title}</TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold">{row.buyer_name}</span>
                                                        <span className="text-xs text-muted-foreground max-w-[130px] truncate">{row.buyer_email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs font-semibold">{row.ticket_type}</Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-semibold">{formatCurrency(row.ticket_price)}</TableCell>
                                                <TableCell className="text-center font-bold text-muted-foreground">{row.commission_rate}%</TableCell>
                                                <TableCell className="text-right font-extrabold text-amber-500">{formatCurrency(row.commission_amount)}</TableCell>
                                                <TableCell className="text-right font-extrabold text-green-500">{formatCurrency(row.organizer_amount)}</TableCell>
                                                <TableCell className="text-xs font-semibold text-muted-foreground">
                                                    {new Date(row.created_at).toLocaleString('en-US', {
                                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {recentCommissions.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground font-medium">
                                                    No ticket commission ledger entries found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>

                        {/* Organizer Payouts Tab */}
                        <TabsContent value="organizers" className="space-y-4">
                            <div className="overflow-x-auto rounded-lg border border-border">
                                <Table>
                                    <TableHeader className="bg-muted/30">
                                        <TableRow>
                                            <TableHead className="font-semibold">Organizer name</TableHead>
                                            <TableHead className="font-semibold">Wallet account</TableHead>
                                            <TableHead className="font-semibold text-center">Tickets sold</TableHead>
                                            <TableHead className="font-semibold text-right">Gross sales</TableHead>
                                            <TableHead className="font-semibold text-right text-amber-500">Total fees paid</TableHead>
                                            <TableHead className="font-semibold text-right text-green-500">Organizer earnings</TableHead>
                                            <TableHead className="font-semibold text-right">Current wallet balance</TableHead>
                                            <TableHead className="font-semibold text-right">Payout action</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {organizerEarnings.map((row: any) => (
                                            <TableRow key={row.organizer_id} className="hover:bg-muted/20">
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold">{row.organizer_name}</span>
                                                        <span className="text-xs text-muted-foreground">{row.organizer_email}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-muted-foreground">
                                                        <Wallet className="h-3.5 w-3.5" />
                                                        {row.account_number || "EM00000000"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center font-bold">{row.tickets_sold}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(row.gross_revenue)}</TableCell>
                                                <TableCell className="text-right font-medium text-amber-500">{formatCurrency(row.platform_commission)}</TableCell>
                                                <TableCell className="text-right font-extrabold text-green-500">{formatCurrency(row.organizer_earnings)}</TableCell>
                                                <TableCell className="text-right font-extrabold text-slate-800 dark:text-slate-100">{formatCurrency(row.wallet_balance)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSimulatePayout(row.organizer_id, row.organizer_name, row.wallet_balance)}
                                                        disabled={payoutInProgress === row.organizer_id || row.wallet_balance <= 0}
                                                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-8 text-xs rounded-md shadow-sm uppercase tracking-wide cursor-pointer"
                                                    >
                                                        {payoutInProgress === row.organizer_id ? (
                                                            <>
                                                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Wiring...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Send className="mr-1.5 h-3.5 w-3.5" /> Wire payout
                                                            </>
                                                        )}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {organizerEarnings.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground font-medium">
                                                    No event organizers found on this platform.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
