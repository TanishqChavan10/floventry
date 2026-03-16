'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, Download } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePlanTier } from '@/hooks/usePlanTier';
import { useRbac } from '@/hooks/use-rbac';
import { formatPlanPrice, pricingPlans } from '@/lib/billing/plans';
import { toast } from 'sonner';
import { useApolloClient } from '@apollo/client';
import {
  useBillingHistory,
  useCancelRazorpaySubscription,
  useChangeRazorpaySubscriptionPlan,
  useCreateRazorpayOrder,
  useVerifyRazorpayPayment,
} from '@/hooks/apollo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type RazorpaySuccessResponse = {
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayFailureResponse = {
  error?: {
    description?: string;
    reason?: string;
  };
};

type RazorpayCheckoutOptions = {
  key: string;
  order_id?: string;
  subscription_id?: string;
  amount?: number;
  currency?: string;
  name: string;
  image?: string;
  description?: string;
  handler: (response: RazorpaySuccessResponse) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
  on: (event: 'payment.failed', handler: (resp: RazorpayFailureResponse) => void) => void;
};

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => RazorpayInstance;

type BillingHistoryRow = {
  id: string;
  plan: string;
  interval: string;
  amount: number;
  currency: string;
  status: string;
  razorpayInvoiceUrl?: string | null;
  createdAt: string;
  paidAt?: string | null;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const msg = (error as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return 'Something went wrong';
}

function loadRazorpayCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]',
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function formatInrFromPaise(paise: number): string {
  const inr = paise / 100;
  // Prices are integer INR, but keep formatter resilient.
  const isInt = Number.isInteger(inr);
  return `₹${inr.toLocaleString('en-IN', {
    minimumFractionDigits: isInt ? 0 : 2,
    maximumFractionDigits: isInt ? 0 : 2,
  })}`;
}

