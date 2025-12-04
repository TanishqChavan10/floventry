import CustomSignUp from '@/components/auth/CustomSignUp';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up - Flowventory',
  description: 'Create your Flowventory account',
};

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <CustomSignUp />
    </div>
  );
}
