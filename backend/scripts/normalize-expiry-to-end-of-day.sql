-- Normalize date-only (midnight) expiry timestamps to end-of-day.
-- Safe to run multiple times.
--
-- Assumes PostgreSQL.

BEGIN;

-- Stock lots (the canonical source of expiry)
UPDATE stock_lots
SET expiry_date = date_trunc('day', expiry_date) + interval '1 day' - interval '1 millisecond'
WHERE expiry_date IS NOT NULL
  AND expiry_date = date_trunc('day', expiry_date);

-- Optional: GRN items (if you want draft GRNs to reflect end-of-day too)
-- UPDATE grn_items
-- SET expiry_date = date_trunc('day', expiry_date) + interval '1 day' - interval '1 millisecond'
-- WHERE expiry_date IS NOT NULL
--   AND expiry_date = date_trunc('day', expiry_date);

COMMIT;
