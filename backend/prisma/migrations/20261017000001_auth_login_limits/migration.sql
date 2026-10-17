CREATE TABLE `auth_login_limits` (
  `scope` VARCHAR(16) NOT NULL,
  `subject_hash` CHAR(64) COLLATE utf8mb4_bin NOT NULL,
  `window_start` DATETIME(3) NOT NULL,
  `failure_count` INT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT `auth_login_limits_pkey` PRIMARY KEY (`scope`, `subject_hash`),
  CONSTRAINT `auth_login_limits_count_check` CHECK (`failure_count` <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
