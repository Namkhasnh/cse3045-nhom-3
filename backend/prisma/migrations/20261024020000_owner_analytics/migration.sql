-- Additive index only; no historical rows or accepted order snapshots are changed.
CREATE INDEX orders_owner_analytics_idx ON orders (restaurant_id, status, completed_at, id);
