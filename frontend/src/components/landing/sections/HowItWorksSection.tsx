import { Zap, Box, BarChart3 } from 'lucide-react';

export default function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="py-24 bg-slate-50 border-y border-slate-200 dark:bg-slate-900 dark:border-slate-700"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4 dark:text-white">
            Simple setup. Powerful results.
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Get up and running in less than 15 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-200 z-0 dark:bg-slate-700"></div>

          {[
            {
              step: '01',
              title: 'Connect',
              desc: 'Import your data via CSV or sync with your existing eCommerce store in minutes.',
              icon: <Zap className="h-6 w-6 text-indigo-600" />,
            },
            {
              step: '02',
              title: 'Automate',
              desc: 'Define low-stock thresholds, preferred suppliers, and approval workflows.',
              icon: <Box className="h-6 w-6 text-indigo-600" />,
            },
            {
              step: '03',
              title: 'Optimize',
              desc: 'Get insights on best-selling items, dead stock, and profit margins.',
              icon: <BarChart3 className="h-6 w-6 text-indigo-600" />,
            },
          ].map((item, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white rounded-full border border-slate-200 flex items-center justify-center shadow-sm mb-6 dark:bg-slate-800 dark:border-slate-700">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center dark:bg-indigo-900">
                  {item.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 dark:text-white">
                {item.title}
              </h3>
              <p className="text-slate-500 leading-relaxed max-w-xs dark:text-slate-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
