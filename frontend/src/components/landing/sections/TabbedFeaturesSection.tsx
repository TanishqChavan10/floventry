import { Check } from 'lucide-react';

/* ── Visuals ───────────────────────────────────────────────────────────── */

function OrganizingVisual() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
        <div className="h-3 w-28 rounded-full bg-neutral-100" />
        <div className="h-8 w-20 rounded-full bg-[#E53935]/10" />
      </div>
      <div className="flex flex-wrap gap-2 mb-5">
        {['Electronics', 'Raw Materials', 'Packaging', 'Tools'].map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600"
          >
            {tag}
          </span>
        ))}
      </div>
      {[
        { name: 'Laptop — Dell XPS 15', sku: '#SKU-0021', qty: 14, tag: 'Electronics' },
        { name: 'HDPE Granules — 25kg', sku: '#SKU-0047', qty: 230, tag: 'Raw Materials' },
        { name: 'Cardboard Box — A4', sku: '#SKU-0088', qty: 1200, tag: 'Packaging' },
      ].map((item) => (
        <div
          key={item.sku}
          className="mb-2 flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3"
        >
          <div>
            <p className="text-xs font-semibold text-neutral-800">{item.name}</p>
            <p className="text-xs text-neutral-400">{item.sku}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-600">
              {item.tag}
            </span>
            <span className="text-xs font-bold text-neutral-900">{item.qty}</span>
          </div>
        </div>
      ))}
      <div className="mt-4 h-9 w-full rounded-xl border-2 border-dashed border-neutral-200 flex items-center justify-center">
        <span className="text-xs text-neutral-400">+ Import from CSV</span>
      </div>
    </div>
  );
}

function ReceivingVisual() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
        <div>
          <p className="text-xs font-bold text-neutral-900">GRN-2024-0042</p>
          <p className="text-xs text-neutral-400">PO Reference: PO-2024-0089</p>
        </div>
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
          Received
        </span>
      </div>
      {[
        { item: 'Steel Rods — 12mm', expected: 500, received: 498 },
        { item: 'Cement Bags — OPC 53', expected: 100, received: 100 },
        { item: 'Safety Gloves — L', expected: 200, received: 195 },
      ].map((row) => (
        <div
          key={row.item}
          className="mb-2 flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3"
        >
          <p className="text-xs font-medium text-neutral-800">{row.item}</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-400">Exp: {row.expected}</span>
            <span
              className={`text-xs font-bold ${row.received === row.expected ? 'text-green-600' : 'text-amber-600'}`}
            >
              Rcvd: {row.received}
            </span>
          </div>
        </div>
      ))}
      <div className="mt-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
        <p className="text-xs font-semibold text-amber-700">
          ⚠ Low stock alert: Safety Gloves — L is below threshold.
        </p>
      </div>
    </div>
  );
}

function ReportingVisual() {
  const bars = [60, 85, 40, 95, 70, 55, 80];
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-bold text-neutral-900">Stock Movement — Last 7 Days</p>
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
          Export CSV
        </span>
      </div>
      <div className="flex items-end gap-2 h-24 mb-4">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 h-full flex flex-col justify-end">
            <div className="w-full rounded-t-md bg-[#E53935]/80" style={{ height: `${h}%` }} />
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="flex-1 text-center text-[10px] text-neutral-400">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Items Moved', value: '1,243' },
          { label: 'Dead Stock', value: '18' },
          { label: 'Near Expiry', value: '7' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl bg-neutral-50 border border-neutral-100 p-3 text-center"
          >
            <p className="text-sm font-bold text-neutral-900">{stat.value}</p>
            <p className="text-[10px] text-neutral-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SyncingVisual() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="text-center mb-5">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#E53935]/10 mb-2">
          <svg
            className="h-6 w-6 text-[#E53935]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.582M9 20.418A8.001 8.001 0 0019.418 15M15 15h-4.582"
            />
          </svg>
        </div>
        <p className="text-xs font-bold text-neutral-900">Real-time sync active</p>
        <p className="text-[10px] text-neutral-400 mt-0.5">All devices up to date</p>
      </div>
      <div className="space-y-2">
        {['Warehouse (Desktop)', 'Manager (Tablet)', 'Staff (Mobile)'].map((device) => (
          <div
            key={device}
            className="flex items-center justify-between rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3"
          >
            <span className="text-xs font-medium text-neutral-700">{device}</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              Synced
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3">
        <p className="text-[10px] text-neutral-500">
          Last sync: <span className="font-semibold text-neutral-700">just now</span> · 3 users
          online
        </p>
      </div>
    </div>
  );
}

/* ── Section data ──────────────────────────────────────────────────────── */

const sections = [
  {
    label: 'Organizing',
    heading: 'Organize and automate your inventory at the touch of a button.',
    bullets: [
      'Easily import your existing inventory list via CSV.',
      'Organize stock by warehouse, category, and custom tags.',
      'Add item details with photos, barcodes, and custom fields.',
    ],
    visual: <OrganizingVisual />,
  },
  {
    label: 'Receiving',
    heading: 'Track and manage your entire inventory with one easy app.',
    bullets: [
      'Receive stock against purchase orders with GRNs.',
      'Scan barcodes to speed up receiving and stock counts.',
      'Get low-stock alerts before you run out.',
    ],
    visual: <ReceivingVisual />,
  },
  {
    label: 'Reporting',
    heading: 'Get real-time reporting insights.',
    bullets: [
      'In-depth data on items, movements, and user actions.',
      'Easily export custom PDF or CSV reports.',
      'Perfect for audits, budgeting, and forecasting.',
    ],
    visual: <ReportingVisual />,
  },
  {
    label: 'Syncing',
    heading: 'Automatically sync your inventory across all devices, all teams.',
    bullets: [
      'Use Floventry on mobile, desktop, or tablet with real-time syncing.',
      'Your team can update inventory from any location.',
      'Changes are reflected instantly — no manual refresh needed.',
    ],
    visual: <SyncingVisual />,
  },
];

/* ── Component ─────────────────────────────────────────────────────────── */

export default function FeaturesScrollSection() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="mx-auto max-w-[1200px] px-6 space-y-28">
        {sections.map((section, index) => {
          const isEven = index % 2 === 0;
          return (
            <div
              key={section.label}
              className={`grid grid-cols-1 items-center gap-16 lg:grid-cols-2 ${
                isEven ? '' : 'lg:[&>*:first-child]:order-2'
              }`}
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#E53935]">
                  {section.label}
                </span>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl leading-snug">
                  {section.heading}
                </h2>
                <ul className="mt-8 space-y-4">
                  {section.bullets.map((bullet) => (
                    <li key={bullet} className="flex items-start gap-3 text-base text-neutral-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white">
                        <Check className="h-3.5 w-3.5 text-neutral-900" />
                      </span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
              <div>{section.visual}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
