-- DEC-07.2026-10-21.v1; additive expansion, no receipts/consents inferred.
CREATE TABLE settlements (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, restaurant_id BIGINT NOT NULL,
 period_start_at DATETIME(3) NOT NULL, period_end_at DATETIME(3) NOT NULL,
 created_by BIGINT NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 policy_version VARCHAR(64) NOT NULL,
 UNIQUE KEY settlement_restaurant_month(restaurant_id,period_start_at), UNIQUE KEY settlement_restaurant(id,restaurant_id),
 CONSTRAINT settlement_restaurant_fk FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT,
 CONSTRAINT settlement_actor_fk FOREIGN KEY(created_by) REFERENCES accounts(id) ON DELETE RESTRICT,
 CONSTRAINT settlement_month_ck CHECK(DAY(DATE_ADD(period_start_at,INTERVAL 7 HOUR))=1 AND TIME(DATE_ADD(period_start_at,INTERVAL 7 HOUR))='00:00:00' AND period_end_at=DATE_SUB(DATE_ADD(DATE_ADD(period_start_at,INTERVAL 7 HOUR),INTERVAL 1 MONTH),INTERVAL 7 HOUR))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
ALTER TABLE commission_entries
 ADD base_order_id BIGINT NULL, ADD reason VARCHAR(1000) NULL, ADD evidence_reference VARCHAR(255) NULL,
 ADD corrects_entry_id BIGINT NULL, ADD booking_month DATETIME(3) NULL,
 ADD settlement_id BIGINT NULL, ADD assigned_at DATETIME(3) NULL, ADD policy_version VARCHAR(64) NULL,
 ADD INDEX commission_order_restaurant(order_id,restaurant_id), ADD UNIQUE KEY commission_entry_restaurant(id,restaurant_id);
-- Original base facts have an unambiguous order/completion relationship. Preserve their facts.
UPDATE commission_entries e JOIN orders o ON o.id=e.order_id SET e.base_order_id=e.order_id,
 e.booking_month=DATE_SUB(CAST(DATE_FORMAT(DATE_ADD(o.completed_at,INTERVAL 7 HOUR),'%Y-%m-01 00:00:00') AS DATETIME),INTERVAL 7 HOUR);
-- Missing completion dates fail NOT NULL rather than inventing historical timestamps.
ALTER TABLE commission_entries MODIFY booking_month DATETIME(3) NOT NULL,
 DROP CHECK commission_entry_base_chk,
 DROP FOREIGN KEY commission_entries_order_id_fkey,
 ADD CONSTRAINT commission_order_immutable_fk FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 ADD UNIQUE KEY commission_base_once(base_order_id),
 ADD CONSTRAINT commission_base_order_fk FOREIGN KEY(base_order_id) REFERENCES orders(id) ON DELETE RESTRICT,
 ADD CONSTRAINT commission_order_restaurant_fk FOREIGN KEY(order_id,restaurant_id) REFERENCES orders(id,restaurant_id) ON DELETE RESTRICT,
 ADD CONSTRAINT commission_settlement_fk FOREIGN KEY(settlement_id,restaurant_id) REFERENCES settlements(id,restaurant_id) ON DELETE RESTRICT,
 ADD CONSTRAINT commission_correction_fk FOREIGN KEY(corrects_entry_id,restaurant_id) REFERENCES commission_entries(id,restaurant_id) ON DELETE RESTRICT,
 ADD CONSTRAINT commission_kind_ck CHECK((kind='base' AND base_order_id IS NOT NULL AND base_order_id=order_id AND amount_vnd>=0 AND reason IS NULL AND evidence_reference IS NULL AND corrects_entry_id IS NULL) OR (kind='adjustment' AND base_order_id IS NULL AND amount_vnd<>0 AND reason IS NOT NULL AND CHAR_LENGTH(TRIM(reason))>0 AND evidence_reference IS NOT NULL AND CHAR_LENGTH(TRIM(evidence_reference))>0)),
 ADD CONSTRAINT commission_assignment_ck CHECK((settlement_id IS NULL AND assigned_at IS NULL) OR (settlement_id IS NOT NULL AND assigned_at IS NOT NULL)),
 ADD CONSTRAINT commission_booking_ck CHECK(DAY(DATE_ADD(booking_month,INTERVAL 7 HOUR))=1 AND TIME(DATE_ADD(booking_month,INTERVAL 7 HOUR))='00:00:00'),
 ADD INDEX commission_booking_idx(restaurant_id,booking_month,id);
ALTER TABLE commission_entries DROP INDEX commission_entries_order_id_key;
CREATE TABLE settlement_receipts (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, settlement_id BIGINT NOT NULL,restaurant_id BIGINT NOT NULL,
 amount_vnd BIGINT NOT NULL, received_at DATETIME(3) NOT NULL, recorded_by BIGINT NOT NULL,
 method VARCHAR(16) NOT NULL, reference VARCHAR(255) NOT NULL, event_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 evidence_reference VARCHAR(255) NOT NULL, note VARCHAR(1000) NULL, replaces_receipt_id BIGINT NULL,
 policy_version VARCHAR(64) NOT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY receipt_restaurant(id,restaurant_id), UNIQUE KEY receipt_settlement(id,settlement_id), UNIQUE KEY receipt_replacement_once(replaces_receipt_id),
 INDEX receipt_event(restaurant_id,event_hash), INDEX receipt_timeline(settlement_id,received_at,id),
 CONSTRAINT receipt_settlement_fk FOREIGN KEY(settlement_id,restaurant_id) REFERENCES settlements(id,restaurant_id) ON DELETE RESTRICT,
 CONSTRAINT receipt_actor_fk FOREIGN KEY(recorded_by) REFERENCES accounts(id) ON DELETE RESTRICT,
 CONSTRAINT receipt_replaces_fk FOREIGN KEY(replaces_receipt_id,restaurant_id) REFERENCES settlement_receipts(id,restaurant_id) ON DELETE RESTRICT,
 CONSTRAINT receipt_amount_ck CHECK(amount_vnd>0),CONSTRAINT receipt_method_ck CHECK(method IN ('cash','bank_transfer')),
 CONSTRAINT receipt_reference_ck CHECK(CHAR_LENGTH(TRIM(reference))>0 AND CHAR_LENGTH(TRIM(evidence_reference))>0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE settlement_receipt_reversals (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, receipt_id BIGINT NOT NULL,settlement_id BIGINT NOT NULL,restaurant_id BIGINT NOT NULL,amount_vnd BIGINT NOT NULL,
 recorded_by BIGINT NOT NULL,reason VARCHAR(1000) NOT NULL,evidence_reference VARCHAR(255) NOT NULL,
 policy_version VARCHAR(64) NOT NULL,created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY receipt_reversed_once(receipt_id),
 CONSTRAINT reversal_receipt_fk FOREIGN KEY(receipt_id,settlement_id) REFERENCES settlement_receipts(id,settlement_id) ON DELETE RESTRICT,
 CONSTRAINT reversal_restaurant_fk FOREIGN KEY(receipt_id,restaurant_id) REFERENCES settlement_receipts(id,restaurant_id) ON DELETE RESTRICT,
 CONSTRAINT reversal_actor_fk FOREIGN KEY(recorded_by) REFERENCES accounts(id) ON DELETE RESTRICT,
 CONSTRAINT reversal_reason_ck CHECK(amount_vnd>0 AND CHAR_LENGTH(TRIM(reason))>0 AND CHAR_LENGTH(TRIM(evidence_reference))>0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE financial_requests (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,actor_id BIGINT NOT NULL,operation VARCHAR(32) NOT NULL,
 idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,request_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 result JSON NULL,entry_id BIGINT NULL,receipt_id BIGINT NULL,reversal_id BIGINT NULL,created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY financial_intent(actor_id,operation,idempotency_key),
 CONSTRAINT financial_actor_fk FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT,
 CONSTRAINT financial_entry_fk FOREIGN KEY(entry_id) REFERENCES commission_entries(id) ON DELETE RESTRICT,
 CONSTRAINT financial_receipt_fk FOREIGN KEY(receipt_id) REFERENCES settlement_receipts(id) ON DELETE RESTRICT,
 CONSTRAINT financial_reversal_fk FOREIGN KEY(reversal_id) REFERENCES settlement_receipt_reversals(id) ON DELETE RESTRICT,
 CONSTRAINT financial_operation_ck CHECK(operation IN ('create_adjustment','record_receipt','reverse_receipt')),
 CONSTRAINT financial_result_ck CHECK((result IS NULL AND entry_id IS NULL AND receipt_id IS NULL AND reversal_id IS NULL) OR (result IS NOT NULL AND ((operation='create_adjustment' AND entry_id IS NOT NULL AND receipt_id IS NULL AND reversal_id IS NULL) OR (operation='record_receipt' AND entry_id IS NULL AND receipt_id IS NOT NULL AND reversal_id IS NULL) OR (operation='reverse_receipt' AND entry_id IS NULL AND receipt_id IS NULL AND reversal_id IS NOT NULL))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
