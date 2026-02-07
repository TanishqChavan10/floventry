import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ExpiryStatus } from '@/lib/utils/expiry';
import { cn } from '@/lib/utils';

interface ExpiryStatusBadgeProps {
  status: ExpiryStatus;
  daysRemaining?: number | null;
  className?: string;
}

export function ExpiryStatusBadge({ status, daysRemaining, className }: ExpiryStatusBadgeProps) {
  const getVariantAndText = () => {
    switch (status) {
      case 'EXPIRED':
        return {
          variant: 'outline' as const,
          text: 'Expired',
          className:
            'border-destructive/30 bg-destructive/10 text-destructive dark:text-foreground',
        };
      case 'EXPIRING_SOON':
        return {
          variant: 'outline' as const,
          text:
            daysRemaining !== null && daysRemaining !== undefined && daysRemaining <= 7
              ? `${daysRemaining}d left`
              : 'Expiring Soon',
          className: 'border-border/50 bg-accent text-accent-foreground dark:text-foreground',
        };
      case 'OK':
        return {
          variant: 'outline' as const,
          text: 'OK',
          className: 'border-primary/30 bg-primary/10 text-primary dark:text-foreground',
        };
      case 'NO_EXPIRY':
        return {
          variant: 'outline' as const,
          text: 'N/A',
          className: 'border-border/50 bg-muted text-muted-foreground dark:text-foreground/80',
        };
      default:
        return {
          variant: 'outline' as const,
          text: 'Unknown',
          className: 'border-border/50 bg-muted text-muted-foreground dark:text-foreground/80',
        };
    }
  };

  const { variant, text, className: badgeClassName } = getVariantAndText();

  return (
    <Badge variant={variant} className={cn(badgeClassName, className)}>
      {text}
    </Badge>
  );
}
