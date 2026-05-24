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
          alt="Elegant Ethiopian Event" 
          className="w-full h-full object-cover brightness-[0.45]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/75" />
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
            <span className="text-[#E4C76B]">Celebration.</span>
          </h1>
          
          <div className="habesha-divider mb-8 max-w-md opacity-60">
            <div className="habesha-divider-icon"></div>
          </div>
          
          <p className="text-xl text-white/90 mb-10 max-w-xl leading-relaxed">
            Curating unforgettable experiences—from soulful concerts and vibrant festivals 
            to insightful workshops and academic gatherings. We blend artistry with precision.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => router.push('/register')}
              className="px-10 py-5 rounded-md bg-crimson text-white font-bold flex items-center gap-2 shadow-2xl shadow-crimson/30 hover:bg-crimson-dark transition-all transform hover:-translate-y-1 cursor-pointer ring-2 ring-habesha-gold/80"
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
