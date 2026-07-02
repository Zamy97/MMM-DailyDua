# MMM-DailyDua

A [MagicMirror²](https://github.com/MagicMirrorOrg/MagicMirror) module that displays a **daily dua or dhikr** from a local JSON file — no API, works offline.

Arabic, transliteration, English, and Bangla. Designed for future audio playback support.

## Features

- 30 authentic duas & adhkar (morning, evening, sleep, salah, general)
- Daily rotation (`dayOfYear % total`) or random
- Optional time-based filtering (morning adhkar before 3pm, evening after)
- Category filter: `morning`, `evening`, `dhikr`, `general`, `sleep`, `salah`
- Bangla UI labels + Bangla text when `language: "bn"`
- Falls back to English when Bangla text is missing
- Small JSON (~30 KB) — Pi-friendly

## Install

```bash
cd ~/MagicMirror/modules
git clone https://github.com/Zamy97/MMM-DailyDua.git
```

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
		rotationMode: "daily",
		filterByTime: false,
		category: "all"
	}
}
```

### Morning / evening auto-filter

Shows morning adhkar from 4am–3pm, evening adhkar after 3pm:

```js
filterByTime: true,
morningStartHour: 4,
eveningStartHour: 15
```

### Category only

```js
category: "morning"   // morning | evening | dhikr | general | sleep | salah | all
```

## Config options

| Option | Description | Default |
|--------|-------------|---------|
| `dataFile` | Path to JSON (relative to module) | `data/duas.json` |
| `language` | UI labels: `en` or `bn` | `en` |
| `rotationMode` | `daily` or `random` | `daily` |
| `category` | Filter by category or `all` | `all` |
| `filterByTime` | Auto morning/evening pool | `false` |
| `morningStartHour` | Morning starts (24h) | `4` |
| `eveningStartHour` | Evening starts (24h) | `15` |
| `showArabic` | Show Arabic text | `true` |
| `showTransliteration` | Show romanized Arabic | `true` |
| `showTranslation` | Show English/Bangla meaning | `true` |
| `showBangla` | Show Bangla when language is `en` | `true` |
| `showRepeat` | Show repeat count (e.g. 3×) | `true` |
| `bilingual` | Show English under Bangla | `false` |

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

## Future: audio playback

The JSON structure is ready for a future `audioFile` field per dua and a `playAt` schedule in config. Not implemented in v1.

## License

MIT
