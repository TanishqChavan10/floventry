'use client';

import * as React from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const supabase = createSupabaseBrowserClient();

export default function ResetPasswordPage() {
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw new Error(error.message);

      setSuccess(true);
      // Redirect to sign-in after 3 seconds
      setTimeout(() => router.push('/auth/sign-in'), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <div className="flex flex-col bg-neutral-50 justify-center px-8 py-12 lg:px-16">
          <div className="mx-auto w-full max-w-[440px]">
            <Link href="/" className="mb-12 inline-block">
              <img src="/2.svg" alt="Floventry" className="h-10 w-auto" />
            </Link>

            <div className="mb-8 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-neutral-900">Password updated!</h1>
              <p className="mt-2 text-sm text-neutral-600">
                Your password has been reset successfully. Redirecting you to sign in...
              </p>
            </div>

            <Link href="/auth/sign-in" className="block">
              <Button className="h-11 w-full bg-[#E53935] text-white hover:bg-[#D32F2F]">
                Sign in now
              </Button>
            </Link>
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
            <h1 className="text-3xl font-bold text-neutral-900">Set new password</h1>
            <p className="mt-2 text-sm text-neutral-600">Must be at least 6 characters.</p>
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
              <Label htmlFor="password" className="text-sm text-neutral-700">
                New password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 border-neutral-300 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm text-neutral-700">
                Confirm new password
              </Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                  Updating password...
                </>
              ) : (
                'Reset password'
              )}
            </Button>
          </form>
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
