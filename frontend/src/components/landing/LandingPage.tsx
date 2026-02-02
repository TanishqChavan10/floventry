'use client';
import React from 'react';
import Navbar from './Navbar';
import HeroSection from './sections/HeroSection';
import VideoSection from './sections/VideoSection';
import CTASection from './sections/CTASection';
import Footer from './Footer';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-white dark:text-neutral-900 font-sans selection:bg-neutral-100 selection:text-neutral-900">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <HeroSection />
      <VideoSection />
      <CTASection />
      <Footer />
    </div>
  );
}