export default function BillingSettingsPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const { plan, isPro, isFree, cancelAt, loading } = usePlanTier();
  const rbac = useRbac();
  const currentTier = plan;

  const canManageBilling = rbac.isOwner;

  const apolloClient = useApolloClient();
  const [createOrder, { loading: creatingOrder }] = useCreateRazorpayOrder();
  const [verifyPayment, { loading: verifyingPayment }] = useVerifyRazorpayPayment();
  const [cancelSubscription, { loading: cancellingSubscription }] = useCancelRazorpaySubscription();
  const [changeSubscriptionPlan, { loading: changingPlan }] = useChangeRazorpaySubscriptionPlan();
  const {
    data: historyData,
    loading: historyLoading,
    refetch: refetchHistory,
  } = useBillingHistory({ skip: !canManageBilling });

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  const isBusy = creatingOrder || verifyingPayment || cancellingSubscription || changingPlan;
  const billingHistory = useMemo<BillingHistoryRow[]>(
    () => (historyData?.billingHistory ?? []) as BillingHistoryRow[],
    [historyData],
  );

  async function handleSubscribe(planId: 'standard' | 'pro') {
    try {
      if (!canManageBilling) {
        toast.error('Only the company owner can change the subscription');
        return;
      }

      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!keyId) {
        toast.error('Razorpay key is not configured (NEXT_PUBLIC_RAZORPAY_KEY_ID)');
        return;
      }

      const ok = await loadRazorpayCheckoutScript();
      if (!ok) {
        toast.error('Failed to load Razorpay Checkout');
        return;
      }

      const planUpper = planId.toUpperCase();
      const interval = 'YEARLY';

      const result = await createOrder({
        variables: {
          input: {
            plan: planUpper,
            interval,
          },
        },
      });

      const order = result.data?.createRazorpayOrder;
      if (!order?.orderId) {
        toast.error('Failed to create payment order');
        return;
      }

      const checkoutId: string = order.subscriptionId || order.orderId;
      const isSubscription: boolean = !!order.subscriptionId;

      const checkoutImageUrl = new URL('/4.svg', window.location.origin).toString();

      const options: RazorpayCheckoutOptions = {
        key: keyId,
        ...(isSubscription
          ? { subscription_id: checkoutId }
          : { order_id: checkoutId, amount: order.amount, currency: order.currency }),
        name: 'floventry',
        image: checkoutImageUrl,
        description: `${order.plan} (${order.interval})`,
        handler: async (response: RazorpaySuccessResponse) => {
          try {
            const razorpayOrderId = response.razorpay_order_id;
            const razorpaySubscriptionId = response.razorpay_subscription_id;

            const verifyRes = await verifyPayment({
              variables: {
                input: {
                  ...(razorpayOrderId ? { razorpayOrderId } : {}),
                  ...(razorpaySubscriptionId ? { razorpaySubscriptionId } : {}),
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
              },
            });

            if (verifyRes.data?.verifyRazorpayPayment?.success) {
              toast.success('Payment successful. Plan updated!');
              await apolloClient.refetchQueries({ include: ['GetCompanyBySlug'] });
              await refetchHistory();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (e) {
            toast.error(getErrorMessage(e) || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            toast.message('Payment cancelled');
          },
        },
      };

      const RazorpayCtor = window.Razorpay;
      if (!RazorpayCtor) {
        toast.error('Razorpay Checkout is not available');
        return;
      }

      const rzp = new RazorpayCtor(options);
      rzp.on('payment.failed', (resp) => {
        // Helpful for debugging test-mode failures (shows code/step/reason).
        // eslint-disable-next-line no-console
        console.error('Razorpay payment.failed', resp);

        const error = resp?.error;
        const code =
          error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined;
        const desc =
          error && typeof error === 'object' && 'description' in error
            ? (error as any).description
            : undefined;
        const reason =
          error && typeof error === 'object' && 'reason' in error
            ? (error as any).reason
            : undefined;

        const msg =
          (code ? `${String(code)}: ` : '') +
          (typeof desc === 'string' && desc.trim()
            ? desc
            : typeof reason === 'string' && reason.trim()
              ? reason
              : 'Payment failed');

        toast.error(msg);
      });
      rzp.open();
    } catch (e) {
      toast.error(getErrorMessage(e) || 'Unable to start checkout');
    }
  }

  async function handleCancelSubscription() {
    try {
      if (!canManageBilling) {
        toast.error('Only the company owner can change the subscription');
        return;
      }

      if (isFree) {
        toast.message('No active subscription to cancel');
        return;
      }

      setIsCancelModalOpen(true);
    } catch (e) {
      toast.error(getErrorMessage(e) || 'Unable to initiate cancellation');
    }
  }

  async function confirmCancelSubscription() {
    try {
      setIsCancelModalOpen(false);
      
      const res = await cancelSubscription({
        variables: { input: {} },
      });

      if (res.data?.cancelRazorpaySubscription?.success) {
        toast.success('Subscription cancellation scheduled');
      } else {
        toast.error('Unable to cancel subscription');
      }
    } catch (e) {
      toast.error(getErrorMessage(e) || 'Unable to cancel subscription');
    }
  }

  async function handleChangePlanInPlace(newPlan: 'STANDARD' | 'PRO') {
    try {
      if (!canManageBilling) {
        toast.error('Only the company owner can change the subscription');
        return;
      }

      const res = await changeSubscriptionPlan({
        variables: { input: { newPlan } },
      });

      if (res.data?.changeRazorpaySubscriptionPlan?.success) {
        toast.success('Plan updated');
        await apolloClient.refetchQueries({ include: ['GetCompanyBySlug'] });
        await refetchHistory();
        return;
      }

      toast.error('Unable to update plan');
    } catch (e) {
      // Fallback: if plan IDs aren\'t configured for subscription updates, use checkout.
      const msg = getErrorMessage(e);
      if (typeof msg === 'string' && msg.toLowerCase().includes('plan_id')) {
        toast.message('Falling back to checkout...');
        await handleSubscribe(newPlan === 'PRO' ? 'pro' : 'standard');
        return;
      }

      toast.error(msg || 'Unable to update plan');
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4">
            <Link href={`/${slug}/settings`} className="inline-flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription plan and billing information
          </p>
        </div>

        {/* Current Plan Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              {loading ? 'Loading...' : `You are currently on the ${currentTier} plan`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {currentTier}
                    {cancelAt && !isFree && (
                      <Badge variant="destructive" className="ml-3 text-xs align-middle">
                        Cancels on {cancelAt.toLocaleDateString()}
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPro ? 'Renews yearly' : isFree ? 'No payment required' : 'Renews yearly'}
                  </p>
                </div>
              </div>

              {canManageBilling && !isFree && !cancelAt && (
                <Button
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => void handleCancelSubscription()}
                >
                  Cancel subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plans Grid */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">Available Plans</h2>
          {!canManageBilling && (
            <p className="mb-4 text-sm text-muted-foreground">
              Only the company owner can purchase or change a subscription. Your role is {rbac.role}
              .
            </p>
          )}
          <div className="grid gap-6 md:grid-cols-3">
            {pricingPlans.map((p) => {
              const isCurrent = p.name === currentTier;
              const price = p.yearlyPrice;
              const canSubscribe = !isCurrent && p.id !== 'free';
              const isUpgradeToPro = currentTier === 'Standard' && p.id === 'pro';
              return (
                <Card
                  key={p.id}
                  className={`relative flex h-full flex-col ${p.popular ? 'border-primary/60 shadow-lg' : ''}`}
                >
                  {p.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {p.name}
                      </span>
                      {isCurrent && <Badge variant="secondary">Current Plan</Badge>}
                    </div>
                    <CardTitle className="text-2xl">{p.name}</CardTitle>
                    <CardDescription>{p.tagline}</CardDescription>
                    <div className="mt-3">
                      <span className="text-3xl font-bold text-foreground">
                        {formatPlanPrice(price)}
                      </span>
                      <span className="text-muted-foreground ml-2">/yr</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col">
                    <ul className="mb-6 space-y-3 flex-1">
                      {p.features.map((feature) => {
                        const isSeparator = feature.startsWith('Everything in');
                        if (isSeparator) {
                          return (
                            <li
                              key={feature}
                              className="pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                            >
                              {feature}
                            </li>
                          );
                        }

                        return (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </li>
                        );
                      })}
                    </ul>
                    <Button
                      className="w-full"
                      variant={isCurrent ? 'outline' : 'default'}
                      disabled={isCurrent || isBusy || !canSubscribe || !canManageBilling}
                      onClick={() => {
                        if (!canSubscribe || isBusy) return;
                        if (isUpgradeToPro) {
                          void handleChangePlanInPlace('PRO');
                          return;
                        }
                        void handleSubscribe(p.id as 'standard' | 'pro');
                      }}
                    >
                      {isCurrent ? 'Current Plan' : p.cta}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            All prices shown in INR. No credit card required for free trial.
          </p>
        </div>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View your past invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {!canManageBilling ? (
              <div className="text-center py-8 text-muted-foreground">
                Billing history is available to the company owner only.
              </div>
            ) : historyLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading billing history...
              </div>
            ) : billingHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No billing history available
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billingHistory.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{row.plan}</TableCell>
                      <TableCell>{row.interval}</TableCell>
                      <TableCell>{formatInrFromPaise(Number(row.amount))}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === 'PAID' ? 'default' : 'outline'}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {row.razorpayInvoiceUrl ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={row.razorpayInvoiceUrl} target="_blank" rel="noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {isBusy && (
              <div className="mt-4 text-sm text-muted-foreground">Processing payment...</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your plan? Your subscription will remain
              active until the end of the current billing period, but it will not automatically
              renew.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} disabled={isBusy}>
              Keep Plan
            </Button>
            <Button variant="destructive" onClick={() => void confirmCancelSubscription()} disabled={isBusy}>
              {cancellingSubscription ? 'Cancelling...' : 'Cancel Renewal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
