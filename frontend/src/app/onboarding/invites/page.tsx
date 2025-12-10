'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, CheckCircle, Store, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Invite {
  invite_id: string;
  email: string;
  role: string;
  company_id: string;
  token: string;
  created_at: string;
  company: {
    id: string;
    name: string;
    slug: string;
  };
}

export default function OnboardingInvitesPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/auth/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    const fetchInvites = async () => {
      if (!isLoaded || !isSignedIn) return;
      try {
        const token = await getToken();
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/invites/my-pending`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setInvites(data);
        } else {
            console.error("Failed to fetch invites");
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load invites');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvites();
  }, [isLoaded, isSignedIn, getToken]);

  const handleAccept = async (invite: Invite) => {
    setAcceptingId(invite.invite_id);
    try {
      const token = await getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/invites/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ token: invite.token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to accept invite');
      }

      toast.success(`Joined ${invite.company?.name || 'company'} successfully!`);
      // Redirect to the company dashboard
      router.push(`/${invite.company?.slug || 'dashboard'}`);
    } catch (err: any) {
      toast.error(err.message);
      setAcceptingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Pending Invitations</h1>
            <p className="text-slate-600 dark:text-slate-400">
                You have been invited to join the following workspaces using your email <span className="font-semibold">{user?.primaryEmailAddress?.emailAddress}</span>.
            </p>
        </div>

        {invites.length === 0 ? (
            <div className="text-center bg-white dark:bg-slate-800 p-8 rounded-lg border border-dashed border-slate-300 dark:border-slate-700">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No pending invitations</h3>
                <p className="text-slate-500 mb-6">It looks like you don't have any pending invites.</p>
                <Button onClick={() => router.push('/onboarding')}>Back to Onboarding</Button>
            </div>
        ) : (
            <div className="grid gap-4">
                {invites.map((invite) => (
                    <Card key={invite.invite_id} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center gap-4 bg-slate-50 dark:bg-slate-800/50 pb-6">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
                                <Store className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">{invite.company?.name}</CardTitle>
                                <CardDescription>Invited {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true })}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex justify-between items-center text-sm">
                                <div className="text-slate-600 dark:text-slate-400">
                                    Role: <span className="font-semibold text-slate-900 dark:text-white capitalize">{invite.role?.replace(/_/g, ' ').toLowerCase()}</span>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => router.push('/onboarding')}>
                                Skip for now
                            </Button>
                            <Button 
                                onClick={() => handleAccept(invite)} 
                                disabled={acceptingId === invite.invite_id}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {acceptingId === invite.invite_id ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Joining...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Accept & Join
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}
