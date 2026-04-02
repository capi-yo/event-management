'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
    {
        question: 'How do I create an event?',
        answer: 'To create an event, sign up for an account and click on "Create an Event" button. Fill in the event details including title, description, date, time, location, and ticket information. Once submitted, your event will be published and visible to others.',
    },
    {
        question: 'How do I register for an event?',
        answer: 'Browse events on our platform, find an event you are interested in, and click on it to view details. Click the "Register" or "RSVP" button to secure your spot. You will receive a confirmation email.',
    },
    {
        question: 'Can I cancel my event registration?',
        answer: 'Yes, you can cancel your registration by going to "My Registered Events" in your account dashboard. Find the event and click the cancellation option. Please note that refund policies vary by event.',
    },
    {
        question: 'How do I save events for later?',
        answer: 'Click the heart icon or "Save" button on any event to add it to your favorites. You can view all saved events in the "Saved Events" section of your account.',
    },
    {
        question: 'What payment methods are accepted?',
        answer: 'We accept major credit cards (Visa, MasterCard, American Express), PayPal, and other payment methods depending on the event organizer\'s settings.',
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

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

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

                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <Card key={index}>
                                    <CardHeader
                                        className="cursor-pointer flex flex-row items-center justify-between py-4"
                                        onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    >
                                        <CardTitle className="text-base font-medium">
                                            {faq.question}
                                        </CardTitle>
                                        {openIndex === index ? (
                                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
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
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
