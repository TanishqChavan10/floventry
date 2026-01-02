import { z } from 'zod';

// ============================================
// PRODUCT VALIDATION SCHEMA
// ============================================

export const productSchema = z.object({
    name: z.string().min(1, 'Product name is required')
        .max(255, 'Product name must be less than 255 characters'),

    sku: z.string()
        .min(1, 'SKU is required')
        .regex(/^[A-Z0-9-]+$/i, 'SKU must contain only letters, numbers, and hyphens')
        .max(50, 'SKU must be less than 50 characters'),

    barcode: z.string().max(100, 'Barcode must be less than 100 characters').optional().or(z.literal('')),

    category_id: z.string().uuid('Invalid category').optional().or(z.literal('')),

    supplier_id: z.string().uuid('Invalid supplier').optional().or(z.literal('')),

    unit: z.string().min(1, 'Unit is required'),

    cost_price: z.number().min(0, 'Cost price must be positive').optional(),

    selling_price: z.number().min(0, 'Selling price must be positive').optional(),

    image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),

    description: z.string().max(1000, 'Description must be less than 1000 characters').optional().or(z.literal('')),

    is_active: z.boolean(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// ============================================
// CATEGORY VALIDATION SCHEMA
// ============================================

export const categorySchema = z.object({
    name: z.string()
        .min(1, 'Category name is required')
        .max(100, 'Category name must be less than 100 characters'),

    description: z.string()
        .max(500, 'Description must be less than 500 characters')
        .optional()
        .or(z.literal('')),

    isActive: z.boolean(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

// ============================================
// SUPPLIER VALIDATION SCHEMA
// ============================================

export const supplierSchema = z.object({
    name: z.string()
        .min(1, 'Supplier name is required')
        .max(200, 'Supplier name must be less than 200 characters'),

    email: z.string()
        .email('Invalid email address')
        .optional()
        .or(z.literal('')),

    phone: z.string()
        .regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number')
        .min(10, 'Phone number must be at least 10 digits')
        .max(20, 'Phone number must be less than 20 characters')
        .optional()
        .or(z.literal('')),

    address: z.string()
        .max(500, 'Address must be less than 500 characters')
        .optional()
        .or(z.literal('')),

    isActive: z.boolean(),
});

export type SupplierFormData = z.infer<typeof supplierSchema>;

// ============================================
// UNIT VALIDATION SCHEMA
// ============================================

export const unitSchema = z.object({
    name: z.string()
        .min(1, 'Unit name is required')
        .max(50, 'Unit name must be less than 50 characters'),

    shortCode: z.string()
        .min(1, 'Short code is required')
        .max(10, 'Short code must be less than 10 characters')
        .regex(/^[a-z0-9]+$/i, 'Short code must be alphanumeric'),

    isDefault: z.boolean(),
});

export type UnitFormData = z.infer<typeof unitSchema>;

// ============================================
// UPDATE SCHEMAS (for edit forms)
// ============================================

export const updateProductSchema = productSchema.extend({
    id: z.string().uuid('Invalid product ID'),
});

export type UpdateProductFormData = z.infer<typeof updateProductSchema>;

export const updateCategorySchema = categorySchema.extend({
    id: z.string().uuid('Invalid category ID'),
});

export type UpdateCategoryFormData = z.infer<typeof updateCategorySchema>;

export const updateSupplierSchema = supplierSchema.extend({
    id: z.string().uuid('Invalid supplier ID'),
});

export type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;

export const updateUnitSchema = unitSchema.extend({
    id: z.string().uuid('Invalid unit ID'),
});

export type UpdateUnitFormData = z.infer<typeof updateUnitSchema>;
