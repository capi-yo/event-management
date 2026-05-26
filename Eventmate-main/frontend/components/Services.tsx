'use client';

import { Calendar, Ticket, Users, BarChart } from 'lucide-react';
import { motion } from 'motion/react';

const services = [
  {
    title: 'Event Registration',
    desc: 'Seamless event discovery and registration system for attendees to find and book their favorite events.',
    icon: Calendar,
    color: 'bg-accent',
    iconColor: 'text-crimson',
  },
  {
    title: 'Ticket Management',
    desc: 'Comprehensive ticketing solution with multiple categories, pricing tiers, and real-time availability tracking.',
    icon: Ticket,
    color: 'bg-slate-50 dark:bg-zinc-900/50',
    iconColor: 'text-slate-700 dark:text-slate-300',
  },
  {
    title: 'Event Organization',
    desc: 'Complete event creation and management tools for organizers to plan, publish, and manage their events.',
    icon: Users,
    color: 'bg-accent',
    iconColor: 'text-crimson',
  },
  {
    title: 'Event Analytics',
    desc: 'Powerful analytics dashboard providing insights on ticket sales, revenue, and attendee engagement.',
    icon: BarChart,
    color: 'bg-slate-50 dark:bg-zinc-900/50',
    iconColor: 'text-slate-700 dark:text-slate-300',
  },
];

const Services = () => {
  return (
    <section className="py-24 habesha-surface">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <h2 className="text-crimson font-bold uppercase tracking-widest text-sm mb-4">Our Expertise</h2>
            <h3 className="text-4xl md:text-5xl font-extrabold font-display leading-tight">
              Crafting Experiences That <br />
              <span className="text-slate-400">Resonate Forever.</span>
            </h3>
          </div>
          <p className="text-slate-500 max-w-sm">
            A complete platform for discovering events, managing tickets, and creating unforgettable experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-8 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:shadow-crimson/5 group ${service.color} border border-transparent hover:border-crimson/10`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 ${service.iconColor} bg-white dark:bg-zinc-800 shadow-sm`}>
                <service.icon size={28} />
              </div>
              <h4 className="text-xl font-bold mb-4 font-display text-foreground">{service.title}</h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                {service.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
