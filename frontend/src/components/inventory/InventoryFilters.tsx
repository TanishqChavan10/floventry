'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Download, Plus } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InventoryFiltersProps {
  role: string;
}

export default function InventoryFilters({ role }: InventoryFiltersProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="search"
            placeholder="Search items by name, SKU, or barcode..."
            className="pl-9 bg-white dark:bg-slate-900"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px] bg-white dark:bg-slate-900">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
            <SelectItem value="clothing">Clothing</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-[150px] bg-white dark:bg-slate-900">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="in_stock">In Stock</SelectItem>
            <SelectItem value="low_stock">Low Stock</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="bg-white dark:bg-slate-900">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        {(role === 'admin' || role === 'manager' || role === 'employee') && (
          <Button asChild>
            <a href="/inventory/items/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
