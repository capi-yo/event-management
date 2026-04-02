'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/components/ui/use-toast";
import { notificationsApi, adminApi } from '@/lib/api';
import { Send, Users, User, Loader2, Info, AlertCircle, Search, Check, X, Shield, Plus, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminNotificationsPage() {
    const { theme } = useTheme();
    const { toast } = useToast();
    const [userIds, setUserIds] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    // User selection states
    const [searchQuery, setSearchQuery] = useState('');
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleSendBulk = async () => {
        // Use either manually entered IDs or selected users
        let finalIds: number[] = [];

        if (selectedUsers.length > 0) {
            finalIds = selectedUsers.map(u => u.id);
        } else if (userIds.trim()) {
            finalIds = userIds.split(/[,\s]+/).map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }

        if (finalIds.length === 0 || !message.trim()) {
            toast({
                title: "Error",
                description: "Please select recipients and enter a message.",
                variant: "destructive"
            });
            return;
        }

        try {
            setSending(true);
            const response = await notificationsApi.sendBulk(finalIds, message);
            if (response.success) {
                toast({
                    title: "Success",
                    description: `Notification sent to ${finalIds.length} user(s).`
                });
                setMessage('');
                setUserIds('');
                setSelectedUsers([]);
            }
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message || "Failed to send bulk notifications",
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    const searchUsers = async (query: string) => {
        try {
            setLoadingUsers(true);
            const res = await adminApi.getUsers({ search: query, limit: 10 });
            if (res.success) {
                setAvailableUsers(res.data.users);
            }
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const toggleUserSelection = (user: any) => {
        if (selectedUsers.some(u => u.id === user.id)) {
            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
        } else {
            setSelectedUsers([...selectedUsers, user]);
            setUserIds(''); // Clear manual entry if using selection
        }
    };

    const removeSelectedUser = (userId: number) => {
        setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className={`text-3xl font-bold tracking-tight ${theme === "dark" ? "text-slate-100" : ""}`}>Admin Notifications</h1>
                <p className={theme === "dark" ? "text-slate-400" : "text-muted-foreground"}>Broadcast announcements and alerts to platform users</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className={theme === "dark" ? "bg-slate-900 border-slate-800" : ""}>
                        <CardHeader>
                            <CardTitle className={theme === "dark" ? "text-slate-100" : ""}>Send Notification</CardTitle>
                            <CardDescription className={theme === "dark" ? "text-slate-400" : ""}>Enter user IDs and the message you want to broadcast.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="userIds" className={theme === "dark" ? "text-slate-200" : ""}>Recipients</Label>
                                    <Dialog open={dialogOpen} onOpenChange={(open) => {
                                        setDialogOpen(open);
                                        if (open && availableUsers.length === 0) searchUsers('');
                                    }}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 gap-2 bg-[#AC1212]/5 hover:bg-[#AC1212]/10 border-[#AC1212]/20 text-[#AC1212]">
                                                <Search className="h-3.5 w-3.5" />
                                                Select Users
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className={`sm:max-w-[500px] ${theme === "dark" ? "bg-slate-900 border-slate-800" : ""}`}>
                                            <DialogHeader>
                                                <DialogTitle className={theme === "dark" ? "text-slate-100" : ""}>Select Recipients</DialogTitle>
                                                <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                                                    Search for users by name or email and add them to the recipient list.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 pt-4">
                                                <div className="relative">
                                                    <Search className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`} />
                                                    <Input
                                                        placeholder="Name or email..."
                                                        className={`pl-10 ${theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-100" : ""}`}
                                                        value={searchQuery}
                                                        onChange={(e) => {
                                                            setSearchQuery(e.target.value);
                                                            searchUsers(e.target.value);
                                                        }}
                                                    />
                                                </div>

                                                <ScrollArea className="h-[300px] pr-4">
                                                    {loadingUsers ? (
                                                        <div className="flex items-center justify-center h-full">
                                                            <Loader2 className="h-6 w-6 animate-spin text-[#AC1212]" />
                                                        </div>
                                                    ) : availableUsers.length === 0 ? (
                                                        <div className="text-center py-10 text-muted-foreground">
                                                            No users found.
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {availableUsers.map(user => (
                                                                <div
                                                                    key={user.id}
                                                                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${selectedUsers.some(u => u.id === user.id)
                                                                        ? "bg-[#AC1212]/5 border-[#AC1212]/30"
                                                                        : theme === "dark" ? "bg-slate-800/50 border-slate-700 hover:bg-slate-800" : "hover:bg-slate-50 border-slate-100"
                                                                        }`}
                                                                    onClick={() => toggleUserSelection(user)}
                                                                >
                                                                    <Checkbox
                                                                        checked={selectedUsers.some(u => u.id === user.id)}
                                                                        className={selectedUsers.some(u => u.id === user.id) ? "border-[#AC1212] bg-[#AC1212]" : ""}
                                                                    />
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`text-sm font-semibold truncate ${theme === "dark" ? "text-slate-100" : ""}`}>{user.name}</p>
                                                                        <p className={`text-xs truncate ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>{user.email}</p>
                                                                    </div>
                                                                    <Badge variant="outline" className={`text-[10px] uppercase font-bold px-1.5 py-0 ${user.role === 'Administrator' ? "border-red-500 text-red-500 bg-red-500/10" :
                                                                        user.role === 'Organizer' ? "border-blue-500 text-blue-500 bg-blue-500/10" :
                                                                            theme === "dark" ? "border-slate-600 text-slate-400" : "border-slate-200 text-slate-500"
                                                                        }`}>
                                                                        {user.role}
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </ScrollArea>

                                                <div className="flex justify-between items-center bg-slate-100/50 dark:bg-slate-800/50 p-3 rounded-lg border dark:border-slate-700">
                                                    <span className="text-sm font-medium">
                                                        {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                                                    </span>
                                                    <Button size="sm" className="bg-[#AC1212] hover:bg-[#8a0f0f]" onClick={() => setDialogOpen(false)}>
                                                        Done
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>

                                {selectedUsers.length > 0 ? (
                                    <div className={`p-3 rounded-lg border flex flex-wrap gap-2 max-h-[120px] overflow-y-auto ${theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-100"}`}>
                                        {selectedUsers.map(user => (
                                            <Badge
                                                key={user.id}
                                                variant="secondary"
                                                className={`pl-2 pr-1 py-1 flex items-center gap-1 ${theme === "dark" ? "bg-slate-700 text-slate-100 border-slate-600 hover:bg-slate-600" : "bg-white border-slate-200"}`}
                                            >
                                                <span className="max-w-[120px] truncate">{user.name}</span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-4 w-4 rounded-full p-0"
                                                    onClick={() => removeSelectedUser(user.id)}
                                                >
                                                    <X className="h-2.5 w-2.5" />
                                                </Button>
                                            </Badge>
                                        ))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-[10px] h-7 px-2 text-[#AC1212] font-bold hover:bg-[#AC1212]/10"
                                            onClick={() => setSelectedUsers([])}
                                        >
                                            Clear All
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="py-4 px-3 rounded-lg border border-dashed text-center text-sm text-muted-foreground">
                                        No recipients selected. Click "Select Users" to add recipients.
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message" className={theme === "dark" ? "text-slate-200" : ""}>Message Content</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Type your announcement here..."
                                    className={`min-h-[150px] resize-none ${theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-100 focus:ring-red-600" : "focus:ring-[#AC1212]"}`}
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSendBulk}
                                    disabled={sending || (!userIds.trim() && selectedUsers.length === 0) || !message.trim()}
                                    className="bg-[#AC1212] hover:bg-[#8a0f0f] text-white min-w-[140px] shadow-lg shadow-red-900/20 transition-all font-semibold"
                                >
                                    {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                                    {sending ? "Sending..." : "Send Notification"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className={theme === "dark" ? "bg-slate-900 border-slate-800 shadow-md" : "shadow-sm"}>
                        <CardHeader>
                            <CardTitle className={`text-base flex items-center gap-2 ${theme === "dark" ? "text-slate-100" : ""}`}>
                                <AlertCircle className="h-4 w-4 text-orange-500" />
                                Admin Guidelines
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-4">
                            <ul className={`space-y-3 ${theme === "dark" ? "text-slate-400" : "text-muted-foreground"}`}>
                                <li className="flex gap-2">
                                    <span className="text-[#AC1212] font-bold">•</span>
                                    <span>Notifications are sent immediately upon pressing send.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#AC1212] font-bold">•</span>
                                    <span>Verify user IDs before broadcasting sensitive information.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#AC1212] font-bold">•</span>
                                    <span>A high frequency of notifications may be considered intrusive by users.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-[#AC1212] font-bold">•</span>
                                    <span>Messages are stored in the database for user history.</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className={theme === "dark" ? "bg-[#AC1212]/5 border-slate-800" : "bg-red-50/50 border-red-100"}>
                        <CardHeader className="pb-2">
                            <div className="w-10 h-10 rounded-full bg-[#AC1212]/10 flex items-center justify-center mb-2">
                                <Users className="h-5 w-5 text-[#AC1212]" />
                            </div>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-[#AC1212]">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="ghost" className="w-full justify-start text-xs font-semibold hover:bg-[#AC1212]/10 h-8" onClick={() => setUserIds('all')}>
                                Target All (Custom Logic)
                            </Button>
                            <Button variant="ghost" className="w-full justify-start text-xs font-semibold hover:bg-slate-200/10 h-8" onClick={() => setMessage('System maintenance scheduled for tonight.')}>
                                Maintenance Template
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
