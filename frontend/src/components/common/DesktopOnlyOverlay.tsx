'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function DesktopOnlyOverlay() {
  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      <div className="absolute inset-0 bg-background/95 backdrop-blur-sm" />
      <div className="relative h-full w-full flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Desktop only</CardTitle>
            <CardDescription>This app is optimized for desktop screens.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Please open Floventry on a laptop/desktop.</p>
            <p>If you must use your phone, enable your browser’s “Request desktop site” option.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
