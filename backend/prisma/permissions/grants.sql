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
-- V0.3 onboarding: consent/payload/history remain immutable to runtime.
GRANT INSERT ON {{database}}.onboarding_evidence TO {{runtime}};
GRANT UPDATE (deletion_requested_at,deleted_at) ON {{database}}.onboarding_evidence TO {{runtime}};
GRANT INSERT ON {{database}}.restaurant_applications TO {{runtime}};
GRANT UPDATE (status,consent_at,reviewed_at,restaurant_id,version) ON {{database}}.restaurant_applications TO {{runtime}};
GRANT INSERT ON {{database}}.application_reviews TO {{runtime}};
GRANT INSERT ON {{database}}.onboarding_requests TO {{runtime}};
GRANT UPDATE (result) ON {{database}}.onboarding_requests TO {{runtime}};
GRANT INSERT ON {{database}}.restaurants TO {{runtime}};
-- No runtime writes to partnership_terms_versions, payload/terms fields, reviews,
-- successful intent hashes/keys or evidence object identity. Production adoption
-- and cooperation termination require their separately reviewed operator workflow.

-- P11: owning restaurant workflow alone derives readiness. HTTP rejects direct writes.
GRANT UPDATE (name,address,contact_phone,latitude,longitude,location_version,is_active,is_accepting_orders,readiness,version,updated_at) ON {{database}}.restaurants TO {{runtime}};
GRANT INSERT, DELETE ON {{database}}.restaurant_hours TO {{runtime}};

-- P12 proposals remain immutable except lifecycle status/version.
GRANT INSERT ON {{database}}.setup_requests TO {{runtime}};
GRANT UPDATE (result) ON {{database}}.setup_requests TO {{runtime}};
GRANT INSERT ON {{database}}.delivery_proposals TO {{runtime}};
GRANT UPDATE (status,version) ON {{database}}.delivery_proposals TO {{runtime}};
GRANT INSERT ON {{database}}.delivery_reviews TO {{runtime}};
GRANT INSERT ON {{database}}.delivery_quotes TO {{runtime}};
GRANT INSERT, UPDATE ON {{database}}.delivery_policies TO {{runtime}};
GRANT INSERT, UPDATE ON {{database}}.restaurant_pickup_rates TO {{runtime}};
GRANT INSERT, UPDATE ON {{database}}.pickup_points TO {{runtime}};

-- P13 scoped menu/media writes. Object identity and image history are immutable.
GRANT INSERT, DELETE ON {{database}}.dishes TO {{runtime}};
GRANT UPDATE (name,description,price_vnd,category_id,image_reference,media_asset_id,is_visible,is_available,version,updated_at) ON {{database}}.dishes TO {{runtime}};
GRANT INSERT ON {{database}}.dish_categories TO {{runtime}};
GRANT UPDATE (name,version) ON {{database}}.dish_categories TO {{runtime}};
GRANT INSERT ON {{database}}.dish_media TO {{runtime}};
GRANT UPDATE (cleanup_requested_at,deletion_requested_at,deleted_at) ON {{database}}.dish_media TO {{runtime}};

-- P14 agreed commercial policy. Terms/rate/hash and consent are append-only.
GRANT INSERT ON {{database}}.commission_proposals TO {{runtime}};
GRANT UPDATE (status,version) ON {{database}}.commission_proposals TO {{runtime}};
GRANT INSERT ON {{database}}.commission_acceptances TO {{runtime}};
GRANT INSERT ON {{database}}.commission_policies TO {{runtime}};
GRANT UPDATE (rate,accepted_proposal_id,version,updated_at) ON {{database}}.commission_policies TO {{runtime}};

-- P15 cash aggregate. Snapshots/items/history and successful keys are immutable.
GRANT INSERT ON {{database}}.orders TO {{runtime}};
GRANT INSERT ON {{database}}.order_items TO {{runtime}};
GRANT INSERT ON {{database}}.order_status_history TO {{runtime}};
GRANT INSERT ON {{database}}.order_payments TO {{runtime}};
GRANT INSERT ON {{database}}.order_payment_history TO {{runtime}};
GRANT INSERT ON {{database}}.order_requests TO {{runtime}};
GRANT UPDATE (order_id) ON {{database}}.order_requests TO {{runtime}};

