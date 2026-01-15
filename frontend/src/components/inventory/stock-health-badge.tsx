import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StockHealthState } from '@/lib/graphql/stock-health';

interface StockHealthBadgeProps {
  state: StockHealthState;
  recommendation: string;
}

const healthConfig: Record<
  StockHealthState,
  { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string; className?: string }
> = {
  HEALTHY: {
    variant: 'default',
    label: 'Healthy',
    className: 'bg-green-500 hover:bg-green-600',
  },
  AT_RISK: {
    variant: 'outline',
    label: 'At Risk',
    className: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
  },
  LOW_STOCK: {
    variant: 'outline',
    label: 'Low Stock',
    className: 'border-orange-500 text-orange-700 dark:text-orange-400',
  },
  CRITICAL: {
    variant: 'destructive',
    label: 'Critical',
  },
  BLOCKED: {
    variant: 'secondary',
    label: 'Blocked',
    className: 'bg-gray-500 hover:bg-gray-600',
  },
};

export function StockHealthBadge({ state, recommendation }: StockHealthBadgeProps) {
  const config = healthConfig[state];

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={config.variant} className={config.className}>
            {config.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{recommendation}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
