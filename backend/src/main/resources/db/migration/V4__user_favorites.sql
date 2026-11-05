CREATE TABLE user_favorites (
    user_id BIGINT NOT NULL,
    store_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (user_id, store_id),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
);
