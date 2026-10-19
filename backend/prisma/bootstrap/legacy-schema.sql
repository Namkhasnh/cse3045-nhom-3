-- Consolidated legacy schema, not a replay of overlapping historical SQL.

SET FOREIGN_KEY_CHECKS=0;

CREATE TABLE `account_role_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account_id` bigint NOT NULL,
  `requested_role` enum('student','restaurant_owner','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('pending','approved','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `requested_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewed_at` datetime(3) DEFAULT NULL,
  `reviewed_by` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `account_role_requests_account_id_key` (`account_id`),
  KEY `account_role_requests_status_requested_at_id_idx` (`status`,`requested_at`,`id`),
  KEY `account_role_requests_reviewed_by_fkey` (`reviewed_by`),
  CONSTRAINT `account_role_requests_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `account_role_requests_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `account_role_requests_privileged_chk` CHECK ((`requested_role` in (_utf8mb4'restaurant_owner',_utf8mb4'admin')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `accounts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `login_identifier` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('student','restaurant_owner','admin') NOT NULL,
  `display_name` varchar(200) NOT NULL,
  `phone` varchar(32) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `auth_version` int unsigned NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `version` int unsigned NOT NULL DEFAULT '1',
  `email` varchar(254) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `email_verified_at` datetime(3) DEFAULT NULL,
  `email_code_hash` char(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `email_code_expires_at` datetime(3) DEFAULT NULL,
  `email_code_sent_at` datetime(3) DEFAULT NULL,
  `email_code_attempts` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `accounts_login_identifier_key` (`login_identifier`),
  UNIQUE KEY `accounts_email_key` (`email`),
  CONSTRAINT `accounts_auth_version_check` CHECK (((`auth_version` >= 1) and (`auth_version` <= 2147483647))),
  CONSTRAINT `accounts_version_check` CHECK (((`version` >= 1) and (`version` <= 2147483647)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_id` bigint NOT NULL,
  `action` varchar(64) NOT NULL,
  `target_type` varchar(64) NOT NULL,
  `target_id` bigint NOT NULL,
  `changes` json NOT NULL,
  `request_id` varchar(128) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `audit_logs_target_idx` (`target_type`,`target_id`,`created_at`,`id`),
  KEY `audit_logs_actor_idx` (`actor_id`,`created_at`,`id`),
  CONSTRAINT `audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `auth_login_limits` (
  `scope` varchar(16) NOT NULL,
  `subject_hash` char(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `window_start` datetime(3) NOT NULL,
  `failure_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`scope`,`subject_hash`),
  CONSTRAINT `auth_login_limits_count_check` CHECK ((`failure_count` <= 5))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `commission_entries` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint NOT NULL,
  `order_id` bigint NOT NULL,
  `kind` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount_vnd` bigint NOT NULL,
  `actor_id` bigint NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `commission_entries_order_id_key` (`order_id`),
  KEY `commission_entries_restaurant_id_created_at_id_idx` (`restaurant_id`,`created_at`,`id`),
  KEY `commission_entries_actor_id_fkey` (`actor_id`),
  CONSTRAINT `commission_entries_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `commission_entries_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `commission_entries_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `commission_entry_base_chk` CHECK (((`kind` = _utf8mb4'base') and (`amount_vnd` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `commission_policies` (
  `restaurant_id` bigint NOT NULL,
  `rate` decimal(12,8) NOT NULL,
  `version` int unsigned NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`restaurant_id`),
  CONSTRAINT `commission_policies_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `commission_rate_nonnegative_chk` CHECK ((`rate` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `delivery_policies` (
  `restaurant_id` bigint NOT NULL,
  `version` int unsigned NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`restaurant_id`),
  CONSTRAINT `delivery_policies_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `dish_categories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dish_categories_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `dishes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint NOT NULL,
  `category_id` bigint NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `price_vnd` bigint NOT NULL,
  `image_reference` varchar(2048) DEFAULT NULL,
  `is_visible` tinyint(1) NOT NULL DEFAULT '1',
  `is_available` tinyint(1) NOT NULL DEFAULT '1',
  `version` int unsigned NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `dishes_id_restaurant_key` (`id`,`restaurant_id`),
  KEY `dishes_restaurant_id_is_visible_is_available_idx` (`restaurant_id`,`is_visible`,`is_available`),
  KEY `dishes_menu_idx` (`restaurant_id`,`is_visible`,`is_available`,`category_id`,`price_vnd`,`id`),
  KEY `dishes_name_id_idx` (`name`,`id`),
  KEY `dishes_category_fk` (`category_id`),
  CONSTRAINT `dishes_category_fk` FOREIGN KEY (`category_id`) REFERENCES `dish_categories` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `dishes_restaurant_fk` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `dishes_available_check` CHECK ((`is_available` in (0,1))),
  CONSTRAINT `dishes_description_check` CHECK (((char_length(`description`) <= 2000) and (length(`description`) <= 8000))),
  CONSTRAINT `dishes_price_check` CHECK ((`price_vnd` between 0 and 1000000000)),
  CONSTRAINT `dishes_price_nonnegative_chk` CHECK ((`price_vnd` >= 0)),
  CONSTRAINT `dishes_version_check` CHECK ((`version` between 1 and 2147483647)),
  CONSTRAINT `dishes_visible_check` CHECK ((`is_visible` in (0,1)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `dish_id` bigint NOT NULL,
  `dish_name_snapshot` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_price_vnd` bigint NOT NULL,
  `quantity` int unsigned NOT NULL,
  `line_total_vnd` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_items_order_id_dish_id_key` (`order_id`,`dish_id`),
  KEY `order_items_dish_id_fkey` (`dish_id`),
  CONSTRAINT `order_items_dish_id_fkey` FOREIGN KEY (`dish_id`) REFERENCES `dishes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_item_amounts_chk` CHECK (((`quantity` > 0) and (`unit_price_vnd` >= 0) and (`line_total_vnd` = (`unit_price_vnd` * `quantity`))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_payment_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `payment_version` int unsigned NOT NULL,
  `from_status` enum('unpaid','paid','refund_pending','refunded') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` enum('unpaid','paid','refund_pending','refunded') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` bigint NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_payment_history_order_id_payment_version_key` (`order_id`,`payment_version`),
  KEY `order_payment_history_actor_id_idx` (`actor_id`),
  CONSTRAINT `order_payment_history_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_payment_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_payments` (
  `order_id` bigint NOT NULL,
  `method` enum('cash','qr') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('unpaid','paid','refund_pending','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `confirmed_by` bigint DEFAULT NULL,
  `confirmed_at` datetime(3) DEFAULT NULL,
  `version` int unsigned NOT NULL DEFAULT '1',
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`order_id`),
  KEY `order_payments_confirmed_by_fkey` (`confirmed_by`),
  CONSTRAINT `order_payments_confirmed_by_fkey` FOREIGN KEY (`confirmed_by`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_payments_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_requests` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `actor_id` bigint NOT NULL,
  `operation` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `idempotency_key` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `request_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_id` bigint DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_requests_actor_id_operation_idempotency_key_key` (`actor_id`,`operation`,`idempotency_key`),
  UNIQUE KEY `order_requests_order_id_key` (`order_id`),
  CONSTRAINT `order_requests_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_requests_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `order_status_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `order_version` int unsigned NOT NULL,
  `from_status` enum('pending','accepted','rejected','cancelled','delivering','completed') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `to_status` enum('pending','accepted','rejected','cancelled','delivering','completed') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` bigint NOT NULL,
  `reason` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_status_history_order_id_order_version_key` (`order_id`,`order_version`),
  KEY `order_status_history_actor_id_fkey` (`actor_id`),
  CONSTRAINT `order_status_history_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_status_history_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `student_id` bigint NOT NULL,
  `restaurant_id` bigint NOT NULL,
  `status` enum('pending','accepted','rejected','cancelled','delivering','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `pickup_point_id` bigint NOT NULL,
  `pickup_point_name_snapshot` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_name_snapshot` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_phone_snapshot` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination_text_snapshot` varchar(1000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destination_latitude_snapshot` decimal(9,6) NOT NULL,
  `destination_longitude_snapshot` decimal(9,6) NOT NULL,
  `distance_m_snapshot` int unsigned NOT NULL,
  `delivery_quote_snapshot` json NOT NULL,
  `subtotal_vnd` bigint NOT NULL,
  `delivery_fee_vnd` bigint NOT NULL,
  `total_vnd` bigint NOT NULL,
  `commission_rate_snapshot` decimal(12,8) NOT NULL,
  `version` int unsigned NOT NULL DEFAULT '1',
  `completed_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orders_student_id_created_at_id_idx` (`student_id`,`created_at`,`id`),
  KEY `orders_restaurant_id_status_created_at_id_idx` (`restaurant_id`,`status`,`created_at`,`id`),
  KEY `orders_pickup_point_id_fkey` (`pickup_point_id`),
  CONSTRAINT `orders_pickup_point_id_fkey` FOREIGN KEY (`pickup_point_id`) REFERENCES `pickup_points` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `orders_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `orders_student_id_fkey` FOREIGN KEY (`student_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `order_amounts_chk` CHECK (((`subtotal_vnd` >= 0) and (`delivery_fee_vnd` >= 0) and (`total_vnd` = (`subtotal_vnd` + `delivery_fee_vnd`)))),
  CONSTRAINT `order_completion_chk` CHECK ((((`status` = _utf8mb4'completed') and (`completed_at` is not null)) or ((`status` <> _utf8mb4'completed') and (`completed_at` is null))))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `pickup_points` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitude` decimal(9,6) NOT NULL,
  `longitude` decimal(9,6) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `version` int unsigned NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `restaurant_hours` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `restaurant_id` bigint NOT NULL,
  `weekday` tinyint unsigned NOT NULL,
  `opens_at` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `closes_at` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `closes_next_day` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `restaurant_hours_restaurant_id_weekday_idx` (`restaurant_id`,`weekday`),
  CONSTRAINT `restaurant_hours_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `restaurants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `restaurant_hours_weekday_chk` CHECK ((`weekday` between 1 and 7))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `restaurant_pickup_rates` (
  `restaurant_id` bigint NOT NULL,
  `pickup_point_id` bigint NOT NULL,
  `distance_m` int unsigned NOT NULL,
  `delivery_fee_vnd` bigint NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `version` int unsigned NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`restaurant_id`,`pickup_point_id`),
  KEY `restaurant_pickup_rates_pickup_point_id_fkey` (`pickup_point_id`),
  CONSTRAINT `restaurant_pickup_rates_pickup_point_id_fkey` FOREIGN KEY (`pickup_point_id`) REFERENCES `pickup_points` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `restaurant_pickup_rates_restaurant_id_fkey` FOREIGN KEY (`restaurant_id`) REFERENCES `delivery_policies` (`restaurant_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `pickup_rate_values_chk` CHECK (((`distance_m` <= 1000000) and (`delivery_fee_vnd` between 0 and 100000000)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `restaurants` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `owner_id` bigint NOT NULL,
  `name` varchar(200) NOT NULL,
  `address` varchar(1000) NOT NULL,
  `contact_phone` varchar(32) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_accepting_orders` tinyint(1) NOT NULL DEFAULT '0',
  `version` int unsigned NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `latitude` decimal(9,6) DEFAULT NULL,
  `longitude` decimal(10,6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `restaurants_owner_id_id_idx` (`owner_id`,`id`),
  KEY `restaurants_is_active_name_id_idx` (`is_active`,`name`,`id`),
  CONSTRAINT `restaurants_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `restaurants_address_check` CHECK ((char_length(trim(`address`)) > 0)),
  CONSTRAINT `restaurants_coordinates_check` CHECK ((((`latitude` is null) and (`longitude` is null)) or ((`latitude` is not null) and (`longitude` is not null) and (`latitude` between -(90) and 90) and (`longitude` between -(180) and 180)))),
  CONSTRAINT `restaurants_name_check` CHECK ((char_length(trim(`name`)) > 0)),
  CONSTRAINT `restaurants_version_check` CHECK ((`version` between 1 and 2147483647))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS=1;
