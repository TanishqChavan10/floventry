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
  const safeRedirectRaw = redirectCandidate?.startsWith('/') ? redirectCandidate : undefined;

  // If the redirect points to the landing page, prefer the post-auth router.
  // The app intentionally allows signed-in users to view '/', so sending users
  // there after login can look like "login didn't work" in production.
  const safeRedirect = safeRedirectRaw === '/' ? undefined : safeRedirectRaw;

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
