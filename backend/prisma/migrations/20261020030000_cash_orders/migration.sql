-- Add only derivable relationship data. Any existing cross-restaurant mismatch fails the FK.
ALTER TABLE orders ADD UNIQUE INDEX orders_id_restaurant_unique(id,restaurant_id);
ALTER TABLE dishes ADD UNIQUE INDEX dishes_id_restaurant_unique(id,restaurant_id);
ALTER TABLE order_items ADD COLUMN restaurant_id BIGINT NULL;
UPDATE order_items i JOIN orders o ON o.id=i.order_id SET i.restaurant_id=o.restaurant_id;
ALTER TABLE order_items MODIFY restaurant_id BIGINT NOT NULL,
 ADD INDEX order_items_order_restaurant_idx(order_id,restaurant_id),
 ADD INDEX order_items_dish_restaurant_idx(dish_id,restaurant_id),
 ADD CONSTRAINT order_items_order_restaurant_fk FOREIGN KEY(order_id,restaurant_id) REFERENCES orders(id,restaurant_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 ADD CONSTRAINT order_items_dish_restaurant_fk FOREIGN KEY(dish_id,restaurant_id) REFERENCES dishes(id,restaurant_id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE order_requests MODIFY idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 MODIFY request_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 ADD CONSTRAINT order_requests_operation_check CHECK(operation='create_order');
