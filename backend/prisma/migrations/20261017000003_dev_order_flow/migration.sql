-- CreateTable
CREATE TABLE `restaurants` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `owner_id` BIGINT NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `address` VARCHAR(1000) NOT NULL,
    `contact_phone` VARCHAR(32) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `is_accepting_orders` BOOLEAN NOT NULL DEFAULT false,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurant_hours` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `restaurant_id` BIGINT NOT NULL,
    `weekday` TINYINT UNSIGNED NOT NULL,
    `opens_at` VARCHAR(8) NOT NULL,
    `closes_at` VARCHAR(8) NOT NULL,
    `closes_next_day` BOOLEAN NOT NULL DEFAULT false,

    INDEX `restaurant_hours_restaurant_id_weekday_idx`(`restaurant_id`, `weekday`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dish_categories` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `dish_categories_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dishes` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `restaurant_id` BIGINT NOT NULL,
    `category_id` BIGINT NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NOT NULL,
    `price_vnd` BIGINT NOT NULL,
    `image_reference` VARCHAR(2048) NULL,
    `is_visible` BOOLEAN NOT NULL DEFAULT true,
    `is_available` BOOLEAN NOT NULL DEFAULT true,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `dishes_restaurant_id_is_visible_is_available_idx`(`restaurant_id`, `is_visible`, `is_available`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pickup_points` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `latitude` DECIMAL(9, 6) NOT NULL,
    `longitude` DECIMAL(9, 6) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `delivery_policies` (
    `restaurant_id` BIGINT NOT NULL,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`restaurant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `restaurant_pickup_rates` (
    `restaurant_id` BIGINT NOT NULL,
    `pickup_point_id` BIGINT NOT NULL,
    `distance_m` INTEGER UNSIGNED NOT NULL,
    `delivery_fee_vnd` BIGINT NOT NULL,
    `is_enabled` BOOLEAN NOT NULL DEFAULT true,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`restaurant_id`, `pickup_point_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_policies` (
    `restaurant_id` BIGINT NOT NULL,
    `rate` DECIMAL(12, 8) NOT NULL,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`restaurant_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_id` BIGINT NOT NULL,
    `restaurant_id` BIGINT NOT NULL,
    `status` ENUM('pending', 'accepted', 'rejected', 'cancelled', 'delivering', 'completed') NOT NULL DEFAULT 'pending',
    `pickup_point_id` BIGINT NOT NULL,
    `pickup_point_name_snapshot` VARCHAR(200) NOT NULL,
    `recipient_name_snapshot` VARCHAR(200) NOT NULL,
    `recipient_phone_snapshot` VARCHAR(32) NOT NULL,
    `destination_text_snapshot` VARCHAR(1000) NOT NULL,
    `destination_latitude_snapshot` DECIMAL(9, 6) NOT NULL,
    `destination_longitude_snapshot` DECIMAL(9, 6) NOT NULL,
    `distance_m_snapshot` INTEGER UNSIGNED NOT NULL,
    `delivery_quote_snapshot` JSON NOT NULL,
    `subtotal_vnd` BIGINT NOT NULL,
    `delivery_fee_vnd` BIGINT NOT NULL,
    `total_vnd` BIGINT NOT NULL,
    `commission_rate_snapshot` DECIMAL(12, 8) NOT NULL,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `orders_student_id_created_at_id_idx`(`student_id`, `created_at`, `id`),
    INDEX `orders_restaurant_id_status_created_at_id_idx`(`restaurant_id`, `status`, `created_at`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `dish_id` BIGINT NOT NULL,
    `dish_name_snapshot` VARCHAR(200) NOT NULL,
    `unit_price_vnd` BIGINT NOT NULL,
    `quantity` INTEGER UNSIGNED NOT NULL,
    `line_total_vnd` BIGINT NOT NULL,

    UNIQUE INDEX `order_items_order_id_dish_id_key`(`order_id`, `dish_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_status_history` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `order_id` BIGINT NOT NULL,
    `order_version` INTEGER UNSIGNED NOT NULL,
    `from_status` ENUM('pending', 'accepted', 'rejected', 'cancelled', 'delivering', 'completed') NULL,
    `to_status` ENUM('pending', 'accepted', 'rejected', 'cancelled', 'delivering', 'completed') NOT NULL,
    `actor_id` BIGINT NOT NULL,
    `reason` VARCHAR(1000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `order_status_history_order_id_order_version_key`(`order_id`, `order_version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_payments` (
    `order_id` BIGINT NOT NULL,
    `method` ENUM('cash', 'qr') NOT NULL,
    `status` ENUM('unpaid', 'paid', 'refund_pending', 'refunded') NOT NULL DEFAULT 'unpaid',
    `confirmed_by` BIGINT NULL,
    `confirmed_at` DATETIME(3) NULL,
    `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`order_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_requests` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `actor_id` BIGINT NOT NULL,
    `operation` VARCHAR(32) NOT NULL,
    `idempotency_key` VARCHAR(128) NOT NULL,
    `request_hash` CHAR(64) NOT NULL,
    `order_id` BIGINT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `order_requests_order_id_key`(`order_id`),
    UNIQUE INDEX `order_requests_actor_id_operation_idempotency_key_key`(`actor_id`, `operation`, `idempotency_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commission_entries` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `restaurant_id` BIGINT NOT NULL,
    `order_id` BIGINT NOT NULL,
    `kind` VARCHAR(16) NOT NULL,
    `amount_vnd` BIGINT NOT NULL,
    `actor_id` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `commission_entries_order_id_key`(`order_id`),
    INDEX `commission_entries_restaurant_id_created_at_id_idx`(`restaurant_id`, `created_at`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `restaurants` ADD CONSTRAINT `restaurants_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurant_hours` ADD CONSTRAINT `restaurant_hours_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dishes` ADD CONSTRAINT `dishes_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dishes` ADD CONSTRAINT `dishes_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `dish_categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `delivery_policies` ADD CONSTRAINT `delivery_policies_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurant_pickup_rates` ADD CONSTRAINT `restaurant_pickup_rates_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `delivery_policies`(`restaurant_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `restaurant_pickup_rates` ADD CONSTRAINT `restaurant_pickup_rates_pickup_point_id_fkey` FOREIGN KEY (`pickup_point_id`) REFERENCES `pickup_points`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_policies` ADD CONSTRAINT `commission_policies_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_pickup_point_id_fkey` FOREIGN KEY (`pickup_point_id`) REFERENCES `pickup_points`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_dish_id_fkey` FOREIGN KEY (`dish_id`) REFERENCES `dishes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_status_history` ADD CONSTRAINT `order_status_history_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_payments` ADD CONSTRAINT `order_payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_payments` ADD CONSTRAINT `order_payments_confirmed_by_fkey` FOREIGN KEY (`confirmed_by`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_requests` ADD CONSTRAINT `order_requests_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_requests` ADD CONSTRAINT `order_requests_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entries_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `dishes` ADD CONSTRAINT `dishes_price_nonnegative_chk` CHECK (`price_vnd` >= 0);
ALTER TABLE `restaurant_hours` ADD CONSTRAINT `restaurant_hours_weekday_chk` CHECK (`weekday` BETWEEN 1 AND 7);
ALTER TABLE `restaurant_pickup_rates` ADD CONSTRAINT `pickup_rate_values_chk` CHECK (`distance_m` <= 1000000 AND `delivery_fee_vnd` BETWEEN 0 AND 100000000);
ALTER TABLE `commission_policies` ADD CONSTRAINT `commission_rate_nonnegative_chk` CHECK (`rate` >= 0);
ALTER TABLE `orders` ADD CONSTRAINT `order_amounts_chk` CHECK (`subtotal_vnd` >= 0 AND `delivery_fee_vnd` >= 0 AND `total_vnd` = `subtotal_vnd` + `delivery_fee_vnd`);
ALTER TABLE `orders` ADD CONSTRAINT `order_completion_chk` CHECK ((`status` = 'completed' AND `completed_at` IS NOT NULL) OR (`status` <> 'completed' AND `completed_at` IS NULL));
ALTER TABLE `order_items` ADD CONSTRAINT `order_item_amounts_chk` CHECK (`quantity` > 0 AND `unit_price_vnd` >= 0 AND `line_total_vnd` = `unit_price_vnd` * `quantity`);
ALTER TABLE `commission_entries` ADD CONSTRAINT `commission_entry_base_chk` CHECK (`kind` = 'base' AND `amount_vnd` >= 0);

