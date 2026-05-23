import Link from "next/link";
import {
  Calendar,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const Footer = () => {
  const socialIcons = [
    { Icon: Instagram, label: "Instagram", href: "https://www.instagram.com/" },
    { Icon: Twitter, label: "Twitter", href: "https://twitter.com/" },
    { Icon: Facebook, label: "Facebook", href: "https://www.facebook.com/" },
    { Icon: Linkedin, label: "LinkedIn", href: "https://www.linkedin.com/" },
  ];

  return (
    <footer className="habesha-footer text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-crimson rounded-lg flex items-center justify-center">
                <Calendar className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-extrabold tracking-tighter font-display">
                Event<span className="text-crimson">Mate</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Redefining the art of celebration through meticulous planning and
              creative vision. From the first spark to the final applause.
            </p>
            <div className="flex gap-4">
              {socialIcons.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-crimson transition-colors duration-300"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 font-display">Quick Links</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li>
                <Link href="/#home" className="hover:text-crimson transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-crimson transition-colors">
                  Our Services
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-crimson transition-colors">
                  Upcoming Events
                </Link>
              </li>
              <li>
                <Link href="/#gallery" className="hover:text-crimson transition-colors">
                  Our Gallery
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="hover:text-crimson transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-crimson transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-crimson transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 font-display">Services</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li>
                <Link
                  href="/events"
                  className="hover:text-crimson transition-colors"
                >
                  Event Registration
                </Link>
              </li>
              <li>
                <Link
                  href="/my-events"
                  className="hover:text-crimson transition-colors"
                >
                  Ticket Management
                </Link>
              </li>
              <li>
                <Link
                  href="/organiser/create"
                  className="hover:text-crimson transition-colors"
                >
                  Event Organization
                </Link>
              </li>
              <li>
                <Link
                  href="/organiser/attendees"
                  className="hover:text-crimson transition-colors"
                >
                  Attendee Management
                </Link>
              </li>
              <li>
                <Link
                  href="/organiser/analytics"
                  className="hover:text-crimson transition-colors"
                >
                  Event Analytics
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 font-display">Contact Us</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-crimson shrink-0" />
                <Link href="/#contact" className="hover:text-crimson transition-colors">
                  Addis Ababa, Ethiopia
                </Link>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-crimson shrink-0" />
                <a href="tel:+251919133232" className="hover:text-crimson transition-colors">
                  +251 91 913 3232
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-crimson shrink-0" />
                <a href="mailto:hello@eventmate.com" className="hover:text-crimson transition-colors">
                  hello@eventmate.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs uppercase tracking-widest font-bold">
          <p>© 2024 EventMate. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link
              href="/cookies"
              className="hover:text-white transition-colors"
            >
              Cookie Policy
            </Link>
            <Link href="/faq" className="hover:text-white transition-colors">
              FAQ
            </Link>
            <Link href="/help" className="hover:text-white transition-colors">
              Help
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
