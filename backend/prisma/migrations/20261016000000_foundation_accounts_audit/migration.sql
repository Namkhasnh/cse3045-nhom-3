CREATE TABLE `accounts` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `login_identifier` VARCHAR(191) COLLATE utf8mb4_bin NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'restaurant_owner', 'admin') NOT NULL,
  `display_name` VARCHAR(200) NOT NULL,
  `phone` VARCHAR(32) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `auth_version` INT UNSIGNED NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `accounts_pkey` PRIMARY KEY (`id`),
  CONSTRAINT `accounts_login_identifier_key` UNIQUE (`login_identifier`),
  CONSTRAINT `accounts_auth_version_check` CHECK (`auth_version` >= 1 AND `auth_version` <= 2147483647)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `audit_logs` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `actor_id` BIGINT NOT NULL,
  `action` VARCHAR(64) NOT NULL,
  `target_type` VARCHAR(64) NOT NULL,
  `target_id` BIGINT NOT NULL,
  `changes` JSON NOT NULL,
  `request_id` VARCHAR(128) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT `audit_logs_pkey` PRIMARY KEY (`id`),
  CONSTRAINT `audit_logs_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  INDEX `audit_logs_target_idx` (`target_type`, `target_id`, `created_at`, `id`),
  INDEX `audit_logs_actor_idx` (`actor_id`, `created_at`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
