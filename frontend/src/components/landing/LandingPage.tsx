'use client';
import React, { use } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  BarChart3,
  Box,
  Truck,
  Users,
  Shield,
  Zap,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/landing/ThemeToggle';
import client from '@/lib/apollo-client';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-slate-900 dark:text-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 dark:bg-black/80 backdrop-blur-md z-50 border-b border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <Box className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">Flowventory</span>
            </div>

            <div className="hidden md:block">
              <ThemeToggle />
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white dark:bg-black border-b border-slate-100 dark:border-slate-800 p-4 space-y-4">
            <ThemeToggle outline fullWidth />
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-[1.1] dark:text-white">
          Inventory management that <span className="text-indigo-600">flows</span> as fast as your
          business.
        </h1>

        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed dark:text-slate-400">
          Stop wrestling with spreadsheets. Flowventory gives you real-time visibility over stock,
          suppliers, and shipments—so you can focus on growth, not counting boxes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link href="/auth/sign-up">
            <Button className="h-12 px-8 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-base font-medium transition-all hover:scale-105 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900">
              Start for free
            </Button>
          </Link>
          <Button
            variant="outline"
            className="h-12 px-8 rounded-full border-slate-200 hover:bg-slate-50 text-slate-700 text-base font-medium gap-2 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-300"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center dark:bg-indigo-900">
              <div className="w-0 h-0 border-t-[4px] border-t-transparent border-l-[6px] border-l-indigo-600 border-b-[4px] border-b-transparent ml-0.5"></div>
            </div>
            View Interactive Demo
          </Button>
        </div>

        {/* Hero Image / Dashboard Preview */}
        <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-slate-50/50 p-2 shadow-2xl shadow-indigo-500/10 dark:border-slate-700 dark:bg-slate-900/50">
          <div className="rounded-xl overflow-hidden bg-white border border-slate-200 aspect-[16/9] relative group dark:bg-slate-900 dark:border-slate-700">
            {/* Abstract UI Representation */}
            <div className="absolute inset-0 bg-slate-50 flex flex-col dark:bg-slate-900">
              {/* Mock Header */}
              <div className="h-14 border-b border-slate-100 bg-white flex items-center px-6 justify-between dark:border-slate-700 dark:bg-slate-800">
                <div className="flex gap-8">
                  <div className="w-24 h-4 bg-slate-100 rounded-md dark:bg-slate-700"></div>
                  <div className="flex gap-4">
                    <div className="w-16 h-4 bg-slate-50 rounded-md dark:bg-slate-800"></div>
                    <div className="w-16 h-4 bg-slate-50 rounded-md dark:bg-slate-800"></div>
                    <div className="w-16 h-4 bg-slate-50 rounded-md dark:bg-slate-800"></div>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900"></div>
              </div>
              {/* Mock Content */}
              <div className="p-8 flex-1 flex gap-6">
                {/* Sidebar */}
                <div className="w-48 hidden md:flex flex-col gap-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-full bg-white border border-slate-100 rounded-md dark:bg-slate-800 dark:border-slate-700"
                    ></div>
                  ))}
                </div>
                {/* Main Area */}
                <div className="flex-1 flex flex-col gap-6">
                  <div className="flex gap-4">
                    <div className="flex-1 h-32 bg-white border border-slate-100 rounded-xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 mb-3 dark:bg-indigo-900"></div>
                      <div className="w-20 h-4 bg-slate-100 rounded mb-2 dark:bg-slate-700"></div>
                      <div className="w-12 h-6 bg-slate-200 rounded dark:bg-slate-600"></div>
                    </div>
                    <div className="flex-1 h-32 bg-white border border-slate-100 rounded-xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="w-8 h-8 rounded-lg bg-green-50 mb-3 dark:bg-green-900"></div>
                      <div className="w-20 h-4 bg-slate-100 rounded mb-2 dark:bg-slate-700"></div>
                      <div className="w-12 h-6 bg-slate-200 rounded dark:bg-slate-600"></div>
                    </div>
                    <div className="flex-1 h-32 bg-white border border-slate-100 rounded-xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 mb-3 dark:bg-orange-900"></div>
                      <div className="w-20 h-4 bg-slate-100 rounded mb-2 dark:bg-slate-700"></div>
                      <div className="w-12 h-6 bg-slate-200 rounded dark:bg-slate-600"></div>
                    </div>
                  </div>
                  <div className="flex-1 bg-white border border-slate-100 rounded-xl shadow-sm p-6 dark:bg-slate-800 dark:border-slate-700">
                    <div className="flex justify-between mb-6">
                      <div className="w-32 h-6 bg-slate-100 rounded dark:bg-slate-700"></div>
                      <div className="w-24 h-8 bg-indigo-600 rounded-md"></div>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="h-12 w-full bg-slate-50 rounded-lg border border-slate-100 dark:bg-slate-800 dark:border-slate-700"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay Badge */}
            <div className="absolute bottom-8 right-8 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce-slow dark:bg-slate-800 dark:border-slate-700">
              <div className="bg-green-100 p-2 rounded-full dark:bg-green-900">
                <Check className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium dark:text-slate-400">
                  Stock Updated
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">PO #402 Approved</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-slate-100 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-medium text-slate-500 mb-8 dark:text-slate-400">
            POWERING OPERATIONS FOR 500+ MODERN RETAILERS
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {[
              'Acme Retail',
              'Nexus Warehousing',
              'Urban Outfitters',
              'TechDistro',
              'GreenLeaf',
            ].map((brand) => (
              <span
                key={brand}
                className="text-xl font-bold text-slate-400 flex items-center gap-2 dark:text-slate-500"
              >
                <div className="w-6 h-6 bg-slate-300 rounded-full dark:bg-slate-600"></div>
                {brand}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
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
              Track stock levels across multiple warehouses in real-time. Know exactly what you
              have, where it is, and when it expires.
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

      {/* How It Works */}
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

      {/* Testimonials */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all dark:bg-slate-800 dark:border-slate-700">
            <div className="flex gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-5 h-5 bg-orange-400 rounded-sm"></div>
              ))}
            </div>
            <p className="text-lg text-slate-700 mb-8 leading-relaxed dark:text-slate-300">
              "We used to spend 10 hours a week just reconciling stock. With Flowventory, it’s done
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

      {/* Pricing */}
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

      {/* FAQ */}
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

      {/* CTA */}
      <section className="py-24 bg-indigo-600 text-center px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to streamline your inventory?
        </h2>
        <p className="text-indigo-100 mb-10 max-w-2xl mx-auto text-lg">
          Join 500+ businesses growing with Flowventory today.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/auth/sign-up">
            <Button className="h-12 px-8 rounded-full bg-white text-indigo-600 hover:bg-indigo-50 text-base font-medium">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4 text-white">
                <div className="bg-indigo-600 p-1 rounded">
                  <Box className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold">Flowventory</span>
              </div>
              <p className="text-sm leading-relaxed">
                Smart inventory management for the modern business. Built for speed, designed for
                growth.
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Changelog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Docs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© 2024 Flowventory Inc. Made with precision.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">
                Twitter
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                LinkedIn
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
