#!/bin/bash
# Restore database script

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 ./backups/eve_db_backup_20240116_120000.sql"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f $BACKUP_FILE ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring database from: $BACKUP_FILE"

# Restore database
cat $BACKUP_FILE | docker-compose exec -T db psql -U ${DATABASE_USER:-eve_user} ${DATABASE_NAME:-eve_db}

echo "Database restored successfully!"
