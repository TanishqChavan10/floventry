import {
  BarChart3,
  Barcode,
  ClipboardCheck,
  ChevronDown,
  RefreshCcw,
  Shield,
  Truck,
  Warehouse,
} from 'lucide-react';

function FeatureDropdownItem({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <details className="group rounded-2xl border border-neutral-200 bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
            <Icon className="h-5 w-5 text-neutral-900" />
          </span>
          <span className="text-sm font-semibold text-neutral-900 md:text-base">{title}</span>
        </span>
        <ChevronDown className="h-5 w-5 text-neutral-600 transition-transform group-open:rotate-180" />
      </summary>
      <div className="px-6 pb-5 pt-0">
        <p className="text-sm leading-relaxed text-neutral-700">{description}</p>
      </div>
    </details>
  );
}

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
            Features, at a glance.
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-neutral-700">
            Open a feature to see what it does — short, clear, and built for warehouse teams.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-4">
          <FeatureDropdownItem
            title="Multi-warehouse stock"
            description="Real-time visibility across locations — know what you have and where it is."
            icon={Warehouse}
          />
          <FeatureDropdownItem
            title="Receiving (GRNs)"
            description="Receive against purchase orders, verify quantities, and keep receiving clean and consistent."
            icon={Truck}
          />
          <FeatureDropdownItem
            title="Transfers & issues"
            description="Move stock between warehouses or issue inventory with clear traceability."
            icon={RefreshCcw}
          />
          <FeatureDropdownItem
            title="Barcode-ready workflows"
            description="Scan items to speed up warehouse operations and reduce manual errors."
            icon={Barcode}
          />
          <FeatureDropdownItem
            title="Audit logs"
            description="Every important action is recorded — expand details to see the who/what/when."
            icon={ClipboardCheck}
          />
          <FeatureDropdownItem
            title="Reports & insights"
            description="Spot trends like expiry risk, dead stock, and movement patterns with simple reporting."
            icon={BarChart3}
          />
        </div>

        <div className="mt-16 rounded-3xl border border-neutral-200 bg-neutral-50 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-neutral-200 bg-white">
              <Shield className="h-6 w-6 text-neutral-900" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">
                Permissions that make sense
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-700">
                Give warehouse staff the tools to work quickly without exposing sensitive settings
                and reporting. Stay confident knowing changes are accountable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
