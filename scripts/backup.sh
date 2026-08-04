#!/bin/bash
# Backup database script

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/eve_db_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Creating database backup..."

# Dump database
docker-compose exec -T db pg_dump -U ${DATABASE_USER:-eve_user} ${DATABASE_NAME:-eve_db} > $BACKUP_FILE

echo "Backup created: $BACKUP_FILE"

# Keep only last 10 backups
echo "Cleaning up old backups..."
ls -t $BACKUP_DIR/*.sql | tail -n +11 | xargs rm -f 2>/dev/null || true

echo "Backup completed successfully!"
