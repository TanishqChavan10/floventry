import Link from 'next/link';
import { Check } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-neutral-600">
              Inventory, purchasing, receiving — in one place
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight text-neutral-900 md:text-6xl">
              Run inventory without the
              <span className="text-[#E53935]"> chaos</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-neutral-700">
              Flowventory helps teams track stock across warehouses, receive goods cleanly, and keep
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
            <p className="mt-4 text-sm text-neutral-600">No credit card required.</p>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6">
            <div className="rounded-2xl border border-neutral-200 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
                <div className="h-3 w-40 rounded-full bg-neutral-100" />
                <div className="h-9 w-24 rounded-full bg-neutral-100" />
              </div>
              <div className="p-5">
                <div className="grid grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl border border-neutral-200 bg-white p-4">
                      <div className="h-8 w-8 rounded-xl bg-neutral-100" />
                      <div className="mt-4 h-3 w-20 rounded-full bg-neutral-100" />
                      <div className="mt-3 h-7 w-14 rounded-full bg-neutral-100" />
                    </div>
                  ))}
                </div>
                <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-40 rounded-full bg-neutral-100" />
                    <div className="h-10 w-28 rounded-full bg-neutral-100" />
                  </div>
                  <div className="mt-5 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-12 w-full rounded-2xl border border-neutral-200 bg-neutral-50"
                      />
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
                  <p className="text-sm font-semibold text-neutral-900">Audit-ready by default</p>
                  <p className="mt-2 text-sm text-neutral-700">
                    Every change is recorded with the who/what/when.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
