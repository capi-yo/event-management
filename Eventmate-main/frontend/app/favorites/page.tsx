'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import AuthNavbar from '@/components/AuthNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, MapPin, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { favoritesApi, API_BASE_URL } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function FavoritesPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [removingId, setRemovingId] = useState<number | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!user) return;

            try {
                setLoading(true);
                const response = await favoritesApi.getFavorites();
                setEvents(response.data.events || []);
            } catch (err: any) {
                console.error('Failed to fetch favorites:', err);
                setError('Failed to load favorites');
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [user]);

    const handleRemoveFavorite = async (eventId: number) => {
        setRemovingId(eventId);
        try {
            await favoritesApi.removeFavorite(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
            toast({ title: "Removed from favorites" });
        } catch (err: any) {
            toast({ title: "Error", description: err.message || "Failed to remove favorite", variant: "destructive" });
        } finally {
            setRemovingId(null);
        }
    };

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

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="flex min-h-screen flex-col">
            <AuthNavbar />
            <main className="flex-1 py-8 mt-16">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Saved Events</h1>
                        <p className="text-muted-foreground">Events you have saved for later</p>
                    </div>

                    {loading && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">Loading your favorites...</p>
                        </div>
                    )}

                    {error && !loading && (
                        <div className="text-center py-12">
                            <p className="text-red-500">{error}</p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => window.location.reload()}
                            >
                                Try Again
                            </Button>
                        </div>
                    )}

                    {!loading && !error && events.length === 0 && (
                        <div className="text-center py-12">
                            <Heart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">No saved events</h2>
                            <p className="text-muted-foreground mb-4">Save events you are interested in to see them here</p>
                            <Button asChild className="bg-crimson hover:bg-crimson-dark">
                                <Link href="/events">Explore Events</Link>
                            </Button>
                        </div>
                    )}

                    {!loading && !error && events.length > 0 && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {events.map((event) => (
                                <div key={event.id} className="habesha-event-card group bg-white dark:bg-zinc-900/50 cursor-pointer">
                                    <div className="aspect-[4/3] relative bg-muted flex items-center justify-center overflow-hidden">
                                        {event.image_url ? (
                                            <img
                                                src={`${API_BASE_URL}${event.image_url}`}
                                                alt={event.title}
                                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <Calendar className="h-10 w-10 text-slate-400" />
                                        )}
                                        <div className="absolute top-2.5 left-2.5">
                                            <span className="bg-white/95 dark:bg-black/90 backdrop-blur-sm text-[10px] font-bold px-2.5 py-1 rounded-full text-slate-800 dark:text-slate-200 uppercase tracking-wider shadow-sm">
                                                {event.category}
                                            </span>
                                        </div>
                                        <button
                                            className="absolute top-2.5 right-2.5 h-8 w-8 flex items-center justify-center bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full shadow-sm text-crimson hover:scale-110 transition-transform"
                                            onClick={() => handleRemoveFavorite(event.id)}
                                            disabled={removingId === event.id}
                                        >
                                            {removingId === event.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Heart className="h-4 w-4 fill-current" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="p-5 cursor-pointer" onClick={() => router.push(`/events/${event.id}`)}>
                                        <h3 className="text-base font-bold line-clamp-1 mb-2 text-foreground group-hover:text-crimson transition-colors">{event.title}</h3>
                                        <div className="flex flex-col gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-crimson" />
                                                <span>{formatDate(event.date)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-3.5 w-3.5 text-crimson" />
                                                <span className="line-clamp-1">{event.location_venue || event.location || 'Location TBD'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
