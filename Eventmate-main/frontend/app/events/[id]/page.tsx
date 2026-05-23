'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AuthNavbar from '@/components/AuthNavbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, MapPin, Users, ArrowLeft, Loader2, Info, Ticket, CheckCircle2 } from 'lucide-react';
import { eventsApi, registrationsApi, Event, API_BASE_URL } from '@/lib/api';
import PriceDisplay from '@/components/PriceDisplay';
import { useAuth } from '@/components/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import CheckoutModal from '@/components/CheckoutModal';
import LocationMap from '@/components/LocationMap';

export default function EventDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();

    const [event, setEvent] = useState<Event | null>(null);
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [registering, setRegistering] = useState(false);

    useEffect(() => {
        const fetchEventData = async () => {
            try {
                setLoading(true);
                const eventId = parseInt(id as string);
                const [eventRes, catRes] = await Promise.all([
                    eventsApi.getById(eventId),
                    eventsApi.getTicketCategories(eventId)
                ]);

                setEvent(eventRes.data.event);
                setCategories(catRes.data.categories);
                
                // Debug logging
                console.log('Event data received:', eventRes.data.event);
                console.log('Location coordinates:', {
                    latitude: eventRes.data.event.location_latitude,
                    longitude: eventRes.data.event.location_longitude,
                    venue: eventRes.data.event.location_venue
                });
            } catch (err: any) {
                console.error('Failed to fetch event details:', err);
                toast({
                    title: "Error",
                    description: "Failed to load event details",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchEventData();
        }
    }, [id, toast]);

    const handleRegister = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (event?.is_paid) {
            setIsCheckoutOpen(true);
            return;
        }

        try {
            setRegistering(true);
            await registrationsApi.register(event!.id);
            toast({
                title: "Registration Successful",
                description: "Redirecting to your events...",
            });
            // Redirect to my-events page
            setTimeout(() => {
                router.push('/my-events');
            }, 1000);
        } catch (err: any) {
            toast({
                title: "Registration Failed",
                description: err.message || "Failed to register for event",
                variant: "destructive",
            });
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
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

    if (!event) {
        return (
            <div className="flex min-h-screen flex-col">
                <AuthNavbar />
                <main className="flex-1 container mx-auto px-4 py-12 text-center mt-16">
                    <h1 className="text-2xl font-bold mb-4">Event not found</h1>
                    <Button onClick={() => router.push('/events')}>Back to Events</Button>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col habesha-surface">
            <AuthNavbar />
            <main className="flex-1 pb-20 mt-16">
                {/* Hero Section */}
                <div className="relative h-[40vh] md:h-[50vh] overflow-hidden bg-zinc-900">
                    {event.image_url ? (
                        <img
                            src={`${API_BASE_URL}${event.image_url}`}
                            alt={event.title}
                            className="w-full h-full object-cover opacity-60"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-700">
                            <Calendar className="w-24 h-24" />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 container mx-auto">
                        <Button
                            variant="ghost"
                            className="text-white hover:text-white hover:bg-white/10 mb-6 -ml-2"
                            onClick={() => router.back()}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="bg-crimson text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                {event.category}
                            </span>
                            {event.is_paid ? (
                                <span className="bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                    Paid Event
                                </span>
                            ) : (
                                <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                    Free
                                </span>
                            )}
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-4 drop-shadow-md">
                            {event.title}
                        </h1>
                    </div>
                </div>

                <div className="container mx-auto px-4 mt-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-10">
                            <section>
                                <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                    <Info className="h-6 w-6 text-crimson" /> About the Event
                                </h2>
                                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-lg whitespace-pre-wrap">
                                    {event.description}
                                </p>
                            </section>

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="border-none bg-white dark:bg-zinc-900/50 shadow-sm rounded-2xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                            <Calendar className="h-6 w-6 text-crimson" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-zinc-900 dark:text-white">Date & Time</h3>
                                            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                                                {new Date(event.date).toLocaleDateString(undefined, {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                            <p className="text-zinc-500 dark:text-zinc-400">{event.time}</p>
                                        </div>
                                    </div>
                                </Card>
                                <Card className="border-none bg-white dark:bg-zinc-900/50 shadow-sm rounded-2xl p-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                                            <MapPin className="h-6 w-6 text-crimson" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-zinc-900 dark:text-white">Location</h3>
                                            <p className="text-zinc-500 dark:text-zinc-400 mt-1">
                                                {event.location_venue || 'Online Event'}
                                            </p>
                                            {(event.city || event.country) && (
                                                <p className="text-zinc-500 dark:text-zinc-400">
                                                    {[event.city, event.country].filter(Boolean).join(', ')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </section>

                            {/* Location Map */}
                            {event.location_latitude && event.location_longitude && (
                                <section>
                                    <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                                        <MapPin className="h-6 w-6 text-crimson" /> Event Location
                                    </h2>
                                    <div className="w-full" style={{ height: '400px' }}>
                                        <LocationMap
                                            latitude={parseFloat(String(event.location_latitude))}
                                            longitude={parseFloat(String(event.location_longitude))}
                                            locationName={event.location_venue}
                                            height="400px"
                                        />
                                    </div>
                                </section>
                            )}

                            <section>
                                <h2 className="text-2xl font-black mb-6">Organizer Details</h2>
                                <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/50 p-6 rounded-2xl">
                                    <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-500">
                                        {event.organizer_name?.[0] || 'O'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-zinc-900 dark:text-white">{event.organizer_name}</p>
                                        <p className="text-sm text-zinc-500">Event Organizer</p>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar / RSVP Widget */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-24 border-none shadow-2xl rounded-3xl overflow-hidden bg-white dark:bg-zinc-900">
                                <div className="bg-crimson p-6 text-white text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Registration</p>
                                    <h3 className="text-2xl font-black">
                                        {event.is_paid ? 'Get Tickets' : 'RSVP Now'}
                                    </h3>
                                </div>
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex justify-between items-center pb-4 border-b border-zinc-100 dark:border-zinc-800">
                                        <div className="flex items-center gap-2 text-zinc-500">
                                            <Users className="h-4 w-4" />
                                            <span className="text-sm font-bold">Attendees</span>
                                        </div>
                                        <span className="font-black text-zinc-900 dark:text-white">
                                            {event.registration_count} / {event.capacity || '∞'}
                                        </span>
                                    </div>

                                    {event.is_paid && categories.length > 0 && (
                                        <div className="space-y-4">
                                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ticket Options</p>
                                            <div className="space-y-2">
                                                {categories.map((cat) => (
                                                    <div key={cat.id} className="flex justify-between items-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-transparent">
                                                        <div>
                                                            <p className="text-sm font-bold">{cat.name}</p>
                                                            <p className="text-[10px] text-zinc-400">
                                                                {cat.capacity > 0 ? `${cat.capacity - cat.quantity_sold} remaining` : 'Available'}
                                                            </p>
                                                        </div>
                                                        <PriceDisplay
                                                            price={cat.price}
                                                            discountType={cat.discount_type}
                                                            discountValue={cat.discount_value}
                                                            size="sm"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full h-14 text-base font-black uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 dark:bg-crimson dark:hover:bg-crimson-dark text-white rounded-2xl transition-all shadow-xl hover:shadow-none"
                                        onClick={handleRegister}
                                        disabled={registering}
                                    >
                                        {registering ? (
                                            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                                        ) : (
                                            event.is_paid ? 'Buy Tickets' : 'Reserve Spot'
                                        )}
                                    </Button>

                                    {!event.is_paid && (
                                        <p className="text-[10px] text-center text-zinc-400 font-medium">
                                            Instant confirmation upon registration
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {isCheckoutOpen && event && (
                <CheckoutModal
                    isOpen={isCheckoutOpen}
                    onClose={() => setIsCheckoutOpen(false)}
                    event={event}
                    categories={categories}
                    onSuccess={() => {
                        setIsCheckoutOpen(false);
                        // Refresh event to update reg count
                        eventsApi.getById(event.id).then(res => setEvent(res.data.event));
                    }}
                />
            )}
        </div>
    );
}
