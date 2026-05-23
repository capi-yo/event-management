/* eslint-disable @next/next/no-img-element */
"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Services from "@/components/Services";
import FeaturedEvents from "@/components/FeaturedEvents";
import Footer from "@/components/Footer";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";

export default function App() {
  const router = useRouter();

  return (
    <div className="page-shell min-h-screen selection:bg-habesha-green selection:text-white scroll-smooth">
      <Navbar />

      <main>
        <section id="home">
          <Hero />
        </section>

        {/* Artistic Divider */}
        <div className="relative h-20 overflow-hidden habesha-surface">
          <div className="habesha-divider max-w-4xl mx-auto px-6" aria-hidden>
            <span className="habesha-divider-icon" />
          </div>
        </div>

        <section id="services">
          <Services />
        </section>

        {/* Call to Action Section */}
        <section
          id="contact"
          className="py-20 habesha-surface overflow-hidden relative"
        >
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="habesha-gradient rounded-lg p-12 md:p-20 text-center text-white relative overflow-hidden ring-1 ring-habesha-gold/30"
            >
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

              <h2 className="text-4xl md:text-6xl font-extrabold font-display mb-8 relative z-10">
                Ready to Create <br />
                Something{" "}
                <span className="underline decoration-white/30 underline-offset-8">
                  Extraordinary?
                </span>
              </h2>
              <p className="text-white/80 text-lg mb-10 max-w-2xl mx-auto relative z-10">
                Whether it&apos;s a stadium concert or an intimate workshop, we
                have the tools and expertise to make it flawless.
              </p>
              <div className="flex flex-wrap justify-center gap-4 relative z-10">
                <button
                  onClick={() => router.push("/register")}
                  className="px-10 py-4 rounded-none bg-white text-crimson font-bold hover:bg-slate-100 transition-all transform hover:scale-105 cursor-pointer"
                >
                  Get Started Now
                </button>
                <button
                  onClick={() =>
                    (window.location.href = "mailto:hello@eventmate.com")
                  }
                  className="px-10 py-4 rounded-none border-2 border-white/30 text-white font-bold hover:bg-white/10 transition-all cursor-pointer"
                >
                  Contact Sales
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="events">
          <FeaturedEvents />
        </section>

        {/* Gallery Preview / Artistic Section */}
        <section id="gallery" className="py-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 h-150">
              <div className="col-span-2 row-span-2 rounded-none overflow-hidden group relative">
                <img
                  src="/gallery-1.png"
                  alt="Gallery 1"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              </div>
              <div className="rounded-none overflow-hidden group relative">
                <img
                  src="/gallery-2.png"
                  alt="Gallery 2"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="rounded-none overflow-hidden group relative">
                <img
                  src="/gallery-3.png"
                  alt="Gallery 3"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="col-span-2 rounded-none overflow-hidden group relative">
                <img
                  src="/gallery-4.png"
                  alt="Gallery 4"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
