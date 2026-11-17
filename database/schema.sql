-- Tower of Hanoi leaderboard database
-- Import with phpMyAdmin (Import tab) or: mysql -u root < database/schema.sql

CREATE DATABASE IF NOT EXISTS hanoi_game
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hanoi_game;

CREATE TABLE IF NOT EXISTS scores (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  player_name  VARCHAR(20)  NOT NULL,
  disks        TINYINT UNSIGNED NOT NULL,
  moves        INT UNSIGNED NOT NULL,
  time_seconds INT UNSIGNED NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rank (disks, moves, time_seconds)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS daily_scores (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  player_name    VARCHAR(20)  NOT NULL,
  challenge_date DATE         NOT NULL,
  disks          TINYINT UNSIGNED NOT NULL,
  moves          INT UNSIGNED NOT NULL,
  time_seconds   INT UNSIGNED NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_daily_rank (challenge_date, moves, time_seconds)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
