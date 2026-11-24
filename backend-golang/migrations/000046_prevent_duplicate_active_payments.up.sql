
CREATE UNIQUE INDEX uq_payments_one_active_per_order
ON payments (order_id)
WHERE status IN ('pending', 'processing');
