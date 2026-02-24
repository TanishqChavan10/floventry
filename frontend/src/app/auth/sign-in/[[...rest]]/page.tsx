import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CustomSignIn from '@/components/auth/CustomSignIn';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your Floventry account to manage inventory, warehouses, and more.',
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { userId } = await auth();
  const { redirect_url } = await searchParams;

  // Validate it's a safe relative path
  const safeRedirect = redirect_url?.startsWith('/') ? redirect_url : undefined;

  // If user is already authenticated, redirect them immediately
  if (userId) {
    redirect(safeRedirect || '/auth-redirect');
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <CustomSignIn redirectUrl={safeRedirect} />
    </div>
  );
}
