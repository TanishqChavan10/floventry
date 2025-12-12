import { useQuery } from '@apollo/client';
import { GET_PRODUCTS } from '@/lib/graphql/catalog';

interface Product {
  id: string;
  name: string;
  sku: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  image_url?: string;
  category?: {
    id: string;
    name: string;
  };
  supplier?: {
    id: string;
    name: string;
  };
}

export function useProducts() {
  const { data, loading, error } = useQuery(GET_PRODUCTS);

  return {
    products: data?.products || [],
    loading,
    error,
  };
}