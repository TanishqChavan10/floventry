import { BarChart3, Zap, Truck, Shield, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 dark:text-white">
          Everything you need to run a tight ship.
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto dark:text-slate-400">
          From procurement to payment, we cover the entire lifecycle with precision and ease.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Large Card */}
        <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all group dark:bg-slate-900 dark:border-slate-700">
          <div className="mb-6 bg-white w-12 h-12 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:scale-110 transition-transform dark:bg-slate-800 dark:border-slate-700">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2 dark:text-white">
            Real-Time Inventory Visibility
          </h3>
          <p className="text-slate-500 mb-8 max-w-md dark:text-slate-400">
            Track stock levels across multiple warehouses in real-time. Know exactly what you have,
            where it is, and when it expires.
          </p>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-48 flex items-center justify-center relative overflow-hidden dark:bg-slate-800 dark:border-slate-700">
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700"></div>
            {/* Mock Chart */}
            <div className="flex items-end gap-2 h-32 w-full px-8">
              {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 bg-indigo-100 rounded-t-md relative group/bar dark:bg-indigo-900"
                >
                  <div
                    style={{ height: `${h}%` }}
                    className="absolute bottom-0 w-full bg-indigo-500 rounded-t-md transition-all duration-500 group-hover/bar:bg-indigo-600"
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Small Card 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all group dark:bg-slate-800 dark:border-slate-700">
          <div className="mb-6 bg-indigo-50 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform dark:bg-indigo-900">
            <Zap className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2 dark:text-white">
            Smart Procurement
          </h3>
          <p className="text-slate-500 mb-6 text-sm dark:text-slate-400">
            Set reorder points. Flowventory auto-generates POs when stock hits the threshold.
          </p>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center gap-3 dark:bg-slate-900 dark:border-slate-700">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Stock below 20. PO #402 created.
            </span>
          </div>
        </div>

        {/* Small Card 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-lg transition-all group dark:bg-slate-800 dark:border-slate-700">
          <div className="mb-6 bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform dark:bg-green-900">
            <Truck className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2 dark:text-white">
            GRN & Quality Check
          </h3>
          <p className="text-slate-500 mb-6 text-sm dark:text-slate-400">
            Streamline check-ins. Verify shipments against POs and flag damaged items instantly.
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
              <Check className="h-3 w-3 text-green-500" /> 10/10 Items Verified
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 dark:bg-slate-700">
              <div className="bg-green-500 h-1.5 rounded-full w-full"></div>
            </div>
          </div>
        </div>

        {/* Medium Card */}
        <div className="md:col-span-3 bg-slate-900 rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-6">
                <Shield className="h-3 w-3" /> Enterprise Security
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Control who sees what.</h3>
              <p className="text-slate-400 mb-8 leading-relaxed">
                Give your warehouse staff access to scan items without exposing your financial
                reports. Invite suppliers to update their own shipment status directly in the
                portal.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Role-Based Access', 'Supplier Portal', 'Audit Logs'].map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full bg-white/10 text-sm border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full max-w-md bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6 border-b border-slate-700 pb-4">
                <span className="font-medium">Invite User</span>
                <X className="h-4 w-4 text-slate-500" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Email Address</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg h-10 w-full"></div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1.5">Role</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg h-10 w-full flex items-center px-3 text-sm text-slate-300">
                    Warehouse Staff
                  </div>
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white mt-2">
                  Send Invitation
                </Button>
              </div>
            </div>
          </div>

          {/* Background decoration */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </section>
  );
}
