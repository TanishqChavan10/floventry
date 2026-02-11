import { Badge, badgeVariants } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';

interface StatusBadgeProps {
  status: 'DRAFT' | 'CONFIRMED' | 'CLOSED' | 'CANCELLED' | 'POSTED';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  type BadgeVariant = Exclude<VariantProps<typeof badgeVariants>['variant'], null | undefined>;
  type StatusConfig = {
    variant: BadgeVariant;
    label: string;
    className?: string;
  };

  const config: Record<StatusBadgeProps['status'], StatusConfig> = {
    DRAFT: {
      variant: 'outline' as const,
      label: 'Draft',
      className: 'text-muted-foreground',
    },
    CONFIRMED: {
      variant: 'secondary' as const,
      label: 'Confirmed',
    },
    POSTED: {
      variant: 'default' as const,
      label: 'Posted',
    },
    CLOSED: {
      variant: 'outline' as const,
      label: 'Closed',
      className: 'text-muted-foreground',
    },
    CANCELLED: {
      variant: 'destructive' as const,
      label: 'Cancelled',
    },
  };

  const { variant, label, className } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
