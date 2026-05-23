'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header Section */}
        <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-24 mt-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(220,20,60,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(220,20,60,0.05),transparent_50%)]"></div>
          <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 font-display">Terms of Service</h1>
            <p className="text-slate-400 text-lg">Last updated: March 9, 2026</p>
          </div>
        </section>

        {/* Content Section */}
        <div className="container mx-auto px-4 max-w-4xl py-16">

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using EventMate, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">2. Use of Service</h2>
              <p className="leading-relaxed mb-4">
                EventMate provides an online platform for event discovery, registration, and management. You agree to use the service only for lawful purposes and in accordance with these Terms.
              </p>
              <p className="leading-relaxed">
                You agree not to use the service:
              </p>
              <ul className="list-disc pl-6 mt-2 space-y-2">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To transmit any harmful or malicious code</li>
                <li>To impersonate or attempt to impersonate EventMate or another user</li>
                <li>To engage in any fraudulent activity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">3. User Accounts</h2>
              <p className="leading-relaxed mb-4">
                To access certain features of the service, you must register for an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Event Registration and Tickets</h2>
              <p className="leading-relaxed mb-4">
                When you register for an event through EventMate:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>You agree to provide accurate and complete information</li>
                <li>Ticket sales are final unless otherwise specified by the event organizer</li>
                <li>Event organizers are responsible for the execution of their events</li>
                <li>EventMate acts as a platform and is not responsible for event cancellations or changes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">5. Event Organizers</h2>
              <p className="leading-relaxed mb-4">
                If you create events on EventMate, you agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate event information</li>
                <li>Honor all ticket sales and registrations</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Be solely responsible for your event's execution</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">6. Intellectual Property</h2>
              <p className="leading-relaxed">
                The service and its original content, features, and functionality are owned by EventMate and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">7. Limitation of Liability</h2>
              <p className="leading-relaxed">
                EventMate shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">8. Changes to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these terms at any time. We will notify users of any material changes via email or through the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">9. Contact Information</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 space-y-2">
                <p>Email: hello@eventmate.com</p>
                <p>Phone: +251 96 778 8933</p>
                <p>Address: Addis Ababa, Ethiopia</p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
