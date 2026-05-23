'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            return;
        }

        setLoading(true);

        try {
            const res = await authApi.forgotPassword(email);
            setMessage(res.message || 'OTP Code sent successfully. Redirecting...');
            setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(email)}`);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Failed to request password reset. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center habesha-surface px-4 py-12">
                <Card className="w-full max-w-md relative">
                    {/* Return Arrow */}
                    <div className="absolute left-4 top-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => router.push('/login')} 
                            className="h-8 w-8 rounded-full"
                            title="Return to Login"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </div>

                    <CardHeader className="space-y-1 text-center pt-8">
                        <CardTitle className="text-2xl">Forgot Password</CardTitle>
                        <CardDescription>
                            Enter your email address and we'll send you a 6-digit OTP code to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20">
                                    {error}
                                </div>
                            )}
                            {message && (
                                <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20">
                                    {message}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium">
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading || !!message}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pt-6">
                            <Button type="submit" className="w-full bg-crimson hover:bg-crimson-dark" disabled={loading || !!message}>
                                {loading ? 'Sending OTP Code...' : 'Send Reset OTP Code'}
                            </Button>
                            <p className="text-center text-sm text-muted-foreground">
                                Remembered your password?{' '}
                                <Link href="/login" className="font-medium text-crimson hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
