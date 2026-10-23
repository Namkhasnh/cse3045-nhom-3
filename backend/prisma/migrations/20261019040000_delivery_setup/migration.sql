CREATE TABLE setup_requests (
 actor_id BIGINT NOT NULL, operation VARCHAR(64) COLLATE utf8mb4_bin NOT NULL,
 request_key VARCHAR(128) COLLATE utf8mb4_bin NOT NULL, request_hash CHAR(64) COLLATE utf8mb4_bin NOT NULL,
 result JSON NULL, created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(actor_id,operation,request_key), CONSTRAINT setup_request_actor_fk FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE delivery_proposals (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,restaurant_id BIGINT NOT NULL,actor_id BIGINT NOT NULL,
 policy_version INT UNSIGNED NOT NULL,location_hash CHAR(64) COLLATE utf8mb4_bin NOT NULL,payload JSON NOT NULL,
 status VARCHAR(16) NOT NULL DEFAULT 'submitted',version INT UNSIGNED NOT NULL DEFAULT 1,created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 INDEX delivery_proposal_restaurant_idx(restaurant_id,id),
 CONSTRAINT delivery_proposal_restaurant_fk FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT delivery_proposal_actor_fk FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT delivery_proposal_status_ck CHECK(status IN ('submitted','approved','rejected')),
 CONSTRAINT delivery_proposal_version_ck CHECK(version BETWEEN 1 AND 2147483646)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE delivery_reviews (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,proposal_id BIGINT NOT NULL UNIQUE,actor_id BIGINT NOT NULL,
 decision VARCHAR(16) NOT NULL,note VARCHAR(1000) NOT NULL,created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT delivery_review_proposal_fk FOREIGN KEY(proposal_id) REFERENCES delivery_proposals(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT delivery_review_actor_fk FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT delivery_review_decision_ck CHECK(decision IN ('approved','rejected')),
 CONSTRAINT delivery_review_note_ck CHECK(CHAR_LENGTH(TRIM(note))>0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE delivery_quotes (
 token_hash CHAR(64) COLLATE utf8mb4_bin NOT NULL PRIMARY KEY,restaurant_id BIGINT NOT NULL,payload JSON NOT NULL,
 expires_at DATETIME(3) NOT NULL,created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),INDEX delivery_quote_expiry_idx(expires_at),
 CONSTRAINT delivery_quote_restaurant_fk FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT delivery_quote_expiry_ck CHECK(expires_at>created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
ALTER TABLE restaurant_pickup_rates
 ADD verified_location_hash CHAR(64) COLLATE utf8mb4_bin NULL,
 ADD verified_point_version INT UNSIGNED NULL,
 ADD approved_proposal_id BIGINT NULL,
 ADD CONSTRAINT pickup_rate_approval_fk FOREIGN KEY(approved_proposal_id) REFERENCES delivery_proposals(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 ADD CONSTRAINT pickup_rate_verification_ck CHECK((verified_location_hash IS NULL AND verified_point_version IS NULL AND approved_proposal_id IS NULL) OR (verified_location_hash IS NOT NULL AND verified_point_version IS NOT NULL AND approved_proposal_id IS NOT NULL));
