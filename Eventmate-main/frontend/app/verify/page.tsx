'use client';

import { useState, useEffect, Suspense, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
    const [message, setMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    
    // Resend OTP Cooldown state
    const [cooldown, setCooldown] = useState(0);
    const [resendLoading, setResendLoading] = useState(false);

    useEffect(() => {
        const emailParam = searchParams.get('email') || '';
        const codeParam = searchParams.get('code') || '';
        if (emailParam) setEmail(emailParam);
        if (codeParam) setCode(codeParam);
        
        // Auto-verify if both are present in URL
        if (emailParam && codeParam) {
            setStatus('loading');
            verifyEmail(emailParam, codeParam);
        }
    }, [searchParams]);

    // Cooldown countdown effect
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => {
            setCooldown(cooldown - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const verifyEmail = async (userEmail: string, verificationCode: string) => {
        try {
            const res = await authApi.verify(userEmail, verificationCode);
            setStatus('success');
            setSuccessMessage(res.message || 'Your email has been verified successfully.');
            setMessage('');
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Failed to verify email. The code might be invalid or expired.');
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setMessage('');
        setSuccessMessage('');
        
        if (!email || !code) {
            setStatus('error');
            setMessage('Please enter both email and verification code.');
            return;
        }
        setStatus('loading');
        verifyEmail(email, code);
    };

    const handleResendOtp = async () => {
        if (!email) {
            setStatus('error');
            setMessage('Please enter your email address first to resend OTP.');
            return;
        }

        setMessage('');
        setSuccessMessage('');
        setResendLoading(true);

        try {
            const res = await authApi.resendOtp(email, 'verification');
            setSuccessMessage(res.message || 'Verification code resent successfully.');
            setCooldown(60); // 60 seconds cooldown
        } catch (error: any) {
            setStatus('error');
            setMessage(error.message || 'Failed to resend verification code.');
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
                <CardTitle className="text-2xl">Email Verification</CardTitle>
                <CardDescription>
                    {status === 'loading' ? 'Verifying your email...' :
                     status === 'success' ? 'Verification complete' : 
                     'Enter the 6-digit OTP code sent to your email.'}
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4 py-4">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center space-y-4 py-6">
                            <Loader2 className="h-8 w-8 animate-spin text-crimson" />
                            <p>Please wait while we verify your email...</p>
                        </div>
                    )}
                    
                    {status === 'success' && (
                        <div className="flex flex-col items-center space-y-4 text-center py-6">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center dark:bg-green-900/20">
                                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-green-600 dark:text-green-400 font-medium">{successMessage}</p>
                            <p className="text-sm text-muted-foreground mt-2">You can now sign in to your account.</p>
                        </div>
                    )}
                    
                    {message && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20">
                            {message}
                        </div>
                    )}

                    {successMessage && status !== 'success' && (
                        <div className="rounded-md bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20">
                            {successMessage}
                        </div>
                    )}
                    
                    {status !== 'loading' && status !== 'success' && (
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
                                    disabled={status === 'loading'}
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="code" className="text-sm font-medium">
                                    Verification Code (OTP)
                                </label>
                                <Input
                                    id="code"
                                    type="text"
                                    placeholder="123456"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    maxLength={6}
                                    required
                                    className="text-center font-bold tracking-widest text-lg"
                                    disabled={status === 'loading'}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    {status !== 'success' ? (
                        <>
                            <Button 
                                type="submit" 
                                className="w-full bg-crimson hover:bg-crimson-dark"
                                disabled={status === 'loading'}
                            >
                                Verify Email
                            </Button>
                            
                            {status !== 'loading' && (
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
                                    
                                    <Link href="/register" className="text-muted-foreground hover:underline font-medium">
                                        Back to Register
                                    </Link>
                                </div>
                            )}

                            {status === 'error' && (
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => setStatus('idle')}
                                >
                                    Try Again
                                </Button>
                            )}
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

export default function VerifyPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center habesha-surface px-4 py-12">
                <Suspense fallback={<div>Loading...</div>}>
                    <VerifyContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
