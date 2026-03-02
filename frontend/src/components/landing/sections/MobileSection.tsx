import Link from 'next/link';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

const devices = [
  { icon: Monitor, label: 'Desktop' },
  { icon: Tablet, label: 'Tablet' },
  { icon: Smartphone, label: 'Mobile' },
];

export default function MobileSection() {
  return (
    <section className="bg-neutral-50 py-24 border-y border-neutral-200">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* Left — text */}
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl leading-snug">
              Inventory from anywhere.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-neutral-700">
              Floventry works beautifully on your desktop, tablet, or phone browser—no install
              required. Manage stock, receive goods, and check reports from the warehouse floor or
              the office.
            </p>

            {/* Device chips */}
            <div className="mt-8 flex flex-wrap gap-3">
              {devices.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 shadow-sm"
                >
                  <Icon className="h-4 w-4 text-neutral-500" />
                  {label}
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/auth/sign-up"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#E53935] px-7 text-base font-semibold text-white hover:bg-[#D32F2F]"
              >
                Start for free
              </Link>
              <Link
                href="/auth/sign-in"
                className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-7 text-base font-semibold text-neutral-900 hover:bg-neutral-50"
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Right — multi-device mockup */}
          <div className="relative flex items-end justify-center gap-4">
            {/* Desktop mockup */}
            <div className="w-64 shrink-0 rounded-2xl border border-neutral-200 bg-white shadow-md overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-1.5 border-b border-neutral-100 bg-neutral-50 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-300" />
                <span className="ml-3 h-3 flex-1 rounded-full bg-neutral-200" />
              </div>
              <div className="p-4 space-y-2">
                <div className="h-3 w-24 rounded-full bg-neutral-100" />
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-xl border border-neutral-100 bg-neutral-50 p-2"
                    >
                      <div className="h-2 w-10 rounded-full bg-neutral-200" />
                      <div className="mt-2 h-4 w-8 rounded-full bg-[#E53935]/20" />
                    </div>
                  ))}
                </div>
                <div className="mt-2 space-y-1.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-full rounded-xl border border-neutral-100 bg-neutral-50"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile mockup */}
            <div className="w-28 shrink-0 rounded-[20px] border-2 border-neutral-200 bg-white shadow-lg overflow-hidden">
              {/* Notch */}
              <div className="flex justify-center border-b border-neutral-100 bg-neutral-50 py-2">
                <div className="h-1.5 w-10 rounded-full bg-neutral-300" />
              </div>
              <div className="p-3 space-y-2">
                <div className="h-2 w-16 rounded-full bg-neutral-100" />
                <div className="space-y-1.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-7 w-full rounded-lg border border-neutral-100 bg-neutral-50"
                    />
                  ))}
                </div>
                <div className="mt-2 h-8 w-full rounded-full bg-[#E53935]/90" />
              </div>
            </div>

            {/* Pulse dot */}
            <div className="absolute -top-4 right-6 flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-xs font-semibold text-neutral-700">Live sync</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
