#!/usr/bin/env bash
# Install cron jobs for morning + evening adhkar playback.
#
# Usage:
#   bash scripts/install-cron.sh --lat 42.4710579 --lon -83.0133362
#   bash scripts/install-cron.sh --lat 42.47 --lon -83.01 --morning 7:15 --offset 40
#
# Morning plays at a fixed local time (default 07:15).
# Evening polls every 5 minutes and plays once ~40 minutes before sunset
# for the given lat/lon.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLAY="$ROOT/scripts/play-adhkar.sh"
MARKER_BEGIN="# BEGIN MMM-DailyDua adhkar"
MARKER_END="# END MMM-DailyDua adhkar"

LAT=""
LON=""
MORNING="7:15"
OFFSET=40

while [[ $# -gt 0 ]]; do
  case "$1" in
    --lat) LAT="$2"; shift 2 ;;
    --lon) LON="$2"; shift 2 ;;
    --morning) MORNING="$2"; shift 2 ;;
    --offset) OFFSET="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$LAT" || -z "$LON" ]]; then
  echo "Required: --lat and --lon" >&2
  exit 1
fi

if [[ ! -x "$PLAY" ]]; then
  chmod +x "$PLAY"
fi

if [[ ! -f "$ROOT/audio/morning-adhkar.m4a" || ! -f "$ROOT/audio/evening-adhkar.m4a" ]]; then
  echo "Audio files missing under audio/. They should be in the repo after git pull." >&2
  exit 1
fi

if ! command -v mpv >/dev/null 2>&1; then
  echo "Warning: mpv not found. Install with: sudo apt-get install -y mpv" >&2
fi

# Parse morning H:MM -> cron fields
MORNING_H="${MORNING%%:*}"
MORNING_M="${MORNING#*:}"
MORNING_H=$((10#$MORNING_H))
MORNING_M=$((10#$MORNING_M))

LOG_DIR="$HOME/.local/state/mmm-dailydua"
mkdir -p "$LOG_DIR"

BLOCK=$(cat <<EOF
$MARKER_BEGIN
# Morning adhkar at ${MORNING_H}:$(printf '%02d' "$MORNING_M")
$MORNING_M $MORNING_H * * * $PLAY morning >> "$LOG_DIR/cron.log" 2>&1
# Evening adhkar ~${OFFSET}m before sunset (lat=$LAT lon=$LON); check every 5 minutes
*/5 * * * * $PLAY evening-if-due --lat $LAT --lon $LON --offset $OFFSET >> "$LOG_DIR/cron.log" 2>&1
$MARKER_END
EOF
)

EXISTING="$(crontab -l 2>/dev/null || true)"
# Strip previous block if present
CLEANED="$(printf '%s\n' "$EXISTING" | awk -v b="$MARKER_BEGIN" -v e="$MARKER_END" '
  $0 == b {skip=1; next}
  $0 == e {skip=0; next}
  !skip {print}
')"

{
  printf '%s\n' "$CLEANED"
  printf '%s\n' "$BLOCK"
} | crontab -

echo "Installed crontab entries:"
echo "$BLOCK"
echo
echo "Verify with: crontab -l"
echo "Test morning now: $PLAY morning"
echo "Test evening now: $PLAY evening"
