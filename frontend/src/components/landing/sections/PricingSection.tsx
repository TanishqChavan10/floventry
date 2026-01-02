import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing.</h2>
          <p className="text-slate-400">Start for free, scale as you grow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-xl font-bold mb-2">Starter</h3>
            <div className="text-3xl font-bold mb-6">
              $0 <span className="text-sm font-normal text-slate-400">/mo</span>
            </div>
            <p className="text-slate-400 text-sm mb-8">For solo founders & micro-retailers.</p>
            <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white mb-8">
              Get Started
            </Button>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-indigo-400" /> 1 User
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-indigo-400" /> Up to 100 SKUs
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-indigo-400" /> Basic Reports
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-indigo-400" /> Community Support
              </li>
            </ul>
          </div>

          {/* Growth */}
          <div className="bg-indigo-600 rounded-2xl p-8 border border-indigo-500 relative transform md:-translate-y-4 shadow-2xl">
            <div className="absolute top-0 right-0 bg-indigo-400 text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg text-indigo-900">
              POPULAR
            </div>
            <h3 className="text-xl font-bold mb-2">Growth</h3>
            <div className="text-3xl font-bold mb-6">
              $49 <span className="text-sm font-normal text-indigo-200">/mo</span>
            </div>
            <p className="text-indigo-100 text-sm mb-8">For growing businesses.</p>
            <Button className="w-full bg-white text-indigo-600 hover:bg-indigo-50 mb-8">
              Start Free Trial
            </Button>
            <ul className="space-y-4 text-sm text-indigo-100">
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> 5 Users (RBAC)
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> Unlimited SKUs
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> Multi-warehouse
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> Supplier Portal
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-white" /> Priority Support
              </li>
            </ul>
          </div>

          {/* Scale */}
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <h3 className="text-xl font-bold mb-2">Scale</h3>
            <div className="text-3xl font-bold mb-6">Custom</div>
            <p className="text-slate-400 text-sm mb-8">For high-volume distributors.</p>
            <Button className="w-full bg-slate-700 hover:bg-slate-600 text-white mb-8">
              Contact Sales
            </Button>
            <ul className="space-y-4 text-sm text-slate-300">
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-indigo-400" /> Unlimited Users
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-indigo-400" /> API Access
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-indigo-400" /> Dedicated Account Manager
              </li>
              <li className="flex items-center gap-3">
                <Check className="h-4 w-4 text-indigo-400" /> Custom Integrations
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
