import LandingPage from '@/components/landing/LandingPage';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Home() {
  const { userId } = await auth();

  // If user is authenticated, redirect to their dashboard
  if (userId) {
    redirect('/auth-redirect');
  }

  return <LandingPage />;
}
