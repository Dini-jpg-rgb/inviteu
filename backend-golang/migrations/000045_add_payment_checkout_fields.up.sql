ALTER TABLE payments
    ADD COLUMN checkout_url TEXT,
    ADD COLUMN idempotency_key VARCHAR(100);

-- Satu idempotency key hanya boleh dipakai untuk
-- satu record pembayaran.
CREATE UNIQUE INDEX uq_payments_idempotency_key
    ON payments (idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- ID transaksi eksternal harus unik per provider.
CREATE UNIQUE INDEX uq_payments_provider_transaction
    ON payments (payment_provider, provider_transaction_id)
    WHERE payment_provider IS NOT NULL
      AND provider_transaction_id IS NOT NULL;