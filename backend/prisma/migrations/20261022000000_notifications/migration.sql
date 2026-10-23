-- Additive only. Logical recipients avoid account FK lock inversion when
-- notifications commit after restaurant/application mutations. No backfill.
CREATE TABLE notifications (
 id BIGINT NOT NULL AUTO_INCREMENT,
 recipient_key VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 event_key VARCHAR(160) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 type VARCHAR(64) NOT NULL,
 title VARCHAR(255) NOT NULL,
 body TEXT NOT NULL,
 href VARCHAR(255) NOT NULL,
 restaurant_id BIGINT NULL,
 source_id BIGINT NULL,
 source_version INT UNSIGNED NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 read_at DATETIME(3) NULL,
 PRIMARY KEY(id),
 UNIQUE KEY notification_event_unique(recipient_key,event_key),
 KEY notification_inbox(recipient_key,id),
 KEY notification_unread(recipient_key,read_at,id),
 CONSTRAINT notification_recipient CHECK (recipient_key='admin' OR recipient_key REGEXP '^account:[1-9][0-9]{0,18}$'),
 CONSTRAINT notification_read_time CHECK (read_at IS NULL OR read_at>=created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
