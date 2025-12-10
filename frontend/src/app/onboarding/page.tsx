'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Building2, Users, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function OnboardingChoicePage() {
  const router = useRouter();
  const [checkingInvites, setCheckingInvites] = useState(true);

  useEffect(() => {
    const checkInvites = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/invites/my-pending`, {
          headers: {
            // Clerk middleware should attach the token automatically if this page is protected
            // But since this is client side, we might need to rely on the cookie session 
            // verifying automatically on backend or use useAuth to get token.
            // For now, let's assume cookie auth works or we need to add token header if using fetch directly.
            // Actually, best practice with Clerk + External API is to send header.
            // But we are using same-origin /api usually, or nextjs rewrite?
            // User env says API URL.
            // Let's try without header first (cookie based), if fails we might need to useAuth.
          }
        });

        // However, standard fetch from client to separate backend needs Bearer token usually.
        // Let's add useAuth from clerk.
      } catch (err) {
        console.error("Error checking invites", err);
      } finally {
        setCheckingInvites(false);
      }
    };
    
    // checkInvites(); 
    // Commented out because we need useAuth to be correct.
    // Let's reimplement with useAuth below.
  }, []);

  // Moving logic to actual implementation below
  return (
    <OnboardingContent />
  );
}

import { useAuth } from '@clerk/nextjs';

function OnboardingContent() {
  const { getToken, isLoaded } = useAuth();
  const router = useRouter();
  const [checkingInvites, setCheckingInvites] = useState(true);

  useEffect(() => {
    const checkInvites = async () => {
      console.log("Checking invites effect running...");
      if (!isLoaded) {
        console.log("Auth not loaded yet");
        return;
      }
      
      try {
        const token = await getToken();
        console.log("Auth token acquired:", !!token);
        
        if (!token) {
           console.log("No token available");
           setCheckingInvites(false);
           return;
        }

        const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/invites/my-pending`;
        console.log("Fetching invites from:", url);
        
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        console.log("API Response status:", res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log("Invites found:", data);
          if (Array.isArray(data) && data.length > 0) {
            console.log("Redirecting to /onboarding/invites");
            router.push('/onboarding/invites');
            return;
          }
        } else {
            const errorText = await res.text();
            console.error("API Error:", errorText);
        }
      } catch (err) {
        console.error("Error checking invites", err);
      } finally {
        setCheckingInvites(false);
      }
    };

    checkInvites();
  }, [isLoaded, getToken, router]);

  if (checkingInvites) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Header */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
            <Building2 className="h-4 w-4" />
            Welcome to Flowventory
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Let's get you started
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Choose how you'd like to begin your inventory management journey
          </p>
        </div>

        {/* Choice Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-12">
          {/* Create Company Card */}
          <Link href="/onboarding/create-company" className="group">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Building2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Create a Company
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Start a new workspace for your business. Set up your company profile and invite your
                team.
              </p>
              <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-medium group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                Get started
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Join Company Card */}
          <Link href="/onboarding/join-company" className="group">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 hover:shadow-xl hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform">
                <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                Join an Existing Company
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                You've been invited to join a team. Enter your invite code or accept a pending
                invitation.
              </p>
              <div className="flex items-center justify-center text-green-600 dark:text-green-400 font-medium group-hover:text-green-700 dark:group-hover:text-green-300">
                Join team
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Not sure which option to choose?{' '}
          <a
            href="mailto:support@flowventory.com"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}
