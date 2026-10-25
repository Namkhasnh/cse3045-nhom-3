-- Additive cutover: never reclassify historical methods/statuses or rewrite money facts.
ALTER TABLE order_payments
 MODIFY method ENUM('cash','qr','cod') NOT NULL DEFAULT 'cod',
 MODIFY status ENUM('unpaid','paid','refund_pending','refunded','not_required','not_tracked') NOT NULL DEFAULT 'not_tracked',
 ADD CONSTRAINT order_payments_cod_status CHECK (
   (method='cod' AND status IN ('not_tracked','not_required') AND confirmed_at IS NULL)
   OR (method<>'cod' AND status<>'not_tracked')
 );
ALTER TABLE order_payment_history
 MODIFY from_status ENUM('unpaid','paid','refund_pending','refunded','not_required','not_tracked') NULL,
 MODIFY to_status ENUM('unpaid','paid','refund_pending','refunded','not_required','not_tracked') NOT NULL;
