'use client';

import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import AuthNavbar from '@/components/AuthNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Save, LogOut } from 'lucide-react';
import { userApi } from '@/lib/api';

export default function ProfilePage() {
    const router = useRouter();
    const { user, userData, signOut, refreshUser, loading: authLoading } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Redirect organizers to their own profile page
    useEffect(() => {
        if (user && userData?.role === 'Organizer') {
            router.push('/organiser/profile');
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
            <div className="flex min-h-screen flex-col">
                <AuthNavbar />
                <main className="flex-1 flex items-center justify-center mt-16">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson mx-auto"></div>
                </main>
                <Footer />
            </div>
        );
    }

    // Don't render if not authenticated
    if (!user) {
        return null;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess(false);

        try {
            await userApi.updateProfile(displayName);
            await refreshUser();
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
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
        <div className="flex min-h-screen flex-col">
            <AuthNavbar />
            <main className="flex-1 py-8 mt-16">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-2xl">
                        <h1 className="mb-8 text-3xl font-bold">My Profile</h1>

                        <div className="mb-8 flex items-center gap-4">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src="" alt={userData?.displayName || 'User'} />
                                <AvatarFallback className="bg-crimson text-white text-2xl">
                                    {userData?.displayName ? getInitials(userData.displayName) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="text-2xl font-semibold">{userData?.displayName || 'User'}</h2>
                                <p className="text-muted-foreground capitalize">{userData?.role?.replace('_', ' ')}</p>
                            </div>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>Update your personal information</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {success && (
                                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-500 dark:bg-green-900/20">
                                            Profile updated successfully!
                                        </div>
                                    )}
                                    {error && (
                                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20">
                                            {error}
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label htmlFor="displayName" className="text-sm font-medium flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Full Name
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
                                        <Button type="submit" className="bg-crimson hover:bg-crimson-dark" disabled={saving}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </Button>
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
            </main>
            <Footer />
        </div>
    );
}
