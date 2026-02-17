'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to Flowventory</h1>
          <p className="text-lg text-muted-foreground">
            Let's get you started with your inventory management journey
          </p>
        </div>

        {/* Create Company Card */}
        <div className="max-w-xl mx-auto">
          <Card className="transition-colors group hover:border-primary/40">
            <CardHeader>
              <div className="p-3 rounded-lg w-fit mb-4 bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                <Building2 className="h-8 w-8" />
              </div>
              <CardTitle className="text-xl">Create Your Company</CardTitle>
              <CardDescription>
                Start by creating your company workspace to manage your inventory efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push('/onboarding/create-company')} className="w-full">
                Create Company
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@flowventory.com" className="hover:underline">
              support@flowventory.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
