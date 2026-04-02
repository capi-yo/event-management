'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registrationsApi, Event } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Check, Loader2, ShieldCheck, Ticket, Landmark, Smartphone, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Bank details configuration
const PAYMENT_OPTIONS = [
    {
        id: 'CBE',
        name: 'Commercial Bank of Ethiopia',
        accountNumber: '1000123456789',
        accountName: 'EventMate Enterprise',
        icon: Landmark,
        color: 'text-purple-600',
        bg: 'bg-purple-500/10'
    },
    {
        id: 'Telebirr',
        name: 'Telebirr',
        accountNumber: '0911234567',
        accountName: 'EventMate Enterprise',
        icon: Smartphone,
        color: 'text-green-600',
        bg: 'bg-green-500/10'
    },
    {
        id: 'Abyssinia',
        name: 'Bank of Abyssinia',
        accountNumber: '1040123456789',
        accountName: 'EventMate Enterprise',
        icon: Building2,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10'
    }
];

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event;
    categories: any[];
    onSuccess: () => void;
}

export default function CheckoutModal({ isOpen, onClose, event, categories, onSuccess }: CheckoutModalProps) {
    const { toast } = useToast();
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
        categories.length > 0 ? categories[0].id : null
    );
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CBE');
    const [transactionRef, setTransactionRef] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const activeBank = PAYMENT_OPTIONS.find(p => p.id === selectedPaymentMethod);

    const handlePurchase = async () => {
        if (!selectedCategoryId) return;
        if (!transactionRef.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter your transaction reference number.",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            await registrationsApi.purchase(event.id, {
                ticket_category_id: selectedCategoryId,
                payment_method: selectedPaymentMethod,
                transaction_ref: transactionRef.trim()
            });

            setIsSuccess(true);
            toast({
                title: "Purchase Submitted",
                description: "Your receipt has been submitted for approval.",
                variant: "success",
            });

            setTimeout(() => {
                onSuccess();
            }, 2500);
        } catch (err: any) {
            toast({
                title: "Purchase Failed",
                description: err.message || "Something went wrong during checkout",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg border-none rounded-3xl p-0 overflow-hidden bg-white dark:bg-zinc-900 max-h-[90vh] overflow-y-auto w-full">
                {isSuccess ? (
                    <div className="py-16 px-8 text-center space-y-4">
                        <div className="mx-auto w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                            <Check className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-black">Success!</h2>
                        <p className="text-zinc-500 max-w-xs mx-auto text-lg leading-relaxed">Your payment reference has been submitted. The organizer will review and approve your ticket shortly.</p>
                    </div>
                ) : (
                    <>
                        <DialogHeader className="px-8 pt-8 pb-4">
                            <DialogTitle className="text-3xl font-black mb-2">Checkout Details</DialogTitle>
                            <DialogDescription className="text-zinc-500 text-base">
                                Complete your purchase for <span className="font-bold text-zinc-900 dark:text-zinc-100">{event.title}</span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="px-8 space-y-8 pb-4">
                            {/* Step 1: Ticket Selection */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-[#AC1212] text-white flex items-center justify-center font-bold text-sm">1</div>
                                    <h3 className="font-bold text-lg">Select Ticket Category</h3>
                                </div>
                                <div className="space-y-3 pl-11">
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.id}
                                            onClick={() => setSelectedCategoryId(cat.id)}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center",
                                                selectedCategoryId === cat.id
                                                    ? "border-[#AC1212] bg-[#AC1212]/5 ring-4 ring-[#AC1212]/10"
                                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-2 rounded-xl", selectedCategoryId === cat.id ? "bg-[#AC1212]/10" : "bg-zinc-100 dark:bg-zinc-800")}>
                                                    <Ticket className={cn("h-5 w-5", selectedCategoryId === cat.id ? "text-[#AC1212]" : "text-zinc-400")} />
                                                </div>
                                                <span className="font-bold text-lg">{cat.name}</span>
                                            </div>
                                            <span className="font-black text-xl text-zinc-900 dark:text-white">ETB {parseFloat(cat.price).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Step 2: Payment Method */}
                            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-[#AC1212] text-white flex items-center justify-center font-bold text-sm">2</div>
                                    <h3 className="font-bold text-lg">Select Payment Method</h3>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-11">
                                    {PAYMENT_OPTIONS.map((option) => {
                                        const Icon = option.icon;
                                        return (
                                            <div
                                                key={option.id}
                                                onClick={() => setSelectedPaymentMethod(option.id)}
                                                className={cn(
                                                    "p-4 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-3",
                                                    selectedPaymentMethod === option.id
                                                        ? "border-[#AC1212] bg-[#AC1212]/5 ring-4 ring-[#AC1212]/10"
                                                        : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                                )}
                                            >
                                                <div className={cn("p-3 rounded-full", option.bg)}>
                                                    <Icon className={cn("h-6 w-6", option.color)} />
                                                </div>
                                                <span className="font-bold text-sm tracking-tight">{option.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Payment Instructions */}
                                {activeBank && (
                                    <div className="ml-11 mt-4 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-4">
                                        <p className="font-medium text-sm text-zinc-600 dark:text-zinc-300">
                                            Please transfer exactly <strong className="text-zinc-900 dark:text-zinc-100">ETB {selectedCategory ? parseFloat(selectedCategory.price).toFixed(2) : '0.00'}</strong> to the following account:
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1 shadow-sm">Account Name</p>
                                                <p className="font-black font-mono text-sm bg-zinc-200 dark:bg-zinc-900 px-3 py-2 rounded-lg">{activeBank.accountName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1 shadow-sm">Account Number</p>
                                                <p className="font-black font-mono text-sm bg-zinc-200 dark:bg-zinc-900 px-3 py-2 rounded-lg text-[#AC1212]">{activeBank.accountNumber}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Step 3: Transaction Details */}
                            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-[#AC1212] text-white flex items-center justify-center font-bold text-sm">3</div>
                                    <h3 className="font-bold text-lg">Verify Payment</h3>
                                </div>
                                <div className="pl-11 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Transaction Reference Number</Label>
                                        <Input
                                            placeholder="e.g. FT231... or TXN123..."
                                            value={transactionRef}
                                            onChange={(e) => setTransactionRef(e.target.value)}
                                            className="h-14 rounded-xl px-4 font-mono font-medium text-lg border-2 border-zinc-200 dark:border-zinc-700 focus-visible:ring-0 focus-visible:border-[#AC1212]"
                                        />
                                        <p className="text-xs text-zinc-500 font-medium">Find this on your bank transfer receipt or SMS confirmation.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-8 pb-8 pt-4 sm:flex-col gap-3 sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                                className="w-full h-14 text-sm font-black uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 dark:bg-[#AC1212] dark:hover:bg-[#8a0f0f] text-white rounded-2xl shadow-xl hover:shadow-none"
                                onClick={handlePurchase}
                                disabled={loading || !selectedCategoryId || !transactionRef.trim()}
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting Verification...</>
                                ) : (
                                    <>Complete Registration</>
                                )}
                            </Button>
                            <Button variant="ghost" className="w-full text-zinc-400 hover:text-zinc-600 font-medium h-12" onClick={onClose}>
                                Cancel
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
