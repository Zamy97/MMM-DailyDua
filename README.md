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

Audio is bundled in this repo (`audio/morning-adhkar.m4a`, `audio/evening-adhkar.m4a`).  
Playback is scheduled with **cron**, not MagicMirror config.

#### How to set location (don’t forget)

Evening timing needs the **house lat/lon** (same numbers as prayer times / weather).

1. Get coordinates for the house (from `config.js`, or [latlong.net](https://www.latlong.net/)).
2. Install mpv once: `sudo apt-get install -y mpv`
3. Run (replace with that house’s values):

```bash
cd ~/MagicMirror/modules/MMM-DailyDua
git pull
bash scripts/install-cron.sh \
  --lat YOUR_LAT \
  --lon YOUR_LON \
  --morning 7:15 \
  --offset 40
```

| Flag | What it sets |
|------|----------------|
| `--lat` / `--lon` | Location used to estimate **sunset** for evening adhkar |
| `--morning` | Clock time for morning adhkar (e.g. `7:15`) |
| `--offset` | Minutes **before sunset** to play evening adhkar (default `40`) |

Re-run the same command anytime you change house location or morning time — it replaces the old cron block.

House-specific copy-paste commands also live in  
[magicmirror-house-setup](https://github.com/Zamy97/magicmirror-house-setup) → `houses/*/LOCATION.md` and [ADHKAR-AUDIO.md](https://github.com/Zamy97/magicmirror-house-setup/blob/main/ADHKAR-AUDIO.md).

#### Test

```bash
crontab -l
bash scripts/play-adhkar.sh morning
bash scripts/play-adhkar.sh evening
```

Logs: `~/.local/state/mmm-dailydua/cron.log`

Audio sources:

- Morning: [youtube.com/watch?v=P8EIBksC0MA](https://www.youtube.com/watch?v=P8EIBksC0MA)
- Evening: [youtube.com/watch?v=fQUbhEHetks](https://www.youtube.com/watch?v=fQUbhEHetks)

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
