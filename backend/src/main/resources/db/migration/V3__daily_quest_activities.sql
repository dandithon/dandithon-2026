CREATE TABLE daily_activities (
    id VARCHAR(160) NOT NULL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    activity_day DATE NOT NULL,
    kind VARCHAR(32) NOT NULL,
    subject_id VARCHAR(64) NOT NULL,
    CONSTRAINT uq_daily_activity UNIQUE (user_id, activity_day, kind, subject_id),
    FOREIGN KEY (user_id) REFERENCES app_users(id)
);
CREATE INDEX idx_daily_activity_progress ON daily_activities(user_id, activity_day, kind);
