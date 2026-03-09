'use client';
import React from 'react';
import Navbar from './Navbar';
import HeroSection from './sections/HeroSection';
import TabbedFeaturesSection from './sections/TabbedFeaturesSection';
import HowItWorksSection from './sections/HowItWorksSection';
import FAQSection from './sections/FAQSection';
import CTASection from './sections/CTASection';
import Footer from './Footer';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />

      {/* ── 1. Hero ── */}
      <HeroSection />

      {/* ── 4. Tabbed features (new — Sortly style) ── */}
      <TabbedFeaturesSection />

      {/* ── 6. How it works (original) ── */}
      <HowItWorksSection />

      {/* ── 8. FAQ (original) ── */}
      <FAQSection />

      {/* ── 11. Final CTA ── */}
      <CTASection />

      <Footer />
    </div>
  );
}
