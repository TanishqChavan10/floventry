import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CustomSignUp from '@/components/auth/CustomSignUp';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Flowventory',
  description: 'Create your Flowventory account',
};

export default async function SignUpPage() {
  const { userId } = await auth();

  if (userId) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <CustomSignUp />
    </div>
  );
}
