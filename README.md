# MMM-DailyDua

A [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) module that displays a **daily dua or dhikr** from a local JSON file — no API, works offline.

Arabic, transliteration, English, and Bangla. Optional **morning / evening adhkar audio** via `mpv`.

## Features

- **48** authentic duas & adhkar
- **15 morning** + **13 evening** adhkar
- Rotate every **3 hours** by default (`rotationMode: "interval"`)
- Daily rotation (`dayOfYear % total`) or random
- Optional time-based filtering (morning adhkar before 3pm, evening after)
- Category filter: `morning`, `evening`, `dhikr`, `general`, `sleep`, `salah`
- Bangla UI labels + Bangla text when `language: "bn"`
- Falls back to English when Bangla text is missing
- Optional scheduled adhkar audio with **mpv**
- Small JSON (~30 KB) — Pi-friendly

## Install

```bash
cd ~/MagicMirror/modules
git clone https://github.com/Zamy97/MMM-DailyDua.git
```

### Audio playback (optional)

1. Install tools on the Pi:

```bash
sudo apt-get update
sudo apt-get install -y mpv ffmpeg
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

2. Download the morning + evening tracks (from YouTube):

```bash
cd ~/MagicMirror/modules/MMM-DailyDua
bash scripts/download-audio.sh
```

Sources:

- Morning: [youtube.com/watch?v=P8EIBksC0MA](https://www.youtube.com/watch?v=P8EIBksC0MA)
- Evening: [youtube.com/watch?v=fQUbhEHetks](https://www.youtube.com/watch?v=fQUbhEHetks)

Files are saved as `audio/morning-adhkar.m4a` and `audio/evening-adhkar.m4a` (not committed to git).

## Config

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
		eveningTime: "16:00",

		// Adhkar audio
		playAudio: true,
		morningPlayTime: "07:15",              // ~7:00–7:30 window; plays once at this time
		eveningMinutesBeforeSunset: 40,        // ~40 minutes before Maghrib/sunset
		lat: 42.4710579,                       // your house latitude
		lon: -83.0133362                       // your house longitude
	}
}
```

### Morning / evening text schedule

Morning adhkar text shows between `morningTime` and `eveningTime`. Evening adhkar shows the rest of the day.

```js
filterByTime: true,
morningTime: "05:00",   // morning adhkar starts (after Fajr)
eveningTime: "16:00",   // evening adhkar starts (after Asr)
strictMorningEvening: true   // only morning/evening items in each window
```

### Morning / evening audio schedule

| When | Default | Notes |
|------|---------|--------|
| Morning audio | `07:15` | Plays once per day at `morningPlayTime` |
| Evening audio | 40 min before sunset | Uses `lat` / `lon` to estimate sunset (Maghrib) |

Requires `playAudio: true`, mpv installed, and the two audio files from `scripts/download-audio.sh`.

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
| `playAudio` | Enable scheduled morning/evening audio | `false` |
| `audioPlayer` | CLI player binary | `"mpv"` |
| `morningAudioFile` | Morning track (relative to module) | `audio/morning-adhkar.m4a` |
| `eveningAudioFile` | Evening track (relative to module) | `audio/evening-adhkar.m4a` |
| `morningPlayTime` | Local time to play morning audio | `"07:15"` |
| `eveningMinutesBeforeSunset` | Minutes before sunset for evening audio | `40` |
| `lat` / `lon` | Location for sunset estimate (required for evening audio) | `null` |
| `audioCheckInterval` | How often the scheduler checks (ms) | `30000` |
| `mpvArgs` | Extra args passed to mpv | `[]` |

## Custom duas

Edit `data/duas.json` or create your own file:

```json
{
	"collection": "My Duas",
	"items": [
		{
			"id": 1,
			"category": "general",
			"title": "My Dua",
			"titleBn": "আমার দোয়া",
			"arabic": "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً",
			"transliteration": "Rabbana atina fid-dunya hasanah",
			"text": "Our Lord, give us good in this world.",
			"textBn": "হে আমাদের রব! দুনিয়ায় আমাদের কল্যাণ দিন।",
			"repeat": 1,
			"reference": "Quran 2:201"
		}
	]
}
```

Point config at it: `dataFile: "data/my-duas.json"`

## License

MIT
