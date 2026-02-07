'use client';

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="min-h-screen">{children}</main>
    </div>
  );
}
