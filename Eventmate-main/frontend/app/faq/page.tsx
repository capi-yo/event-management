'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
    {
        question: 'How do I create an event?',
        answer: 'To create an event, sign up for an account and click on "Create an Event" button. Fill in the event details including title, description, date, time, location, and ticket information. Once submitted, your event will be reviewed and published for others to see.',
    },
    {
        question: 'How do I register for an event?',
        answer: 'Browse events on our platform, find an event you are interested in, and click on it to view details. Click the "Register" or "RSVP" button to secure your spot. You will receive a confirmation notification once your registration is processed.',
    },
    {
        question: 'Can I cancel my event registration?',
        answer: 'Yes, you can cancel your registration by going to "My Registered Events" in your account dashboard. Find the event and click the cancellation option. Please note that refund eligibility depends on the event\'s refund policy.',
    },
    {
        question: 'How do I save events for later?',
        answer: 'Click the heart icon or "Save" button on any event to add it to your favorites. You can view all saved events in the "Saved Events" section of your account.',
    },
    {
        question: 'What payment methods are accepted?',
        answer: 'EventMate uses its own secure integrated payment system — EventMate Bank — to process all transactions. Payments are handled entirely within the platform, ensuring your financial information is kept safe and your transactions are processed quickly and reliably.',
    },
    {
        question: 'What is the refund policy?',
        answer: 'Refund eligibility depends on each event\'s individual policy set by the organizer. If an event is cancelled by the organizer, a full refund will be issued automatically through EventMate Bank to your original payment method. For other cancellations, please check the event details page or contact the organizer directly. All approved refunds are processed within 5–10 business days.',
    },
    {
        question: 'How do event organizers manage attendees?',
        answer: 'Event organizers can access their dashboard to view registrations, send updates, manage tickets, and communicate with attendees through our platform.',
    },
    {
        question: 'Is my personal information secure?',
        answer: 'Yes, we take data privacy seriously. Your personal information is encrypted and stored securely. We never share your data with third parties without your consent.',
    },
    {
        question: 'How can I contact event organizers?',
        answer: 'You can contact event organizers through the messaging feature on the event page or by using the contact information provided in the event description.',
    },
];

function FAQContent() {
    const searchParams = useSearchParams();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    useEffect(() => {
        const q = searchParams.get('q');
        if (q !== null) {
            const idx = parseInt(q, 10);
            if (!isNaN(idx) && idx >= 0 && idx < faqs.length) {
                setOpenIndex(idx);
                // Scroll to the question after a short delay
                setTimeout(() => {
                    const el = document.getElementById(`faq-${idx}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        }
    }, [searchParams]);

    return (
        <div className="space-y-4">
            {faqs.map((faq, index) => (
                <Card key={index} id={`faq-${index}`}>
                    <CardHeader
                        className="cursor-pointer flex flex-row items-center justify-between py-4"
                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                    >
                        <CardTitle className="text-base font-medium">
                            {faq.question}
                        </CardTitle>
                        {openIndex === index ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
                        ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                    </CardHeader>
                    {openIndex === index && (
                        <CardContent className="pt-0">
                            <p className="text-muted-foreground">{faq.answer}</p>
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
    );
}

export default function FAQPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 py-8">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-8 text-center">
                            <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
                            <p className="text-muted-foreground">Find answers to common questions about EventMate</p>
                        </div>

                        <Suspense fallback={<div className="text-center text-muted-foreground py-10">Loading...</div>}>
                            <FAQContent />
                        </Suspense>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
