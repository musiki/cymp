#!/bin/bash

# Database Restore Script for CYMP LMS
# Restores database from backup

BACKUP_DIR="./db/backups"
DB_FILE="./.astro/content.db"

# List available backups
echo "📦 Available backups:"
ls -lt "${BACKUP_DIR}"/content_*.db 2>/dev/null | head -n 10 | awk '{print NR". "$9" ("$5" bytes, "$6" "$7" "$8")"}'

if [ $? -ne 0 ] || [ ! "$(ls -A ${BACKUP_DIR}/content_*.db 2>/dev/null)" ]; then
    echo "❌ No backups found in ${BACKUP_DIR}"
    exit 1
fi

# Ask which backup to restore
echo ""
read -p "Enter backup number to restore (or 'latest' for most recent): " choice

if [ "$choice" = "latest" ]; then
    BACKUP=$(ls -t "${BACKUP_DIR}"/content_*.db | head -n 1)
else
    BACKUP=$(ls -t "${BACKUP_DIR}"/content_*.db | sed -n "${choice}p")
fi

if [ -z "$BACKUP" ]; then
    echo "❌ Invalid selection"
    exit 1
fi

echo ""
echo "Selected backup: $BACKUP"
read -p "Restore this backup? This will REPLACE current database. (y/N): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Restore cancelled"
    exit 0
fi

# Create backup of current DB before restoring
if [ -f "$DB_FILE" ]; then
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    SAFETY_BACKUP="${BACKUP_DIR}/before_restore_${TIMESTAMP}.db"
    cp "$DB_FILE" "$SAFETY_BACKUP"
    echo "🔒 Current DB backed up to: $SAFETY_BACKUP"
fi

# Restore
cp "$BACKUP" "$DB_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully from:"
    echo "   $BACKUP"
else
    echo "❌ Restore failed"
    exit 1
fi
