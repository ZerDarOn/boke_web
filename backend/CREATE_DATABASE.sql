-- INK.SPIRIT Blog - Database Creation Script
-- Run this with: psql -U postgres -f create_database.sql

-- Create database
CREATE DATABASE ink_spirit_db;

-- Grant all privileges to postgres user
GRANT ALL PRIVILEGES ON DATABASE ink_spirit_db TO postgres;

-- Exit
\q
