'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Crown, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { PlanTier } from '@/hooks/usePlanTier';

const STANDARD_FEATURES = [
  'CSV imports & exports',
  'Barcode label PDF generation',
  'Point of Sale scanner',
  'Company overview & movements reports',
  'Manual expiry scan trigger',
  'Up to 3 warehouses, 5 members, 500 SKUs',
] as const;

const PRO_FEATURES = [
  'Everything in Standard',
  'Unlimited warehouses, members & SKUs',
  'Advanced analytics & stock health reports',
  'Full audit log & compliance trail',
  'Company-level CSV exports',
  'Custom expiry warning windows',
  'Purchase & sales order reports',
] as const;

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which plan is required — determines which features to show */
  requiredPlan?: 'Standard' | 'Pro';
  /** Optional override for the modal title */
  title?: string;
  /** Optional override for the subtitle / description */
  description?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  requiredPlan = 'Pro',
  title,
  description,
}: UpgradeModalProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string | undefined;

  const isStandardUpgrade = requiredPlan === 'Standard';
  const features = isStandardUpgrade ? STANDARD_FEATURES : PRO_FEATURES;
  const planLabel = isStandardUpgrade ? 'Standard' : 'Pro';
  const price = isStandardUpgrade ? '₹1,499' : '₹3,499';

  const resolvedTitle = title ?? `Upgrade to ${planLabel}`;
  const resolvedDescription = description ?? `Unlock powerful features with the ${planLabel} plan:`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <DialogTitle className="text-lg">{resolvedTitle}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            {resolvedDescription}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 py-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground">{price}/month — cancel anytime.</p>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              if (slug) router.push(`/${slug}/settings/billing`);
            }}
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to {planLabel}
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
