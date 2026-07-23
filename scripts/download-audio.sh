#!/usr/bin/env bash
# Optional: re-download morning/evening adhkar if you need to refresh the bundled files.
# The repo already includes audio/morning-adhkar.m4a and audio/evening-adhkar.m4a.
#
# Sources:
#   Morning: https://www.youtube.com/watch?v=P8EIBksC0MA
#   Evening: https://www.youtube.com/watch?v=fQUbhEHetks

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUDIO_DIR="$ROOT/audio"
mkdir -p "$AUDIO_DIR"

command -v yt-dlp >/dev/null || { echo "Install yt-dlp first"; exit 1; }

yt-dlp -f "bestaudio[ext=m4a]/bestaudio" -o "$AUDIO_DIR/morning-adhkar.%(ext)s" \
  "https://www.youtube.com/watch?v=P8EIBksC0MA"
yt-dlp -f "bestaudio[ext=m4a]/bestaudio" -o "$AUDIO_DIR/evening-adhkar.%(ext)s" \
  "https://www.youtube.com/watch?v=fQUbhEHetks"

ls -lh "$AUDIO_DIR"/morning-adhkar.* "$AUDIO_DIR"/evening-adhkar.*
