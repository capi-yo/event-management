'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { registrationsApi, bankApi, Event, type BankAccount, eventsApi, API_BASE_URL } from '@/lib/api';
import PriceDisplay from '@/components/PriceDisplay';
import { useToast } from '@/components/ui/use-toast';
import { Check, Loader2, Ticket, Landmark, Smartphone, Building2, Wallet, Upload, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LOCAL_BANK_ID = 'EventMateBank';

const EXTERNAL_PAYMENT_OPTIONS = [
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
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>(LOCAL_BANK_ID);
    const [transactionRef, setTransactionRef] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [bankAccount, setBankAccount] = useState<BankAccount | null>(null);
    const [loadingBank, setLoadingBank] = useState(false);
    const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    const activeExternal = EXTERNAL_PAYMENT_OPTIONS.find(p => p.id === selectedPaymentMethod);
    const isLocalBank = selectedPaymentMethod === LOCAL_BANK_ID;

    const getFinalPrice = (cat: any) => {
        if (!cat) return 0;
        const base = parseFloat(cat.price) || 0;
        const val = parseFloat(cat.discount_value) || 0;
        if (cat.discount_type === 'percentage') {
            return base * (1 - val / 100);
        } else if (cat.discount_type === 'fixed') {
            return Math.max(0, base - val);
        }
        return base;
    };

    const finalPrice = selectedCategory ? getFinalPrice(selectedCategory) : 0;
    const formattedFinalPrice = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(finalPrice);
    const hasEnoughBalance = bankAccount ? bankAccount.balance >= finalPrice : false;

    useEffect(() => {
        if (!isOpen) return;
        setLoadingBank(true);
        bankApi
            .getAccount()
            .then((res) => {
                if (res.success) setBankAccount(res.data.account);
            })
            .catch(() => setBankAccount(null))
            .finally(() => setLoadingBank(false));
    }, [isOpen]);

    const handlePurchase = async () => {
        if (!selectedCategoryId) return;

        if (!isLocalBank && !transactionRef.trim()) {
            toast({
                title: "Validation Error",
                description: "Please enter your transaction reference number.",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);

            if (isLocalBank) {
                const res = await registrationsApi.purchaseWithBank(event.id, {
                    ticket_category_id: selectedCategoryId,
                });
                if (res.success && res.data?.balance != null) {
                    setBankAccount((prev) =>
                        prev ? { ...prev, balance: res.data.balance } : prev
                    );
                }
            } else {
                await registrationsApi.purchase(event.id, {
                    ticket_category_id: selectedCategoryId,
                    payment_method: selectedPaymentMethod,
                    transaction_ref: transactionRef.trim()
                });
            }

            setIsSuccess(true);
            toast({
                title: isLocalBank ? "Payment successful" : "Purchase Submitted",
                description: isLocalBank
                    ? "Your ticket is confirmed. Payment deducted from your EventMate Bank account."
                    : "Your receipt has been submitted for approval.",
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

    const canSubmit = isLocalBank
        ? !!selectedCategoryId && hasEnoughBalance && !loadingBank
        : !!selectedCategoryId && !!transactionRef.trim();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg border-none rounded-3xl p-0 overflow-hidden bg-white dark:bg-zinc-900 max-h-[90vh] overflow-y-auto w-full">
                {isSuccess ? (
                    <div className="py-16 px-8 text-center space-y-4">
                        <div className="mx-auto w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
                            <Check className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-3xl font-black">Success!</h2>
                        <p className="text-zinc-500 max-w-xs mx-auto text-lg leading-relaxed">
                            {isLocalBank
                                ? 'Payment complete. Your ticket is confirmed!'
                                : 'Your payment reference has been submitted. The organizer will review and approve your ticket shortly.'}
                        </p>
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
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-crimson text-white flex items-center justify-center font-bold text-sm">1</div>
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
                                                    ? "border-crimson bg-crimson/5 ring-4 ring-crimson/10"
                                                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-2 rounded-xl", selectedCategoryId === cat.id ? "bg-crimson/10" : "bg-zinc-100 dark:bg-zinc-800")}>
                                                    <Ticket className={cn("h-5 w-5", selectedCategoryId === cat.id ? "text-crimson" : "text-zinc-400")} />
                                                </div>
                                                <span className="font-bold text-lg">{cat.name}</span>
                                            </div>
                                            <PriceDisplay
                                                price={cat.price}
                                                discountType={cat.discount_type}
                                                discountValue={cat.discount_value}
                                                size="sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-full bg-crimson text-white flex items-center justify-center font-bold text-sm">2</div>
                                    <h3 className="font-bold text-lg">Select Payment Method</h3>
                                </div>

                                <div className="pl-11 space-y-3">
                                    <div
                                        onClick={() => setSelectedPaymentMethod(LOCAL_BANK_ID)}
                                        className={cn(
                                            "p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3",
                                            isLocalBank
                                                ? "border-crimson bg-crimson/5 ring-4 ring-crimson/10"
                                                : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-full bg-crimson/10">
                                                <Wallet className="h-6 w-6 text-crimson" />
                                            </div>
                                            <div>
                                                <span className="font-bold">EventMate Bank</span>
                                                <p className="text-xs text-zinc-500">Instant payment from your wallet</p>
                                            </div>
                                        </div>
                                        {loadingBank ? (
                                            <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
                                        ) : bankAccount ? (
                                            <div className="text-right">
                                                <p className="text-xs text-zinc-500 uppercase font-bold">Your balance</p>
                                                <p className={cn(
                                                    "font-black text-lg",
                                                    hasEnoughBalance ? "text-emerald-600" : "text-red-600"
                                                )}>
                                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(bankAccount.balance)}
                                                </p>
                                            </div>
                                        ) : (
                                            <Link href="/wallet" className="text-sm text-crimson font-bold hover:underline">
                                                Open wallet
                                            </Link>
                                        )}
                                    </div>

                                    {!hasEnoughBalance && isLocalBank && bankAccount && finalPrice > 0 && (
                                        <p className="text-sm text-red-600 font-medium">
                                            Insufficient balance. You need {formattedFinalPrice}.{' '}
                                            <Link href="/wallet" className="underline font-bold">Top up your wallet</Link>
                                        </p>
                                    )}

                                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider pt-2">Or pay manually (pending approval)</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {EXTERNAL_PAYMENT_OPTIONS.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <div
                                                    key={option.id}
                                                    onClick={() => setSelectedPaymentMethod(option.id)}
                                                    className={cn(
                                                        "p-4 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center gap-3",
                                                        selectedPaymentMethod === option.id
                                                            ? "border-crimson bg-crimson/5 ring-4 ring-crimson/10"
                                                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300"
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
                                </div>

                                {!isLocalBank && activeExternal && (
                                    <div className="ml-11 mt-4 p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 space-y-4">
                                        <p className="font-medium text-sm text-zinc-600 dark:text-zinc-300">
                                            Transfer exactly <strong className="text-zinc-900 dark:text-zinc-100">{formattedFinalPrice}</strong> to:
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">Account Name</p>
                                                <p className="font-black font-mono text-sm bg-zinc-200 dark:bg-zinc-900 px-3 py-2 rounded-lg">{activeExternal.accountName}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-zinc-500 uppercase font-bold tracking-widest mb-1">Account Number</p>
                                                <p className="font-black font-mono text-sm bg-zinc-200 dark:bg-zinc-900 px-3 py-2 rounded-lg text-crimson">{activeExternal.accountNumber}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!isLocalBank && (
                                <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-crimson text-white flex items-center justify-center font-bold text-sm">3</div>
                                        <h3 className="font-bold text-lg">Verify Payment</h3>
                                    </div>
                                    <div className="pl-11 space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold">Upload Payment Screenshot / Receipt</Label>
                                            
                                            {transactionRef ? (
                                                <div className="relative rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 p-4 flex flex-col items-center gap-3">
                                                    <img 
                                                        src={`${API_BASE_URL}${transactionRef}`} 
                                                        alt="Payment screenshot" 
                                                        className="max-h-40 rounded-xl object-contain border bg-white dark:bg-zinc-800"
                                                    />
                                                    <div className="flex gap-2 w-full">
                                                        <Button 
                                                            type="button" 
                                                            variant="outline" 
                                                            className="flex-1 text-sm border-zinc-200"
                                                            onClick={() => setTransactionRef('')}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2 text-red-500" />
                                                            Remove Screenshot
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 bg-zinc-50 dark:bg-zinc-950/40 text-center gap-3 hover:border-crimson/50 transition-colors relative cursor-pointer group min-h-[140px]">
                                                    <input 
                                                        type="file" 
                                                        accept="image/jpeg,image/png,image/webp" 
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;
                                                            
                                                            // Validate client-side
                                                            const allowed = ['image/jpeg', 'image/png', 'image/webp'];
                                                            if (!allowed.includes(file.type)) {
                                                                toast({
                                                                    title: 'Invalid file type',
                                                                    description: 'Only JPG, JPEG, PNG, and WEBP files are allowed.',
                                                                    variant: 'destructive',
                                                                });
                                                                return;
                                                            }
                                                            if (file.size > 5 * 1024 * 1024) {
                                                                toast({
                                                                    title: 'File too large',
                                                                    description: 'File size must be 5 MB or less.',
                                                                    variant: 'destructive',
                                                                });
                                                                return;
                                                            }
                                                            
                                                            try {
                                                                setUploadingScreenshot(true);
                                                                const res = await eventsApi.uploadImage(file);
                                                                if (res.success) {
                                                                    setTransactionRef(res.data.imageUrl);
                                                                    toast({
                                                                        title: 'Success',
                                                                        description: 'Payment receipt uploaded successfully',
                                                                        variant: 'success',
                                                                    });
                                                                }
                                                            } catch (err: any) {
                                                                toast({
                                                                    title: 'Upload failed',
                                                                    description: err.message || 'Failed to upload screenshot',
                                                                    variant: 'destructive',
                                                                });
                                                            } finally {
                                                                setUploadingScreenshot(false);
                                                            }
                                                        }}
                                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                                                        disabled={uploadingScreenshot}
                                                    />
                                                    {uploadingScreenshot ? (
                                                        <Loader2 className="h-10 w-10 animate-spin text-crimson" />
                                                    ) : (
                                                        <Upload className="h-10 w-10 text-zinc-400 group-hover:text-crimson transition-colors" />
                                                    )}
                                                    <div>
                                                        <p className="font-bold text-sm">
                                                            {uploadingScreenshot ? 'Uploading receipt...' : 'Click or Drag receipt here'}
                                                        </p>
                                                        <p className="text-xs text-zinc-400 mt-1">
                                                            Supports JPG, PNG, WEBP (Max 5MB)
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="px-8 pb-8 pt-4 sm:flex-col gap-3 sticky bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                            <Button
                                className="w-full h-14 text-sm font-black uppercase tracking-widest bg-zinc-900 hover:bg-zinc-800 dark:bg-crimson dark:hover:bg-crimson-dark text-white rounded-2xl"
                                onClick={handlePurchase}
                                disabled={loading || !canSubmit}
                            >
                                {loading ? (
                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                                ) : isLocalBank ? (
                                    <>Pay {formattedFinalPrice} with EventMate Bank</>
                                ) : (
                                    <>Submit payment for approval</>
                                )}
                            </Button>
                            <Button variant="ghost" className="w-full text-zinc-400 h-12" onClick={onClose}>
                                Cancel
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
