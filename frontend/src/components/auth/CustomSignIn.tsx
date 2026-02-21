'use client';

import * as React from 'react';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';

export default function CustomSignIn() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const { user, isClerkLoaded, isClerkSignedIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const { run, isLoading } = useAsyncAction();
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const router = useRouter();

  // Redirect signed-in users away from sign-in page — no need to wait for DB user
  React.useEffect(() => {
    if (!isClerkLoaded) return;
    if (isClerkSignedIn) {
      router.replace('/auth-redirect');
    }
  }, [isClerkLoaded, isClerkSignedIn, router]);

  // Helper to get redirect URL based on user's companies
  const getRedirectUrl = () => {
    if (!user || !user.companies || user.companies.length === 0) {
      return '/onboarding/create-company';
    }
    const activeCompany = user.companies.find((c) => c.isActive);
    const targetCompany = activeCompany || user.companies[0];
    return `/${targetCompany.slug}/dashboard`;
  };

  // Handle OAuth sign in
  const signInWith = (strategy: 'oauth_google') => {
    if (!isLoaded) return;

    return signIn.authenticateWithRedirect({
      strategy,
      redirectUrl: '/sso-callback',
      redirectUrlComplete: '/auth-redirect',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoaded) return;

    void run(async () => {
      setError('');
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // Wait a bit for auth context to update, then redirect
        setTimeout(() => {
          router.push('/auth-redirect');
        }, 500);
      } else {
        setError('Something went wrong. Please try again.');
      }
    }).catch((err: any) => {
      const errorMessage =
        err.errors?.[0]?.longMessage || err.message || 'Invalid email or password';

      if (errorMessage.toLowerCase().includes('already signed in')) {
        router.push('/auth-redirect');
        return;
      }

      setError(errorMessage);
    });
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Left Column - Form */}
      <div className="flex flex-col bg-neutral-50 justify-center px-8 py-12 lg:px-16">
        <div className="mx-auto w-full max-w-[440px]">
          {/* Logo */}
          <Link href="/" className="mb-12 inline-block">
            <img src="/2.svg" alt="Floventory" className="h-10 w-auto" />
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
              className="h-11 w-full bg-neutral-200 text-neutral-900 hover:bg-neutral-300"
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
              onClick={() => signInWith('oauth_google')}
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
              href="/auth/sign-up"
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
