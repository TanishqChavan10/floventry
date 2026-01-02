export default function SocialProof() {
  return (
    <section className="py-12 border-y border-slate-100 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm font-medium text-slate-500 mb-8 dark:text-slate-400">
          POWERING OPERATIONS FOR 500+ MODERN RETAILERS
        </p>
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {['Acme Retail', 'Nexus Warehousing', 'Urban Outfitters', 'TechDistro', 'GreenLeaf'].map(
            (brand) => (
              <span
                key={brand}
                className="text-xl font-bold text-slate-400 flex items-center gap-2 dark:text-slate-500"
              >
                <div className="w-6 h-6 bg-slate-300 rounded-full dark:bg-slate-600"></div>
                {brand}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
