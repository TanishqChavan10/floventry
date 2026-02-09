import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'DRAFT' | 'CONFIRMED' | 'CLOSED' | 'CANCELLED' | 'POSTED';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    DRAFT: {
      variant: 'secondary' as const,
      label: 'Draft',
    },
    CONFIRMED: {
      variant: 'default' as const,
      label: 'Confirmed',
    },
    POSTED: {
      variant: 'default' as const,
      label: 'Posted',
    },
    CLOSED: {
      variant: 'outline' as const,
      label: 'Closed',
    },
    CANCELLED: {
      variant: 'destructive' as const,
      label: 'Cancelled',
    },
  };

  const { variant, label } = config[status];

  return <Badge variant={variant}>{label}</Badge>;
}
