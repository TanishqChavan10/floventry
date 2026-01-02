'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useMutation, useApolloClient } from '@apollo/client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { ACCEPT_INVITE, VALIDATE_INVITE } from '@/lib/graphql/invite';

function InviteAcceptContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const client = useApolloClient();
  const { isSignedIn, isLoaded } = useAuth();

  /** ✅ Token persistence (SSO safe) */
  const urlToken = searchParams.get('token');
  const storedToken =
    typeof window !== 'undefined' ? localStorage.getItem('inviteToken') : null;
  const token = urlToken || storedToken;

  const [inviteDetails, setInviteDetails] = useState<{
    email: string;
    companyName: string;
    companySlug: string;
    role: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [hasAccepted, setHasAccepted] = useState(false);

  const [acceptInvite, { loading: isAccepting }] = useMutation(ACCEPT_INVITE);

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
        const { data } = await client.query({
          query: VALIDATE_INVITE,
          variables: { token },
          fetchPolicy: 'network-only',
        });

        if (!data?.validateInvite) {
          throw new Error('Invite not found or expired');
        }

        setInviteDetails(data.validateInvite);
      } catch (err: any) {
        setError(err.message || 'Invalid or expired invite.');
      }
    })();
  }, [token, client, inviteDetails, hasAccepted]);

  /** ------------------------------------
   *  2️⃣ Auto-accept AFTER SSO login
   * ------------------------------------ */
  useEffect(() => {
    if (
      !token ||
      !inviteDetails ||
      !isLoaded ||
      !isSignedIn ||
      hasAccepted ||
      isAccepting
    ) {
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

        router.replace(`/${inviteDetails.companySlug}/dashboard`);
      } catch (err: any) {
        setHasAccepted(false);
        setError(err.message || 'Failed to accept invite');
      }
    })();
  }, [
    token,
    inviteDetails,
    isLoaded,
    isSignedIn,
    hasAccepted,
    isAccepting,
    acceptInvite,
    router,
  ]);

  /** -----------------------------
   *  UI STATES
   * ----------------------------- */

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="mx-auto h-10 w-10 text-red-500" />
            <CardTitle>Invite Invalid</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.push('/')}>Go Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!inviteDetails || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  /** -----------------------------
   *  Not signed in → Sign in
   * ----------------------------- */
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CheckCircle className="mx-auto h-10 w-10 text-indigo-600" />
            <CardTitle>You’re invited!</CardTitle>
            <CardDescription>
              Join <strong>{inviteDetails.companyName}</strong> as{' '}
              <strong>{inviteDetails.role.replace(/_/g, ' ')}</strong>
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() =>
                router.push(
                  `/auth/sign-in?redirect_url=${encodeURIComponent(
                    window.location.href,
                  )}`,
                )
              }
            >
              Sign in to accept
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  /** -----------------------------
   *  Signed in → auto accepting
   * ----------------------------- */
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          <CardTitle>Accepting invite…</CardTitle>
          <CardDescription>
            Joining <strong>{inviteDetails.companyName}</strong>
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InviteAcceptContent />
    </Suspense>
  );
}
