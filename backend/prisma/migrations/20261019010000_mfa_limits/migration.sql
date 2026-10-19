-- Keep the legacy login quota/check unchanged; MFA has an independent 20-attempt budget.
CREATE TABLE admin_mfa_limits (
 scope VARCHAR(16) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 subject_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 window_start DATETIME(3) NOT NULL, attempt_count INT UNSIGNED NOT NULL DEFAULT 0,
 PRIMARY KEY(scope,subject_hash),
 CONSTRAINT admin_mfa_limits_count_check CHECK(attempt_count<=20)
) ENGINE=InnoDB;
