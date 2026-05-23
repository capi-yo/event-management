'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/AuthContext';
import { getUser } from '@/lib/api';
import { validateEmail, validatePassword } from '@/lib/validations';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const getRedirectUrl = (role: string): string => {
        switch (role) {
            case 'Administrator':
                return '/admin';
            case 'Organizer':
                return '/organiser';
            default:
                return '/events';
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        const emailError = validateEmail(email);
        if (emailError) {
            setError(emailError);
            return;
        }

        setLoading(true);

        try {
            await signIn(email, password);
            // Get user from localStorage to determine redirect
            const user = getUser();
            if (user) {
                const redirectUrl = getRedirectUrl(user.role);
                router.push(redirectUrl);
            } else {
                router.push('/');
            }
        } catch (err: any) {
            if (err.needsVerification) {
                router.push(`/verify?email=${encodeURIComponent(email)}`);
            } else {
                setError(err.message || 'Invalid email or password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center habesha-surface px-4 py-12">
                <Card className="w-full max-w-md border-t-2 border-t-habesha-gold/50">
                    <CardHeader className="space-y-1 relative pt-8">
                        <Link href="/" className="absolute left-4 top-4 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center h-8 w-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" title="Return Home">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <CardTitle className="text-2xl text-center">Welcome back</CardTitle>
                        <CardDescription className="text-center">
                            Enter your email and password to sign in to your account
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit} autoComplete="on" method="POST" action="/login">
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="rounded-md bg-red-50 p-3 text-sm text-red-500 dark:bg-red-900/20">
                                    {error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium">
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="username"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium">
                                    Password
                                </label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        required
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
                                <div className="flex justify-end pt-1">
                                    <Link href="/forgot-password" className="text-xs text-crimson hover:underline">
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pt-6">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </Button>
                            
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-muted" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                                </div>
                            </div>

                            <Button type="button" variant="outline" className="w-full gap-2" onClick={() => alert('Google login is not yet configured on this platform.')}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Google
                            </Button>

                            <p className="text-center text-sm text-muted-foreground mt-2">
                                Don't have an account?{' '}
                                <Link href="/register" className="font-medium text-crimson hover:underline">
                                    Sign up
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
