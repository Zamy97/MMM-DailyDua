/* Magic Mirror
 * Node Helper: MMM-DailyDua
 */

const fs = require("fs");
const path = require("path");
const NodeHelper = require("node_helper");

const DEFAULT_DATA_FILE = "data/duas.json";

module.exports = NodeHelper.create({
	dataCache: null,
	cacheFile: null,

	start() {
		console.log(`Starting node_helper for ${this.name}`);
	},

	getDayOfYear(date) {
		const start = new Date(date.getFullYear(), 0, 0);
		const diff = date - start;
		return Math.floor(diff / (1000 * 60 * 60 * 24));
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
			const hour = new Date().getHours();
			const isMorning = hour >= (options.morningStartHour ?? 4) && hour < (options.eveningStartHour ?? 15);
			const timeCategories = isMorning ? ["morning", "dhikr", "general"] : ["evening", "sleep", "dhikr", "general"];
			const timePool = pool.filter((item) => timeCategories.includes(item.category));

			if (timePool.length > 0) {
				pool = timePool;
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
		} else {
			index = this.getDayOfYear(new Date()) % pool.length;
		}

		return pool[index];
	},

	socketNotificationReceived(notification, payload) {
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
