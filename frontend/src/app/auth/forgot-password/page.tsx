'use client';

import * as React from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Loader2, AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const supabase = createSupabaseBrowserClient();

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [emailSent, setEmailSent] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw new Error(error.message);

      setEmailSent(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state — email sent
  if (emailSent) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <div className="flex flex-col bg-neutral-50 justify-center px-8 py-12 lg:px-16">
          <div className="mx-auto w-full max-w-[440px]">
            <Link href="/" className="mb-12 inline-block">
              <img src="/2.svg" alt="Floventry" className="h-10 w-auto" />
            </Link>

            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-neutral-900">Check your email</h1>
              <p className="mt-2 text-sm text-neutral-600">
                We sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => setEmailSent(false)}
                variant="outline"
                className="h-11 w-full border-neutral-300"
              >
                Try a different email
              </Button>
              <Link href="/auth/sign-in" className="block">
                <Button variant="ghost" className="h-11 w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex lg:items-center lg:justify-center lg:p-16">
          <div className="max-w-lg">
            <img
              src="/signin-illustration.jpg"
              alt="Inventory Management"
              className="w-full h-auto rounded-2xl"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Left Column - Form */}
      <div className="flex flex-col bg-neutral-50 justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-[440px]">
          {/* Logo */}
          <Link href="/" className="mb-12 inline-block">
            <img src="/2.svg" alt="Floventry" className="h-10 w-auto" />
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900">Forgot password?</h1>
            <p className="mt-2 text-sm text-neutral-600">
              No worries, we'll send you a reset link.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-neutral-700">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-neutral-300"
              />
            </div>

            <Button
              type="submit"
              className="h-11 w-full bg-[#E53935] text-white hover:bg-[#D32F2F]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>

          {/* Back to sign in */}
          <Link
            href="/auth/sign-in"
            className="mt-6 flex items-center justify-center text-sm text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </div>

      {/* Right Column - Illustration */}
      <div className="hidden lg:flex lg:items-center lg:justify-center lg:p-16">
        <div className="max-w-lg">
          <img
            src="/signin-illustration.jpg"
            alt="Inventory Management"
            className="w-full h-auto rounded-2xl"
          />
        </div>
      </div>
    </div>
  );
}
