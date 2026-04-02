'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CookiePolicy() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Header Section */}
        <section className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white py-24 mt-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(220,20,60,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(220,20,60,0.05),transparent_50%)]"></div>
          <div className="container mx-auto px-4 max-w-4xl relative z-10 text-center">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 font-display">Cookie Policy</h1>
            <p className="text-slate-400 text-lg">Last updated: March 9, 2026</p>
          </div>
        </section>

        {/* Content Section */}
        <div className="container mx-auto px-4 max-w-4xl py-16 bg-white">

          <div className="space-y-8 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">1. What Are Cookies</h2>
              <p className="leading-relaxed">
                Cookies are small text files that are placed on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">2. How We Use Cookies</h2>
              <p className="leading-relaxed mb-4">
                EventMate uses cookies for the following purposes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Authentication:</strong> To keep you logged in and maintain your session</li>
                <li><strong>Preferences:</strong> To remember your settings and preferences</li>
                <li><strong>Security:</strong> To protect your account and detect fraudulent activity</li>
                <li><strong>Analytics:</strong> To understand how users interact with our platform</li>
                <li><strong>Performance:</strong> To improve the speed and functionality of our service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">3. Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Essential Cookies</h3>
                  <p className="leading-relaxed">
                    These cookies are necessary for the website to function properly. They enable core functionality such as security, authentication, and accessibility features.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Functional Cookies</h3>
                  <p className="leading-relaxed">
                    These cookies enable enhanced functionality and personalization, such as remembering your preferences and settings.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Analytics Cookies</h3>
                  <p className="leading-relaxed">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">Marketing Cookies</h3>
                  <p className="leading-relaxed">
                    These cookies track your online activity to help us deliver more relevant advertising or to limit how many times you see an advertisement.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">4. Third-Party Cookies</h2>
              <p className="leading-relaxed mb-4">
                We may use third-party services that also use cookies. These include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Analytics providers to help us improve our service</li>
                <li>Payment processors to handle secure transactions</li>
                <li>Social media platforms for sharing functionality</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">5. Managing Cookies</h2>
              <p className="leading-relaxed mb-4">
                You can control and manage cookies in various ways:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Browser Settings:</strong> Most browsers allow you to refuse or accept cookies through their settings</li>
                <li><strong>Cookie Preferences:</strong> You can manage your cookie preferences through our cookie consent banner</li>
                <li><strong>Opt-Out:</strong> You can opt out of third-party cookies through their respective websites</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Please note that disabling certain cookies may affect the functionality of our website and your user experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">6. Cookie Duration</h2>
              <p className="leading-relaxed mb-4">
                Cookies may be either:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Session Cookies:</strong> Temporary cookies that expire when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Cookies that remain on your device for a set period or until you delete them</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">7. Updates to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of any material changes by posting the new policy on this page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">8. Contact Us</h2>
              <p className="leading-relaxed mb-4">
                If you have any questions about our use of cookies, please contact us:
              </p>
              <div className="space-y-2">
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
