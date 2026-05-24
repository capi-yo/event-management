'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Save, LogOut } from 'lucide-react';
import { userApi } from '@/lib/api';
import { FeedbackButton } from '@/components/FeedbackButton';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';

export default function OrganiserProfilePage() {
    const router = useRouter();
    const { user, userData, signOut, refreshUser, loading: authLoading } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const saveFeedback = useButtonFeedback();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Redirect non-organizers to regular profile page
    useEffect(() => {
        if (user && userData?.role !== 'Organizer') {
            router.push('/profile');
        }
    }, [user, userData, router]);

    useEffect(() => {
        if (userData) {
            setDisplayName(userData.displayName || '');
            setEmail(userData.email || '');
        }
    }, [userData]);

    // Show loading while checking authentication
    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson mx-auto"></div>
            </div>
        );
    }

    // Don't render if not authenticated or not an organizer
    if (!user || userData?.role !== 'Organizer') {
        return null;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            await userApi.updateProfile({ name: displayName });
            await refreshUser();
            saveFeedback.showSaved();
        } catch (err: any) {
            setError(err.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mx-auto max-w-2xl">
                <h1 className="mb-8 text-3xl font-bold">Organiser Profile</h1>

                <div className="mb-8 flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src="" alt={userData?.displayName || 'Organiser'} />
                        <AvatarFallback className="bg-crimson text-white text-2xl">
                            {userData?.displayName ? getInitials(userData.displayName) : 'O'}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h2 className="text-2xl font-semibold">{userData?.displayName || 'Organiser'}</h2>
                        <p className="text-muted-foreground">Event Organiser</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your organiser profile information</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label htmlFor="displayName" className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    Organisation Name
                                </label>
                                <Input
                                    id="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled
                                />
                                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                            </div>
                            <div className="flex gap-3">
                                <FeedbackButton
                                    type="submit"
                                    className="bg-crimson hover:bg-crimson-dark"
                                    loading={saving}
                                    feedback={saveFeedback.feedback}
                                    defaultLabel="Save Changes"
                                    loadingLabel="Saving..."
                                    savedLabel="Saved"
                                    icon={Save}
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={handleLogout}
                                    className="cursor-pointer"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Log Out
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
