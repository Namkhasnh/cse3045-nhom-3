-- DEC-08.2026-10-21.v1: additive, no retained identity/snapshot rewrite.
CREATE TABLE account_availability_events (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, account_id BIGINT NOT NULL, actor_id BIGINT NOT NULL,
 is_active BOOLEAN NOT NULL, reason VARCHAR(1000) NOT NULL, version INT UNSIGNED NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY account_availability_version(account_id,version),
 FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CHECK(is_active IN(0,1))
) ENGINE=InnoDB;
CREATE TABLE support_requests (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, order_id BIGINT NOT NULL, creator_id BIGINT NOT NULL, buyer_id BIGINT NOT NULL, restaurant_id BIGINT NOT NULL,
 category VARCHAR(32) NOT NULL, priority VARCHAR(16) NOT NULL, status VARCHAR(32) NOT NULL DEFAULT 'open',
 version INT UNSIGNED NOT NULL DEFAULT 1, followup_id BIGINT NULL, dispute_id BIGINT NULL,
 escalated_at DATETIME(3) NULL, escalation_requested_at DATETIME(3) NULL,
 first_response_at DATETIME(3) NULL, last_admin_update_at DATETIME(3) NULL,
 resolved_at DATETIME(3) NULL, closed_at DATETIME(3) NULL, outcome VARCHAR(32) NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 active_slot TINYINT GENERATED ALWAYS AS (CASE WHEN status IN('resolved','closed') THEN NULL ELSE 1 END) STORED,
 UNIQUE KEY support_active(order_id,creator_id,category,active_slot), KEY support_order(order_id,id), KEY support_creator(creator_id,id), KEY support_status(status,id), KEY support_buyer(buyer_id,id), KEY support_restaurant(restaurant_id,id),
 FOREIGN KEY(buyer_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(order_id,restaurant_id) REFERENCES orders(id,restaurant_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(creator_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(followup_id) REFERENCES support_requests(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(dispute_id) REFERENCES payment_disputes(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CHECK(category IN('delivery','payment_refund','account_access','other')),
 CHECK(priority IN('urgent','normal')),
 CHECK(status IN('open','in_progress','waiting_requester','waiting_partner','resolved','closed')),
 CHECK(outcome IS NULL OR outcome IN('answered','action_recorded','unable_to_resolve'))
) ENGINE=InnoDB;
CREATE TABLE support_messages (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, request_id BIGINT NOT NULL, actor_id BIGINT NOT NULL,
 kind VARCHAR(16) NOT NULL, body TEXT NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), deleted_at DATETIME(3) NULL,
 KEY support_message_request(request_id,id),
 FOREIGN KEY(request_id) REFERENCES support_requests(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CHECK(kind IN('participant','admin','internal','resolution','reason'))
) ENGINE=InnoDB;
CREATE TABLE support_events (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, request_id BIGINT NOT NULL, actor_id BIGINT NOT NULL,
 version INT UNSIGNED NOT NULL, status VARCHAR(32) NOT NULL, action VARCHAR(32) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 UNIQUE KEY support_event_version(request_id,version),
 FOREIGN KEY(request_id) REFERENCES support_requests(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE data_holds (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY, order_id BIGINT NULL, application_id BIGINT NULL,
 actor_id BIGINT NOT NULL, reason VARCHAR(1000) NOT NULL, version INT UNSIGNED NOT NULL DEFAULT 1,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), review_due_at DATETIME(3) NOT NULL,
 released_at DATETIME(3) NULL, released_by BIGINT NULL, release_reason VARCHAR(1000) NULL,
 FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(application_id) REFERENCES restaurant_applications(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(released_by) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 KEY hold_order(order_id,released_at), KEY hold_application(application_id,released_at),
 CHECK((order_id IS NOT NULL AND application_id IS NULL) OR (order_id IS NULL AND application_id IS NOT NULL)),
 CHECK((released_at IS NULL AND released_by IS NULL AND release_reason IS NULL) OR (released_at IS NOT NULL AND released_by IS NOT NULL AND release_reason IS NOT NULL))
) ENGINE=InnoDB;
CREATE TABLE erasure_requests (
 account_id BIGINT NOT NULL PRIMARY KEY, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 acknowledged_at DATETIME(3) NULL, verified_at DATETIME(3) NULL, verified_by BIGINT NULL,
 eligible_at DATETIME(3) NULL, erased_at DATETIME(3) NULL, version INT UNSIGNED NOT NULL DEFAULT 1,
 FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 FOREIGN KEY(verified_by) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;
CREATE TABLE order_private_payloads (
 order_id BIGINT NOT NULL PRIMARY KEY, key_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
 ciphertext TEXT NOT NULL, content_hash CHAR(64) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), deletion_requested_at DATETIME(3) NULL, deleted_at DATETIME(3) NULL,
 FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB;
CREATE INDEX audit_lookup_time ON audit_logs(created_at,id);
