CREATE TABLE dish_categories (
 id BIGINT NOT NULL AUTO_INCREMENT, name VARCHAR(100) NOT NULL,
 PRIMARY KEY (id), UNIQUE KEY dish_categories_name_key (name)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ENGINE=InnoDB;
INSERT INTO dish_categories (name) VALUES ('Cơm'), ('Bún & phở'), ('Mì'), ('Ăn vặt'), ('Đồ uống'), ('Khác');
CREATE TABLE dishes (
 id BIGINT NOT NULL AUTO_INCREMENT, restaurant_id BIGINT NOT NULL, category_id BIGINT NOT NULL,
 name VARCHAR(200) NOT NULL, description TEXT NOT NULL, price_vnd BIGINT NOT NULL,
 image_reference VARCHAR(2048) NULL, is_visible BOOLEAN NOT NULL DEFAULT TRUE, is_available BOOLEAN NOT NULL DEFAULT TRUE,
 version INT UNSIGNED NOT NULL DEFAULT 1, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL,
 PRIMARY KEY (id), UNIQUE KEY dishes_id_restaurant_key (id, restaurant_id),
 INDEX dishes_menu_idx (restaurant_id, is_visible, is_available, category_id, price_vnd, id),
 INDEX dishes_name_id_idx (name, id), INDEX dishes_category_idx (category_id),
 CONSTRAINT dishes_restaurant_fk FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT dishes_category_fk FOREIGN KEY (category_id) REFERENCES dish_categories(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT dishes_price_check CHECK (price_vnd BETWEEN 0 AND 1000000000),
 CONSTRAINT dishes_visible_check CHECK (is_visible IN (0,1)),
 CONSTRAINT dishes_available_check CHECK (is_available IN (0,1)),
 CONSTRAINT dishes_version_check CHECK (version BETWEEN 1 AND 2147483647),
 CONSTRAINT dishes_description_check CHECK (CHAR_LENGTH(description) <= 2000 AND OCTET_LENGTH(description) <= 8000)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci ENGINE=InnoDB;
