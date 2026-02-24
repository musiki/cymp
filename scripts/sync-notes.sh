#!/bin/bash

SOURCE="/Users/zztt/Library/CloudStorage/GoogleDrive-lucianoazzigotti@gmail.com/My Drive/Obsidian/cym/06-out/"
TARGET="$HOME/projects/26-musiki/src/content/"

rsync -av \
--delete \
--exclude ".DS_Store" \
--exclude ".obsidian" \
"$SOURCE"/  "$TARGET"/