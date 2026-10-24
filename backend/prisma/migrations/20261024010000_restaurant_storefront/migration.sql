-- Optional storefront content; existing restaurants keep the default presentation.
CREATE TABLE restaurant_cover_media (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
 restaurant_id BIGINT NOT NULL, uploader_id BIGINT NOT NULL,
 object_key VARCHAR(200) NOT NULL UNIQUE, content_hash CHAR(64) NOT NULL,
 mime_type VARCHAR(32) NOT NULL, size_bytes INT UNSIGNED NOT NULL,
 width INT UNSIGNED NOT NULL, height INT UNSIGNED NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 cleanup_requested_at DATETIME(3) NULL, deletion_requested_at DATETIME(3) NULL, deleted_at DATETIME(3) NULL,
 UNIQUE KEY restaurant_cover_scope_key(id,restaurant_id),
 KEY restaurant_cover_media_restaurant_id_id_idx(restaurant_id,id),
 CONSTRAINT restaurant_cover_restaurant_fk FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT restaurant_cover_uploader_fk FOREIGN KEY(uploader_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT restaurant_cover_image_check CHECK(mime_type IN ('image/jpeg','image/png') AND size_bytes BETWEEN 1 AND 5242880 AND width BETWEEN 1 AND 4096 AND height BETWEEN 1 AND 4096 AND width*height<=16000000)
) ENGINE=InnoDB DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE restaurants ADD COLUMN description TEXT NULL, ADD COLUMN cover_media_asset_id BIGINT NULL,
 ADD CONSTRAINT restaurant_cover_text_check CHECK(description IS NULL OR (CHAR_LENGTH(description)<=2000 AND OCTET_LENGTH(description)<=8000)),
 ADD CONSTRAINT restaurant_cover_asset_fk FOREIGN KEY(cover_media_asset_id,id) REFERENCES restaurant_cover_media(id,restaurant_id) ON DELETE RESTRICT ON UPDATE RESTRICT;
