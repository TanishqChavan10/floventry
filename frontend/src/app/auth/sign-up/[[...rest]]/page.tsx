import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CustomSignUp from '@/components/auth/CustomSignUp';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Create your free Floventry account and start managing inventory, warehouses, and suppliers in minutes.',
};

export default async function SignUpPage() {
  const { userId } = await auth();

  // If user is already authenticated, redirect them immediately
  if (userId) {
    redirect('/auth-redirect');
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <CustomSignUp />
    </div>
  );
}
