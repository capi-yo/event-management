'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, MapPin, ArrowUpRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { eventsApi, API_BASE_URL, type Event } from '@/lib/api';

const FeaturedEvents = () => {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await eventsApi.getAll({ limit: 2 });
        setEvents(response.data.events);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return '/placeholder.png';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${API_BASE_URL}${imageUrl}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold font-display mb-4">Featured <span className="text-crimson">Showcases</span></h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              A glimpse into the diverse range of events we've brought to life recently.
            </p>
          </div>
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-crimson" />
          </div>
        </div>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-extrabold font-display mb-4">Featured <span className="text-crimson">Showcases</span></h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              A glimpse into the diverse range of events we've brought to life recently.
            </p>
          </div>
          <div className="text-center py-20">
            <p className="text-slate-500">No events available at the moment. Check back soon!</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold font-display mb-4">Featured <span className="text-crimson">Showcases</span></h2>
          <p className="text-slate-500 max-w-xl mx-auto">
            A glimpse into the diverse range of events we've brought to life recently.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10">
          {events.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              onClick={() => router.push('/login')}
              className="group relative bg-white rounded-none overflow-hidden shadow-xl border-b-8 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
              style={{ borderBottomColor: index === 0 ? '#DC143C' : '#1e293b' }}
            >
              <div className="relative h-80 overflow-hidden">
                <img
                  src={getImageUrl(event.image_url)}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-6 left-6">
                  <span className={`px-4 py-2 rounded-none text-xs font-bold uppercase tracking-widest bg-white/90 backdrop-blur-sm ${index === 0 ? 'text-crimson' : 'text-slate-800'}`}>
                    {event.category}
                  </span>
                </div>
              </div>
              
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-2xl font-bold font-display mb-2">{event.title}</h4>
                    <div className="flex flex-col gap-2 text-slate-500 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-crimson" />
                        {formatDate(event.date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-crimson" />
                        {event.location_venue}
                      </div>
                    </div>
                  </div>
                  <button className="w-12 h-12 rounded-none bg-slate-100 flex items-center justify-center group-hover:bg-crimson group-hover:text-white transition-colors duration-300">
                    <ArrowUpRight size={20} />
                  </button>
                </div>
                
                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {event.is_paid ? 'Paid Event' : 'Free Event'}
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push('/login');
                    }}
                    className="px-6 py-2 bg-crimson text-white text-xs font-bold uppercase tracking-widest hover:bg-crimson-dark transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 text-center">
          <button 
            onClick={() => router.push('/register')}
            className="px-10 py-4 rounded-none border-2 border-slate-200 font-bold hover:border-crimson hover:text-crimson transition-all duration-300 cursor-pointer"
          >
            View All Events
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
