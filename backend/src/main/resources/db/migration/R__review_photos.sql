CREATE TABLE IF NOT EXISTS review_photos (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL,
    review_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL,
    image_data LONGBLOB NOT NULL
);
