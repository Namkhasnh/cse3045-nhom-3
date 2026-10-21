-- Nullable history additions do not invent old receipt evidence or food-ready facts.
ALTER TABLE order_payment_history ADD reason VARCHAR(1000) NULL, ADD evidence_reference VARCHAR(2048) NULL;
CREATE TABLE order_food_ready (
 order_id BIGINT NOT NULL PRIMARY KEY,actor_id BIGINT NOT NULL,ready_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),order_version INT UNSIGNED NOT NULL,
 CONSTRAINT order_food_ready_order_fk FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT order_food_ready_actor_fk FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT order_food_ready_version_ck CHECK(order_version BETWEEN 1 AND 2147483647)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
