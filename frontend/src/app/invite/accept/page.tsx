'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { useAcceptInvite, useLazyValidateInvite } from '@/hooks/apollo';

function BrandHeader() {
  return (
    <div className="text-center mb-10">
      <span className="text-2xl font-bold tracking-tight" style={{ color: '#e05252' }}>
        Floventry
      </span>
    </div>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: '#fafafa' }}
    >
      <div className="w-full max-w-sm">
        <BrandHeader />
        {children}
      </div>
    </div>
  );
}

function InviteAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [validateInvite] = useLazyValidateInvite();
  const { isSignedIn: isSignedIn, isLoaded: isLoaded, signOut } = useAuth();

  /** ✅ Token persistence (SSO safe) */
  const urlToken = searchParams.get('token');
  const storedToken = typeof window !== 'undefined' ? localStorage.getItem('inviteToken') : null;
  const token = urlToken || storedToken;

  const [inviteDetails, setInviteDetails] = useState<{
    email: string;
    companyName: string;
    companySlug: string;
    role: string;
    status: string;
    userExists: boolean;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [emailMismatch, setEmailMismatch] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [alreadyAccepted, setAlreadyAccepted] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [acceptInvite, { loading: isAccepting }] = useAcceptInvite();

  /** -----------------------------
   *  1️⃣ Validate invite token (ONCE)
   * ----------------------------- */
  useEffect(() => {
    // Don't validate if:
    // - No token
    // - Already have invite details (already validated)
    // - Already accepted the invite
    if (!token || inviteDetails || hasAccepted) {
      return;
    }

    localStorage.setItem('inviteToken', token);

    (async () => {
      try {
        const { data } = await validateInvite({ variables: { token } });

        if (!data?.validateInvite) {
          throw new Error('Invite not found or expired');
        }

        const details = data.validateInvite;
        setInviteDetails(details);

        // Invite already accepted — show friendly message, no error
        if (details.status === 'accepted') {
          setAlreadyAccepted(true);
          localStorage.removeItem('inviteToken');
          return;
        }
      } catch (err: any) {
        const msg: string = err.message || 'Invalid or expired invite.';
        // If the invite was already accepted, redirect to dashboard
        if (msg.toLowerCase().includes("'accepted'")) {
          setAlreadyAccepted(true);
          localStorage.removeItem('inviteToken');
          return;
        }
        setError(msg);
      }
    })();
  }, [token, validateInvite, inviteDetails, hasAccepted]);

  /** ------------------------------------
   *  2️⃣ Auto-accept AFTER SSO login
   * ------------------------------------ */
  useEffect(() => {
    if (!token || !inviteDetails || !isLoaded || !isSignedIn || hasAccepted || isAccepting) {
      return;
    }

    (async () => {
      try {
        setHasAccepted(true);

        await acceptInvite({
          variables: { input: { token } },
        });

        localStorage.removeItem('inviteToken');
        toast.success('Joined company successfully');

        // Hard redirect (not SPA) so the auth context re-initialises with fresh
        // data that includes the newly joined company — prevents CompanyGuard
        // from seeing stale empty-companies state and bouncing to /onboarding.
        window.location.href = `/${inviteDetails.companySlug}/dashboard`;
      } catch (err: any) {
        const msg: string = err.message || 'Failed to accept invite';
        // Already accepted (e.g. race condition / double-click) → just redirect
        if (
          msg.toLowerCase().includes("'accepted'") ||
          msg.toLowerCase().includes('already a member')
        ) {
          localStorage.removeItem('inviteToken');
          toast.success('You already joined this company');
          window.location.href = `/${inviteDetails.companySlug}/dashboard`;
          return;
        }
        // Email mismatch — user is signed in with a different email than the invite
        if (msg.toLowerCase().includes('please sign in with that email')) {
          setHasAccepted(false);
          setEmailMismatch(true);
          return;
        }
        setHasAccepted(false);
        setError(msg);
      }
    })();
  }, [token, inviteDetails, isLoaded, isSignedIn, hasAccepted, isAccepting, acceptInvite, router]);

  if (alreadyAccepted) {
    return (
      <PageShell>
        <div className="text-center space-y-4">
          <CheckCircle className="mx-auto h-10 w-10" style={{ color: '#e05252' }} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Already accepted</h2>
            <p className="text-sm text-gray-500 mt-1">You've already joined this company.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/auth-redirect')}>
            Go to dashboard
          </Button>
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="text-center space-y-4">
          <XCircle className="mx-auto h-10 w-10" style={{ color: '#e05252' }} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Invite invalid</h2>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/auth-redirect')}>
            Go to dashboard
          </Button>
        </div>
      </PageShell>
    );
  }

  if (!inviteDetails || !isLoaded) {
    return (
      <PageShell>
        <div className="flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </PageShell>
    );
  }

  /** -----------------------------
   *  Email mismatch -> Sign out & re-auth
   * ----------------------------- */
  if (emailMismatch && inviteDetails) {
    const invitePageUrl = window.location.href;
    return (
      <PageShell>
        <div
          className="rounded-xl border bg-white p-8 text-center space-y-6"
          style={{ borderColor: '#f0f0f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
        >
          <div
            className="mx-auto h-12 w-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#fff0f0' }}
          >
            <LogOut className="h-6 w-6" style={{ color: '#e05252' }} />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900">Wrong account</h2>
            <p className="text-sm text-gray-500">
              This invite was sent to{' '}
              <span className="font-medium text-gray-800">{inviteDetails.email}</span>. You&apos;re
              signed in with a different email.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Sign out and then sign in or create an account with{' '}
              <span className="font-medium text-gray-800">{inviteDetails.email}</span> to accept.
            </p>
          </div>

          <button
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#e05252' }}
            disabled={isSigningOut}
            onClick={async () => {
              setIsSigningOut(true);
              await signOut();
              // After sign out, the page will re-render and show the sign-in/sign-up options
              setEmailMismatch(false);
              setHasAccepted(false);
              setIsSigningOut(false);
            }}
          >
            {isSigningOut ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing out...
              </span>
            ) : (
              'Sign out & switch account'
            )}
          </button>
        </div>
      </PageShell>
    );
  }

  /** -----------------------------
   *  Not signed in -> Sign in OR Create account
   * ----------------------------- */
  if (!isSignedIn) {
    // User already has a Floventry account — just sign in
    if (inviteDetails.userExists) {
      return (
        <PageShell>
          <div
            className="rounded-xl border bg-white p-8 text-center space-y-6"
            style={{ borderColor: '#f0f0f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
          >
            <div
              className="mx-auto h-12 w-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: '#fff0f0' }}
            >
              <CheckCircle className="h-6 w-6" style={{ color: '#e05252' }} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-gray-900">You're invited</h2>
              <p className="text-sm text-gray-500">
                Join <span className="font-medium text-gray-800">{inviteDetails.companyName}</span>{' '}
                as{' '}
                <span className="font-medium text-gray-800">
                  {inviteDetails.role.charAt(0) + inviteDetails.role.slice(1).toLowerCase()}
                </span>
              </p>
            </div>

            <button
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#e05252' }}
              onClick={() =>
                router.push(
                  `/auth/sign-in?redirect_url=${encodeURIComponent(window.location.pathname + window.location.search)}`,
                )
              }
            >
              Sign in to accept
            </button>

            <p className="text-xs text-gray-400">
              Invited to <span className="font-medium">{inviteDetails.email}</span>
            </p>
          </div>
        </PageShell>
      );
    }

    // User does NOT have a Floventry account — prompt to create one
    return (
      <PageShell>
        <div
          className="rounded-xl border bg-white p-8 text-center space-y-6"
          style={{ borderColor: '#f0f0f0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}
        >
          <div
            className="mx-auto h-12 w-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#fff0f0' }}
          >
            <CheckCircle className="h-6 w-6" style={{ color: '#e05252' }} />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-900">You're invited!</h2>
            <p className="text-sm text-gray-600">
              To join <span className="font-medium text-gray-800">{inviteDetails.companyName}</span>{' '}
              as{' '}
              <span className="font-medium text-gray-800">
                {inviteDetails.role.charAt(0) + inviteDetails.role.slice(1).toLowerCase()}
              </span>
              , you need to create a Floventry account.
            </p>
            <p className="text-xs text-gray-400">
              Make sure to sign up with{' '}
              <span className="font-medium text-gray-700">{inviteDetails.email}</span>
            </p>
          </div>

          <button
            className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#e05252' }}
            onClick={() =>
              router.push(
                `/auth/sign-up?redirect_url=${encodeURIComponent(window.location.pathname + window.location.search)}`,
              )
            }
          >
            Create account to accept
          </button>
        </div>
      </PageShell>
    );
  }

  /** -----------------------------
   *  Signed in -> auto accepting
   * ----------------------------- */
  return (
    <PageShell>
      <div className="text-center space-y-4">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-gray-400" />
        <div>
          <h2 className="text-base font-medium text-gray-900">
            Joining {inviteDetails.companyName}...
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Setting up your access</p>
        </div>
      </div>
    </PageShell>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense
      fallback={
        <PageShell>
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        </PageShell>
      }
    >
      <InviteAcceptContent />
    </Suspense>
  );
}
