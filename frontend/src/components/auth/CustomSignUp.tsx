'use client';

import * as React from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

const supabase = createSupabaseBrowserClient();

export default function CustomSignUp({ redirectUrl }: { redirectUrl?: string }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const { run, isLoading } = useAsyncAction();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const router = useRouter();

  /** Where to send the user after successful authentication */
  const postAuthUrl = redirectUrl?.startsWith('/') ? redirectUrl : '/onboarding';

  // Handle OAuth sign up with Google
  const signUpWithGoogle = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message || 'Could not start Google sign-up');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    void run(async () => {
      setError('');

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`.trim(),
            avatar_url: '',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Supabase returns identities = [] when the email is already registered
      // (email enumeration protection hides this as a normal success).
      if (data.user && data.user.identities?.length === 0) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }

      // If email confirmation is required, Supabase returns a user with
      // identities = [] (or a confirmation email is sent).
      // Check if session was created (auto-confirm enabled) or needs verification.
      if (data.session) {
        // Auto-confirmed — redirect immediately
        router.push(postAuthUrl);
      } else {
        // Email confirmation required — show OTP verification
        setPendingVerification(true);
      }
    }).catch((err: any) => {
      const errorMessage = err?.message || 'Invalid data';
      console.error('error', errorMessage);
      setError(errorMessage);
    });
  };

  const handleVerification = (e: React.FormEvent) => {
    e.preventDefault();

    void run(async () => {
      setError('');

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'signup',
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        router.push(postAuthUrl);
      } else {
        setError('Verification failed. Please try again.');
      }
    }).catch((err: any) => {
      console.error('error', err.message);
      setError(err.message || 'Invalid code');
    });
  };

  const handleResend = async () => {
    setError('');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    if (error) {
      setError(error.message || 'Could not resend code');
    } else {
      // Start 60-second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  if (pendingVerification) {
    return (
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        <div className="flex flex-col justify-center px-8 py-12 lg:px-16">
          <div className="mx-auto w-full max-w-[440px]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mb-6 -ml-2 w-fit text-neutral-700 hover:text-neutral-900"
              onClick={() => {
                setError('');
                setCode('');
                setPendingVerification(false);
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Link href="/" className="mb-12 inline-block">
              <img src="/2.svg" alt="Floventry" className="h-10 w-auto" />
            </Link>

            <div className="mb-8">
              <h1 className="text-3xl font-bold text-neutral-900">Check your email</h1>
              <p className="mt-2 text-sm text-neutral-600">
                We sent a verification code to {email}
              </p>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleVerification} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-sm text-neutral-700">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  required
                  className="h-11 border-neutral-300 text-center text-lg tracking-widest"
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
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-neutral-600">
              Didn&apos;t receive a code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="font-semibold text-neutral-900 hover:text-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </p>
          </div>
        </div>

        <div className="hidden bg-neutral-50 lg:flex lg:items-center lg:justify-center lg:p-16">
          <div className="max-w-md">
            <div className="relative">
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-neutral-300 bg-white p-4 shadow-lg">
                  <div className="mb-3 flex gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-400"></div>
                    <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                    <div className="h-2 w-2 rounded-full bg-green-400"></div>
                  </div>
                  <div className="flex items-center justify-center py-8">
                    <svg
                      className="h-16 w-16 text-[#E53935]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Left Column - Form */}
      <div className="flex flex-col justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-[440px]">
          {/* Logo */}
          <Link href="/" className="mb-12 inline-block">
            <img src="/2.svg" alt="Floventry" className="h-10 w-auto" />
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-neutral-900">Create your account</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Start managing your inventory smarter today
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* OAuth Buttons */}
          <div className="mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={signUpWithGoogle}
              className="h-11 w-full border-neutral-300"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign up with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">OR</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-sm text-neutral-700">
                  First name
                </Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="h-11 border-neutral-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-sm text-neutral-700">
                  Last name
                </Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="h-11 border-neutral-300"
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-neutral-700">
                Password
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

            <Button
              type="submit"
              className="h-11 w-full bg-[#E53935] text-white hover:bg-[#D32F2F]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          {/* Sign in link */}
          <p className="mt-8 text-center text-sm text-neutral-600">
            Already have an account?{' '}
            <Link
              href={`/auth/sign-in${redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="font-semibold text-neutral-900 hover:text-neutral-700"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right Column - Illustration */}
      <div className="hidden bg-neutral-50 lg:flex lg:items-center lg:justify-center lg:p-16">
        <div className="max-w-md">
          <div className="relative">
            <div className="space-y-4">
              <div className="rounded-lg border-2 border-neutral-300 bg-white p-4 shadow-lg">
                <div className="mb-3 flex gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-400"></div>
                  <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                  <div className="h-2 w-2 rounded-full bg-green-400"></div>
                </div>
                <div className="flex items-center justify-center py-8">
                  <svg
                    className="h-16 w-16 text-[#E53935]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-12 rounded-lg border-2 border-neutral-300 bg-white p-3 shadow">
                <div className="mb-2 flex gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-yellow-400"></div>
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full rounded bg-neutral-200"></div>
                  <div className="h-2 w-3/4 rounded bg-neutral-200"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
