ALTER TABLE `accounts`
  ADD COLUMN `email` VARCHAR(254) COLLATE utf8mb4_bin NULL,
  ADD COLUMN `email_verified_at` DATETIME(3) NULL,
  ADD COLUMN `email_code_hash` CHAR(64) COLLATE ascii_bin NULL,
  ADD COLUMN `email_code_expires_at` DATETIME(3) NULL,
  ADD COLUMN `email_code_sent_at` DATETIME(3) NULL,
  ADD COLUMN `email_code_attempts` INT UNSIGNED NOT NULL DEFAULT 0,
  ADD UNIQUE INDEX `accounts_email_key` (`email`);

CREATE TABLE `account_role_requests` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `account_id` BIGINT NOT NULL,
  `requested_role` ENUM('student', 'restaurant_owner', 'admin') NOT NULL,
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  `requested_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `reviewed_at` DATETIME(3) NULL,
  `reviewed_by` BIGINT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `account_role_requests_account_id_key` (`account_id`),
  INDEX `account_role_requests_status_requested_at_id_idx` (`status`, `requested_at`, `id`),
  CONSTRAINT `account_role_requests_account_id_fkey` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `account_role_requests_reviewed_by_fkey` FOREIGN KEY (`reviewed_by`) REFERENCES `accounts`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `account_role_requests_privileged_chk` CHECK (`requested_role` IN ('restaurant_owner', 'admin'))
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
