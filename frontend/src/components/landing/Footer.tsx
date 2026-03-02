import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 py-24 text-neutral-400">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="flex flex-col items-start gap-12 md:flex-row md:items-center md:justify-between">
          <div>
            <img src="/2.svg" alt="Floventry" className="h-10 block w-auto brightness-0 invert" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="flex flex-col gap-2 text-sm sm:flex-row sm:gap-6">
              <li>
                <Link href="/pricing" className="hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/auth/sign-up" className="hover:text-white">
                  Get started
                </Link>
              </li>
              <li>
                <Link href="/auth/sign-in" className="hover:text-white">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-neutral-800 pt-8 text-sm">
          <p>© 2026 Floventry Inc. Made with precision.</p>
        </div>
      </div>
    </footer>
  );
}
