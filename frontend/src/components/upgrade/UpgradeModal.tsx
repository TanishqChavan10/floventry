'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, Crown, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const PRO_FEATURES = [
  'Custom expiry warning windows',
  'Email alerts & summaries',
  'Expiry export reports',
  'Warehouse-specific monitoring',
  'Historical expiry trends',
] as const;

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional override for the modal title */
  title?: string;
  /** Optional override for the subtitle / description */
  description?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  title = 'Upgrade to Pro — Advanced Expiry Monitoring',
  description = 'Stay ahead of inventory risk with:',
}: UpgradeModalProps) {
  const router = useRouter();
  const params = useParams();
  const slug = params?.slug as string | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            <DialogTitle className="text-lg">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-muted-foreground pt-1">
            {description}
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2.5 py-2">
          {PRO_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        <p className="text-xs text-muted-foreground">
          Keep your operations proactive, not reactive.
        </p>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={() => {
              onOpenChange(false);
              if (slug) router.push(`/${slug}/settings/billing`);
            }}
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Continue with Standard Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
