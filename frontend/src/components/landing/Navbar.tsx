'use client';
import React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  Barcode,
  ChevronDown,
  ClipboardCheck,
  Menu,
  RefreshCcw,
  Truck,
  Warehouse,
  X,
} from 'lucide-react';

interface NavbarProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
}

export default function Navbar({ isMenuOpen, setIsMenuOpen }: NavbarProps) {
  const [isFeaturesOpen, setIsFeaturesOpen] = React.useState(false);
  const featuresMenuRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!isFeaturesOpen) return;

      const target = event.target as Node | null;
      if (target && featuresMenuRef.current && !featuresMenuRef.current.contains(target)) {
        setIsFeaturesOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsFeaturesOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFeaturesOpen]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-24 max-w-[1200px] items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Floventory" className="h-12" />
        </Link>

        <div className="hidden items-center gap-3 md:flex">
          <div
            ref={featuresMenuRef}
            className="relative"
            onMouseEnter={() => setIsFeaturesOpen(true)}
            onMouseLeave={() => setIsFeaturesOpen(false)}
            onFocusCapture={() => setIsFeaturesOpen(true)}
            onBlurCapture={() => {
              // Close only if focus moves outside the dropdown container
              setTimeout(() => {
                const active = document.activeElement;
                if (
                  active &&
                  featuresMenuRef.current &&
                  !featuresMenuRef.current.contains(active)
                ) {
                  setIsFeaturesOpen(false);
                }
              }, 0);
            }}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isFeaturesOpen}
              onClick={() => setIsFeaturesOpen(true)}
              className={
                'inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium hover:text-neutral-900 ' +
                (isFeaturesOpen
                  ? 'text-[#E53935] underline underline-offset-8'
                  : 'text-neutral-700')
              }
            >
              Features
              <ChevronDown
                className={
                  'h-4 w-4 transition-transform ' + (isFeaturesOpen ? 'rotate-180' : 'rotate-0')
                }
              />
            </button>

            {isFeaturesOpen && (
              <div
                role="menu"
                aria-label="Features"
                className="fixed left-0 right-0 top-[95px] -mt-2 border-y border-neutral-200 bg-white pt-2"
              >
                <div className="mx-auto grid max-w-[1200px] grid-cols-12 gap-8 px-6 py-10">
                  <div className="col-span-4">
                    <h3 className="text-2xl font-semibold tracking-tight text-neutral-900">
                      Features
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                      Discover how Flowventory simplifies inventory with features designed for
                      speed, accuracy, and accountability.
                    </p>
                    <Link
                      href="#features"
                      onClick={() => setIsFeaturesOpen(false)}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-neutral-900 hover:text-[#E53935]"
                    >
                      Features{' '}
                      <span aria-hidden className="text-neutral-500">
                        →
                      </span>
                    </Link>
                  </div>

                  <div className="col-span-8">
                    <div className="grid grid-cols-3 gap-8">
                      {[
                        {
                          title: 'Mobile-ready workflows',
                          desc: 'Run inventory from any device, any location.',
                          icon: Warehouse,
                        },
                        {
                          title: 'Inventory visibility',
                          desc: 'Know what you have and where it lives.',
                          icon: Warehouse,
                        },
                        {
                          title: 'Alerts & expiry risk',
                          desc: 'Stay ahead of low stock and expiring items.',
                          icon: ClipboardCheck,
                        },
                        {
                          title: 'Barcoding',
                          desc: 'Scan items to reduce errors and save time.',
                          icon: Barcode,
                        },
                        {
                          title: 'Transfers & issues',
                          desc: 'Move stock with traceability, end to end.',
                          icon: RefreshCcw,
                        },
                        {
                          title: 'Reporting',
                          desc: 'Generate insights from movement and usage.',
                          icon: BarChart3,
                        },
                      ].map(({ title, desc, icon: Icon }) => (
                        <Link
                          key={title}
                          role="menuitem"
                          href="#features"
                          onClick={() => setIsFeaturesOpen(false)}
                          className="group flex gap-4"
                        >
                          <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
                            <Icon className="h-5 w-5 text-[#E53935]" />
                          </span>
                          <span>
                            <span className="block text-sm font-semibold text-neutral-900 group-hover:text-[#E53935]">
                              {title}
                            </span>
                            <span className="mt-1 block text-sm leading-relaxed text-neutral-600">
                              {desc}
                            </span>
                          </span>
                        </Link>
                      ))}
                    </div>

                    <div className="mt-10">
                      <Link
                        href="#features"
                        onClick={() => setIsFeaturesOpen(false)}
                        className="inline-flex h-10 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
                      >
                        View all features
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="#pricing"
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            Pricing
          </Link>

          <Link
            href="/auth/sign-in"
            className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#E53935] px-6 text-sm font-semibold text-white hover:bg-[#D32F2F]"
          >
            Get started
          </Link>
        </div>

        <div className="md:hidden">
          <button
            type="button"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-900"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-neutral-200 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            <details className="rounded-2xl border border-neutral-200 bg-white">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-neutral-900">
                <span>Features</span>
                <ChevronDown className="h-4 w-4 text-neutral-600" />
              </summary>
              <div className="px-2 pb-2">
                {[
                  {
                    title: 'Multi-warehouse stock',
                    desc: 'Real-time visibility across locations.',
                  },
                  {
                    title: 'Receiving (GRNs)',
                    desc: 'Verify quantities and keep receiving clean.',
                  },
                  { title: 'Transfers & issues', desc: 'Move and issue stock with traceability.' },
                  { title: 'Barcode-ready workflows', desc: 'Scan items to reduce errors.' },
                  { title: 'Audit logs', desc: 'Know the who/what/when for changes.' },
                  { title: 'Reports & insights', desc: 'Spot expiry risk and movement patterns.' },
                ].map((item) => (
                  <Link
                    key={item.title}
                    href="#features"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-2xl px-3 py-3 hover:bg-neutral-50"
                  >
                    <div className="text-sm font-semibold text-neutral-900">{item.title}</div>
                    <div className="mt-1 text-xs text-neutral-600">{item.desc}</div>
                  </Link>
                ))}
              </div>
            </details>
            <Link
              href="/auth/sign-in"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 hover:bg-neutral-50"
            >
              Sign in
            </Link>
            <Link
              href="/auth/sign-up"
              onClick={() => setIsMenuOpen(false)}
              className="inline-flex h-11 items-center justify-center rounded-full bg-[#E53935] px-5 text-sm font-semibold text-white hover:bg-[#D32F2F]"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
