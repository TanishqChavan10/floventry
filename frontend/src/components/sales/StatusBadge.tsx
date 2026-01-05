import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  status: 'DRAFT' | 'CONFIRMED' | 'CLOSED' | 'CANCELLED' | 'POSTED';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    DRAFT: { 
      variant: 'default' as const, 
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      label: '📝 Draft'
    },
    CONFIRMED: { 
      variant: 'default' as const, 
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      label: '✅ Confirmed'
    },
    POSTED: { 
      variant: 'default' as const, 
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      label: '✅ Posted'
    },
    CLOSED: { 
      variant: 'secondary' as const, 
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      label: '⚪ Closed'
    },
    CANCELLED: { 
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      label: '❌ Cancelled'
    },
  };

  const { variant, className, label } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
