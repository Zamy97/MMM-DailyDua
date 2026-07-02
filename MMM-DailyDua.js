Module.register("MMM-DailyDua", {
	defaults: {
		showTitle: true,
		showCategory: true,
		showArabic: true,
		showTransliteration: true,
		showTranslation: true,
		showBangla: true,
		showReference: true,
		showRepeat: true,
		bilingual: false,
		dataFile: "data/duas.json",
		category: "all",
		filterByTime: false,
		morningStartHour: 4,
		eveningStartHour: 15,
		rotationMode: "daily",
		updateInterval: 60 * 60 * 1000,
		animationSpeed: 2000,
		language: config.language || "en"
	},

	getStyles() {
		return ["MMM-DailyDua.css"];
	},

	getTranslations() {
		return {
			en: "translations/en.json",
			bn: "translations/bn.json"
		};
	},

	usesBangla() {
		return this.config.language === "bn";
	},

	getCategoryLabel(category) {
		const key = `CATEGORY_${category.toUpperCase()}`;
		const translated = this.translate(key);
		return translated !== key ? translated : category;
	},

	getDisplayTitle() {
		if (this.usesBangla() && this.dua.titleBn) {
			return this.dua.titleBn;
		}
		return this.dua.title;
	},

	getDisplayText() {
		if (this.usesBangla() && this.dua.textBn) {
			return this.dua.textBn;
		}
		return this.dua.text;
	},

	requestDua() {
		this.sendSocketNotification("GET_DUA", {
			dataFile: this.config.dataFile,
			category: this.config.category,
			filterByTime: this.config.filterByTime,
			morningStartHour: this.config.morningStartHour,
			eveningStartHour: this.config.eveningStartHour,
			rotationMode: this.config.rotationMode
		});
	},

	appendBlock(wrapper, className, html) {
		if (!html) {
			return;
		}

		const block = document.createElement("div");
		block.className = className;
		block.innerHTML = html;
		wrapper.appendChild(block);
	},

	start() {
		Log.info(`Starting module: ${this.name}`);
		this.dua = null;
		this.errorMessage = null;

		this.requestDua();

		setInterval(() => {
			this.requestDua();
		}, this.config.updateInterval);
	},

	getDom() {
		const wrapper = document.createElement("div");

		if (this.errorMessage) {
			wrapper.className = "dimmed light small error";
			wrapper.innerHTML = this.translate("ERROR");
			return wrapper;
		}

		if (!this.dua) {
			wrapper.className = "dimmed light small";
			wrapper.innerHTML = this.translate("LOADING");
			return wrapper;
		}

		if (this.config.showTitle) {
			this.appendBlock(wrapper, "dua-title bright small light", this.translate("TITLE"));
		}

		if (this.config.showCategory && this.dua.category) {
			const title = this.getDisplayTitle();
			const category = this.getCategoryLabel(this.dua.category);
			const label = title ? `${category} — ${title}` : category;
			this.appendBlock(wrapper, "dua-category dimmed xsmall light", label);
		} else if (this.getDisplayTitle()) {
			this.appendBlock(wrapper, "dua-name bright xsmall light", this.getDisplayTitle());
		}

		if (this.config.showArabic && this.dua.arabic) {
			this.appendBlock(wrapper, "dua-arabic bright medium light", this.dua.arabic);
		}

		if (this.config.showTransliteration && this.dua.transliteration) {
			this.appendBlock(wrapper, "dua-transliteration dimmed small light", this.dua.transliteration);
		}

		if (this.config.showTranslation) {
			const displayText = this.getDisplayText();
			if (displayText) {
				const usingBangla = this.usesBangla() && this.dua.textBn;
				const textClass = usingBangla ? "dua-bangla bright small light" : "dua-translation bright small light";
				this.appendBlock(wrapper, textClass, displayText);
			}
		}

		if (this.config.bilingual && this.usesBangla() && this.dua.textBn && this.dua.text) {
			this.appendBlock(wrapper, "dua-translation dimmed xsmall light", this.dua.text);
		}

		if (!this.usesBangla() && this.config.showBangla && this.dua.textBn) {
			this.appendBlock(wrapper, "dua-bangla bright small light", this.dua.textBn);
		}

		if (this.config.showRepeat && this.dua.repeat && this.dua.repeat > 1) {
			this.appendBlock(
				wrapper,
				"dua-repeat dimmed xsmall light",
				`${this.translate("REPEAT")}: ${this.dua.repeat}×`
			);
		}

		if (this.config.showReference && this.dua.reference) {
			this.appendBlock(wrapper, "dua-reference dimmed xsmall light", this.dua.reference);
		}

		return wrapper;
	},

	socketNotificationReceived(notification, payload) {
		if (notification === "DUA_RESULT") {
			this.errorMessage = null;
			this.dua = payload.dua;
			this.updateDom(this.config.animationSpeed);
		}

		if (notification === "DUA_ERROR") {
			this.errorMessage = payload.message;
			this.dua = null;
			this.updateDom(this.config.animationSpeed);
		}
	}
});
