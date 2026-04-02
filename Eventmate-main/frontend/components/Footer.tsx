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
    { Icon: Instagram, label: "Instagram" },
    { Icon: Twitter, label: "Twitter" },
    { Icon: Facebook, label: "Facebook" },
    { Icon: Linkedin, label: "LinkedIn" },
  ];

  return (
    <footer className="bg-slate-950 text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-crimson rounded-lg flex items-center justify-center">
                <Calendar className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-extrabold tracking-tighter font-display">
                Event<span className="text-crimson">Mate</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Redefining the art of celebration through meticulous planning and
              creative vision. From the first spark to the final applause.
            </p>
            <div className="flex gap-4">
              {socialIcons.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
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
                <a
                  href="#home"
                  className="hover:text-crimson transition-colors"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-crimson transition-colors"
                >
                  Our Services
                </a>
              </li>
              <li>
                <a
                  href="#events"
                  className="hover:text-crimson transition-colors"
                >
                  Upcoming Events
                </a>
              </li>
              <li>
                <a
                  href="#gallery"
                  className="hover:text-crimson transition-colors"
                >
                  Our Gallery
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="hover:text-crimson transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 font-display">Services</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li>
                <a
                  href="#services"
                  className="hover:text-crimson transition-colors"
                >
                  Event Registration
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-crimson transition-colors"
                >
                  Ticket Management
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-crimson transition-colors"
                >
                  Event Organization
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-crimson transition-colors"
                >
                  Attendee Management
                </a>
              </li>
              <li>
                <a
                  href="#services"
                  className="hover:text-crimson transition-colors"
                >
                  Event Analytics
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6 font-display">Contact Us</h4>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-crimson shrink-0" />
                <span>Addis Ababa, Ethiopia</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-crimson shrink-0" />
                <span>+251 91 913 3232</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-crimson shrink-0" />
                <span>hello@eventmate.com</span>
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
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
