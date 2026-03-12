'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

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
  archiveWarehouse: (id: string) => Promise<void>;
  isLoading: boolean;
  refreshWarehouses: (forCompanyId?: string) => Promise<void>;
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

import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';
import { API_URL } from '@/config/env';

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading, isSignedIn: isSignedIn, getToken } = useAuth();
  const params = useParams();

  // Track the previous company slug so we can detect a company switch
  const prevSlugRef = useRef<string | undefined>(undefined);
  const prevActiveCompanyIdRef = useRef<string | undefined>(undefined);
  const fetchRequestIdRef = useRef(0);

  const currentSlug = params?.slug as string | undefined;
  const companyFromSlug = currentSlug
    ? user?.companies?.find((company) => company.slug === currentSlug)
    : undefined;

  const fetchWarehouses = async (forCompanyId?: string) => {
    if (!isSignedIn || !user) {
      setIsLoading(false);
      return;
    }

    const requestId = ++fetchRequestIdRef.current;
    setIsLoading(true);

    try {
      const token = await getToken();
      // When forCompanyId is provided, pass it to the backend so we always get
      // the correct company's warehouses regardless of activeCompanyId timing.
      const url = forCompanyId
        ? `${API_URL}/warehouses?companyId=${encodeURIComponent(forCompanyId)}`
        : `${API_URL}/warehouses`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();

        if (requestId !== fetchRequestIdRef.current) {
          return;
        }

        setWarehouses(data);
      }
    } catch (error) {
      if (requestId !== fetchRequestIdRef.current) {
        return;
      }

      console.error('[WarehouseContext] Failed to fetch warehouses', error);
      toast.error('Failed to load warehouses');
    } finally {
      if (requestId === fetchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    const currentActiveCompanyId = user?.activeCompanyId;

    // When the user navigates to a different company, reset stale warehouse state
    // immediately so the old company's list never appears in the new company's switcher.
    if (prevSlugRef.current !== undefined && prevSlugRef.current !== currentSlug) {
      fetchRequestIdRef.current += 1;
      setWarehouses([]);
      setActiveWarehouseId('ALL');
    }

    // Also react to backend active-company changes even if the URL was already updated.
    if (
      prevActiveCompanyIdRef.current !== undefined &&
      prevActiveCompanyIdRef.current !== currentActiveCompanyId
    ) {
      fetchRequestIdRef.current += 1;
      setWarehouses([]);
      setActiveWarehouseId('ALL');
    }

    prevSlugRef.current = currentSlug;
    prevActiveCompanyIdRef.current = currentActiveCompanyId;

    if (isSignedIn && user && !authLoading) {
      // Resolve the company ID from the URL slug and pass it explicitly
      // so the backend returns the correct company's warehouses even if
      // activeCompanyId hasn't propagated yet.
      const slugCompanyId = companyFromSlug?.id;
      fetchWarehouses(slugCompanyId);
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [isSignedIn, user, user?.activeCompanyId, authLoading, currentSlug]);

  // Detect active warehouse from URL
  useEffect(() => {
    const warehouseSlug = params?.warehouseSlug as string;
    if (warehouseSlug && warehouses.length > 0) {
      const currentWarehouse = warehouses.find((w) => w.slug === warehouseSlug);
      if (currentWarehouse && currentWarehouse.id !== activeWarehouseId) {
        setActiveWarehouseId(currentWarehouse.id);
      }
    } else if (!warehouseSlug && activeWarehouseId !== 'ALL') {
      setActiveWarehouseId('ALL');
    }
  }, [params?.warehouseSlug, warehouses, activeWarehouseId]);

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

  const archiveWarehouse = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/warehouses/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to archive warehouse');
      }

      setWarehouses((prev) => prev.filter((w) => w.id !== id));
      if (activeWarehouseId === id) {
        setActiveWarehouseId('ALL');
      }
      toast.success('Warehouse archived successfully');
    } catch (error) {
      console.error('Failed to archive warehouse', error);
      toast.error('Failed to archive warehouse');
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
    archiveWarehouse,
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
