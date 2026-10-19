-- Substitute {{database}}, {{runtime}}, {{provision}} with quoted operator-selected
-- identifiers/accounts. Create FRESH users separately. Never run against root or
-- identities inheriting global/database grants or roles. No GRANT OPTION/DDL.
GRANT SELECT ON {{database}}.* TO {{runtime}};
GRANT INSERT ON {{database}}.accounts TO {{runtime}};
GRANT UPDATE (password_hash,display_name,phone,email_verified_at,email_code_hash,email_code_expires_at,email_code_sent_at,email_code_attempts,auth_version,version,updated_at)
 ON {{database}}.accounts TO {{runtime}};
GRANT INSERT, UPDATE ON {{database}}.auth_login_limits TO {{runtime}};
GRANT INSERT, UPDATE ON {{database}}.admin_mfa_limits TO {{runtime}};
GRANT INSERT, UPDATE ON {{database}}.admin_challenges TO {{runtime}};
GRANT UPDATE (last_step,enrolled_at) ON {{database}}.admin_factors TO {{runtime}};
GRANT UPDATE (consumed_at) ON {{database}}.admin_recovery_codes TO {{runtime}};
GRANT INSERT ON {{database}}.audit_logs TO {{runtime}};
-- Operator CLI: no DDL, history deletion or restaurant mutation. SELECT supports
-- protected restore/inventory checks. Runtime cannot create/replace factors.
GRANT SELECT ON {{database}}.* TO {{provision}};
GRANT INSERT, UPDATE ON {{database}}.accounts TO {{provision}};
GRANT INSERT ON {{database}}.admin_authority TO {{provision}};
GRANT INSERT, UPDATE ON {{database}}.admin_factors TO {{provision}};
GRANT INSERT, UPDATE ON {{database}}.admin_recovery_codes TO {{provision}};
GRANT UPDATE ON {{database}}.admin_challenges TO {{provision}};
GRANT INSERT ON {{database}}.admin_operator_requests TO {{provision}};
GRANT INSERT ON {{database}}.audit_logs TO {{provision}};
