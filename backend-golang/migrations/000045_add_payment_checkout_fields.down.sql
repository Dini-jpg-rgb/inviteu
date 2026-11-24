DROP INDEX IF EXISTS uq_payments_provider_transaction;

DROP INDEX IF EXISTS uq_payments_idempotency_key;

ALTER TABLE payments
    DROP COLUMN IF EXISTS idempotency_key,
    DROP COLUMN IF EXISTS checkout_url;