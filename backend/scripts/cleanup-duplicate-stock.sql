-- ========================================
-- Data Cleanup Script: Remove Duplicate Stock Rows
-- ========================================
-- WARNING: This script will permanently delete duplicate rows
-- Run this AFTER adding the UNIQUE constraint
-- ========================================

-- Step 1: Verify duplicates exist
SELECT 
    product_id, 
    warehouse_id, 
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as row_ids,
    STRING_AGG(quantity::text, ', ') as quantities
FROM stock
GROUP BY product_id, warehouse_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Preview which rows will be kept vs deleted
-- (Keeps the row with highest quantity, then most recent created_at)
WITH ranked_stock AS (
    SELECT 
        id,
        product_id,
        warehouse_id,
        quantity,
        created_at,
        ROW_NUMBER() OVER (
            PARTITION BY product_id, warehouse_id 
            ORDER BY quantity DESC, created_at DESC
        ) as rn
    FROM stock
)
SELECT 
    id,
    product_id,
    warehouse_id,
    quantity,
    created_at,
    CASE WHEN rn = 1 THEN 'KEEP' ELSE 'DELETE' END as action
FROM ranked_stock
WHERE (product_id, warehouse_id) IN (
    SELECT product_id, warehouse_id
    FROM stock
    GROUP BY product_id, warehouse_id
    HAVING COUNT(*) > 1
)
ORDER BY product_id, warehouse_id, rn;

-- Step 3: BACKUP before deletion (CRITICAL!)
CREATE TABLE stock_backup_before_dedup AS
SELECT * FROM stock
WHERE (product_id, warehouse_id) IN (
    SELECT product_id, warehouse_id
    FROM stock
    GROUP BY product_id, warehouse_id
    HAVING COUNT(*) > 1
);

-- Step 4: Delete duplicates (keeps row with highest quantity)
WITH ranked_stock AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY product_id, warehouse_id 
            ORDER BY quantity DESC, created_at DESC
        ) as rn
    FROM stock
)
DELETE FROM stock
WHERE id IN (
    SELECT id FROM ranked_stock WHERE rn > 1
);

-- Step 5: Verify cleanup
SELECT 
    product_id, 
    warehouse_id, 
    COUNT(*) as count
FROM stock
GROUP BY product_id, warehouse_id
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Step 6: Verify constraint exists
SELECT 
    constraint_name, 
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'stock' 
  AND constraint_type = 'UNIQUE';
-- Should show: IDX_... | UNIQUE

-- Optional: If you need to manually add the constraint
-- ALTER TABLE stock
-- ADD CONSTRAINT uq_stock_product_warehouse
-- UNIQUE (product_id, warehouse_id);
