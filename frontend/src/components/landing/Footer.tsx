import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950 py-24 text-neutral-400">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid grid-cols-1 items-start gap-12 md:grid-cols-4">
          <div>
            <div className="flex items-end gap-2 text-white md:pt-1">
              <img
                src="/2.svg"
                alt="Floventory"
                className="h-10 block w-auto brightness-0 invert"
              />
            </div>
          </div>
          <div className="items-center">
            <h4 className="text-sm font-semibold text-white">Product</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="#features" className="hover:text-white">
                  Features
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
          <div>
            <h4 className="text-sm font-semibold text-white">Company</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Legal</h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-white">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white">
                  Security
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-neutral-800 pt-8 text-sm md:flex-row">
          <p>© 2026 Flowventory Inc. Made with precision.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white">
              Twitter
            </Link>
            <Link href="#" className="hover:text-white">
              LinkedIn
            </Link>
            <Link href="#" className="hover:text-white">
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
