#!/usr/bin/env bash
# Download morning + evening adhkar audio for MMM-DailyDua (mpv playback).
# Requires: yt-dlp (https://github.com/yt-dlp/yt-dlp)
#
# Sources:
#   Morning: https://www.youtube.com/watch?v=P8EIBksC0MA
#   Evening: https://www.youtube.com/watch?v=fQUbhEHetks

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUDIO_DIR="$ROOT/audio"
mkdir -p "$AUDIO_DIR"

if ! command -v yt-dlp >/dev/null 2>&1; then
  echo "yt-dlp is required. Install it first, e.g.:"
  echo "  sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp"
  echo "  sudo chmod a+rx /usr/local/bin/yt-dlp"
  exit 1
fi

echo "Downloading morning adhkar..."
yt-dlp -f "bestaudio/best" \
  --extract-audio \
  --audio-format m4a \
  --audio-quality 0 \
  -o "$AUDIO_DIR/morning-adhkar.%(ext)s" \
  "https://www.youtube.com/watch?v=P8EIBksC0MA"

echo "Downloading evening adhkar..."
yt-dlp -f "bestaudio/best" \
  --extract-audio \
  --audio-format m4a \
  --audio-quality 0 \
  -o "$AUDIO_DIR/evening-adhkar.%(ext)s" \
  "https://www.youtube.com/watch?v=fQUbhEHetks"

# Normalize extension if yt-dlp kept the container name
for kind in morning evening; do
  if [[ ! -f "$AUDIO_DIR/${kind}-adhkar.m4a" ]]; then
    found="$(ls -1 "$AUDIO_DIR/${kind}-adhkar."* 2>/dev/null | head -1 || true)"
    if [[ -n "$found" ]]; then
      mv "$found" "$AUDIO_DIR/${kind}-adhkar.m4a"
    fi
  fi
done

echo
echo "Done. Files:"
ls -lh "$AUDIO_DIR"/morning-adhkar.m4a "$AUDIO_DIR"/evening-adhkar.m4a
echo
echo "Also install mpv on the Pi if needed:"
echo "  sudo apt-get install -y mpv"
