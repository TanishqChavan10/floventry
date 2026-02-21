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
  const { isClerkLoaded, isClerkSignedIn } = useAuth();

  // Redirect signed-in users immediately — no need to wait for DB user
  React.useEffect(() => {
    if (!isClerkLoaded) return;
    if (isClerkSignedIn) {
      router.replace('/auth-redirect');
    }
  }, [isClerkLoaded, isClerkSignedIn, router]);

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
