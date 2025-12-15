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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Welcome to Flowventory
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Let's get you started with your inventory management journey
          </p>
        </div>

        {/* Create Company Card */}
        <div className="max-w-xl mx-auto">
          <Card className="border-2 border-indigo-100 dark:border-indigo-900 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group">
            <CardHeader>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg w-fit mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 transition-colors">
                <Building2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-xl">Create Your Company</CardTitle>
              <CardDescription>
                Start by creating your company workspace to manage your inventory efficiently
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push('/onboarding/create-company')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Create Company
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@flowventory.com" className="text-indigo-600 dark:text-indigo-400 hover:underline">
              support@flowventory.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
