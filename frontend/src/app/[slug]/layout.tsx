'use client';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <main>{children}</main>
    </div>
  );
}
