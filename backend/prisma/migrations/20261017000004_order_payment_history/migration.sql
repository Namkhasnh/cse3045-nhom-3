CREATE TABLE `order_payment_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT NOT NULL,
  `payment_version` INT UNSIGNED NOT NULL,
  `from_status` ENUM('unpaid', 'paid', 'refund_pending', 'refunded') NULL,
  `to_status` ENUM('unpaid', 'paid', 'refund_pending', 'refunded') NOT NULL,
  `actor_id` BIGINT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `order_payment_history_order_id_payment_version_key` (`order_id`, `payment_version`),
  INDEX `order_payment_history_actor_id_idx` (`actor_id`),
  CONSTRAINT `order_payment_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_payment_history_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
