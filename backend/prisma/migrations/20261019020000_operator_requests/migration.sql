CREATE TABLE admin_operator_requests (
 request_id VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 account_id BIGINT NOT NULL, operation VARCHAR(16) NOT NULL, request_hash CHAR(64) NOT NULL,
 created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
 CONSTRAINT admin_operator_requests_account_fk FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
 CONSTRAINT admin_operator_requests_operation_check CHECK(operation IN ('initialize','recover'))
) ENGINE=InnoDB;
