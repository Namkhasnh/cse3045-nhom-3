ALTER TABLE `accounts` ADD COLUMN `version` INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE `accounts` ADD CONSTRAINT `accounts_version_check` CHECK (`version` >= 1 AND `version` <= 2147483647);
