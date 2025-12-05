'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavLinks from './NavLinks';
import ThemeToggle from './ThemeToggle';
import MobileMenu from './MobileMenu';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/context/theme-context';
import { UserButton } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

import NotificationBell from '@/components/NotificationBell';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { darkMode } = useTheme();

  return (
    <header className="bg-white dark:bg-black text-black dark:text-white sticky top-0 z-50 border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <nav className="container mx-auto flex items-center justify-between px-10 py-4">
        <Link href="/" className="flex items-center gap-2 group">
          <Image
            src="/logos/newImage.png"
            alt="Flowventory Logo"
            width={400}
            height={50}
            className="h-15 w-auto"
            priority
          />
        </Link>
        <NavLinks
          className="hidden md:flex items-center gap-8 flex-1 justify-center"
          isAuthenticated={isAuthenticated}
        />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isAuthenticated && <NotificationBell />}

          {/* User Authentication Section */}
          {isAuthenticated ? <UserButton appearance={darkMode ? { baseTheme: dark } : {}} /> : null}
        </div>
        <button
          className="md:hidden ml-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle Mobile Menu"
        >
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </nav>
      <MobileMenu open={open} closeMenu={() => setOpen(false)} />
    </header>
  );
}
