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
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <HeroSection />
      <VideoSection />
      <CTASection />
      <Footer />
    </div>
  );
}
