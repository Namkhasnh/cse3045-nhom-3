-- An image reference must belong to the same restaurant even under direct SQL.
ALTER TABLE dish_media ADD UNIQUE KEY dish_media_restaurant_key(id,restaurant_id);
ALTER TABLE dishes DROP FOREIGN KEY dish_asset_fk,
 ADD CONSTRAINT dish_asset_restaurant_fk FOREIGN KEY(media_asset_id,restaurant_id)
 REFERENCES dish_media(id,restaurant_id) ON DELETE RESTRICT ON UPDATE RESTRICT;
