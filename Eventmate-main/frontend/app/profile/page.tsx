'use client';

import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import AuthNavbar from '@/components/AuthNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Save, LogOut, Camera, Phone, FileText, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { userApi, API_BASE_URL, UserProfile } from '@/lib/api';
import { FeedbackButton } from '@/components/FeedbackButton';
import { useButtonFeedback } from '@/hooks/useButtonFeedback';
import { validateName, validatePassword, validatePhone } from '@/lib/validations';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';

export default function ProfilePage() {
    const router = useRouter();
    const { user, userData, signOut, refreshUser, loading: authLoading } = useAuth();

    // Profile data from the backend (source of truth for avatar, etc.)
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // ── Profile form state ──
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileError, setProfileError] = useState('');

    // ── Avatar state ──
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [avatarSuccess, setAvatarSuccess] = useState('');
    const [avatarError, setAvatarError] = useState('');

    // ── Password form state ──
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [pwSuccess, setPwSuccess] = useState('');
    const [pwError, setPwError] = useState('');

    const profileSaveFeedback = useButtonFeedback();
    const avatarSaveFeedback = useButtonFeedback();
    const passwordSaveFeedback = useButtonFeedback();

    // ── Auth guard ──
    useEffect(() => {
        if (!authLoading && !user) router.push('/login');
    }, [user, authLoading, router]);

    // ── Load full profile from API ──
    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const res = await userApi.getProfile();
                const u = res.data.user;
                setProfile(u);
                setDisplayName(u.name || '');
                setPhone(u.phone || '');
                setBio(u.bio || '');
            } catch (err: any) {
                console.error('Failed to load profile', err);
            } finally {
                setLoadingProfile(false);
            }
        })();
    }, [user]);

    // ── Helpers ──
    const getInitials = (name: string) =>
        name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

    const avatarSrc = (() => {
        if (avatarPreview) return avatarPreview;
        if (profile?.avatar_url) return `${API_BASE_URL}${profile.avatar_url}`;
        return '';
    })();

    // ── Profile handlers ──
    const handleProfileSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSavingProfile(true);
        setProfileError('');
        setProfileSuccess('');

        const nameErr = validateName(displayName);
        if (nameErr) { setProfileError(nameErr); setSavingProfile(false); return; }

        const phoneErr = validatePhone(phone);
        if (phoneErr) { setProfileError(phoneErr); setSavingProfile(false); return; }

        try {
            const res = await userApi.updateProfile({
                name: displayName,
                phone: phone || '',
                bio: bio || '',
            });
            setProfile(res.data.user);
            await refreshUser();
            profileSaveFeedback.showSaved();
        } catch (err: any) {
            setProfileError(err.message || 'Failed to update profile');
        } finally {
            setSavingProfile(false);
        }
    };

    // ── Avatar handlers ──
    const handleAvatarSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate client-side
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) {
            setAvatarError('Only JPG, JPEG, PNG, and WEBP files are allowed.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setAvatarError('File size must be 5 MB or less.');
            return;
        }

        setAvatarError('');
        setAvatarFile(file);
        // Create local preview
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleAvatarUpload = async () => {
        if (!avatarFile) return;
        setUploadingAvatar(true);
        setAvatarError('');
        setAvatarSuccess('');

        try {
            const res = await userApi.uploadAvatar(avatarFile);
            setProfile(res.data.user);
            setAvatarPreview(null);
            setAvatarFile(null);
            await refreshUser();
            avatarSaveFeedback.showSaved();
        } catch (err: any) {
            setAvatarError(err.message || 'Failed to upload avatar');
        } finally {
            setUploadingAvatar(false);
        }
    };

    // ── Password handlers ──
    const handlePasswordSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setChangingPassword(true);
        setPwError('');
        setPwSuccess('');

        if (!currentPassword) { setPwError('Current password is required'); setChangingPassword(false); return; }

        const pwErr = validatePassword(newPassword);
        if (pwErr) { setPwError(pwErr); setChangingPassword(false); return; }

        if (newPassword !== confirmPassword) { setPwError('New password and confirmation do not match'); setChangingPassword(false); return; }

        try {
            await userApi.changePassword(currentPassword, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            passwordSaveFeedback.showSaved();
        } catch (err: any) {
            setPwError(err.message || 'Failed to change password');
        } finally {
            setChangingPassword(false);
        }
    };

    // ── Logout ──
    const handleLogout = async () => {
        await signOut();
        router.push('/');
    };

    // ── Loading / auth guard renders ──
    if (authLoading || loadingProfile) {
        return (
            <div className="flex min-h-screen flex-col">
                <AuthNavbar />
                <main className="flex-1 flex items-center justify-center mt-16">
                    <Loader2 className="h-10 w-10 animate-spin text-crimson" />
                </main>
                <Footer />
            </div>
        );
    }
    if (!user) return null;

    return (
        <div className="flex min-h-screen flex-col">
            <AuthNavbar />
            <main className="flex-1 py-10 mt-16">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-2xl space-y-8">

                        {/* ─── Page header ─── */}
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                            <p className="text-muted-foreground mt-1">Manage your account information and security</p>
                        </div>

                        {/* ━━━ AVATAR CARD ━━━ */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Camera className="h-5 w-5" /> Profile Photo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <Avatar className="h-24 w-24 ring-2 ring-offset-2 ring-crimson/30 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <AvatarImage src={avatarSrc} alt={displayName || 'User'} />
                                        <AvatarFallback className="bg-crimson text-white text-2xl">
                                            {displayName ? getInitials(displayName) : 'U'}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex flex-col gap-3 flex-1 w-full sm:w-auto">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            className="hidden"
                                            onChange={handleAvatarSelect}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Camera className="mr-2 h-4 w-4" /> Choose Photo
                                            </Button>
                                            {avatarFile && (
                                                <FeedbackButton
                                                    type="button"
                                                    size="sm"
                                                    className="bg-crimson hover:bg-crimson/90 text-white"
                                                    onClick={handleAvatarUpload}
                                                    loading={uploadingAvatar}
                                                    feedback={avatarSaveFeedback.feedback}
                                                    defaultLabel="Upload"
                                                    loadingLabel="Uploading…"
                                                    savedLabel="Saved"
                                                    icon={Save}
                                                />
                                            )}
                                        </div>
                                        {avatarFile && (
                                            <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                                Selected: {avatarFile.name}
                                            </p>
                                        )}
                                        {avatarSuccess && <p className="text-sm text-green-600 dark:text-green-400">{avatarSuccess}</p>}
                                        {avatarError && <p className="text-sm text-red-600 dark:text-red-400">{avatarError}</p>}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* ━━━ PERSONAL INFO CARD ━━━ */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Personal Information</CardTitle>
                                <CardDescription>Update your name, phone number and bio</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleProfileSubmit} className="space-y-5">
                                    {profileSuccess && (
                                        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-600 dark:text-green-400">
                                            {profileSuccess}
                                        </div>
                                    )}
                                    {profileError && (
                                        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                                            {profileError}
                                        </div>
                                    )}

                                    {/* Full Name */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="profileName" className="text-sm font-medium flex items-center gap-2">
                                            <User className="h-4 w-4" /> Full Name
                                        </label>
                                        <Input id="profileName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" />
                                    </div>

                                    {/* Email (read-only) */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="profileEmail" className="text-sm font-medium flex items-center gap-2">
                                            <Mail className="h-4 w-4" /> Email
                                        </label>
                                        <Input id="profileEmail" type="email" value={profile?.email || ''} disabled className="bg-muted" />
                                        <p className="text-xs text-muted-foreground">Email address cannot be changed</p>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="profilePhone" className="text-sm font-medium flex items-center gap-2">
                                            <Phone className="h-4 w-4" /> Phone Number <span className="text-muted-foreground font-normal">(optional)</span>
                                        </label>
                                        <Input id="profilePhone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+251 91 234 5678" />
                                    </div>

                                    {/* Bio */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="profileBio" className="text-sm font-medium flex items-center gap-2">
                                            <FileText className="h-4 w-4" /> Bio / About Me <span className="text-muted-foreground font-normal">(optional)</span>
                                        </label>
                                        <Textarea
                                            id="profileBio"
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder="Tell us about yourself…"
                                            rows={4}
                                            maxLength={500}
                                        />
                                        <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
                                    </div>

                                    <FeedbackButton
                                        type="submit"
                                        className="bg-crimson hover:bg-crimson/90 text-white"
                                        loading={savingProfile}
                                        feedback={profileSaveFeedback.feedback}
                                        defaultLabel="Save Changes"
                                        loadingLabel="Saving…"
                                        savedLabel="Saved"
                                        icon={Save}
                                    />
                                </form>
                            </CardContent>
                        </Card>

                        {/* ━━━ PASSWORD CHANGE CARD ━━━ */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle>
                                <CardDescription>Use a strong password with at least 8 characters</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                    {pwSuccess && (
                                        <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-600 dark:text-green-400">
                                            {pwSuccess}
                                        </div>
                                    )}
                                    {pwError && (
                                        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-400">
                                            {pwError}
                                        </div>
                                    )}

                                    {/* Current Password */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="currentPw" className="text-sm font-medium">Current Password</label>
                                        <div className="relative">
                                            <Input
                                                id="currentPw"
                                                type={showCurrentPw ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Enter current password"
                                            />
                                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                                                {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* New Password */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="newPw" className="text-sm font-medium">New Password</label>
                                        <div className="relative">
                                            <Input
                                                id="newPw"
                                                type={showNewPw ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="Enter new password"
                                            />
                                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowNewPw(!showNewPw)}>
                                                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        <PasswordStrengthIndicator password={newPassword} />
                                    </div>

                                    {/* Confirm New Password */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="confirmPw" className="text-sm font-medium">Confirm New Password</label>
                                        <div className="relative">
                                            <Input
                                                id="confirmPw"
                                                type={showConfirmPw ? 'text' : 'password'}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Confirm new password"
                                            />
                                            <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                                                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        </div>
                                        {confirmPassword && newPassword !== confirmPassword && (
                                            <p className="text-xs text-red-500">Passwords do not match</p>
                                        )}
                                    </div>

                                    <FeedbackButton
                                        type="submit"
                                        className="bg-crimson hover:bg-crimson/90 text-white"
                                        loading={changingPassword}
                                        feedback={passwordSaveFeedback.feedback}
                                        defaultLabel="Change Password"
                                        loadingLabel="Changing…"
                                        savedLabel="Saved"
                                        icon={Lock}
                                    />
                                </form>
                            </CardContent>
                        </Card>

                        {/* ━━━ LOGOUT ━━━ */}
                        <Card className="border-destructive/30">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">Sign Out</h3>
                                        <p className="text-sm text-muted-foreground">Sign out of your EventMate account</p>
                                    </div>
                                    <Button variant="destructive" onClick={handleLogout} className="cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" /> Log Out
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
