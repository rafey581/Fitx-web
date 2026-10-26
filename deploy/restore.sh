#!/usr/bin/env bash
#
# Restore the FITX database (and optionally the uploads folder) from a backup
# produced by deploy/backup.sh. Run during a low-traffic window; this script
# overwrites live data. See DEPLOYMENT.md §11.
#
#   deploy/restore.sh                       # newest DB backup (+ newest uploads if present)
#   deploy/restore.sh DB.sql.gz             # a specific DB dump, keep uploads
#   deploy/restore.sh DB.sql.gz UPLOADS.tar.gz
#
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${FITX_BACKUP_DIR:-$HOME/backups}"

if [[ -f "$APP_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$APP_DIR/.env"
  set +a
fi

: "${DATABASE_URL:?DATABASE_URL is not set (checked .env)}"
UPLOAD_DIR="${UPLOAD_DIR:-uploads}"

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

newest() { ls -t "$BACKUP_DIR"/$1 2>/dev/null | head -n1 || true; }

DB_FILE="${1:-$(newest 'fitx-db-*.sql.gz')}"
UPLOAD_FILE="${2:-$(newest 'fitx-uploads-*.tar.gz')}"

if [[ -z "$DB_FILE" || ! -f "$DB_FILE" ]]; then
  echo "No database backup found in $BACKUP_DIR. Pass one explicitly." >&2
  exit 1
fi

echo "About to OVERWRITE database '$DB_NAME' on $DB_HOST with:"
echo "  DB:      $DB_FILE"
echo "  Uploads: ${UPLOAD_FILE:-(skipped)}"
read -r -p "Type 'yes' to continue: " confirm
[[ "$confirm" == "yes" ]] || { echo "Aborted."; exit 1; }

echo "[$(date -Is)] Restoring database..."
gunzip -c "$DB_FILE" | MYSQL_PWD="$DB_PASS" mysql \
  -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" "$DB_NAME"

if [[ -n "$UPLOAD_FILE" && -f "$UPLOAD_FILE" ]]; then
  echo "[$(date -Is)] Restoring uploads from $UPLOAD_FILE..."
  rm -rf "${APP_DIR:?}/${UPLOAD_DIR:?}"
  tar -xzf "$UPLOAD_FILE" -C "$APP_DIR"
fi

echo "[$(date -Is)] Restore complete. Restart the app:  pm2 restart fitx"
