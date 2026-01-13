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
          variant: 'destructive' as const,
          text: 'Expired',
          className: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'EXPIRING_SOON':
        return {
          variant: 'secondary' as const,
          text: daysRemaining !== null && daysRemaining !== undefined && daysRemaining <= 7
            ? `${daysRemaining}d left`
            : 'Expiring Soon',
          className: 'bg-orange-500 hover:bg-orange-600 text-white',
        };
      case 'OK':
        return {
          variant: 'default' as const,
          text: 'OK',
          className: 'bg-green-600 hover:bg-green-700 text-white',
        };
      case 'NO_EXPIRY':
        return {
          variant: 'outline' as const,
          text: 'N/A',
          className: 'text-muted-foreground',
        };
      default:
        return {
          variant: 'outline' as const,
          text: 'Unknown',
          className: '',
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
