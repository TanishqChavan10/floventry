'use client';

import * as React from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';

const supabase = createSupabaseBrowserClient();

export default function CustomSignIn({ redirectUrl }: { redirectUrl?: string }) {
  const { isLoaded, isSignedIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const { run, isLoading } = useAsyncAction();
  const submitInFlightRef = React.useRef(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [maybeUnverified, setMaybeUnverified] = React.useState(false);
  const router = useRouter();

  /** Where to send the user after successful authentication */
  const postAuthUrl =
    redirectUrl?.startsWith('/') && redirectUrl !== '/'
      ? redirectUrl
      : '/auth-redirect';

  // Redirect signed-in users away from sign-in page
  React.useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      router.replace(postAuthUrl);
    }
  }, [isLoaded, isSignedIn, router, postAuthUrl]);

  // Handle OAuth sign in with Google
  const signInWithGoogle = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message || 'Could not start Google sign-in');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Password managers/autofill can trigger multiple submits quickly.
    if (submitInFlightRef.current || isLoading) return;
    submitInFlightRef.current = true;

    // Read from the actual form fields so autofill works even if React state didn't update.
    const form = e.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const submittedEmail = String(formData.get('email') ?? '').trim();
    const submittedPassword = String(formData.get('password') ?? '');

    // Keep state in sync for the verification flow and error UI.
    setEmail(submittedEmail);
    setPassword(submittedPassword);

    run(async () => {
      setError('');

      // 1. Try signing in with existing credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: submittedEmail,
        password: submittedPassword,
      });

      if (!signInError) {
        // Sign-in successful — redirect
        router.replace(postAuthUrl);
        return;
      }

      // Email explicitly not confirmed (when enumeration protection is off)
      if (signInError.message.toLowerCase().includes('email not confirmed')) {
        setPendingVerification(true);
        await supabase.auth.resend({ type: 'signup', email: submittedEmail });
        return;
      }

      if (signInError.message === 'Invalid login credentials') {
        // Could be wrong password OR an unverified account (Supabase hides the
        // distinction when email enumeration protection is enabled).
        // Show the error but surface an option to verify.
        setMaybeUnverified(true);
        throw new Error('Invalid email or password.');
      }

      throw new Error(signInError.message);
    })
      .catch((err: any) => {
        const errorMessage = err?.message || 'Invalid email or password';
        setError(errorMessage);
      })
      .finally(() => {
        submitInFlightRef.current = false;
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
      if (error) throw new Error(error.message);
      if (data.session) {
        router.push(postAuthUrl);
      } else {
        setError('Verification failed. Please try again.');
      }
    }).catch((err: any) => {
      setError(err.message || 'Invalid code');
    });
  };

  const handleResend = async () => {
    setError('');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) {
      setError(error.message || 'Could not resend code');
    } else {
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
            <Link href="/" className="mb-12 inline-block">
              <img src="/2.svg" alt="Floventry" className="h-10 w-auto" />
            </Link>
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-neutral-900">Check your email</h1>
              <p className="mt-2 text-sm text-neutral-600">
                We sent a verification code to <span className="font-medium">{email}</span>
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
                className="h-11 w-full bg-neutral-200 text-neutral-900 hover:bg-neutral-300"
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
        <div className="hidden lg:flex lg:items-center lg:justify-center lg:p-16">
          <div className="max-w-lg">
            <img src="/signin-illustration.jpg" alt="" className="w-full h-auto rounded-2xl" />
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
            <h1 className="text-3xl font-bold text-neutral-900">Welcome back!</h1>
            <p className="mt-2 text-sm text-neutral-600">Log in to your account.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
                {maybeUnverified && (
                  <button
                    type="button"
                    onClick={() => {
                      setMaybeUnverified(false);
                      setError('');
                      setPendingVerification(true);
                      void supabase.auth.resend({ type: 'signup', email });
                    }}
                    className="ml-2 underline font-semibold hover:no-underline"
                  >
                    Verify your email instead?
                  </button>
                )}
              </AlertDescription>
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
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11 border-neutral-300"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm text-neutral-700">
                  Password
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-[#E53935] hover:text-[#D32F2F]"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
                  Signing in...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">OR</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={signInWithGoogle}
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
              Sign in with Google
            </Button>
          </div>

          {/* Sign up link */}
          <p className="mt-8 text-center text-sm text-neutral-600">
            Don't have an account?{' '}
            <Link
              href={`/auth/sign-up${redirectUrl ? `?redirect_url=${encodeURIComponent(redirectUrl)}` : ''}`}
              className="font-semibold text-neutral-900 hover:text-neutral-700"
            >
              Sign up
            </Link>
          </p>
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
