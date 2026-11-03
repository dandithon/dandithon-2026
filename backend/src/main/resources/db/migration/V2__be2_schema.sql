CREATE TABLE game_orders (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    store_id VARCHAR(64) NOT NULL,
    store_name VARCHAR(100) NOT NULL,
    request_key VARCHAR(128) NOT NULL,
    request_signature VARCHAR(2048) NOT NULL,
    total_price BIGINT NOT NULL,
    remaining_balance BIGINT NOT NULL,
    ordered_at TIMESTAMP NOT NULL,
    reviewed BOOLEAN NOT NULL,
    CONSTRAINT uq_order_request UNIQUE (user_id, request_key),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
);
CREATE TABLE order_lines (
    order_id VARCHAR(64) NOT NULL,
    line_number INTEGER NOT NULL,
    menu_id VARCHAR(64) NOT NULL,
    menu_name VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL,
    price BIGINT NOT NULL,
    PRIMARY KEY (order_id, line_number),
    FOREIGN KEY (order_id) REFERENCES game_orders(id)
);
CREATE TABLE game_reviews (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    order_id VARCHAR(64) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    store_id VARCHAR(64) NOT NULL,
    author_name VARCHAR(32) NOT NULL,
    rating INTEGER NOT NULL,
    review_text VARCHAR(2000) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (order_id) REFERENCES game_orders(id),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
);
CREATE TABLE review_images (
    review_id VARCHAR(64) NOT NULL,
    image_number INTEGER NOT NULL,
    image_url VARCHAR(2048) NOT NULL,
    PRIMARY KEY (review_id, image_number),
    FOREIGN KEY (review_id) REFERENCES game_reviews(id)
);
CREATE TABLE quest_claims (
    id VARCHAR(128) NOT NULL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES app_users(id)
);
CREATE INDEX idx_order_user_time ON game_orders(user_id, ordered_at);
CREATE INDEX idx_review_store_time ON game_reviews(store_id, created_at);
