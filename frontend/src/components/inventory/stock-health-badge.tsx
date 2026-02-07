import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { StockHealthState } from '@/lib/graphql/stock-health';

interface StockHealthBadgeProps {
  state: StockHealthState;
  recommendation: string;
}

const healthConfig: Record<
  StockHealthState,
  {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    label: string;
    className?: string;
  }
> = {
  HEALTHY: {
    variant: 'outline',
    label: 'Healthy',
    className: 'border-primary/30 bg-primary/10 text-primary dark:text-foreground',
  },
  AT_RISK: {
    variant: 'outline',
    label: 'At Risk',
    className: 'border-border/50 bg-accent text-accent-foreground dark:text-foreground',
  },
  LOW_STOCK: {
    variant: 'outline',
    label: 'Low Stock',
    className: 'border-border/50 bg-secondary text-secondary-foreground dark:text-foreground',
  },
  CRITICAL: {
    variant: 'outline',
    label: 'Critical',
    className: 'border-destructive/30 bg-destructive/10 text-destructive dark:text-foreground',
  },
  BLOCKED: {
    variant: 'outline',
    label: 'Blocked',
    className: 'border-border/50 bg-muted text-muted-foreground dark:text-foreground/80',
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
