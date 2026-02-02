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

  if (userId) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <CustomSignIn />
    </div>
  );
}
