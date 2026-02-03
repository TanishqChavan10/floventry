'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type WarehouseType = 'MAIN' | 'RETAIL' | 'SERVICE_CENTER' | 'KIOSK' | 'COLD_STORAGE';

export interface Warehouse {
  id: string;
  name: string;
  slug: string;
  type: WarehouseType;
  address: string;
  status?: string;
}

interface WarehouseContextType {
  warehouses: Warehouse[];
  activeWarehouseId: string | 'ALL';
  activeWarehouse: Warehouse | null; // Null if 'ALL' is selected
  setActiveWarehouseId: (id: string | 'ALL') => void;
  addWarehouse: (warehouse: Omit<Warehouse, 'id' | 'slug'>) => Promise<Warehouse>;
  deleteWarehouse: (id: string) => Promise<void>;
  isLoading: boolean;
  refreshWarehouses: () => Promise<void>;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

// Mock Initial Data (for reference, though unused now)
const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh_main_001',
    name: 'Main Warehouse',
    slug: 'main-warehouse',
    type: 'MAIN',
    address: '123 Logistics Way, Industrial Zone, Mumbai',
  },
  {
    id: 'wh_retail_001',
    name: 'Mumbai Retail Store',
    slug: 'mumbai-retail-store',
    type: 'RETAIL',
    address: '45 High Street, Bandra West, Mumbai',
  },
  {
    id: 'wh_service_001',
    name: 'Service Center',
    slug: 'service-center',
    type: 'SERVICE_CENTER',
    address: '88 Tech Park, Navi Mumbai',
  },
];

import { useAuth as useClerkAuth } from '@clerk/nextjs';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { API_URL } from '@/config/env';

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const { getToken, isSignedIn } = useClerkAuth();
  const { user, loading: authLoading } = useAuth(); // Get user from auth context
  const params = useParams();

  const fetchWarehouses = async () => {
    if (!isSignedIn || !user) {
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/warehouses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();

        setWarehouses(data);
        if (data.length > 0 && activeWarehouseId === 'ALL') {
          // Optionally set default if 'ALL' is not desired as initial state, but 'ALL' is fine.
          // If we want to mimic the logic of "select first if exists", we can do it here.
          // For now, let's keep 'ALL' or user preference.
        }
      } else {
      }
    } catch (error) {
      console.error('[WarehouseContext] Failed to fetch warehouses', error);
      toast.error('Failed to load warehouses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn && user && !authLoading) {
      fetchWarehouses();
    } else {
      if (!authLoading) {
        setIsLoading(false);
      }
    }
  }, [isSignedIn, user, authLoading, params?.slug]); // Added user and authLoading dependencies

  // Detect active warehouse from URL
  useEffect(() => {
    const warehouseSlug = params?.warehouseSlug as string;
    if (warehouseSlug && warehouses.length > 0) {
      const currentWarehouse = warehouses.find((w) => w.slug === warehouseSlug);
      if (currentWarehouse && currentWarehouse.id !== activeWarehouseId) {
        setActiveWarehouseId(currentWarehouse.id);
      }
    }
  }, [params?.warehouseSlug, warehouses]);

  const addWarehouse = async (newWarehouseData: Omit<Warehouse, 'id' | 'slug'>) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/warehouses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newWarehouseData),
      });

      if (!res.ok) {
        throw new Error('Failed to create warehouse');
      }

      const createdWarehouse = await res.json();
      setWarehouses((prev) => [...prev, createdWarehouse]);
      toast.success('Warehouse created successfully');

      // If it's the first warehouse, select it
      if (warehouses.length === 0) {
        setActiveWarehouseId(createdWarehouse.id);
        // We might want to trigger a redirect here via callback or return the slug
      }
      return createdWarehouse; // Return so caller can redirect
    } catch (error) {
      console.error('Failed to create warehouse', error);
      toast.error('Failed to create warehouse');
      throw error;
    }
  };

  const deleteWarehouse = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/warehouses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete warehouse');
      }

      setWarehouses((prev) => prev.filter((w) => w.id !== id));
      if (activeWarehouseId === id) {
        setActiveWarehouseId('ALL');
      }
      toast.success('Warehouse deleted successfully');
    } catch (error) {
      console.error('Failed to delete warehouse', error);
      toast.error('Failed to delete warehouse');
      throw error;
    }
  };

  const activeWarehouse =
    activeWarehouseId === 'ALL' ? null : warehouses.find((w) => w.id === activeWarehouseId) || null;

  const value = {
    warehouses,
    activeWarehouseId,
    activeWarehouse,
    setActiveWarehouseId,
    addWarehouse,
    deleteWarehouse,
    isLoading,
    refreshWarehouses: fetchWarehouses,
  };

  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (context === undefined) {
    throw new Error('useWarehouse must be used within a WarehouseProvider');
  }
  return context;
}
