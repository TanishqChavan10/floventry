import Link from 'next/link';

export default function CTASection() {
  return (
    <section className="w-full bg-neutral-50 py-16">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
          Ready to streamline your inventory?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-neutral-700">
          Start clean, stay accurate, and keep every movement accountable as your operations grow.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/auth/sign-up"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#E53935] px-7 text-base font-semibold text-white hover:bg-[#D32F2F]"
          >
            Get started
          </Link>
          <Link
            href="/auth/sign-in"
            className="inline-flex h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-7 text-base font-semibold text-neutral-900 hover:bg-neutral-50"
          >
            Sign in
          </Link>
        </div>
        <p className="mt-4 text-sm text-neutral-600">No long setup. No hidden complexity.</p>
      </div>
    </section>
  );
}
