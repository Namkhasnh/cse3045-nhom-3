-- A resolved request is still appealable. Keep its active slot until closed.
-- Existing conflicts deliberately fail this additive change; never choose/delete a case.
ALTER TABLE support_requests
 DROP INDEX support_active,
 DROP COLUMN active_slot,
 ADD COLUMN active_slot TINYINT GENERATED ALWAYS AS (CASE WHEN status='closed' THEN NULL ELSE 1 END) STORED,
 ADD UNIQUE KEY support_active(order_id,creator_id,category,active_slot);
