-- Forward expansion only. Operator cutover is a separate, audited transaction.
ALTER TABLE restaurants ADD COLUMN readiness VARCHAR(32) NOT NULL DEFAULT 'setup_required',
 ADD CONSTRAINT restaurants_readiness_check CHECK (readiness IN ('setup_required','ready')),
 ADD UNIQUE KEY restaurants_owner_unique (owner_id);
CREATE TABLE admin_authority (
 id TINYINT UNSIGNED NOT NULL, account_id BIGINT NOT NULL,
 PRIMARY KEY(id), UNIQUE KEY admin_authority_account_id_key(account_id),
 CONSTRAINT admin_authority_singleton CHECK(id=1),
 CONSTRAINT admin_authority_account_fk FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE admin_factors (
 account_id BIGINT NOT NULL PRIMARY KEY, encrypted_secret VARCHAR(512) NOT NULL,
 enrolled_at DATETIME(3) NULL, last_step BIGINT NOT NULL DEFAULT -1,
 CONSTRAINT admin_factors_account_fk FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE admin_challenges (
 id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY, account_id BIGINT NOT NULL,
 auth_version INT UNSIGNED NOT NULL, expires_at DATETIME(3) NOT NULL,
 attempts INT UNSIGNED NOT NULL DEFAULT 0, consumed_at DATETIME(3) NULL,
 INDEX admin_challenges_expires_at_idx(expires_at),
 CONSTRAINT admin_challenges_attempts_check CHECK(attempts<=5),
 CONSTRAINT admin_challenges_account_fk FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE admin_recovery_codes (
 hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY, account_id BIGINT NOT NULL,
 consumed_at DATETIME(3) NULL, INDEX admin_recovery_codes_account_id_idx(account_id),
 CONSTRAINT admin_recovery_codes_account_fk FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
