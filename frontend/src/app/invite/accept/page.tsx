'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth, ClerkLoaded, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

function InviteAcceptContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<{
    email: string;
    companyName: string;
    role: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid invite link.');
      setIsLoading(false);
      return;
    }

    const validateInvite = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/invites/validate?token=${token}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Invalid or expired invite.');
        }
        const data = await res.json();
        setInviteDetails(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    validateInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    
    if (!isSignedIn) {
        // Should be handled by UI showing "Sign In" button, but checking here too.
        router.push(`/auth/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`);
        return;
    }

    setIsAccepting(true);
    try {
      const authToken = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/invites/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`
        },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to accept invite.');
      }

      toast.success('Joined company successfully!');
      router.push('/dashboard'); 
    } catch (err: any) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md border-red-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-700">Invite Invalid</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
             <Button variant="outline" onClick={() => router.push('/')}>
               Go Home
             </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center">
           <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          <CardTitle className="text-2xl font-bold">You're Invited!</CardTitle>
          <CardDescription>
            You have been invited to join <strong>{inviteDetails?.companyName}</strong> as a <strong>{inviteDetails?.role}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg text-sm text-center">
             <p className="text-slate-500 dark:text-slate-400">Invited Email</p>
             <p className="font-medium text-slate-900 dark:text-white">{inviteDetails?.email}</p>
           </div>
           
           <div className="text-xs text-center text-slate-500">
             By accepting, you will be granted access to the company workspace.
           </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          {!isSignedIn ? (
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
              size="lg"
              onClick={() => router.push(`/auth/sign-in?redirect_url=${encodeURIComponent(window.location.href)}`)}
            >
              Sign In to Accept
            </Button>
          ) : (
            <Button 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white" 
                size="lg"
                onClick={handleAccept}
                disabled={isAccepting}
            >
                {isAccepting ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Joining...
                </>
                ) : 'Accept Invite'}
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={() => router.push('/')}>
            Decline
          </Button>
        </CardFooter>
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
