const brands = [
  'Acme Retail',
  'Nexus Warehousing',
  'Urban Hub',
  'TechDistro',
  'GreenLeaf Foods',
  'BoltParts',
  'Skyline Traders',
];

export default function SocialProof() {
  return (
    <section className="border-y border-neutral-200 bg-neutral-50 py-14">
      <div className="mx-auto max-w-[1200px] px-6 text-center">
        <p className="text-base font-semibold text-neutral-900 md:text-lg">
          Over 500 Indian businesses trust Floventry to track their inventory.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-16">
          {brands.map((brand) => (
            <span
              key={brand}
              className="flex items-center gap-2 text-sm font-semibold tracking-wide text-neutral-400"
            >
              <span className="inline-block h-4 w-4 rounded-full bg-neutral-300" />
              {brand}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
