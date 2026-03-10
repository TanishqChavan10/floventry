'use client';

import React, { useState } from 'react';
import { Crown, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from '@/components/upgrade/UpgradeModal';

interface PlanGateBlockProps {
  /** Which plan is needed to unlock this feature */
  requiredPlan: 'Standard' | 'Pro';
  /** Feature name shown in the heading */
  featureName: string;
  /** Short description of what the upgrade unlocks */
  description?: string;
}

export function PlanGateBlock({ requiredPlan, featureName, description }: PlanGateBlockProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  const defaultDescription =
    requiredPlan === 'Pro'
      ? `Upgrade to Pro to unlock ${featureName.toLowerCase()}.`
      : `Upgrade to Standard or Pro to unlock ${featureName.toLowerCase()}.`;

  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-6">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">{featureName}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md">
          {description ?? defaultDescription}
        </p>
        <Button onClick={() => setShowUpgrade(true)} size="sm">
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to {requiredPlan}
        </Button>
      </div>
      <UpgradeModal open={showUpgrade} onOpenChange={setShowUpgrade} requiredPlan={requiredPlan} />
    </>
  );
}
