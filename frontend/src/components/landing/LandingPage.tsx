'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Navbar from './Navbar';
import HeroSection from './sections/HeroSection';
import VideoSection from './sections/VideoSection';
import CTASection from './sections/CTASection';
import Footer from './Footer';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  // Redirect authenticated users to their dashboard
  React.useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/auth-redirect');
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <HeroSection />
      <VideoSection />
      <CTASection />
      <Footer />
    </div>
  );
}
