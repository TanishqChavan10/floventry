export default function TestimonialsSection() {
  return (
    <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700">
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-5 h-5 bg-orange-400 rounded-sm"></div>
            ))}
          </div>
          <p className="text-lg text-slate-700 mb-8 leading-relaxed dark:text-slate-300">
            "We used to spend 10 hours a week just reconciling stock. With Flowventory, it's done
            automatically. The GRN feature saved us from overpaying suppliers three times this
            month."
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full dark:bg-slate-600"></div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Sarah Jenkins</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Operations Director, Urban Home Goods
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700">
          <div className="flex gap-1 mb-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="w-5 h-5 bg-orange-400 rounded-sm"></div>
            ))}
          </div>
          <p className="text-lg text-slate-700 mb-8 leading-relaxed dark:text-slate-300">
            "The interface is incredibly clean. My warehouse team learned it in an afternoon. It
            feels like modern software, not a clunky ERP from the 90s."
          </p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 rounded-full dark:bg-slate-600"></div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">David Chen</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Founder, TechGear Distributors
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
