CREATE TABLE dish_media (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,restaurant_id BIGINT NOT NULL,uploader_id BIGINT NOT NULL,
 object_key VARCHAR(200) COLLATE utf8mb4_bin NOT NULL UNIQUE,content_hash CHAR(64) COLLATE utf8mb4_bin NOT NULL,
 mime_type VARCHAR(32) NOT NULL,size_bytes INT UNSIGNED NOT NULL,width INT UNSIGNED NOT NULL,height INT UNSIGNED NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),cleanup_requested_at DATETIME(3) NULL,deletion_requested_at DATETIME(3) NULL,deleted_at DATETIME(3) NULL,
 INDEX dish_media_restaurant_idx(restaurant_id,id),
 CONSTRAINT dish_media_restaurant_fk FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT dish_media_uploader_fk FOREIGN KEY(uploader_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT dish_media_size_ck CHECK(size_bytes BETWEEN 1 AND 5242880),
 CONSTRAINT dish_media_pixels_ck CHECK(width BETWEEN 1 AND 4096 AND height BETWEEN 1 AND 4096 AND width*height<=16000000),
 CONSTRAINT dish_media_mime_ck CHECK(mime_type IN ('image/png','image/jpeg'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
ALTER TABLE dishes ADD media_asset_id BIGINT NULL,
 ADD CONSTRAINT dish_asset_fk FOREIGN KEY(media_asset_id) REFERENCES dish_media(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE dish_categories ADD version INT UNSIGNED NOT NULL DEFAULT 1,
 ADD CONSTRAINT category_version_ck CHECK(version BETWEEN 1 AND 2147483646);
