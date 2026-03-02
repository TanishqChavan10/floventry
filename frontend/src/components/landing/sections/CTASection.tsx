import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="w-full bg-white py-24">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
          Try Floventry free for 14 days.
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-neutral-700">
          Track your inventory, supplies, materials, and tools with Floventry and run a more
          efficient business — no credit card required.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/sign-up"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#E53935] px-7 text-base font-semibold text-white hover:bg-[#D32F2F]"
          >
            Start free trial
          </Link>
          <Link
            href="/pricing"
            className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-7 text-base font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            See all plans
          </Link>
        </div>
      </div>
    </section>
  );
}
