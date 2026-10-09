
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_reference_id BIGINT,
    item_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(15,2) NOT NULL,
    subtotal NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CONSTRAINT check_order_items_type
        CHECK (
            item_type IN (
                'package',
                'template',
                'addon',
                'custom_service'
            )
        ),

    CONSTRAINT check_order_items_quantity
        CHECK (quantity > 0),

    CONSTRAINT check_order_items_unit_price
        CHECK (unit_price >= 0),

    CONSTRAINT check_order_items_subtotal
        CHECK (subtotal >= 0)
);

CREATE INDEX idx_order_items_order_id
    ON order_items(order_id);

CREATE INDEX idx_order_items_item_type
    ON order_items(item_type);