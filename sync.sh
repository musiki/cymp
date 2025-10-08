#!/usr/bin/env bash
set -euo pipefail
SRC="/Users/zztt/My Drive/Obsidian/cym/06-out"
DST="/Users/zztt/My Drive/Obsidian/samples/cymp/src/content"
rsync -av --delete --exclude ".DS_Store" --exclude ".obsidian" "$SRC"/ "$DST"/
echo "Sync OK: $SRC -> $DST"
SH
chmod +x scripts/sync-content.sh