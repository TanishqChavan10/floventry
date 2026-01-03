import { redirect } from 'next/navigation';

export default async function StockMovementsRedirectPage({
  params,
}: {
  params: Promise<{ slug: string; warehouseSlug: string }>;
}) {
  const { slug, warehouseSlug } = await params;
  redirect(`/${slug}/warehouses/${warehouseSlug}/inventory/stock-movements`);
}
