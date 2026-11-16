-- Run as MySQL root:  sudo mysql < deploy/setup.sql
-- 1) Replace REPLACE_WITH_STRONG_PASSWORD with a real password  (openssl rand -base64 24)
-- 2) Use the same password inside DATABASE_URL in .env

CREATE DATABASE IF NOT EXISTS elipse_kids_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'elipse_user'@'localhost' IDENTIFIED BY 'REPLACE_WITH_STRONG_PASSWORD';

-- Prisma migrate needs to create tables and a temporary "shadow" database in dev;
-- in production (migrate deploy) access to this one database is enough.
GRANT ALL PRIVILEGES ON elipse_kids_db.* TO 'elipse_user'@'localhost';
FLUSH PRIVILEGES;
