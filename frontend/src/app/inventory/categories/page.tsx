'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import CategoryTable from '@/components/inventory/CategoryTable';
import CategoryDialog from '@/components/inventory/CategoryDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

// Mock Data
const MOCK_CATEGORIES = [
  {
    id: '1',
    name: 'Electronics',
    description: 'Gadgets, computers, and accessories',
    itemCount: 145,
    parentId: null,
    createdAt: 'Oct 12, 2024',
  },
  {
    id: '2',
    name: 'Furniture',
    description: 'Office chairs, desks, and tables',
    itemCount: 56,
    parentId: null,
    createdAt: 'Oct 15, 2024',
  },
  {
    id: '3',
    name: 'Office Supplies',
    description: 'Paper, pens, and stationery',
    itemCount: 890,
    parentId: null,
    createdAt: 'Oct 20, 2024',
  },
  {
    id: '4',
    name: 'Laptops',
    description: 'Portable computers',
    itemCount: 45,
    parentId: '1', // Subcategory of Electronics
    createdAt: 'Nov 01, 2024',
  },
];

export default function CategoriesPage() {
  const [role, setRole] = useState('admin');
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = () => {
    setEditingCategory(null);
    setIsDialogOpen(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const handleDeleteCategory = (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (category && category.itemCount > 0) {
      toast.error(`Cannot delete category with ${category.itemCount} items. Reassign items first.`);
      return;
    }
    
    if (confirm('Are you sure you want to delete this category?')) {
      setCategories(categories.filter((c) => c.id !== id));
      toast.success('Category deleted successfully');
    }
  };

  const handleSaveCategory = (categoryData: any) => {
    if (editingCategory) {
      // Update existing
      setCategories(
        categories.map((c) =>
          c.id === editingCategory.id ? { ...c, ...categoryData } : c
        )
      );
    } else {
      // Create new
      const newCategory = {
        id: Math.random().toString(36).substr(2, 9),
        ...categoryData,
        itemCount: 0,
        createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      };
      setCategories([...categories, newCategory]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <DashboardHeader companyName="Acme Corp" role={role} onRoleChange={setRole} />
      
      <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Categories
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Organize your inventory into categories and subcategories.
            </p>
          </div>
          {(role === 'admin' || role === 'manager') && (
            <Button onClick={handleAddCategory}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <Input
              type="search"
              placeholder="Search categories..."
              className="pl-9 bg-white dark:bg-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <CategoryTable
          categories={filteredCategories}
          role={role}
          onEdit={handleEditCategory}
          onDelete={handleDeleteCategory}
        />
      </main>

      <CategoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        category={editingCategory}
        onSave={handleSaveCategory}
        categories={categories}
      />
    </div>
  );
}
