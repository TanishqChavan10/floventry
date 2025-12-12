import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CTASection() {
  return (
    <section className="py-24 bg-indigo-600 text-center px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
        Ready to streamline your inventory?
      </h2>
      <p className="text-indigo-100 mb-10 max-w-2xl mx-auto text-lg">
        Join 500+ businesses growing with Flowventory today.
      </p>
      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link href="/auth/sign-up">
          <Button className="h-12 px-8 rounded-full bg-white text-indigo-600 hover:bg-indigo-50 text-base font-medium">
            Get Started for Free
          </Button>
        </Link>
      </div>
    </section>
  );
}
