-- Dashboard materialized view: pre-computes stock status distribution per company.
-- Run this migration manually or via a deployment script.
-- Refresh periodically via CRON (e.g., every 5 minutes) or after stock-changing operations.

-- Drop if recreating
DROP MATERIALIZED VIEW IF EXISTS mv_company_stock_status;

CREATE MATERIALIZED VIEW mv_company_stock_status AS
SELECT
  s.company_id,
  COUNT(*) AS total_stock_records,
  COUNT(*) FILTER (
    WHERE s.quantity > 0
      AND (s.reorder_point IS NULL OR s.quantity > s.reorder_point)
      AND (s.min_stock_level IS NULL OR s.quantity > s.min_stock_level)
  ) AS ok_count,
  COUNT(*) FILTER (
    WHERE s.quantity > 0
      AND s.reorder_point IS NOT NULL
      AND s.quantity <= s.reorder_point
      AND (s.min_stock_level IS NULL OR s.quantity > s.min_stock_level)
  ) AS low_count,
  COUNT(*) FILTER (
    WHERE s.quantity = 0
      OR (s.min_stock_level IS NOT NULL AND s.quantity <= s.min_stock_level)
  ) AS critical_count,
  COALESCE(SUM(s.quantity), 0) AS total_units,
  NOW() AS refreshed_at
FROM stock s
GROUP BY s.company_id;

-- Unique index required for CONCURRENTLY refresh
CREATE UNIQUE INDEX idx_mv_company_stock_status_company
  ON mv_company_stock_status (company_id);

-- To refresh without locking reads:
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_company_stock_status;
