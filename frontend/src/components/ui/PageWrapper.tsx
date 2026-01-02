'use client';

import { useEffect } from 'react';

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const sections = document.querySelectorAll('.fade-in-section');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.1 });

    sections.forEach(section => {
      observer.observe(section);
    });

    // Cleanup observer on component unmount
    return () => {
      sections.forEach(section => {
        observer.unobserve(section);
      });
    };
  }, []);

  return <>{children}</>;
}