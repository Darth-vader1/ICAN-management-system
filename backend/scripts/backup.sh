#!/usr/bin/env bash
# Automated PostgreSQL Backup Script for ICAN Management System
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/ican}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${DB_NAME:-ican_platform}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

mkdir -p "${BACKUP_DIR}"

BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting PostgreSQL database backup for ${DB_NAME}..."

PGPASSWORD="${DB_PASSWORD:-}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -F c -b -v -f "${BACKUP_FILE}" "${DB_NAME}"

echo "[$(date)] Backup completed successfully: ${BACKUP_FILE}"

# Retention cleanup: keep backups for last 30 days
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +30 -exec rm -f {} \;
echo "[$(date)] Cleaned up backups older than 30 days."
