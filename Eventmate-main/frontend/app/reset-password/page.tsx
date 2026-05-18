'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState('');
    const [token, setToken] = useState(''); // OTP Code
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Resend OTP Cooldown state
    const [cooldown, setCooldown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get('email') || '';
        const tokenParam = searchParams.get('token') || '';
        if (emailParam) setEmail(emailParam);
        if (tokenParam) setToken(tokenParam);
    }, [searchParams]);

    // Cooldown countdown effect
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => {
            setCooldown(cooldown - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorState('');
        setSuccessMessage('');

        if (!email) {
            setErrorState('Please enter your account email.');
            return;
        }

        if (!token) {
            setErrorState('Please enter the 6-digit OTP code.');
            return;
        }

        if (password.length < 6) {
            setErrorState('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setErrorState('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const res = await authApi.resetPassword({ email, token, password });
            setSuccessMessage(res.message || 'Your password has been reset successfully.');
        } catch (err: any) {
            setErrorState(err.message || 'Failed to reset password. The code might be invalid or expired.');
        } finally {
            setLoading(false);
        }
    };

    const setErrorState = (msg: string) => {
        setMessage(msg);
    };

    const handleResendOtp = async () => {
        if (!email) {
            setErrorState('Please enter your email address first to resend OTP.');
            return;
        }

        setMessage('');
        setSuccessMessage('');
        setResendLoading(true);

        try {
            const res = await authApi.resendOtp(email, 'reset');
            setSuccessMessage(res.message || 'Password reset OTP code resent successfully.');
            setCooldown(60); // 60 seconds cooldown
        } catch (error: any) {
            setErrorState(error.message || 'Failed to resend OTP code.');
        } finally {
            setResendLoading(false);
        }
    };

    return (
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
                <CardTitle className="text-2xl">Reset Password</CardTitle>
                <CardDescription>
                    Enter your email, the OTP code sent to you, and your new password.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {message && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20">
                            {message}
                        </div>
                    )}
                    {successMessage && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20">
                            {successMessage}
                        </div>
                    )}
                    
                    {!successMessage && (
                        <>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium">
                                    Email Address
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="token" className="text-sm font-medium">
                                    Reset Code (OTP)
                                </label>
                                <Input
                                    id="token"
                                    type="text"
                                    placeholder="123456"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    maxLength={6}
                                    required
                                    className="text-center font-bold tracking-widest text-lg"
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium">
                                    New Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium">
                                    Confirm New Password
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-6">
                    {!successMessage ? (
                        <>
                            <Button type="submit" className="w-full bg-crimson hover:bg-crimson-dark" disabled={loading}>
                                {loading ? 'Resetting password...' : 'Reset Password'}
                            </Button>
                            
                            <div className="w-full flex items-center justify-between text-sm">
                                <Button
                                    type="button"
                                    variant="link"
                                    onClick={handleResendOtp}
                                    disabled={cooldown > 0 || resendLoading}
                                    className="text-crimson hover:underline p-0 h-auto font-medium"
                                >
                                    {resendLoading ? (
                                        <span className="flex items-center gap-1">
                                            <Loader2 className="h-3 w-3 animate-spin" /> Sending...
                                        </span>
                                    ) : cooldown > 0 ? (
                                        `Resend OTP in ${cooldown}s`
                                    ) : (
                                        'Resend OTP Code'
                                    )}
                                </Button>
                                
                                <Link href="/login" className="text-muted-foreground hover:underline font-medium">
                                    Back to Login
                                </Link>
                            </div>
                        </>
                    ) : (
                        <Button 
                            type="button" 
                            className="w-full bg-crimson hover:bg-crimson-dark"
                            onClick={() => router.push('/login')}
                        >
                            Go to Login
                        </Button>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
                <Suspense fallback={<div>Loading reset details...</div>}>
                    <ResetPasswordContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
