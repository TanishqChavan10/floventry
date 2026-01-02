export default function FAQSection() {
  return (
    <section className="py-24 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center dark:text-white">
        Frequently Asked Questions
      </h2>
      <div className="space-y-6">
        {[
          {
            q: 'Can I migrate from Excel?',
            a: 'Yes. We offer a smart CSV importer that maps your columns automatically.',
          },
          {
            q: 'Does it support barcode scanning?',
            a: 'Absolutely. You can use any standard USB scanner or our mobile app.',
          },
          {
            q: 'Is my data secure?',
            a: 'We use bank-grade encryption and daily backups. Your data is safe with us.',
          },
          {
            q: 'Can I invite my accountant?',
            a: "Yes, you can invite unlimited 'Viewer' roles for finance and reporting purposes on the Growth plan.",
          },
        ].map((item, i) => (
          <div key={i} className="border-b border-slate-200 pb-6 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 mb-2 dark:text-white">{item.q}</h3>
            <p className="text-slate-500 dark:text-slate-400">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
