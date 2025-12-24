export enum MovementType {
    IN = 'IN',
    OUT = 'OUT',
    ADJUSTMENT = 'ADJUSTMENT',
    TRANSFER_IN = 'TRANSFER_IN',
    TRANSFER_OUT = 'TRANSFER_OUT',
}

export enum ReferenceType {
    PURCHASE_ORDER = 'PURCHASE_ORDER',
    SALES_ORDER = 'SALES_ORDER',
    ADJUSTMENT = 'ADJUSTMENT',
    TRANSFER = 'TRANSFER',
    MANUAL = 'MANUAL',
}

export interface Stock {
    id: string;
    product: {
        id: string;
        name: string;
        sku: string;
        category?: {
            id: string;
            name: string;
        };
        cost_price?: number;
        selling_price?: number;
    };
    warehouse: {
        id: string;
        name: string;
    };
    quantity: number;
    min_stock_level?: number;
    max_stock_level?: number;
    reorder_point?: number;
    created_at: string;
    updated_at: string;
}

export interface StockMovement {
    id: string;
    type: MovementType;
    quantity: number;
    previous_quantity: number;
    new_quantity: number;
    reason?: string;
    reference_id?: string;
    reference_type?: ReferenceType;
    notes?: string;
    product: {
        id: string;
        name: string;
        sku: string;
    };
    warehouse: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        fullName?: string;
    };
    created_at: string;
}

export interface CreateStockInput {
    product_id: string;
    warehouse_id: string;
    quantity?: number;
    min_stock_level?: number;
    max_stock_level?: number;
    reorder_point?: number;
}

export interface AdjustStockInput {
    product_id: string;
    warehouse_id: string;
    quantity: number;
    type: MovementType;
    reason?: string;
    reference_id?: string;
    reference_type?: ReferenceType;
    notes?: string;
}

export interface UpdateStockInput {
    id: string;
    min_stock_level?: number;
    max_stock_level?: number;
    reorder_point?: number;
}

export interface StockMovementFilterInput {
    warehouse_id?: string;
    product_id?: string;
    type?: MovementType;
    from_date?: Date;
    to_date?: Date;
    limit?: number;
    offset?: number;
}
