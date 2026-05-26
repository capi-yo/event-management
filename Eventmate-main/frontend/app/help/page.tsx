'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/components/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MessageCircle, Send, Headphones, Loader2 } from 'lucide-react';
import { publicApi } from '@/lib/api';

const SUPPORT_EMAIL = 'tihitnaejigu@gmail.com';
const SUPPORT_PHONE = '0777429027';

export default function HelpPage() {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await publicApi.sendContactMessage(formData);
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 py-8">
                <div className="container mx-auto px-4">
                    <div className="mx-auto max-w-4xl">
                        <div className="mb-8 text-center">
                            <h1 className="text-3xl font-bold mb-2">Get Help</h1>
                            <p className="text-muted-foreground">Need assistance? We are here to help!</p>
                        </div>

                        <div className="grid gap-8 md:grid-cols-2">
                            {/* Contact Options */}
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Headphones className="h-5 w-5 text-crimson" />
                                            Contact Options
                                        </CardTitle>
                                        <CardDescription>Choose how you want to reach us</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="font-medium">Email Support</p>
                                                <a
                                                    href={`mailto:${SUPPORT_EMAIL}`}
                                                    className="text-sm text-muted-foreground hover:text-crimson"
                                                >
                                                    {SUPPORT_EMAIL}
                                                </a>
                                                <p className="text-xs text-muted-foreground">Response time: 24-48 hours</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="font-medium">Phone Support</p>
                                                <a
                                                    href={`tel:${SUPPORT_PHONE}`}
                                                    className="text-sm text-muted-foreground hover:text-crimson"
                                                >
                                                    {SUPPORT_PHONE}
                                                </a>
                                                <p className="text-xs text-muted-foreground">Mon-Fri, 9am-6pm EST</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <MessageCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="font-medium">Live Chat</p>
                                                <p className="text-sm text-muted-foreground">Available 24/7</p>
                                                <p className="text-xs text-muted-foreground">Click the chat icon in the corner</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Quick Links</CardTitle>
                                        <CardDescription>Common help topics</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <a href="/faq" className="block p-2 rounded hover:bg-muted text-sm">
                                            → Frequently Asked Questions
                                        </a>
                                        <a href="/faq?q=0" className="block p-2 rounded hover:bg-muted text-sm">
                                            → How to Create an Event
                                        </a>
                                        <a href="/faq?q=1" className="block p-2 rounded hover:bg-muted text-sm">
                                            → Ticket Registration Guide
                                        </a>
                                        <a href={user ? '/profile' : '/login?redirect=/profile'} className="block p-2 rounded hover:bg-muted text-sm">
                                            → Account Settings
                                        </a>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Contact Form */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Send us a Message</CardTitle>
                                    <CardDescription>Fill out the form below and we will get back to you</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {submitted ? (
                                        <div className="text-center py-8">
                                            <div className="mb-4 flex justify-center">
                                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                                    <Send className="h-6 w-6 text-green-600" />
                                                </div>
                                            </div>
                                            <h3 className="text-lg font-semibold mb-2">Message Sent!</h3>
                                            <p className="text-muted-foreground">We will get back to you as soon as possible.</p>
                                            <Button
                                                className="mt-4"
                                                variant="outline"
                                                onClick={() => setSubmitted(false)}
                                            >
                                                Send Another Message
                                            </Button>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="space-y-4">
                                            {error && (
                                                <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                                    {error}
                                                </p>
                                            )}
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Name</Label>
                                                <Input
                                                    id="name"
                                                    placeholder="Your name"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                    disabled={submitting}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    placeholder="your@email.com"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    required
                                                    disabled={submitting}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="subject">Subject</Label>
                                                <Input
                                                    id="subject"
                                                    placeholder="How can we help?"
                                                    value={formData.subject}
                                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                                    required
                                                    disabled={submitting}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="message">Message</Label>
                                                <Textarea
                                                    id="message"
                                                    placeholder="Describe your issue or question..."
                                                    value={formData.message}
                                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                                    rows={4}
                                                    required
                                                    disabled={submitting}
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                className="w-full bg-crimson hover:bg-crimson-dark"
                                                disabled={submitting}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        Sending...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Send Message
                                                    </>
                                                )}
                                            </Button>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
