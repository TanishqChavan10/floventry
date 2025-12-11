'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type WarehouseType = 'MAIN' | 'RETAIL' | 'SERVICE_CENTER' | 'KIOSK' | 'COLD_STORAGE';

export interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  address: string;
}

interface WarehouseContextType {
  warehouses: Warehouse[];
  activeWarehouseId: string | 'ALL';
  activeWarehouse: Warehouse | null; // Null if 'ALL' is selected
  setActiveWarehouseId: (id: string | 'ALL') => void;
  addWarehouse: (warehouse: Omit<Warehouse, 'id'>) => void;
  isLoading: boolean;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

// Mock Initial Data
const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh_main_001',
    name: 'Main Warehouse',
    type: 'MAIN',
    address: '123 Logistics Way, Industrial Zone, Mumbai',
  },
  {
    id: 'wh_retail_001',
    name: 'Mumbai Retail Store',
    type: 'RETAIL',
    address: '45 High Street, Bandra West, Mumbai',
  },
  {
    id: 'wh_service_001',
    name: 'Service Center',
    type: 'SERVICE_CENTER',
    address: '88 Tech Park, Navi Mumbai',
  },
];

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [activeWarehouseId, setActiveWarehouseId] = useState<string | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data (simulating API fetch)
  useEffect(() => {
    const timer = setTimeout(() => {
      setWarehouses(INITIAL_WAREHOUSES);
      setActiveWarehouseId('wh_main_001'); // Default to Main Warehouse
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const addWarehouse = (newWarehouseData: Omit<Warehouse, 'id'>) => {
    const newWarehouse: Warehouse = {
      ...newWarehouseData,
      id: `wh_${Math.random().toString(36).substr(2, 9)}`,
    };
    setWarehouses((prev) => [...prev, newWarehouse]);
  };

  const activeWarehouse =
    activeWarehouseId === 'ALL' ? null : warehouses.find((w) => w.id === activeWarehouseId) || null;

  const value = {
    warehouses,
    activeWarehouseId,
    activeWarehouse,
    setActiveWarehouseId,
    addWarehouse,
    isLoading,
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
