import Link from 'next/link';
import { Check } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="overflow-hidden py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-12">
          {/* Left — text */}
          <div className="flex flex-col lg:w-[46%] lg:flex-shrink-0">
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
              Inventory, purchasing, receiving — in one place
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-neutral-900 md:text-6xl">
              Run inventory without the
              <span className="text-[#E53935]"> chaos</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-700">
              Floventry helps teams track stock across warehouses, receive goods cleanly, and keep
              every action accountable — so you stop counting boxes and start scaling.
            </p>

            <div className="mt-8 flex flex-col items-start gap-3 text-sm text-neutral-700">
              {[
                'Real-time stock levels across locations',
                'Fast receiving with GRNs and audit trails',
                'Permissions built for warehouse teams',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-neutral-300 bg-white">
                    <Check className="h-3.5 w-3.5 text-neutral-900" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/auth/sign-up"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[#E53935] px-7 text-base font-semibold text-white hover:bg-[#D32F2F]"
              >
                Get started
              </Link>
              <Link
                href="#features"
                className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-7 text-base font-semibold text-neutral-900 hover:bg-neutral-50"
              >
                See features
              </Link>
            </div>
          </div>

          {/* Right — image bleeds off the right edge like Sortly */}
          <div className="lg:flex-1 lg:min-w-0 lg:translate-x-12">
            <img
              src="/landingDemo.png"
              alt="Floventry Dashboard Preview"
              className="w-full lg:w-[160%] max-w-none rounded-2xl shadow-2xl border border-neutral-200/60 lg:scale-y-110 origin-top"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
