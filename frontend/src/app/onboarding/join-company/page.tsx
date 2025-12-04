'use client';

import React from 'react';
import Link from 'next/link';
import { Users, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function JoinCompanyPage() {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Implement actual join logic
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <Link
            href="/onboarding"
            className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to options
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Join an Existing Company
            </h1>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Enter the invite code shared by your administrator to join their workspace.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-xl shadow-green-100/50 dark:shadow-none">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                placeholder="e.g. INV-1234-ABCD"
                required
                className="h-11 font-mono uppercase tracking-wider"
              />
              <p className="text-xs text-slate-500">
                The code is usually 12 characters long and starts with INV-
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying Code...
                </>
              ) : (
                'Join Workspace'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
