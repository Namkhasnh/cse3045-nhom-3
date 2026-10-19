CREATE TABLE `restaurants` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `owner_id` BIGINT NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `address` VARCHAR(1000) NOT NULL,
  `contact_phone` VARCHAR(32) NOT NULL,
  `latitude` DECIMAL(9,6) NULL,
  `longitude` DECIMAL(10,6) NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT true,
  `is_accepting_orders` BOOLEAN NOT NULL DEFAULT false,
  `version` INTEGER UNSIGNED NOT NULL DEFAULT 1,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `restaurants_owner_id_id_idx` (`owner_id`, `id`),
  INDEX `restaurants_is_active_name_id_idx` (`is_active`, `name`, `id`),
  CONSTRAINT `restaurants_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `accounts` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `restaurants_coordinates_check` CHECK (
    (`latitude` IS NULL AND `longitude` IS NULL) OR
    (`latitude` IS NOT NULL AND `longitude` IS NOT NULL AND `latitude` BETWEEN -90 AND 90 AND `longitude` BETWEEN -180 AND 180)),
  CONSTRAINT `restaurants_version_check` CHECK (`version` BETWEEN 1 AND 2147483647),
  CONSTRAINT `restaurants_name_check` CHECK (CHAR_LENGTH(TRIM(`name`)) > 0),
  CONSTRAINT `restaurants_address_check` CHECK (CHAR_LENGTH(TRIM(`address`)) > 0)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
