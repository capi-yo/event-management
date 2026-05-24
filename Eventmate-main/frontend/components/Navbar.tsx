'use client';

import { useState, useEffect } from 'react';
import { Menu, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  
  // Check if we're on the landing page
  const isLandingPage = pathname === '/';
  // Check if we're on auth pages (login/register)
  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation links - use hash links on landing page, simple links on auth pages, route links elsewhere
  const navLinks = isLandingPage ? [
    { name: 'Home', href: '#home' },
    { name: 'Services', href: '#services' },
    { name: 'Events', href: '#events' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Contact', href: '#contact' },
  ] : isAuthPage ? [
    { name: 'Home', href: '/#home' },
    { name: 'Services', href: '/#services' },
    { name: 'Events', href: '/#events' },
    { name: 'Gallery', href: '/#gallery' },
    { name: 'Contact', href: '/#contact' },
  ] : [
    { name: 'Home', href: '/' },
    { name: 'Events', href: '/events' },
    { name: 'My Events', href: '/my-events' },
    { name: 'Favorites', href: '/favorites' },
  ];

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[60] habesha-stripe"></div>
      <nav className={`fixed w-full mt-[4px] z-50 transition-all duration-300 ${scrolled || isAuthPage ? 'glass-nav py-3' : isLandingPage ? 'bg-transparent py-5' : 'glass-nav py-3'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-lg ring-1 ring-habesha-gold/40">
            <Calendar className="text-white w-6 h-6" />
          </div>
          <span className={`text-xl font-extrabold tracking-tighter font-display ${scrolled || !isLandingPage ? 'text-slate-900 dark:text-white' : 'text-white'}`}>
            Event<span className="text-crimson">Mate</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <ThemeToggle />
          {navLinks.map((link) => (
            isLandingPage && link.href.startsWith('#') ? (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${scrolled || isAuthPage ? 'text-slate-900 dark:text-slate-100 hover:text-crimson' : 'text-white hover:text-crimson'}`}
              >
                {link.name}
              </a>
            ) : (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${scrolled || !isLandingPage ? 'text-slate-900 dark:text-slate-100 hover:text-crimson' : 'text-white hover:text-crimson'}`}
              >
                {link.name}
              </Link>
            )
          ))}
          <Link href='/register'>
            <button className={`px-5 py-2 rounded-lg border-2 font-semibold text-sm transition-all duration-300 cursor-pointer ${scrolled || !isLandingPage ? 'border-crimson text-crimson hover:bg-crimson hover:text-white' : 'border-white text-white hover:bg-white hover:text-crimson'}`}>
              Sign Up
            </button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button onClick={() => setIsOpen(!isOpen)} className={scrolled || !isLandingPage ? 'text-slate-900 dark:text-white' : 'text-white'}>
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="flex flex-col p-6 gap-4">
              {navLinks.map((link) => (
                isLandingPage && link.href.startsWith('#') ? (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-lg font-medium hover:text-crimson"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    className="text-lg font-medium hover:text-crimson"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                )
              ))}
              <Link href='/register'>
                <button className="w-full py-3 rounded-lg bg-crimson text-white font-bold mt-2 cursor-pointer">
                  Sign Up
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
};

export default Navbar;
