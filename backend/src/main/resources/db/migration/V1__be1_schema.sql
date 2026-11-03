CREATE TABLE app_users (
    id BIGINT NOT NULL PRIMARY KEY,
    nickname VARCHAR(32) NOT NULL,
    balance BIGINT NOT NULL,
    user_level INTEGER NOT NULL,
    exp BIGINT NOT NULL,
    next_level_exp BIGINT NOT NULL
);
CREATE TABLE equipped_items (
    user_id BIGINT NOT NULL,
    slot VARCHAR(16) NOT NULL,
    equipment_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (user_id, slot),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
);
CREATE TABLE food_progress (
    id VARCHAR(128) NOT NULL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    food_id VARCHAR(64) NOT NULL,
    purchase_count BIGINT NOT NULL,
    CONSTRAINT uq_food_progress UNIQUE (user_id, food_id),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
);
CREATE TABLE purchase_events (
    event_id VARCHAR(128) NOT NULL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    food_id VARCHAR(64) NOT NULL,
    FOREIGN KEY (user_id) REFERENCES app_users(id)
);
