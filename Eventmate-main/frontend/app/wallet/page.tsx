'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthNavbar from '@/components/AuthNavbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/AuthContext';
import { bankApi, type BankAccount, type BankTransaction } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Wallet, Loader2, ArrowDownLeft, ArrowUpRight, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function WalletPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [account, setAccount] = useState<BankAccount | null>(null);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [depositAmount, setDepositAmount] = useState('500');
  const [depositing, setDepositing] = useState(false);

  const loadAccount = async () => {
    try {
      setLoading(true);
      const res = await bankApi.getAccount();
      if (res.success) {
        setAccount(res.data.account);
        setTransactions(res.data.transactions);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load wallet';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      void loadAccount();
    }
  }, [user, authLoading, router]);

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid amount', description: 'Enter a positive amount', variant: 'destructive' });
      return;
    }
    try {
      setDepositing(true);
      const res = await bankApi.deposit(amount);
      if (res.success) {
        toast({ title: 'Deposit successful', description: res.message, variant: 'success' });
        setAccount(res.data.account);
        await loadAccount();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Deposit failed';
      toast({ title: 'Deposit failed', description: message, variant: 'destructive' });
    } finally {
      setDepositing(false);
    }
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(n);

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <AuthNavbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-28 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10">
            <Wallet className="h-8 w-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight">EventMate Bank</h1>
            <p className="text-muted-foreground">Your local wallet for event tickets</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : account ? (
          <>
            <Card className="border-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <CardHeader>
                <CardDescription>Available balance</CardDescription>
                <CardTitle className="text-4xl font-black text-emerald-600">
                  {formatMoney(account.balance)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Account number:{' '}
                  <span className="font-mono font-bold text-foreground">{account.account_number}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Status: <span className="capitalize font-medium">{account.status}</span> · Currency: {account.currency}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add demo funds</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 space-y-2 w-full">
                  <Label htmlFor="deposit">Amount (ETB)</Label>
                  <Input
                    id="deposit"
                    type="number"
                    min="1"
                    max="10000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleDeposit}
                  disabled={depositing}
                  className="bg-emerald-600 hover:bg-emerald-700 shrink-0 text-white font-bold"
                >
                  {depositing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Top up
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction history</CardTitle>
                <CardDescription>Recent payments and deposits</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((tx) => {
                        const isDebit = tx.from_account_number === account.account_number;
                        const sign = isDebit ? '-' : '+';
                        return (
                          <TableRow key={tx.id}>
                            <TableCell className="text-sm">
                              {new Date(tx.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="capitalize text-sm">{tx.type.replace('_', ' ')}</TableCell>
                            <TableCell className="text-sm max-w-[200px] truncate">
                              {tx.description || tx.reference}
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold">
                              <span className={isDebit ? 'text-red-600' : 'text-emerald-600'}>
                                {sign}{formatMoney(tx.amount)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground">
              <Link href="/events" className="text-emerald-600 font-semibold hover:underline">
                Browse events
              </Link>{' '}
              to pay with your EventMate Bank balance.
            </p>
          </>
        ) : null}
      </main>
      <Footer />
    </div>
  );
}
