/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import AuthNavbar from "@/components/AuthNavbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Calendar, MapPin, Search, Heart, Loader2 } from "lucide-react";
import { eventsApi, favoritesApi, Event, API_BASE_URL } from "@/lib/api";
import PriceDisplay from "@/components/PriceDisplay";
import { useAuth } from "@/components/AuthContext";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

const categories = [
  "All",
  "Technology",
  "Music",
  "Art",
  "Business",
  "Food",
  "Sports",
];

function EventsList() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [togglingFavorite, setTogglingFavorite] = useState<number | null>(null);

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return "/placeholder.png";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `${API_BASE_URL}${imageUrl}`;
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Update search query when URL param changes
  useEffect(() => {
    const query = searchParams.get("search");
    if (query !== null) {
      setSearchQuery(query);
    }
  }, [searchParams]);

  // Fetch favorites when user is available
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavoriteIds([]);
        return;
      }
      try {
        const response = await favoritesApi.getMyFavorites();
        const favIds = (response.data.favorites || []).map(
          (fav: any) => fav.event_id,
        );
        setFavoriteIds(favIds);
      } catch (err) {
        console.error("Failed to fetch favorites:", err);
      }
    };
    fetchFavorites();
  }, [user]);

  const handleToggleFavorite = async (eventId: number) => {
    if (!user) {
      router.push("/login");
      return;
    }

    const isFavorite = favoriteIds.includes(eventId);
    setTogglingFavorite(eventId);

    try {
      if (isFavorite) {
        await favoritesApi.removeFavorite(eventId);
        setFavoriteIds((prev) => prev.filter((id) => id !== eventId));
        toast({ title: "Removed from favorites" });
      } else {
        await favoritesApi.addFavorite(eventId);
        setFavoriteIds((prev) => [...prev, eventId]);
        toast({ title: "Added to favorites" });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update favorite",
        variant: "destructive",
      });
    } finally {
      setTogglingFavorite(null);
    }
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await eventsApi.getAll({
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          search: searchQuery || undefined,
          page: page,
          limit: 12,
        });
        setEvents(response.data.events);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } catch (err: any) {
        console.error("Failed to fetch events:", err);
        setError("Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchEvents();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, searchQuery, page]);

  return (
    <div className="flex min-h-screen flex-col">
      <AuthNavbar />
      <main className="flex-1 py-8 mt-16">
        {/* Added mt-16 for navbar spacing */}
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Discover Events</h1>
            <p className="text-muted-foreground">
              Find events that match your interests
            </p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={
                      selectedCategory === category
                        ? "bg-crimson hover:bg-crimson-dark"
                        : ""
                    }
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-crimson mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading events...</p>
            </div>
          )}

          {/* Error State */}
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

          {/* Events Grid */}
          {!loading && !error && events.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No events found</h2>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {events.map((event) => {
                const imageUrl = getImageUrl(event.image_url);
                return (
                  <div
                    key={event.id}
                    className="habesha-event-card group bg-white dark:bg-zinc-900/50 cursor-pointer"
                  >
                    <div className="aspect-4/3 relative bg-gray-100 flex items-center justify-center overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/95 dark:bg-black/90 backdrop-blur-sm text-[10px] font-bold px-3 py-1.5 rounded-full text-slate-800 dark:text-slate-200 uppercase tracking-wider shadow-sm">
                          {event.category}
                        </span>
                      </div>
                      <button
                        className={`absolute top-3 right-3 h-9 w-9 flex items-center justify-center bg-white/95 dark:bg-black/90 backdrop-blur-sm rounded-full shadow-sm transition-all duration-200 hover:scale-110 ${
                          favoriteIds.includes(event.id)
                            ? "text-crimson"
                            : "text-slate-400 hover:text-crimson"
                        }`}
                        onClick={() => handleToggleFavorite(event.id)}
                        disabled={togglingFavorite === event.id}
                      >
                        {togglingFavorite === event.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Heart
                            className={`h-4.5 w-4.5 ${favoriteIds.includes(event.id) ? "fill-current" : ""}`}
                          />
                        )}
                      </button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div
                        className="cursor-pointer space-y-3"
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                        <h3 className="text-lg font-bold line-clamp-2 text-foreground group-hover:text-crimson transition-colors leading-snug">
                          {event.title}
                        </h3>
                        <div className="flex flex-col gap-2 text-sm text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-crimson shrink-0" />
                            <span>
                              {new Date(event.date).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}{" "}
                              • {event.time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-crimson shrink-0" />
                            <span className="line-clamp-1">
                              {event.location_venue || "Location TBD"}
                            </span>
                          </div>
                        </div>
                        <PriceDisplay
                          price={event.min_price}
                          discountType={event.discount_type}
                          discountValue={event.discount_value}
                          size="sm"
                        />
                      </div>
                      <Button
                        className="w-full h-11 text-sm font-bold bg-crimson text-white hover:bg-crimson-dark transition-all duration-200 border-0 rounded-lg uppercase tracking-wide shadow-sm hover:shadow-md cursor-pointer"
                        onClick={() => router.push(`/events/${event.id}`)}
                      >
                        Book Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={pagination.page >= pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <AuthNavbar />
          <main className="flex-1 flex items-center justify-center mt-16">
            <Loader2 className="h-8 w-8 animate-spin text-crimson" />
          </main>
          <Footer />
        </div>
      }
    >
      <EventsList />
    </Suspense>
  );
}
