import type { Metadata } from 'next';
import LandingPage from '@/components/landing/LandingPage';

export const metadata: Metadata = {
  title: 'Floventry — Smart Inventory Management for Growing Businesses',
  description:
    'Track stock across warehouses, scan barcodes, manage suppliers, handle purchase orders, and streamline your entire inventory workflow — built for Indian businesses.',
  openGraph: {
    title: 'Floventry — Smart Inventory Management',
    description: 'Track stock, scan barcodes, manage warehouses and suppliers from one dashboard.',
    url: 'https://floventry.online',
  },
  alternates: {
    canonical: 'https://floventry.online',
  },
};

export default async function Home() {
  return (
    <>
      {/* JSON-LD Structured Data for rich Google results */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Floventry',
            url: 'https://floventry.online',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description:
              'Smart inventory management built for Indian businesses. Track stock across godowns & warehouses, scan barcodes, manage suppliers, and streamline operations.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'INR',
            },
            countryOfOrigin: 'IN',
            featureList: [
              'Multi-warehouse stock tracking',
              'Barcode scanning & label generation',
              'Supplier management',
              'Purchase order workflows',
              'Expiry date monitoring',
              'Audit logging',
              'CSV import & export',
              'Role-based access control',
            ],
          }),
        }}
      />
      <LandingPage />
    </>
  );
}
