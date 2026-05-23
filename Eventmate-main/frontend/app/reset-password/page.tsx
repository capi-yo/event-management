'use client';

import { useState, useEffect, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { validateEmail, validatePassword } from '@/lib/validations';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

function ResetPasswordContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [token, setToken] = useState(''); // OTP Code
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    const handleNextStep = (e: React.MouseEvent) => {
        e.preventDefault();
        setMessage('');
        setSuccessMessage('');

        const emailError = validateEmail(email);
        if (emailError) {
            setErrorState(emailError);
            return;
        }

        if (!token || token.length !== 6) {
            setErrorState('Please enter the 6-digit OTP code.');
            return;
        }

        setStep(2);
    };

    const handleBackStep = () => {
        setStep(1);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setErrorState('');
        setSuccessMessage('');

        const emailError = validateEmail(email);
        if (emailError) {
            setErrorState(emailError);
            return;
        }

        if (!token) {
            setErrorState('Please enter the 6-digit OTP code.');
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            setErrorState(passwordError);
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
        const emailError = validateEmail(email);
        if (emailError) {
            setErrorState('Please enter a valid email address first to resend OTP.');
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
                    onClick={step === 2 ? handleBackStep : () => router.push('/login')} 
                    className="h-8 w-8 rounded-full"
                    title={step === 2 ? "Go back to OTP verification" : "Return to Login"}
                >
                    <ArrowLeft className="h-4 w-4" />
                </Button>
            </div>

            <CardHeader className="space-y-1 text-center pt-8">
                <CardTitle className="text-2xl">
                    {!successMessage && step === 1 ? 'Verify Reset Code' : 'Create New Password'}
                </CardTitle>
                <CardDescription>
                    {!successMessage && step === 1 
                        ? 'Enter your email address and the 6-digit OTP code sent to your inbox.' 
                        : 'Choose a secure new password for your EventMate account.'}
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
                    
                    {!successMessage && step === 1 && (
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
                                    className="text-center font-bold tracking-widest text-lg animate-fade-in"
                                    disabled={loading}
                                />
                            </div>
                        </>
                    )}

                    {!successMessage && step === 2 && (
                        <>
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your new password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </button>
                                </div>
                                <PasswordStrengthIndicator password={password} />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm your new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                        title={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-6">
                    {!successMessage ? (
                        <>
                            {step === 1 ? (
                                <Button 
                                    type="button" 
                                    onClick={handleNextStep} 
                                    className="w-full bg-crimson hover:bg-crimson-dark"
                                >
                                    Reset Password
                                </Button>
                            ) : (
                                <div className="w-full space-y-2">
                                    <Button type="submit" className="w-full bg-crimson hover:bg-crimson-dark" disabled={loading}>
                                        {loading ? 'Resetting password...' : 'Continue'}
                                    </Button>
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={handleBackStep} 
                                        className="w-full border-zinc-200 hover:bg-zinc-50"
                                        disabled={loading}
                                    >
                                        Back
                                    </Button>
                                </div>
                            )}
                            
                            {step === 1 && (
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

export default function ResetPasswordPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center habesha-surface px-4 py-12">
                <Suspense fallback={<div>Loading reset details...</div>}>
                    <ResetPasswordContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
