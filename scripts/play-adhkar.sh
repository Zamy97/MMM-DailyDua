#!/usr/bin/env bash
# Play morning or evening adhkar with mpv.
# Usage:
#   play-adhkar.sh morning
#   play-adhkar.sh evening
#   play-adhkar.sh evening-if-due --lat 42.47 --lon -83.01 [--offset 40]

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AUDIO_DIR="$ROOT/audio"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/mmm-dailydua"
mkdir -p "$STATE_DIR"

MODE="${1:-}"
shift || true

LAT=""
LON=""
OFFSET=40

while [[ $# -gt 0 ]]; do
  case "$1" in
    --lat) LAT="$2"; shift 2 ;;
    --lon) LON="$2"; shift 2 ;;
    --offset) OFFSET="$2"; shift 2 ;;
    *) shift ;;
  esac
done

play_file() {
  local file="$1"
  local label="$2"

  if [[ ! -f "$file" ]]; then
    echo "Missing audio file: $file" >&2
    exit 1
  fi

  if ! command -v mpv >/dev/null 2>&1; then
    echo "mpv is required. Install with: sudo apt-get install -y mpv" >&2
    exit 1
  fi

  echo "Playing $label: $file"
  # Only one adhkar at a time
  pkill -f "mpv .*adhkar" 2>/dev/null || true
  exec mpv --no-video --really-quiet "$file"
}

# Sunset minutes from local midnight (approx). Good enough for Maghrib-ish scheduling.
sunset_minutes() {
  local lat="$1" lon="$2"
  python3 - "$lat" "$lon" <<'PY'
import math, sys, datetime
lat = float(sys.argv[1]); lon = float(sys.argv[2])
now = datetime.datetime.now().astimezone()
n = now.timetuple().tm_yday
rad = math.pi / 180
gamma = 2 * math.pi / 365 * (n - 1)
eq = 229.18 * (0.000075 + 0.001868*math.cos(gamma) - 0.032077*math.sin(gamma)
               - 0.014615*math.cos(2*gamma) - 0.040849*math.sin(2*gamma))
decl = (0.006918 - 0.399912*math.cos(gamma) + 0.070257*math.sin(gamma)
        - 0.006758*math.cos(2*gamma) + 0.000907*math.sin(2*gamma)
        - 0.002697*math.cos(3*gamma) + 0.00148*math.sin(3*gamma))
cha = (math.cos(90.833*rad)/(math.cos(lat*rad)*math.cos(decl))
       - math.tan(lat*rad)*math.tan(decl))
if cha < -1 or cha > 1:
    sys.exit("No sunset at this location/date")
ha = math.acos(cha)
# sunset (NOAA): 720 - 4*(lon - HA°) - eqtime
sunset_utc = 720 - 4 * (lon - (ha / rad)) - eq
local = sunset_utc - now.utcoffset().total_seconds() / 60
local = local % (24 * 60)
print(int(round(local)))
PY
}

case "$MODE" in
  morning)
    play_file "$AUDIO_DIR/morning-adhkar.m4a" "morning adhkar"
    ;;
  evening)
    play_file "$AUDIO_DIR/evening-adhkar.m4a" "evening adhkar"
    ;;
  evening-if-due)
    if [[ -z "$LAT" || -z "$LON" ]]; then
      echo "evening-if-due requires --lat and --lon" >&2
      exit 1
    fi
    target=$(( $(sunset_minutes "$LAT" "$LON") - OFFSET ))
    if (( target < 0 )); then target=0; fi
    now_mins=$(( 10#$(date +%H) * 60 + 10#$(date +%M) ))
    today="$(date +%F)"
    stamp_file="$STATE_DIR/evening-played-$today"

    # Play once when current minute matches target (cron should poll every 1–5 min)
    if [[ -f "$stamp_file" ]]; then
      exit 0
    fi
    if (( now_mins == target || (now_mins > target && now_mins <= target + 4) )); then
      touch "$stamp_file"
      play_file "$AUDIO_DIR/evening-adhkar.m4a" "evening adhkar (${OFFSET}m before sunset)"
    fi
    ;;
  *)
    echo "Usage: $0 morning|evening|evening-if-due --lat LAT --lon LON [--offset 40]" >&2
    exit 1
    ;;
esac
