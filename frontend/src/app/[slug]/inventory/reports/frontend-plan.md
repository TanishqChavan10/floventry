# Frontend Implementation: Company Inventory Reports

## Page Structure
`src/app/[slug]/inventory/reports/page.tsx`

## Components
1.  **InventorySummaryTab**
    - Query: `GET_COMPANY_INVENTORY_SUMMARY`
    - Filters: Category (Select), Search (Input), Status (Select)
    - Table: Product Name, SKU, Category, Total Stock, Warehouses Count, Min/Max Qty, Status

2.  **WarehouseComparisonTab**
    - State: `selectedProductId`
    - Top Filter: Product Selector (Searchable Select) - Fetch using `GET_PRODUCTS` or derived from summary.
    - Query: `GET_STOCK_BY_PRODUCT` (Triggered when product selected)
    - Table: Warehouse Name, Quantity, Min Level, Reorder Point, Status, Last Updated

3.  **StockMovementsTab**
    - Query: `GET_COMPANY_STOCK_MOVEMENTS`
    - Filters: Date Range, Warehouse, Movement Type
    - Table: Date, Product, Warehouse, Type, Quantity, Source, Reference, User

4.  **AdjustmentsAuditTab**
    - Query: `GET_COMPANY_STOCK_MOVEMENTS`
    - Filters: Fixed types `[ADJUSTMENT_IN, ADJUSTMENT_OUT]`, Warehouse, User, Date
    - Table: Date, Warehouse, Product, Type, Quantity, Reason, User

## Requirements
- RBAC: `OWNER`, `ADMIN`
- Read-only: No edit actions

## GraphQL
Using queries added to `src/lib/graphql/inventory.ts`.
