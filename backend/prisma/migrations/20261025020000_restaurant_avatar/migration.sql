-- Keep existing covers untouched; avatars are optional and scoped to their restaurant.
ALTER TABLE restaurants ADD COLUMN avatar_media_asset_id BIGINT NULL,
 ADD CONSTRAINT restaurant_avatar_asset_fk FOREIGN KEY(avatar_media_asset_id,id)
 REFERENCES restaurant_cover_media(id,restaurant_id) ON DELETE RESTRICT ON UPDATE RESTRICT;