-- P17 state changes are separate from immutable accepted snapshots.
GRANT UPDATE (status,version,updated_at,completed_at) ON {{database}}.orders TO {{runtime}};
GRANT INSERT ON {{database}}.order_food_ready TO {{runtime}};
GRANT UPDATE (status,version,updated_at,confirmed_by,confirmed_at) ON {{database}}.order_payments TO {{runtime}};
GRANT INSERT ON {{database}}.commission_entries TO {{runtime}};

-- P20 append-only payment facts with scoped lifecycle/deletion columns only.
GRANT INSERT ON {{database}}.payment_images TO {{runtime}};
GRANT INSERT ON {{database}}.payment_qr_proposals TO {{runtime}};
GRANT INSERT ON {{database}}.payment_qr_config TO {{runtime}};
GRANT INSERT ON {{database}}.payment_instructions TO {{runtime}};
GRANT INSERT ON {{database}}.payment_receipts TO {{runtime}};
GRANT INSERT ON {{database}}.payment_refunds TO {{runtime}};
GRANT INSERT ON {{database}}.payment_claims TO {{runtime}};
GRANT INSERT ON {{database}}.payment_disputes TO {{runtime}};
GRANT UPDATE (active_id,version) ON {{database}}.payment_qr_config TO {{runtime}};
GRANT UPDATE (status,version,reviewed_by,reason,qr_version) ON {{database}}.payment_qr_proposals TO {{runtime}};
GRANT UPDATE (order_id,deletion_requested_at,deleted_at) ON {{database}}.payment_images TO {{runtime}};
GRANT UPDATE (status,refunded_at,recorded_at,actor_id,evidence_id,transaction_reference,transaction_hash,event_hash) ON {{database}}.payment_refunds TO {{runtime}};
GRANT UPDATE (status,version,resolution_note,resolved_by,resolved_at) ON {{database}}.payment_disputes TO {{runtime}};

-- P23: immutable financial facts, only one-time assignment/result links are mutable.
GRANT INSERT ON {{database}}.settlements TO {{runtime}};
GRANT INSERT ON {{database}}.settlement_receipts TO {{runtime}};
GRANT INSERT ON {{database}}.settlement_receipt_reversals TO {{runtime}};
GRANT INSERT ON {{database}}.financial_requests TO {{runtime}};
GRANT UPDATE (settlement_id,assigned_at) ON {{database}}.commission_entries TO {{runtime}};
GRANT UPDATE (result,entry_id,receipt_id,reversal_id) ON {{database}}.financial_requests TO {{runtime}};

-- P25 synthetic DEC-08, immutable messages/events except privileged retention maintenance.
GRANT UPDATE (is_active) ON {{database}}.accounts TO {{runtime}};
GRANT INSERT ON {{database}}.account_availability_events TO {{runtime}};
GRANT INSERT ON {{database}}.support_requests TO {{runtime}};
GRANT UPDATE (status,version,updated_at,escalated_at,escalation_requested_at,first_response_at,last_admin_update_at,resolved_at,closed_at,outcome) ON {{database}}.support_requests TO {{runtime}};
GRANT INSERT ON {{database}}.support_messages TO {{runtime}};
GRANT INSERT ON {{database}}.support_events TO {{runtime}};
GRANT INSERT ON {{database}}.data_holds TO {{runtime}};
GRANT UPDATE (released_at,released_by,release_reason,version) ON {{database}}.data_holds TO {{runtime}};
GRANT INSERT ON {{database}}.erasure_requests TO {{runtime}};
GRANT UPDATE (acknowledged_at,verified_at,verified_by,version) ON {{database}}.erasure_requests TO {{runtime}};
GRANT INSERT ON {{database}}.order_private_payloads TO {{runtime}};
-- No runtime personal key deletion, profile anonymization, payload/message cleanup,
-- business snapshot rewrite, audit/event/key deletion. Retention CLI uses a separate
-- synthetic operator identity, never a website-controlled database credential.
GRANT UPDATE (credentials_blocked,recovery_code_hash,recovery_expires_at,recovery_sent_at,recovery_attempts) ON {{database}}.accounts TO {{runtime}};
