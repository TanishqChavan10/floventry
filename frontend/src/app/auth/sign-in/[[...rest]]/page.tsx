import { createSupabaseServerClient } from '@/lib/supabase/server';
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
  searchParams: Promise<{ redirect_url?: string; redirect?: string }>;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { redirect_url, redirect: redirectParam } = await searchParams;

  const redirectCandidate = redirect_url ?? redirectParam;

  // Validate it's a safe relative path
  const safeRedirect = redirectCandidate?.startsWith('/') ? redirectCandidate : undefined;

  // If user is already authenticated, redirect them immediately
  if (user) {
    redirect(safeRedirect || '/auth-redirect');
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <CustomSignIn redirectUrl={safeRedirect} />
    </div>
  );
}
