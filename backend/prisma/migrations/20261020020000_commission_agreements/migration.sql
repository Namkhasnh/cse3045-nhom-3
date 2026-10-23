CREATE TABLE commission_proposals (
 id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,restaurant_id BIGINT NOT NULL,proposer_id BIGINT NOT NULL,base_policy_version INT UNSIGNED NOT NULL,
 rate DECIMAL(12,8) NOT NULL,terms_version VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,terms_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 agreement_text TEXT NOT NULL,agreement_hash CHAR(64) COLLATE utf8mb4_bin NOT NULL,status VARCHAR(16) NOT NULL DEFAULT 'proposed',version INT UNSIGNED NOT NULL DEFAULT 1,
 pending_restaurant_id BIGINT GENERATED ALWAYS AS(CASE WHEN status='proposed' THEN restaurant_id ELSE NULL END) STORED,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),UNIQUE KEY commission_one_pending(pending_restaurant_id),UNIQUE KEY commission_proposal_restaurant_key(id,restaurant_id),INDEX commission_proposal_restaurant_idx(restaurant_id,id),
 CONSTRAINT commission_proposal_restaurant_fk FOREIGN KEY(restaurant_id) REFERENCES restaurants(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT commission_proposer_fk FOREIGN KEY(proposer_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT commission_terms_fk FOREIGN KEY(terms_version,terms_hash) REFERENCES partnership_terms_versions(version,content_hash) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT commission_proposal_rate_ck CHECK(rate BETWEEN 0.03000000 AND 0.05000000),
 CONSTRAINT commission_proposal_status_ck CHECK(status IN ('proposed','accepted','superseded')),
 CONSTRAINT commission_proposal_version_ck CHECK(version BETWEEN 1 AND 2147483646)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
CREATE TABLE commission_acceptances (
 proposal_id BIGINT NOT NULL PRIMARY KEY,restaurant_id BIGINT NOT NULL,actor_id BIGINT NOT NULL,agreement_hash CHAR(64) COLLATE utf8mb4_bin NOT NULL,
 accepted_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),UNIQUE KEY commission_acceptance_restaurant_key(proposal_id,restaurant_id),
 CONSTRAINT commission_acceptance_proposal_fk FOREIGN KEY(proposal_id,restaurant_id) REFERENCES commission_proposals(id,restaurant_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 CONSTRAINT commission_acceptance_actor_fk FOREIGN KEY(actor_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin;
ALTER TABLE commission_policies ADD accepted_proposal_id BIGINT NULL,
 ADD CONSTRAINT commission_policy_consent_fk FOREIGN KEY(accepted_proposal_id,restaurant_id) REFERENCES commission_acceptances(proposal_id,restaurant_id) ON DELETE RESTRICT ON UPDATE RESTRICT,
 ADD CONSTRAINT commission_consented_rate_ck CHECK(accepted_proposal_id IS NULL OR rate BETWEEN 0.03000000 AND 0.05000000);
