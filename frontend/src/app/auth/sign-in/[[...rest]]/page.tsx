import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CustomSignIn from '@/components/auth/CustomSignIn';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In - Flowventory',
  description: 'Sign in to your Flowventory account',
};

export default async function SignInPage() {
  const { userId } = await auth();
  
  // If user is already authenticated, redirect them immediately
  if (userId) {
    redirect('/auth-redirect');
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <CustomSignIn />
    </div>
  );
}
