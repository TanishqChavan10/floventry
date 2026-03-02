import { Zap, Box, BarChart3 } from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Connect',
    desc: 'Import your existing inventory via CSV and set up your warehouses in minutes.',
    icon: Zap,
  },
  {
    step: '02',
    title: 'Automate',
    desc: 'Define low-stock thresholds, preferred suppliers, and purchase order workflows.',
    icon: Box,
  },
  {
    step: '03',
    title: 'Optimize',
    desc: 'Get insights on stock movement, dead stock, expiry risk, and profit margins.',
    icon: BarChart3,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="mx-auto max-w-[1200px] px-6">
        {/* Heading */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
            Simple setup. Powerful results.
          </h2>
          <p className="mt-4 text-lg text-neutral-600">
            Get up and running in less than 15 minutes.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line — desktop */}
          <div className="hidden md:block absolute top-[52px] left-[calc(16.66%+32px)] right-[calc(16.66%+32px)] h-px bg-neutral-200 z-0" />

          {steps.map(({ step, title, desc, icon: Icon }, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center px-4">
              {/* Icon circle */}
              <div className="flex h-[104px] w-[104px] items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E53935]/8 border border-[#E53935]/20">
                  <Icon className="h-7 w-7 text-[#E53935]" />
                </div>
              </div>

              {/* Step label */}
              <span className="mb-2 text-xs font-bold uppercase tracking-widest text-neutral-400">
                Step {step}
              </span>

              <h3 className="text-xl font-semibold text-neutral-900 mb-3">{title}</h3>
              <p className="text-sm leading-relaxed text-neutral-600 max-w-xs">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
