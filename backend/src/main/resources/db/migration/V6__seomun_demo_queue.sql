-- Explicitly seeded fictional tickets; never modify user orders/balances/reviews.
CREATE TABLE seomun_demo_queue (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    menu_id VARCHAR(64) NOT NULL,
    quantity INTEGER NOT NULL,
    preparation_minutes DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP NOT NULL,
    ready_at TIMESTAMP NOT NULL,
    model_version VARCHAR(80) NOT NULL
);
CREATE INDEX idx_demo_queue_ready ON seomun_demo_queue(ready_at);
