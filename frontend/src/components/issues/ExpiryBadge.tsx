import { Badge } from '@/components/ui/badge';
import { differenceInDays, format } from 'date-fns';

interface ExpiryBadgeProps {
  expiryDate: Date | null;
  warningDays?: number;
}

export function ExpiryBadge({ expiryDate, warningDays = 30 }: ExpiryBadgeProps) {
  if (!expiryDate) {
    return <Badge variant="outline">No Expiry</Badge>;
  }

  const now = new Date();
  const daysLeft = differenceInDays(new Date(expiryDate), now);

  if (daysLeft < 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        🔴 Expired {format(new Date(expiryDate), 'dd/MM/yyyy')}
      </Badge>
    );
  } else if (daysLeft <= warningDays) {
    return (
      <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 gap-1">
        🟡 Expires in {daysLeft} days
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 gap-1">
      ✅ OK
    </Badge>
  );
}
