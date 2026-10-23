-- Additive DEC-08 compromised-credential gate; no account is inferred compromised.
ALTER TABLE accounts
 ADD COLUMN credentials_blocked BOOLEAN NOT NULL DEFAULT FALSE,
 ADD COLUMN recovery_code_hash CHAR(64) NULL,
 ADD COLUMN recovery_expires_at DATETIME(3) NULL,
 ADD COLUMN recovery_sent_at DATETIME(3) NULL,
 ADD COLUMN recovery_attempts INT UNSIGNED NOT NULL DEFAULT 0,
 ADD CONSTRAINT accounts_credentials_boolean CHECK(credentials_blocked IN(0,1)),
 ADD CONSTRAINT accounts_recovery_pair CHECK((recovery_code_hash IS NULL AND recovery_expires_at IS NULL) OR (recovery_code_hash IS NOT NULL AND recovery_expires_at IS NOT NULL)),
 ADD CONSTRAINT accounts_recovery_attempts CHECK(recovery_attempts<=5);
