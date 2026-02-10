import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'DRAFT' | 'CONFIRMED' | 'CLOSED' | 'CANCELLED' | 'POSTED';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
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
