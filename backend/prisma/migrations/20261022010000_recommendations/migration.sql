-- Metadata only. No recommendation inputs, outputs, contacts or transcripts.
CREATE TABLE ai_admission (
 id TINYINT NOT NULL PRIMARY KEY,
 CONSTRAINT ai_admission_singleton CHECK (id=1)
) ENGINE=InnoDB;
INSERT INTO ai_admission(id) VALUES(1);
CREATE TABLE ai_counters (
 subject VARCHAR(80) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 window_key VARCHAR(32) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 used_count INT UNSIGNED NOT NULL DEFAULT 0,
 updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 PRIMARY KEY(subject,window_key), INDEX ai_counter_cleanup(updated_at)
) ENGINE=InnoDB;
CREATE TABLE ai_leases (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 expires_at DATETIME(3) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 finished_at DATETIME(3) NULL,
 outcome VARCHAR(16) CHARACTER SET ascii NULL,
 latency_ms INT UNSIGNED NULL,
 input_tokens INT UNSIGNED NULL,
 output_tokens INT UNSIGNED NULL,
 INDEX ai_lease_expiry(expires_at), INDEX ai_lease_cleanup(created_at)
) ENGINE=InnoDB;
