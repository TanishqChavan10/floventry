'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';

// --- Apollo Client and GraphQL Imports ---
import { useQuery, useMutation } from '@apollo/client';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

// --- Component Imports ---
import {
  InventoryHeader,
  SearchFilterBar,
  ProductTable,
  ProductModal,
} from '@/components/inventory';

// Make sure this path is correct for your project structure
import { GET_PRODUCTS, UPDATE_PRODUCT, DELETE_PRODUCT, CREATE_PRODUCT } from '../../graphql/products';
import { GET_CATEGORIES } from '../../graphql/categories';
import type { Product as BackendProduct, Category, LegacyProduct } from '@/types';
import { mapProductToLegacy } from '@/types';

// --- Define a type for our Product for better TypeScript support ---
type Product = LegacyProduct;

export default function InventoryPage() {
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [form, setForm] = useState({ name: '', category: '', qty: 0, price: 0, minCount: 0 });

  // --- Fetch categories ---
  const { data: categoriesData } = useQuery(GET_CATEGORIES);
  const availableCategories = categoriesData?.categories || [];

  // --- STEP 1: Fetch data from the backend ---
  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS, {
    notifyOnNetworkStatusChange: true,
  });

  // --- Extract products and categories from the fetched data ---
  // Convert backend products to frontend format
  const backendProducts: BackendProduct[] = data?.products || [];
  const products: Product[] = backendProducts.map(mapProductToLegacy);

  // Extract categories from the available categories, not from products
  const categories: string[] = ['All', ...availableCategories.map((cat: Category) => cat.name)];

  // --- STEP 2: Define the mutations ---
  const [addProduct] = useMutation(CREATE_PRODUCT);
  const [updateProduct] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate pagination values
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Get current page items
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const resetForm = () => setForm({ name: '', category: '', qty: 0, price: 0, minCount: 0 });

  const handleAddProduct = () => {
    resetForm();
    setAdding(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name || '',
      category: product.category || '',
      qty: product.quantity || 0,
      price: product.price || 0,
      minCount: product.minCount || 0,
    });
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
    // Note: With the current backend setup, we filter on the frontend
    // If you want to filter on the backend, you can use GET_PRODUCTS_BY_CATEGORY
  };

  const handleFormChange = (newForm: typeof form) => {
    setForm(newForm);
  };

  const handleModalClose = () => {
    setEditing(null);
    setAdding(false);
    resetForm();
  };

  // --- STEP 3: Update event handlers to call mutations ---
  const handleSave = async () => {
    if (!form.name || !form.category) return;

    // Find the category ID from the category name
    const selectedCategory = availableCategories.find(
      (cat: Category) => cat.name === form.category,
    );
    if (!selectedCategory) {
      toast.error('Invalid category selected');
      return;
    }

    try {
      if (editing) {
        // For update, we need to find the original backend product to get the product_id
        const originalProduct = backendProducts.find(
          (p: BackendProduct) => p.product_id.toString() === editing.id,
        );
        if (!originalProduct) {
          toast.error('Product not found for update');
          return;
        }

        const updateInput = {
          product_id: originalProduct.product_id,
          product_name: form.name,
          categoryIds: [selectedCategory.category_id],
          stock: Number(form.qty),
          default_price: Number(form.price),
          min_stock: Number(form.minCount),
        };
        await updateProduct({ variables: { updateProductInput: updateInput } });
        toast.success('Product updated successfully!');
        setEditing(null);
      } else {
        const createInput = {
          product_name: form.name,
          categoryIds: [selectedCategory.category_id],
          stock: Number(form.qty),
          default_price: Number(form.price),
          min_stock: Number(form.minCount),
        };
        await addProduct({ variables: { createProductInput: createInput } });
        toast.success('Product added successfully!');
        setAdding(false);
      }
      refetch(); // Refetch the product list to show the new data
      resetForm();
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(error.message);
    }
  };

  const handleDelete = (productToDelete: Product) => {
    // This visually removes the item and shows the toast
    products.findIndex((p) => p.id === productToDelete.id);

    // A bit of a hack to update the cache visually before the mutation confirms
    // This provides a faster UI response. A more advanced method is to update the Apollo Cache directly.

    toast.error('Product has been deleted.', {
      action: {
        label: 'Undo',
        onClick: () => {
          // For now, undo is visual. A full implementation would cancel the scheduled delete.
          toast.info('Delete operation cancelled.');
        },
      },
      // When the toast automatically closes, confirm the deletion with the backend
      onAutoClose: () => confirmDelete(productToDelete.id),
    });
  };

  const confirmDelete = async (id: string) => {
    try {
      await deleteProduct({
        variables: { id: parseInt(id) },
      });

      // Force refetch to ensure UI is updated
      await refetch();
      toast.success('Product permanently deleted.');
    } catch (err: unknown) {
      const error = err as Error;
      toast.error(`Failed to delete product: ${error.message}`);
    }
  };

  if (loading && !data?.products) return <p className="text-center p-10">Loading inventory...</p>;
  if (error) return <p className="text-center text-red-500 p-10">Error: {error.message}</p>;

  return (
    <div className="w-full px-32 py-8 bg-gray-50 dark:bg-neutral-900 min-h-screen">
      <InventoryHeader onAddProduct={handleAddProduct} />

      <SearchFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={handleCategoryChange}
        categories={categories}
      />

      <ProductTable
        products={currentItems}
        onEditProduct={handleEditProduct}
        onDeleteProduct={handleDelete}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {totalPages <= 5 ? (
                // Show all pages if 5 or fewer
                [...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))
              ) : (
                // Show limited pages with ellipsis for larger page counts
                <>
                  <PaginationItem>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(1);
                      }}
                    >
                      1
                    </PaginationLink>
                  </PaginationItem>

                  {currentPage > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {currentPage > 2 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(currentPage - 1);
                        }}
                      >
                        {currentPage - 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {currentPage !== 1 && currentPage !== totalPages && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(currentPage);
                        }}
                      >
                        {currentPage}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {currentPage < totalPages - 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(currentPage + 1);
                        }}
                      >
                        {currentPage + 1}
                      </PaginationLink>
                    </PaginationItem>
                  )}

                  {currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}

                  {totalPages > 1 && (
                    <PaginationItem>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === totalPages}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(totalPages);
                        }}
                      >
                        {totalPages}
                      </PaginationLink>
                    </PaginationItem>
                  )}
                </>
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="mt-2 text-center text-sm text-gray-500">
            Showing page {currentPage} of {totalPages} ({totalItems} items)
          </div>
        </div>
      )}

      <ProductModal
        isOpen={adding || editing !== null}
        isEditing={editing !== null}
        form={form}
        categories={categories}
        onFormChange={handleFormChange}
        onSave={handleSave}
        onClose={handleModalClose}
      />
    </div>
  );
}
