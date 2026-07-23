/* Magic Mirror
 * Node Helper: MMM-DailyDua
 *
 * Loads duas from a local JSON file and optionally plays morning/evening
 * adhkar audio via mpv on a schedule.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const NodeHelper = require("node_helper");

const DEFAULT_DATA_FILE = "data/duas.json";

module.exports = NodeHelper.create({
	dataCache: null,
	cacheFile: null,
	audioConfig: null,
	audioTimer: null,
	playerProcess: null,
	lastMorningPlayKey: null,
	lastEveningPlayKey: null,

	start() {
		console.log(`Starting node_helper for ${this.name}`);
	},

	stop() {
		this.stopAudioScheduler();
		this.stopPlayer();
	},

	getDayOfYear(date) {
		const start = new Date(date.getFullYear(), 0, 0);
		const diff = date - start;
		return Math.floor(diff / (1000 * 60 * 60 * 24));
	},

	parseTimeToMinutes(value, fallbackHour) {
		if (typeof value === "string" && value.includes(":")) {
			const [hours, minutes] = value.split(":").map((part) => parseInt(part, 10));
			if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
				return hours * 60 + minutes;
			}
		}

		const hour = parseInt(value ?? fallbackHour, 10);
		return (Number.isNaN(hour) ? fallbackHour : hour) * 60;
	},

	minutesToLabel(totalMinutes) {
		const minutes = ((Math.round(totalMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
	},

	isMorningWindow(date, options) {
		const nowMinutes = date.getHours() * 60 + date.getMinutes();
		const morningMinutes = this.parseTimeToMinutes(options.morningTime, options.morningStartHour ?? 5);
		const eveningMinutes = this.parseTimeToMinutes(options.eveningTime, options.eveningStartHour ?? 16);

		if (morningMinutes === eveningMinutes) {
			return nowMinutes >= morningMinutes;
		}

		if (morningMinutes < eveningMinutes) {
			return nowMinutes >= morningMinutes && nowMinutes < eveningMinutes;
		}

		return nowMinutes >= morningMinutes || nowMinutes < eveningMinutes;
	},

	/**
	 * Approximate local sunset (minutes from midnight) using a compact solar algorithm.
	 * Good enough for scheduling adhkar ~40 minutes before Maghrib/sunset.
	 */
	getSunsetMinutes(date, lat, lon) {
		const rad = Math.PI / 180;
		const day = Math.floor(
			(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) /
				86400000
		);

		const gamma = (2 * Math.PI) / 365 * (day - 1 + (12 - 12) / 24);
		const eqTime =
			229.18 *
			(0.000075 +
				0.001868 * Math.cos(gamma) -
				0.032077 * Math.sin(gamma) -
				0.014615 * Math.cos(2 * gamma) -
				0.040849 * Math.sin(2 * gamma));
		const decl =
			0.006918 -
			0.399912 * Math.cos(gamma) +
			0.070257 * Math.sin(gamma) -
			0.006758 * Math.cos(2 * gamma) +
			0.000907 * Math.sin(2 * gamma) -
			0.002697 * Math.cos(3 * gamma) +
			0.00148 * Math.sin(3 * gamma);

		const latRad = lat * rad;
		const cosHourAngle =
			(Math.cos(90.833 * rad) / (Math.cos(latRad) * Math.cos(decl))) - Math.tan(latRad) * Math.tan(decl);

		if (cosHourAngle < -1 || cosHourAngle > 1) {
			return null;
		}

		const hourAngle = Math.acos(cosHourAngle);
		const sunsetUtcMinutes = 720 - 4 * (lon + (hourAngle / rad)) - eqTime;
		const localOffsetMinutes = -date.getTimezoneOffset();
		return sunsetUtcMinutes + localOffsetMinutes;
	},

	resolveAudioPath(relativePath) {
		if (!relativePath) {
			return null;
		}
		if (path.isAbsolute(relativePath)) {
			return relativePath;
		}
		return path.join(__dirname, relativePath);
	},

	stopPlayer() {
		if (this.playerProcess && !this.playerProcess.killed) {
			try {
				this.playerProcess.kill("SIGTERM");
			} catch (error) {
				console.error(`${this.name}: failed to stop player`, error);
			}
		}
		this.playerProcess = null;
	},

	playAudioFile(filePath, label) {
		if (!filePath || !fs.existsSync(filePath)) {
			console.warn(`${this.name}: audio file missing for ${label}: ${filePath || "(empty)"}`);
			return false;
		}

		const player = this.audioConfig.audioPlayer || "mpv";
		const extraArgs = Array.isArray(this.audioConfig.mpvArgs) ? this.audioConfig.mpvArgs : [];
		const args =
			player === "mpv"
				? ["--no-video", "--really-quiet", ...extraArgs, filePath]
				: [...extraArgs, filePath];

		this.stopPlayer();

		console.log(`${this.name}: playing ${label} via ${player}: ${filePath}`);
		this.playerProcess = spawn(player, args, {
			detached: false,
			stdio: "ignore"
		});

		this.playerProcess.on("error", (error) => {
			console.error(`${this.name}: ${player} failed (${label}):`, error.message);
			this.playerProcess = null;
		});

		this.playerProcess.on("exit", (code) => {
			console.log(`${this.name}: ${player} exited for ${label} (code ${code})`);
			this.playerProcess = null;
		});

		return true;
	},

	dateKey(date) {
		return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
	},

	checkAudioSchedule() {
		if (!this.audioConfig || !this.audioConfig.playAudio) {
			return;
		}

		const now = new Date();
		const nowMinutes = now.getHours() * 60 + now.getMinutes();
		const today = this.dateKey(now);

		const morningTarget = this.parseTimeToMinutes(this.audioConfig.morningPlayTime, 7);
		if (nowMinutes === morningTarget && this.lastMorningPlayKey !== today) {
			const morningFile = this.resolveAudioPath(this.audioConfig.morningAudioFile);
			if (this.playAudioFile(morningFile, "morning adhkar")) {
				this.lastMorningPlayKey = today;
			}
		}

		const lat = Number(this.audioConfig.lat);
		const lon = Number(this.audioConfig.lon);
		if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
			return;
		}

		const sunsetMinutes = this.getSunsetMinutes(now, lat, lon);
		if (sunsetMinutes == null) {
			return;
		}

		const offset = Number(this.audioConfig.eveningMinutesBeforeSunset ?? 40);
		const eveningTarget = Math.round(sunsetMinutes - offset);
		if (eveningTarget < 0 || eveningTarget >= 24 * 60) {
			return;
		}

		if (nowMinutes === eveningTarget && this.lastEveningPlayKey !== today) {
			const eveningFile = this.resolveAudioPath(this.audioConfig.eveningAudioFile);
			if (this.playAudioFile(eveningFile, "evening adhkar")) {
				this.lastEveningPlayKey = today;
				console.log(
					`${this.name}: evening trigger ${this.minutesToLabel(eveningTarget)} ` +
						`(sunset ~${this.minutesToLabel(sunsetMinutes)}, -${offset}m)`
				);
			}
		}
	},

	stopAudioScheduler() {
		if (this.audioTimer) {
			clearInterval(this.audioTimer);
			this.audioTimer = null;
		}
	},

	startAudioScheduler(config) {
		this.audioConfig = config || null;
		this.stopAudioScheduler();

		if (!config || !config.playAudio) {
			console.log(`${this.name}: audio playback disabled`);
			return;
		}

		const interval = Math.max(15 * 1000, Number(config.audioCheckInterval) || 30 * 1000);
		console.log(
			`${this.name}: audio scheduler on ` +
				`(morning ${config.morningPlayTime || "07:15"}, ` +
				`evening ${config.eveningMinutesBeforeSunset ?? 40}m before sunset)`
		);

		this.checkAudioSchedule();
		this.audioTimer = setInterval(() => this.checkAudioSchedule(), interval);
	},

	loadData(dataFile) {
		const filePath = path.join(__dirname, dataFile || DEFAULT_DATA_FILE);

		if (!fs.existsSync(filePath)) {
			throw new Error(`Data file not found: ${dataFile || DEFAULT_DATA_FILE}`);
		}

		if (this.dataCache && this.cacheFile === filePath) {
			return this.dataCache;
		}

		this.dataCache = JSON.parse(fs.readFileSync(filePath, "utf8"));
		this.cacheFile = filePath;
		console.log(`${this.name}: loaded ${this.dataCache.items.length} duas from ${dataFile || DEFAULT_DATA_FILE}`);

		return this.dataCache;
	},

	filterItems(items, options) {
		let pool = items;

		if (options.category && options.category !== "all") {
			pool = pool.filter((item) => item.category === options.category);
		}

		if (options.filterByTime) {
			const isMorning = this.isMorningWindow(new Date(), options);

			if (options.strictMorningEvening !== false) {
				const targetCategory = isMorning ? "morning" : "evening";
				const strictPool = pool.filter((item) => item.category === targetCategory);
				if (strictPool.length > 0) {
					pool = strictPool;
				}
			} else {
				const timeCategories = isMorning
					? ["morning", "dhikr", "general"]
					: ["evening", "sleep", "dhikr", "general"];
				const timePool = pool.filter((item) => timeCategories.includes(item.category));
				if (timePool.length > 0) {
					pool = timePool;
				}
			}
		}

		return pool;
	},

	pickItem(data, options) {
		const pool = this.filterItems(data.items, options);

		if (!pool.length) {
			throw new Error("No duas match the current filters.");
		}

		let index = 0;
		if (options.rotationMode === "random") {
			index = Math.floor(Math.random() * pool.length);
		} else if (options.rotationMode === "interval") {
			const hours = options.rotateEveryHours || 3;
			const slot = Math.floor(Date.now() / (hours * 60 * 60 * 1000));
			index = slot % pool.length;
		} else {
			index = this.getDayOfYear(new Date()) % pool.length;
		}

		return pool[index];
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "INIT_AUDIO") {
			this.startAudioScheduler(payload);
			return;
		}

		if (notification === "STOP_AUDIO") {
			this.stopPlayer();
			return;
		}

		if (notification !== "GET_DUA") {
			return;
		}

		try {
			const data = this.loadData(payload.dataFile);
			const dua = this.pickItem(data, payload);

			this.sendSocketNotification("DUA_RESULT", {
				dua,
				collection: data.collection || ""
			});
		} catch (error) {
			console.error(`${this.name}:`, error);
			this.sendSocketNotification("DUA_ERROR", {
				message: error.message
			});
		}
	}
});
