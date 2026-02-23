import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Floventry — Smart Inventory Management',
    short_name: 'Floventry',
    description:
      'Track stock across warehouses, scan barcodes, manage suppliers — built for Indian businesses.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#E53935',
    icons: [
      {
        src: '/4.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
