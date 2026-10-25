-- Forward-only expansion. Historical orders retain their original amounts and payment status.
CREATE TABLE vouchers (
 id BIGINT AUTO_INCREMENT PRIMARY KEY, code VARCHAR(32) COLLATE utf8mb4_bin NOT NULL UNIQUE,
 restaurant_id BIGINT NULL, creator_id BIGINT NOT NULL, funding VARCHAR(16) NOT NULL,
 rate DECIMAL(12,8) NOT NULL, max_discount_vnd BIGINT NOT NULL, min_subtotal_vnd BIGINT NOT NULL,
 starts_at DATETIME(3) NOT NULL, ends_at DATETIME(3) NOT NULL,
 total_limit INT UNSIGNED NOT NULL, per_account_limit INT UNSIGNED NOT NULL,
 is_active BOOLEAN NOT NULL DEFAULT TRUE, version INT UNSIGNED NOT NULL DEFAULT 1,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(restaurant_id) REFERENCES restaurants(id), FOREIGN KEY(creator_id) REFERENCES accounts(id),
 CONSTRAINT voucher_scope CHECK ((funding='platform' AND restaurant_id IS NULL) OR (funding='restaurant' AND restaurant_id IS NOT NULL)),
 CONSTRAINT voucher_money CHECK (rate>0 AND rate<=1 AND max_discount_vnd BETWEEN 1 AND 1000000000000 AND min_subtotal_vnd BETWEEN 0 AND 1000000000000),
 CONSTRAINT voucher_limits CHECK (total_limit BETWEEN 1 AND 2147483646 AND per_account_limit BETWEEN 1 AND total_limit AND version BETWEEN 1 AND 2147483646 AND ends_at>starts_at),
 CONSTRAINT voucher_code CHECK (REGEXP_LIKE(code,'^[A-Z0-9][A-Z0-9_-]{2,31}$','c')),
 INDEX(restaurant_id,id)
) ENGINE=InnoDB;
ALTER TABLE orders ADD COLUMN discount_vnd BIGINT NOT NULL DEFAULT 0,
 ADD COLUMN voucher_snapshot JSON NULL, DROP CHECK order_amounts_chk,
 ADD CONSTRAINT order_amounts_chk CHECK (subtotal_vnd>=0 AND delivery_fee_vnd>=0 AND discount_vnd BETWEEN 0 AND subtotal_vnd AND total_vnd=subtotal_vnd-discount_vnd+delivery_fee_vnd),
 ADD CONSTRAINT order_discount_snapshot CHECK (voucher_snapshot IS NOT NULL OR discount_vnd=0);
CREATE TABLE voucher_redemptions (
 order_id BIGINT PRIMARY KEY, voucher_id BIGINT NOT NULL, buyer_id BIGINT NOT NULL, discount_vnd BIGINT NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 FOREIGN KEY(order_id) REFERENCES orders(id), FOREIGN KEY(voucher_id) REFERENCES vouchers(id), FOREIGN KEY(buyer_id) REFERENCES accounts(id),
 CHECK(discount_vnd>=0), INDEX(voucher_id,buyer_id)
) ENGINE=InnoDB;
ALTER TABLE order_payments MODIFY status ENUM('unpaid','paid','refund_pending','refunded','not_required') NOT NULL DEFAULT 'unpaid';
ALTER TABLE order_payment_history MODIFY from_status ENUM('unpaid','paid','refund_pending','refunded','not_required') NULL,
 MODIFY to_status ENUM('unpaid','paid','refund_pending','refunded','not_required') NOT NULL;
ALTER TABLE commission_entries ADD COLUMN subsidy_order_id BIGINT NULL,
 ADD UNIQUE KEY commission_subsidy_order_unique(subsidy_order_id),
 ADD CONSTRAINT commission_subsidy_order_fk FOREIGN KEY(subsidy_order_id,restaurant_id) REFERENCES orders(id,restaurant_id),
 DROP CHECK commission_kind_ck,
 ADD CONSTRAINT commission_kind_ck CHECK (
 (kind='base' AND base_order_id IS NOT NULL AND base_order_id=order_id AND subsidy_order_id IS NULL AND amount_vnd>=0 AND reason IS NULL AND evidence_reference IS NULL AND corrects_entry_id IS NULL) OR
 (kind='adjustment' AND base_order_id IS NULL AND subsidy_order_id IS NULL AND amount_vnd<>0 AND reason IS NOT NULL AND CHAR_LENGTH(TRIM(reason))>0 AND evidence_reference IS NOT NULL AND CHAR_LENGTH(TRIM(evidence_reference))>0) OR
 (kind='voucher_subsidy' AND base_order_id IS NULL AND subsidy_order_id IS NOT NULL AND subsidy_order_id=order_id AND amount_vnd<0 AND reason IS NOT NULL AND evidence_reference IS NULL AND corrects_entry_id IS NULL));
