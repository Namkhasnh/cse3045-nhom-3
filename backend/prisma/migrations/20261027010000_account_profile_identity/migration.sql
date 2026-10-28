CREATE TABLE account_avatar_media (
 id BIGINT NOT NULL AUTO_INCREMENT, account_id BIGINT NOT NULL,
 object_key VARCHAR(255) NOT NULL, content_hash CHAR(64) NOT NULL, mime_type VARCHAR(32) NOT NULL,
 size_bytes INT UNSIGNED NOT NULL, width INT UNSIGNED NOT NULL, height INT UNSIGNED NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), cleanup_requested_at DATETIME(3) NULL,
 deletion_requested_at DATETIME(3) NULL, deleted_at DATETIME(3) NULL,
 PRIMARY KEY(id), UNIQUE KEY account_avatar_media_object_key_key(object_key),
 UNIQUE KEY account_avatar_media_account_id_id_key(account_id,id),
 CONSTRAINT account_avatar_media_owner_fk FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT account_avatar_media_image_check CHECK(mime_type='image/jpeg' AND size_bytes BETWEEN 1 AND 5242880 AND width=256 AND height=256),
 CONSTRAINT account_avatar_media_deletion_check CHECK(deleted_at IS NULL OR deletion_requested_at IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE accounts
 ADD COLUMN avatar_media_asset_id BIGINT NULL,
 ADD COLUMN email_change_auth_version INT UNSIGNED NULL,
 ADD COLUMN pending_email VARCHAR(254) NULL,
 ADD COLUMN email_change_id VARCHAR(43) NULL,
 ADD COLUMN email_change_hash CHAR(64) NULL,
 ADD COLUMN email_change_expires_at DATETIME(3) NULL,
 ADD COLUMN email_change_sent_at DATETIME(3) NULL,
 ADD COLUMN email_change_attempts INT UNSIGNED NOT NULL DEFAULT 0,
 ADD CONSTRAINT accounts_avatar_owner_fk FOREIGN KEY(id,avatar_media_asset_id) REFERENCES account_avatar_media(account_id,id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 ADD CONSTRAINT accounts_email_change_attempts_check CHECK(email_change_attempts<=5),
 ADD CONSTRAINT accounts_email_change_pending_check CHECK(
 (email_change_auth_version IS NULL AND pending_email IS NULL AND email_change_id IS NULL AND email_change_hash IS NULL AND email_change_expires_at IS NULL AND email_change_sent_at IS NULL AND email_change_attempts=0)
 OR (email_change_auth_version IS NOT NULL AND pending_email IS NOT NULL AND email_change_id IS NOT NULL AND email_change_hash IS NOT NULL AND email_change_expires_at IS NOT NULL AND email_change_sent_at IS NOT NULL));
