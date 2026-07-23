# MMM-DailyDua

A [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) module that displays a **daily dua or dhikr** from a local JSON file — no API, works offline.

Arabic, transliteration, English, and Bangla. Morning/evening **adhkar audio** is included in the repo and scheduled with a simple **cron + mpv** setup.

## Features

- **48** authentic duas & adhkar
- **15 morning** + **13 evening** adhkar
- Rotate every **3 hours** by default (`rotationMode: "interval"`)
- Daily rotation (`dayOfYear % total`) or random
- Optional time-based filtering (morning adhkar before 3pm, evening after)
- Category filter: `morning`, `evening`, `dhikr`, `general`, `sleep`, `salah`
- Bangla UI labels + Bangla text when `language: "bn"`
- Bundled morning + evening adhkar audio (`audio/*.m4a`)
- Cron-based playback with **mpv** (morning fixed time, evening ~40 min before sunset from lat/lon)
- Small JSON (~30 KB) — Pi-friendly

## Install

```bash
cd ~/MagicMirror/modules
git clone https://github.com/Zamy97/MMM-DailyDua.git
# or: git pull  (audio files come with the repo)
```

### Adhkar audio (cron + mpv)

Audio sources (bundled under `audio/`):

- Morning: [youtube.com/watch?v=P8EIBksC0MA](https://www.youtube.com/watch?v=P8EIBksC0MA) → `audio/morning-adhkar.m4a`
- Evening: [youtube.com/watch?v=fQUbhEHetks](https://www.youtube.com/watch?v=fQUbhEHetks) → `audio/evening-adhkar.m4a`

1. Install mpv:

```bash
sudo apt-get update
sudo apt-get install -y mpv
```

2. Install cron jobs for your house (set lat/lon + morning time):

```bash
cd ~/MagicMirror/modules/MMM-DailyDua
bash scripts/install-cron.sh --lat 42.4710579 --lon -83.0133362 --morning 7:15 --offset 40
```

That installs:

| Job | Schedule |
|-----|----------|
| Morning adhkar | every day at `7:15` (change with `--morning`) |
| Evening adhkar | checks every 5 minutes; plays once ~`--offset` minutes before sunset for that lat/lon |

3. Test anytime:

```bash
bash scripts/play-adhkar.sh morning
bash scripts/play-adhkar.sh evening
```

Logs: `~/.local/state/mmm-dailydua/cron.log`

## Config (display module)

Add to `config/config.js`:

```js
{
	module: "MMM-DailyDua",
	position: "bottom_bar",
	config: {
		showTitle: true,
		showCategory: true,
		showArabic: true,
		showTransliteration: true,
		showTranslation: true,
		showReference: true,
		showRepeat: true,
		language: "bn",
		rotationMode: "interval",
		rotateEveryHours: 3,
		filterByTime: true,
		morningTime: "05:00",
		eveningTime: "16:00"
	}
}
```

Audio is **not** controlled by MagicMirror config — only by cron (above).

### Morning / evening text schedule

```js
filterByTime: true,
morningTime: "05:00",
eveningTime: "16:00",
strictMorningEvening: true
```

## Config options

| Option | Description | Default |
|--------|-------------|---------|
| `dataFile` | Path to JSON (relative to module) | `data/duas.json` |
| `language` | UI labels: `en` or `bn` | `en` |
| `rotationMode` | `daily`, `interval`, or `random` | `interval` |
| `rotateEveryHours` | Hours between duas when `interval` mode | `3` |
| `category` | Filter by category or `all` | `all` |
| `filterByTime` | Auto morning/evening pool | `false` |
| `morningTime` | Morning adhkar starts (`"HH:MM"`) | `"05:00"` |
| `eveningTime` | Evening adhkar starts (`"HH:MM"`) | `"16:00"` |
| `morningStartHour` | Fallback if `morningTime` omitted | `5` |
| `eveningStartHour` | Fallback if `eveningTime` omitted | `16` |
| `strictMorningEvening` | Only `morning` / `evening` items per window | `true` |
| `timeCheckInterval` | How often to check for window switch (ms) | `60000` |
| `showArabic` | Show Arabic text | `true` |
| `showTransliteration` | Show romanized Arabic | `true` |
| `showTranslation` | Show English/Bangla meaning | `true` |
| `showBangla` | Show Bangla when language is `en` | `true` |
| `showRepeat` | Show repeat count (e.g. 3×) | `true` |
| `bilingual` | Show English under Bangla | `false` |

## License

MIT
