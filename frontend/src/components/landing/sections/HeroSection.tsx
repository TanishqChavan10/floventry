import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  return (
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
  );
}
