#!/usr/bin/env bash
#
# Daily backup for the FITX site: a compressed MySQL dump plus a tarball of the
# uploaded media. Install as a cron job (see DEPLOYMENT.md §8):
#
#   30 2 * * * /var/www/fitx/deploy/backup.sh >> /home/fitx/backups/backup.log 2>&1
#
# Configuration is read from the app's .env (DATABASE_URL, UPLOAD_DIR). Override
# the destination or retention with the environment:
#
#   FITX_BACKUP_DIR=/mnt/backups FITX_BACKUP_KEEP_DAYS=30 deploy/backup.sh
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${FITX_BACKUP_DIR:-$HOME/backups}"
KEEP_DAYS="${FITX_BACKUP_KEEP_DAYS:-14}"
STAMP="$(date +%F)"

mkdir -p "$BACKUP_DIR"

# Load .env (KEY="value" lines) into the environment.
if [[ -f "$APP_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env"
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL is not set (checked .env)}"
UPLOAD_DIR="${UPLOAD_DIR:-uploads}"

# --- Parse mysql://user:pass@host:port/dbname (drop any ?query string) --------
_url="${DATABASE_URL#*://}"
_creds="${_url%%@*}"
_hostpart="${_url#*@}"
DB_USER="${_creds%%:*}"
DB_PASS="${_creds#*:}"
DB_HOSTPORT="${_hostpart%%/*}"
DB_NAME="${_hostpart#*/}"
DB_NAME="${DB_NAME%%\?*}"
DB_HOST="${DB_HOSTPORT%%:*}"
DB_PORT="${DB_HOSTPORT#*:}"
if [[ "$DB_PORT" == "$DB_HOST" ]]; then DB_PORT=3306; fi

DB_FILE="$BACKUP_DIR/fitx-db-$STAMP.sql.gz"
UPLOAD_FILE="$BACKUP_DIR/fitx-uploads-$STAMP.tar.gz"

echo "[$(date -Is)] Dumping database '$DB_NAME' -> $DB_FILE"
MYSQL_PWD="$DB_PASS" mysqldump \
  --single-transaction --quick --routines --triggers --no-tablespaces \
  -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME" | gzip -9 > "$DB_FILE"

if [[ -d "$APP_DIR/$UPLOAD_DIR" ]]; then
  echo "[$(date -Is)] Archiving $UPLOAD_DIR -> $UPLOAD_FILE"
  tar -czf "$UPLOAD_FILE" -C "$APP_DIR" "$UPLOAD_DIR"
else
  echo "[$(date -Is)] No uploads directory yet; skipping media archive."
fi

# --- Prune old backups --------------------------------------------------------
find "$BACKUP_DIR" -maxdepth 1 -name 'fitx-db-*.sql.gz'      -mtime +"$KEEP_DAYS" -print -delete
find "$BACKUP_DIR" -maxdepth 1 -name 'fitx-uploads-*.tar.gz' -mtime +"$KEEP_DAYS" -print -delete

echo "[$(date -Is)] Backup complete. Files in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"
