'use client';

import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();

  return (
    <section className="relative min-h-screen flex items-center py-32 overflow-hidden">
      {/* Background Image with Backdrop Brightness */}
      <div className="absolute inset-0 -z-10">
        <img 
          src="/hero-image.png" 
          alt="Vibrant music festival crowd" 
          className="w-full h-full object-cover brightness-50"
        />
        <div className="absolute inset-0 backdrop-brightness-75 bg-gradient-to-br from-habesha-green/80 via-black/50 to-habesha-red/40" />
      </div>
      
      <div className="max-w-7xl mx-auto px-6 md:px-12 w-full">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl"
        >
          <h1 className="text-5xl md:text-8xl font-extrabold leading-[1.1] mb-6 font-display text-white">
            Where <span className="text-habesha-gold">Vision</span> Meets <br />
            Celebration.
          </h1>
          
          <p className="text-xl text-white/80 mb-10 max-w-xl leading-relaxed">
            Curating unforgettable experiences—from soulful concerts and vibrant festivals 
            to insightful workshops and academic gatherings. We blend artistry with precision.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => router.push('/register')}
              className="px-10 py-5 rounded-md bg-crimson text-white font-bold flex items-center gap-2 shadow-2xl shadow-crimson/30 hover:bg-crimson-dark transition-all transform hover:-translate-y-1 cursor-pointer ring-1 ring-habesha-gold/50"
            >
              Explore Events <ArrowRight size={20} />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
