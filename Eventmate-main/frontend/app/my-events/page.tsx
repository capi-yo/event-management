'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthContext';
import AuthNavbar from '@/components/AuthNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registrationsApi, API_BASE_URL } from '@/lib/api';

export default function MyEventsPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('confirmed');

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        const fetchMyEvents = async () => {
            if (!user) return;

            try {
                setLoading(true);
                const response = await registrationsApi.getMyEvents();
                setEvents(response.data.events || []);
            } catch (err: any) {
                console.error('Failed to fetch my events:', err);
                setError('Failed to load your events');
            } finally {
                setLoading(false);
            }
        };

        fetchMyEvents();
    }, [user]);

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

    const getStatus = (eventDate: string) => {
        const eventTime = new Date(eventDate).getTime();
        const now = new Date().getTime();
        return eventTime > now ? 'upcoming' : 'past';
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Separate events by registration status
    const confirmedEvents = events.filter(event => 
        ['RSVPed', 'Confirmed', 'Purchased', 'Checked-In'].includes(event.registration_status)
    );
    const pendingEvents = events.filter(event => 
        event.registration_status === 'Pending'
    );

    const renderEventCard = (event: any) => (
        <Card key={event.id} className="group overflow-hidden border-none shadow-none bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors">
            <div className="aspect-[4/3] relative bg-muted flex items-center justify-center overflow-hidden rounded-2xl mb-3">
                {event.image_url ? (
                    <img
                        src={`${API_BASE_URL}${event.image_url}`}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                ) : (
                    <Calendar className="h-10 w-10 text-muted-foreground/30" />
                )}
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                    <span className={`backdrop-blur-md text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20 uppercase tracking-wider shadow-sm ${getStatus(event.date) === 'upcoming'
                            ? 'bg-green-500 text-white'
                            : 'bg-zinc-500 text-white'
                        }`}>
                        {getStatus(event.date)}
                    </span>
                    <span className={`backdrop-blur-md text-[10px] font-black px-2.5 py-1 rounded-full border border-white/20 uppercase tracking-wider shadow-sm ${
                        event.registration_status === 'Pending' 
                            ? 'bg-yellow-500 text-white'
                            : 'bg-blue-500 text-white'
                    }`}>
                        {event.registration_status || 'Registered'}
                    </span>
                </div>
            </div>
            <div className="px-1.5 pb-2 cursor-pointer" onClick={() => router.push(`/events/${event.id}`)}>
                <h3 className="text-base font-bold line-clamp-1 mb-1 group-hover:text-crimson transition-colors">{event.title}</h3>
                <div className="flex flex-col gap-1 text-[11px] font-medium text-muted-foreground">
                    <div className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                        <Calendar className="h-3.5 w-3.5 text-crimson" />
                        <span>{formatDate(event.date)} at {event.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5 opacity-70">
                        <MapPin className="h-3.5 w-3.5" />
                        <span className="line-clamp-1">{event.location_venue || event.location || 'Location TBD'}</span>
                    </div>
                </div>
            </div>
        </Card>
    );

    return (
        <div className="flex min-h-screen flex-col">
            <AuthNavbar />
            <main className="flex-1 py-8 mt-16">
                <div className="container mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">My Registered Events</h1>
                        <p className="text-muted-foreground">Events you have registered for</p>
                    </div>

                    {loading && (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">Loading your events...</p>
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
                            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-semibold mb-2">No events yet</h2>
                            <p className="text-muted-foreground mb-4">Start discovering events and register for ones you love</p>
                            <Button asChild className="bg-crimson hover:bg-crimson-dark">
                                <Link href="/events">Explore Events</Link>
                            </Button>
                        </div>
                    )}

                    {!loading && !error && events.length > 0 && (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
                                <TabsTrigger value="confirmed" className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Confirmed ({confirmedEvents.length})
                                </TabsTrigger>
                                <TabsTrigger value="pending" className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Pending ({pendingEvents.length})
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="confirmed">
                                {confirmedEvents.length === 0 ? (
                                    <div className="text-center py-12">
                                        <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <h2 className="text-xl font-semibold mb-2">No confirmed events</h2>
                                        <p className="text-muted-foreground mb-4">Your confirmed registrations will appear here</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {confirmedEvents.map(renderEventCard)}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="pending">
                                {pendingEvents.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                        <h2 className="text-xl font-semibold mb-2">No pending events</h2>
                                        <p className="text-muted-foreground mb-4">Events awaiting payment or confirmation will appear here</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Pending Registrations</h3>
                                                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                    These events require payment or organizer approval before confirmation.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                            {pendingEvents.map(renderEventCard)}
                                        </div>
                                    </>
                                )}
                            </TabsContent>
                        </Tabs>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
