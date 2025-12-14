#!/bin/bash

# Database Backup Script for CYMP LMS
# Creates timestamped backup of SQLite database

BACKUP_DIR="./db/backups"
DB_FILE="./.astro/content.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/content_${TIMESTAMP}.db"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Check if database exists
if [ ! -f "$DB_FILE" ]; then
    echo "❌ Database file not found: $DB_FILE"
    exit 1
fi

# Create backup
cp "$DB_FILE" "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database backed up successfully:"
    echo "   $BACKUP_FILE"
    
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "   Size: $SIZE"
    
    # Keep only last 10 backups
    ls -t "${BACKUP_DIR}"/content_*.db | tail -n +11 | xargs -r rm
    echo "   (Old backups cleaned, keeping last 10)"
else
    echo "❌ Backup failed"
    exit 1
fi
