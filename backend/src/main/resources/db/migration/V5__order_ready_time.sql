-- Existing orders keep their legacy 15-second completion; no history is deleted.
ALTER TABLE game_orders ADD COLUMN ready_at TIMESTAMP NULL;
ALTER TABLE game_orders ADD COLUMN eta_model_version VARCHAR(80) NULL;
ALTER TABLE game_orders ADD COLUMN eta_seconds_per_minute INTEGER NULL;
UPDATE game_orders SET ready_at = TIMESTAMPADD(SECOND, 15, ordered_at), eta_seconds_per_minute = 60 WHERE ready_at IS NULL;
CREATE INDEX idx_order_store_ready ON game_orders(store_id, ready_at);
