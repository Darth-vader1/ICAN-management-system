-- PostgreSQL Database Setup Script for ICAN Platform
-- Run this script as postgres superuser
psql -U postgres -f setup-database.sql
-- Create the database
CREATE DATABASE ican_platform;

-- Create a dedicated user (optional but recommended for production)
CREATE USER ican_user WITH PASSWORD 'gbolahan258';

-- Grant all privileges on the database to the user
GRANT ALL PRIVILEGES ON DATABASE ican_management_db TO ican_user;

-- Connect to the database
\c ican_platform

-- Grant schema privileges (required for PostgreSQL 15+)
GRANT ALL ON SCHEMA public TO ican_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ican_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ican_user;

-- Set default privileges for future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ican_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ican_user;

-- Display confirmation
SELECT 'Database ican_platform created successfully!' AS status;
SELECT 'User ican_user created and granted privileges' AS status;
