import CustomSignUp from '@/components/auth/CustomSignUp';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description:
    'Create your free Floventry account and start managing inventory, warehouses, and suppliers in minutes.',
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url } = await searchParams;
  const safeRedirectRaw = redirect_url?.startsWith('/') ? redirect_url : undefined;
  const safeRedirect = safeRedirectRaw === '/' ? undefined : safeRedirectRaw;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <CustomSignUp redirectUrl={safeRedirect} />
    </div>
  );
}
