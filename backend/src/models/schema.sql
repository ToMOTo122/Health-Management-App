-- ============================================================
-- Database: health_assistant
-- Engine: InnoDB, Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS health_assistant
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE health_assistant;

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE users (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(255)   NOT NULL,
    password    VARCHAR(255)   NOT NULL COMMENT 'bcrypt hashed',
    nickname    VARCHAR(100)   NOT NULL,
    gender      ENUM('male','female','other') DEFAULT NULL,
    age         TINYINT UNSIGNED DEFAULT NULL,
    height_cm   DECIMAL(5,1)   DEFAULT NULL COMMENT '身高(cm)',
    weight_kg   DECIMAL(5,1)   DEFAULT NULL COMMENT '体重(kg)',
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 2. health_goals
-- ============================================================
CREATE TABLE health_goals (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED   NOT NULL,
    sleep_hours     DECIMAL(3,1)   DEFAULT 8.0   COMMENT '每日睡眠目标(小时)',
    steps_daily     INT UNSIGNED   DEFAULT 10000  COMMENT '每日步数目标',
    water_ml        INT UNSIGNED   DEFAULT 2000   COMMENT '每日饮水目标(ml)',
    exercise_min    INT UNSIGNED   DEFAULT 30     COMMENT '每日运动目标(分钟)',
    calories_kcal   INT UNSIGNED   DEFAULT 2000   COMMENT '每日热量目标(kcal)',
    updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE INDEX idx_user_id (user_id),
    CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 3. sleep_records
-- ============================================================
CREATE TABLE sleep_records (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED   NOT NULL,
    record_date DATE           NOT NULL,
    sleep_time  TIME           NOT NULL COMMENT '入睡时间',
    wake_time   TIME           DEFAULT NULL COMMENT '起床时间',
    duration_h  DECIMAL(3,1)   NOT NULL COMMENT '睡眠时长(小时)',
    quality     ENUM('good','fair','poor') NOT NULL DEFAULT 'good',
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_date (user_id, record_date),
    CONSTRAINT fk_sleep_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 4. steps_records
-- ============================================================
CREATE TABLE steps_records (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED   NOT NULL,
    record_date DATE           NOT NULL,
    steps       INT UNSIGNED   NOT NULL,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE INDEX idx_user_date (user_id, record_date),
    CONSTRAINT fk_steps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 5. water_records
-- ============================================================
CREATE TABLE water_records (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED   NOT NULL,
    record_date DATE           NOT NULL,
    amount_ml   INT UNSIGNED   NOT NULL COMMENT '饮水量(ml)',
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_date (user_id, record_date),
    CONSTRAINT fk_water_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 6. exercise_records
-- ============================================================
CREATE TABLE exercise_records (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED   NOT NULL,
    record_date   DATE           NOT NULL,
    exercise_type VARCHAR(100)   NOT NULL COMMENT '运动类型',
    duration_min  INT UNSIGNED   NOT NULL COMMENT '时长(分钟)',
    calories_kcal INT UNSIGNED   DEFAULT 0 COMMENT '消耗热量(kcal)',
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_date (user_id, record_date),
    CONSTRAINT fk_exercise_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 7. diet_records
-- ============================================================
CREATE TABLE diet_records (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED   NOT NULL,
    record_date   DATE           NOT NULL,
    food_name     VARCHAR(255)   NOT NULL COMMENT '食物名称',
    meal_time     TIME           NOT NULL COMMENT '摄入时间',
    calories_kcal INT UNSIGNED   NOT NULL COMMENT '热量(kcal)',
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_date (user_id, record_date),
    CONSTRAINT fk_diet_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 8. stress_records
-- ============================================================
CREATE TABLE stress_records (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED   NOT NULL,
    record_date DATE           NOT NULL,
    level       ENUM('low','medium','high') NOT NULL,
    score       TINYINT UNSIGNED NOT NULL COMMENT '压力评分 1-10',
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_date (user_id, record_date),
    CONSTRAINT fk_stress_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 9. cycle_records (menstrual cycle, sensitive data)
-- ============================================================
CREATE TABLE cycle_records (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED   NOT NULL,
    start_date    DATE           NOT NULL COMMENT '周期开始日期',
    end_date      DATE           DEFAULT NULL COMMENT '周期结束日期',
    cycle_length  INT UNSIGNED   DEFAULT NULL COMMENT '周期长度(天)',
    notes         TEXT           DEFAULT NULL COMMENT '备注(仅本人可见)',
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_date (user_id, start_date),
    CONSTRAINT fk_cycle_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 10. reminders (user-configured reminders)
-- ============================================================
CREATE TABLE reminders (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED   NOT NULL,
    type        ENUM('water','sleep','exercise','record') NOT NULL,
    time_of_day TIME           NOT NULL COMMENT '提醒时间 HH:MM',
    is_active   TINYINT(1)     NOT NULL DEFAULT 1,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_user_active (user_id, is_active),
    CONSTRAINT fk_reminder_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 11. goal_achievements (track when goals are met, for FR17)
-- ============================================================
CREATE TABLE goal_achievements (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED   NOT NULL,
    goal_type   ENUM('sleep','steps','water','exercise','calories') NOT NULL,
    achieved_on DATE           NOT NULL COMMENT '达标日期',
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_date (user_id, achieved_on),
    CONSTRAINT fk_achievement_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- 12. chat_history (persist chat messages)
-- ============================================================
CREATE TABLE chat_history (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED   NOT NULL,
    role        ENUM('user','assistant') NOT NULL,
    content     TEXT           NOT NULL,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_time (user_id, created_at),
    CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
