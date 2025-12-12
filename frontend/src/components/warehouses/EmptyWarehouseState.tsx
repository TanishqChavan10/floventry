'use client';

import React, { useState } from 'react';
import { Warehouse, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CreateWarehouseModal } from './CreateWarehouseModal';

interface EmptyWarehouseStateProps {
  companySlug: string;
}

export default function EmptyWarehouseState({ companySlug }: EmptyWarehouseStateProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          {/* Icon */}
          <div className="mx-auto w-24 h-24 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
            <Warehouse className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
          </div>

          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              No Warehouses Yet
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Get started by creating your first warehouse to manage your inventory and operations.
            </p>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            size="lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Warehouse
          </Button>

          {/* Additional Info */}
          <div className="text-sm text-slate-400 dark:text-slate-500">
            <p>
              Warehouses help you organize inventory, track stock levels, and manage operations
              across multiple locations.
            </p>
          </div>
        </div>
      </div>
      
      <CreateWarehouseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
