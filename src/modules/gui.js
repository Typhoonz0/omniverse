function GUI(utils) {

	utils.injectStyle(css);

	const CROSSHAIR_TEMPLATES = {
		None: (s, c, t) => ``,
		Dot: (s, c) => `<div style="width:${s}px;height:${s}px;background:${c};border-radius:50%"></div>`,
		Cross: (s, c, t) => `<div style="position:relative;width:${s}px;height:${s}px">
			<div style="position:absolute;left:50%;top:0;transform:translateX(-50%);width:${t}px;height:100%;background:${c}"></div>
			<div style="position:absolute;top:50%;left:0;transform:translateY(-50%);height:${t}px;width:100%;background:${c}"></div>
			</div>`,
		Circle: (s, c, t) => `<div style="width:${s}px;height:${s}px;border-radius:50%;border:${t}px solid ${c};box-sizing:border-box"></div>`,
		CircleWithDot: (s, c, t) => `
            <div style="position:relative;width:${s}px;height:${s}px;border:${t}px solid ${c};border-radius:50%;">
                <div style="position:absolute;top:50%;left:50%;width:${s / 5}px;height:${s / 5}px;background:${c};border-radius:50%;transform:translate(-50%,-50%);"></div>
            </div>`,
		XShaped: (s, c, t) => `
            <div style="position:relative;width:${s}px;height:${s}px;">
                <div style="position:absolute;width:${t}px;height:100%;background:${c};transform:rotate(45deg);left:50%;top:0;transform-origin:center;"></div>
                <div style="position:absolute;width:${t}px;height:100%;background:${c};transform:rotate(-45deg);left:50%;top:0;transform-origin:center;"></div>
            </div>`,
	};

	const SKIN_OPTIONS = {
		"default": "Default",
		"bacon": "Bacon",
		"linen": "Fresh Linen",
		"greencamo": "Green Camo",
		"redcamo": "Red Camo",
		"tiger": "Tigris",
		"carbon": "Carbon Fiber",
		"cherry": "Blossom",
		"prism": "Gem Stone",
		"splatter": "Marble",
		"swirl": "Swirl",
		"vapor": "Vapor Wave",
		"astro": "Astro",
		"payday": "Pay Day",
		"safari": "Safari",
		"snowcamo": "Snow Camo",
		"rustic": "Royal",
		"hydro": "Hydrodip",
		"ice": "Frostbite",
		"silly": "Silly",
		"alez": "Alez",
		"horizon": "Horizon",
		"quackster": "QuaK",
		"matrix": "Matrix",
		"scanline": "Scanline",
		"frostyglow": "Frosty Glow",
		"neonpulse": "Neon Pulse (not out yet)",
		"neon": "Neon",
		"winter": "Winter '22",
		"cloudy": "Cloudy",
		"winter2024": "Winter '24",
		"hallow22": "HLWN '22",
		"hlwn": "HLWN '23",
		"summer": "Summer '24",
		"birthday": "1st Birthday"
	};

	const TABS = [
		{ id: 'main', label: 'Main' },
		{ id: 'stats', label: 'Stats' },
		{ id: 'cross', label: 'Crosshair' },
		{ id: 'gif', label: 'GIF' },
		{ id: 'theme', label: 'Theme' },
		{ id: 'other', label: 'Other' },
	];
	let activeTab = 'main';

	const gui = utils.el('div', { attrs: { id: 'ovGui' } });
	const header = utils.el('header');
	header.innerHTML = `<div style="font-weight:700">Omniverse | xliam.xyz</div><div style="opacity:0.9">Toggle: <span id="ov-toggle-key">${settings.toggleKey}</span></div>`;
	gui.appendChild(header);

	const wrap = utils.el('div', { cls: 'wrap' });
	const tabsEl = utils.el('div', { cls: 'tabs' });
	const contentEl = utils.el('div', { cls: 'content' });
	wrap.appendChild(tabsEl);
	wrap.appendChild(contentEl);
	gui.appendChild(wrap);

	function createTabs() {
		tabsEl.innerHTML = '';
		TABS.forEach(t => {
			const b = utils.el('div', {
				cls: 'tab',
				text: t.label,
				listeners: { click: () => setActiveTab(t.id) }
			});
			b.dataset.tabId = t.id;
			if (t.id === activeTab) b.classList.add('active');
			tabsEl.appendChild(b);
		});
	}

	function setActiveTab(id) {
		activeTab = id;
		Array.from(tabsEl.children).forEach(c => c.classList.toggle('active', c.dataset.tabId === id));
		renderContent();
	}

	function heading(text) {
		return utils.el('div', { html: `<strong>${text}</strong>` });
	}

	function row(labelText) {
		const r = utils.el('div', { cls: 'ov-row' });
		const l = utils.el('label', { text: labelText });
		l.style.fontSize = '13px';
		r.appendChild(l);
		return r;
	}

	function makeToggle(state, onChange) {
		const t = utils.el('div', { cls: 'ov-toggle' });
		const k = utils.el('div', { cls: 'knob' });
		t.appendChild(k);
		t.dataset.on = state ? 1 : 0;
		if (state) k.style.transform = 'translateX(22px)';
		t.addEventListener('click', () => {
			const now = t.dataset.on !== '1';
			t.dataset.on = now ? 1 : 0;
			k.style.transform = now ? 'translateX(22px)' : '';
			onChange(now);
		});
		return t;
	}

	function toggleRow(labelText, state, onChange) {
		const r = row(labelText);
		r.appendChild(makeToggle(state, onChange));
		return r;
	}

	function colorRow(labelText, value, onChange) {
		const r = row(labelText);
		const input = utils.el('input', { attrs: { type: 'color', value } });
		input.addEventListener('input', e => onChange(e.target.value));
		r.appendChild(input);
		return r;
	}

	function rangeRow(labelText, { min, max, step, value }, onChange) {
		const r = row(labelText);
		const input = utils.el('input', { attrs: { type: 'range', min, max, step, value } });
		input.addEventListener('input', e => onChange(Number(e.target.value)));
		r.appendChild(input);
		return r;
	}

	function selectRow(labelText, options, value, onChange) {
		const r = row(labelText);
		const select = utils.el('select', { cls: 'ov-select' });
		Object.entries(options).forEach(([k, display]) => {
			const o = utils.el('option', { text: display });
			o.value = k;
			if (value === k) o.selected = true;
			select.appendChild(o);
		});
		select.addEventListener('change', e => onChange(e.target.value));
		r.appendChild(select);
		return r;
	}

	function buttonRow(labelText, buttonText, onClick) {
		const r = row(labelText);
		r.appendChild(utils.el('button', { text: buttonText, cls: 'ov-btn', listeners: { click: onClick } }));
		return r;
	}

	function renderContent() {
		contentEl.innerHTML = '';

		if (activeTab === 'main') {
			contentEl.appendChild(heading('Quick Controls'));
			contentEl.appendChild(heading('Check xliam.xyz for updates every week'));

			contentEl.appendChild(toggleRow('Resource Swapper (Reload Client)', settings.swapper, v => {
				settings.swapper = v;
				save();
			}));

			contentEl.appendChild(toggleRow('Discord RPC', settings.rpc, v => {
				settings.rpc = v;
				save();
			}));

			contentEl.appendChild(toggleRow('Open in fullscreen', settings.largewindow, v => {
				settings.largewindow = v;
				save();
			}));

			contentEl.appendChild(toggleRow('Uncap FPS', settings.disableFrameRateLimit, v => {
				settings.disableFrameRateLimit = v;
				settings.forceHighPerformanceGPU = v;
				save();
			}));

			contentEl.appendChild(toggleRow('Stats Overlay', settings.showStats, v => {
				settings.showStats = v;
				save();
				updateOverlay('dsOverlayStats');
			}));

			contentEl.appendChild(toggleRow('Keys Overlay', settings.showOverlay, v => {
				settings.showOverlay = v;
				save();
				updateOverlay('keyDisplayOverlay');
			}));

			contentEl.appendChild(toggleRow('Crosshair', settings.crossEnable, v => {
				settings.crossEnable = v;
				save();
				updateCrosshair();
			}));

			contentEl.appendChild(toggleRow('GIF', settings.showAnimeGif, v => {
				settings.showAnimeGif = v;
				save();
				updateGif();
			}));
		}

		if (activeTab === 'stats') {
			contentEl.appendChild(heading('Stats Overlay'));

			contentEl.appendChild(toggleRow('Enable', settings.showStats, v => {
				settings.showStats = v;
				save();
				updateOverlay('dsOverlayStats');
			}));

			const statFields = [
				['Show Date', 'showDate'],
				['Show Time', 'showTime'],
				['Show OS', 'showOS'],
				['Show CPU', 'showCPU'],
				['Show Sens', 'showSens'],
				['Show FPS', 'showFPS'],
				['Show Ping', 'showPing'],
			];
			statFields.forEach(([label, key]) => {
				contentEl.appendChild(toggleRow(label, utils.getRaw(key) !== 'false', v => {
					utils.setRaw(key, v);
				}));
			});
		}

		/*
		if (activeTab === 'skins') {
			contentEl.appendChild(heading('Skin Selector'));
			contentEl.appendChild(utils.el('div', { html: 'Reload to apply changes<br>Order: AR, SMG, AWP, Shotgun' }));

			const weapons = [
				{ key: 'ar', label: 'Assault Rifle' },
				{ key: 'smg', label: 'SMG' },
				{ key: 'awp', label: 'AWP' },
				{ key: 'shotgun', label: 'Shotgun' },
			];

			weapons.forEach(weapon => {
				contentEl.appendChild(selectRow(weapon.label, SKIN_OPTIONS, settings.selectedSkins[weapon.key], v => {
					settings.selectedSkins[weapon.key] = v;
					save();
				}));
			});
		}
		*/

		if (activeTab === 'cross') {
			contentEl.appendChild(heading('Crosshair Editor'));

			contentEl.appendChild(toggleRow('Enable', settings.crossEnable, v => {
				settings.crossEnable = v;
				save();
				updateCrosshair();
			}));

			contentEl.appendChild(colorRow('Color', settings.crossColor, v => {
				settings.crossColor = v;
				save();
				updateCrosshair();
			}));

			contentEl.appendChild(rangeRow('Size', { min: 4, max: 300, value: settings.crossSize }, v => {
				settings.crossSize = v;
				save();
				updateCrosshair();
			}));

			contentEl.appendChild(rangeRow('Thickness', { min: 1, max: 28, value: settings.crossThickness }, v => {
				settings.crossThickness = v;
				save();
				updateCrosshair();
			}));

			const crossTypeOptions = Object.fromEntries(Object.keys(CROSSHAIR_TEMPLATES).map(k => [k, k]));
			contentEl.appendChild(selectRow('Type', crossTypeOptions, settings.crossType, v => {
				settings.crossType = v;
				save();
				updateCrosshair();
			}));

			updateCrosshair();
		}

		if (activeTab === 'gif') {
			contentEl.appendChild(heading('GIF Overlay'));

			contentEl.appendChild(toggleRow('Enable', settings.showAnimeGif, v => {
				settings.showAnimeGif = v;
				save();
				updateGif();
			}));

			contentEl.appendChild(rangeRow('Scale', { min: 0.1, max: 2, step: 0.05, value: settings.animeGifScale || 0.6 }, v => {
				settings.animeGifScale = v;
				save();
				updateGif();
			}));
		}

		if (activeTab === 'theme') {
			contentEl.appendChild(heading('Theme Editor'));

			const colorFields = [
				['Accent Color', 'accent'],
				['Overlay Text Color', 'text3'],
				['Movement Keys Color', 'red1'],
				['Actions Keys Color', 'red2'],
			];
			colorFields.forEach(([label, key]) => {
				contentEl.appendChild(colorRow(label, settings.themeData?.[key] || '#8da4ff', v => {
					settings.themeData = settings.themeData || {};
					settings.themeData[key] = v;
					applyTheme(settings.themeData);
					save();
				}));
			});

			contentEl.appendChild(rangeRow('Background Opacity', { min: 0.15, max: 1, step: 0.05, value: settings.themeData?.bgOpacity || 0.6 }, v => {
				settings.themeData = settings.themeData || {};
				settings.themeData.bgOpacity = v;
				applyTheme(settings.themeData);
				save();
			}));
		}

		if (activeTab === 'other') {
			const fmtKey = k => (k === ' ' ? 'Space' : k || '');

			const kb = utils.el('div', {
				cls: 'ov-row',
				style: { display: 'flex', flexDirection: 'column', gap: '4px' }
			});
			kb.appendChild(utils.el('label', { text: 'Toggle Key (click then press a key)' }));

			const keyInput = utils.el('input', {
				cls: 'ov-input',
				attrs: { type: 'text', value: fmtKey(settings.toggleKey), placeholder: 'Press a key...' }
			});
			keyInput.readOnly = true;
			keyInput.addEventListener('keydown', e => {
				e.preventDefault();
				e.stopPropagation();
				if (e.key === 'Escape') {
					keyInput.blur();
					return;
				}
				settings.toggleKey = e.key;
				keyInput.value = fmtKey(e.key);
				document.getElementById('ov-toggle-key').textContent = fmtKey(e.key);
				save();
				keyInput.blur();
			});
			kb.appendChild(keyInput);
			contentEl.appendChild(kb);

			contentEl.appendChild(buttonRow('Player Rank', 'Get Rank', () => {
				if (typeof getRank === 'function') {
					getRank();
				} else {
					console.warn('getRank() is not defined');
				}
			}));

			contentEl.appendChild(buttonRow('Debug', 'Show State', () => alert(JSON.stringify(settings, null, 2))));
		}
	}

	function applyTheme(td) {
		if (!td) return;
		const root = document.documentElement.style;
		if (td.accent) root.setProperty('--ov-accent', td.accent);
		if (td.text3) root.setProperty('--ov-text', td.text3);
		if (td.red1) root.setProperty('--ov-red1', td.red1);
		if (td.red2) root.setProperty('--ov-red2', td.red2);
		if (td.bgOpacity !== undefined) root.setProperty('--ov-bg', `rgba(12,12,12,${td.bgOpacity})`);
	}
	if (settings.themeData) applyTheme(settings.themeData);

	let crossEl;
	let overlayEl;

	function ensureOverlays() {
		if (!crossEl) {
			crossEl = utils.el('div', {
				style: {
					position: 'fixed',
					left: '50%',
					top: '50%',
					transform: 'translate(-50%,-50%)',
					pointerEvents: 'none',
					zIndex: 999998
				}
			});
			document.body.appendChild(crossEl);
		}
		if (!overlayEl) {
			overlayEl = utils.el('div', {
				style: {
					position: 'fixed',
					right: '14px',
					bottom: '14px',
					pointerEvents: 'none',
					zIndex: 999998
				}
			});
			document.body.appendChild(overlayEl);
		}
	}

	function updateCrosshair() {
		ensureOverlays();
		crossEl.innerHTML = '';
		if (!settings.crossEnable) return;
		const tpl = CROSSHAIR_TEMPLATES[settings.crossType] || CROSSHAIR_TEMPLATES.Cross;
		crossEl.innerHTML = tpl(settings.crossSize, settings.crossColor, settings.crossThickness);
	}

	function updateOverlay(id) {
		const el = document.getElementById(id);
		if (!el) return;
		const currentlyHidden = el.style.display === 'none';
		el.style.display = currentlyHidden ? '' : 'none';
	}

	function updateGif() {
		ensureOverlays();
		const raw = settings.animeGifPath || "anime.gif";
		const full = "custom://" + raw.replace(/\\/g, "/");

		const existing = document.getElementById("customGifEl");
		if (existing) existing.remove();
		if (!settings.showAnimeGif) return;

		const gifEl = document.createElement("div");
		gifEl.id = "customGifEl";

		Object.assign(gifEl.style, {
			position: "absolute",
			left: "0px",
			top: "0px",
			cursor: "move",
			zIndex: 9999,
		});

		const img = document.createElement("img");
		img.src = full;

		Object.assign(img.style, {
			maxWidth: "45vw",
			transform: `scale(${settings.animeGifScale})`,
			borderRadius: "8px",
			opacity: "0.95",
			display: "block",
		});

		gifEl.appendChild(img);
		document.body.appendChild(gifEl);

		utils.makeDraggable(gifEl, { storageKey: "animeGif_pos" });
	}

	function save() {
		writeSettings(settings);
		utils.set('toggleKey', settings.toggleKey);
	}

	setInterval(() => {
		writeSettings(settings);
	}, 5000);

	function isOverlaySupposedToBeOn() {
		if (!settings.showOverlay) updateOverlay("keyDisplayOverlay");
		if (!settings.showStats) updateOverlay("dsOverlayStats");
	}

	async function fetchLeaderboardRank(username) {
		try {
			const response = await fetch('https://login.deadshot.io/leaderboards');
			const data = await response.json();
			const categories = ["daily", "weekly", "all"];
			const result = {};

			for (const category of categories) {
				result[category] = {};

				for (const stat of ["kills", "wins"]) {
					if (data[category]?.[stat]) {
						const leaderboard = [...data[category][stat]].sort((a, b) => b[stat] - a[stat]);
						const idx = leaderboard.findIndex(p => p.name === username);
						result[category][stat] = idx !== -1 ? `#${idx + 1}` : "Not ranked";
					} else {
						result[category][stat] = "Not found";
					}
				}
			}

			return [
				`Daily - Kills: ${result.daily.kills} - Wins: ${result.daily.wins}`,
				`Weekly - Kills: ${result.weekly.kills} - Wins: ${result.weekly.wins}`,
				`All-time - Kills: ${result.all.kills} - Wins: ${result.all.wins}`,
			].join("\n");

		} catch (error) {
			console.error('Error fetching leaderboard:', error);
			return "Daily: Error\nWeekly: Error\nAll-time: Error";
		}
	}

	function getRank() {
		const overlay = document.createElement('div');
		overlay.style.cssText = `
			position: fixed;
			inset: 0;
			width: 100vw;
			height: 100vh;
			background: rgba(0,0,0,0.6);
			display: flex;
			justify-content: center;
			align-items: center;
			z-index: 9999;
		`;

		const box = document.createElement('div');
		box.style.cssText = `
			background: var(--ov-bg);
			border: 2px solid var(--ov-accent);
			padding: 20px;
			border-radius: 12px;
			box-shadow: 0 16px 40px rgba(0,0,0,0.6);
			color: var(--ov-text);
			min-width: 280px;
			display: flex;
			flex-direction: column;
			gap: 8px;
			font-family: 'DM Sans', sans-serif;
		`;

		const header = document.createElement('div');
		header.style.cssText = `
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding-bottom: 10px;
			border-bottom: 1px solid rgba(255,255,255,0.06);
			margin-bottom: 4px;
		`;

		const title = document.createElement('span');
		title.textContent = 'Rank Lookup (if it dont let u click inside alt+tab)';
		title.style.cssText = `font-size: 14px; font-weight: 600; color: var(--ov-text);`;

		const closeBtn = document.createElement('button');
		closeBtn.textContent = '✕';
		closeBtn.style.cssText = `
			background: none;
			border: none;
			color: var(--ov-text);
			cursor: pointer;
			font-size: 14px;
			opacity: 0.5;
			line-height: 1;
			padding: 0;
			transition: opacity 0.15s;
		`;
		closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
		closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.5');
		closeBtn.addEventListener('click', () => document.body.removeChild(overlay));

		header.appendChild(title);
		header.appendChild(closeBtn);

		const label = document.createElement('label');
		label.textContent = 'Username';
		label.style.cssText = `font-size: 12px; opacity: 0.6;`;

		const input = document.createElement('input');
		input.type = 'text';
		input.placeholder = 'Enter username...';
		input.className = 'ov-input';
		input.style.cssText = `
			padding: 6px;
			border-radius: 6px;
			border: 1px solid rgba(255,255,255,0.06);
			background: var(--ov-panel);
			color: var(--ov-text);
			font-size: 14px;
			outline: none;
			width: 100%;
			font-family: 'DM Sans', sans-serif;
		`;

		const submit = document.createElement('button');
		submit.textContent = 'Look up';
		submit.className = 'ov-btn';
		submit.style.cssText = `
			padding: 6px 8px;
			border-radius: 6px;
			border: none;
			background: var(--ov-accent);
			color: #031133;
			cursor: pointer;
			font-size: 14px;
			font-family: 'DM Sans', sans-serif;
			transition: opacity 0.15s, transform 0.05s;
			align-self: flex-end;
		`;
		submit.addEventListener('mouseenter', () => submit.style.opacity = '0.85');
		submit.addEventListener('mouseleave', () => submit.style.opacity = '1');
		submit.addEventListener('mousedown', () => submit.style.transform = 'scale(0.97)');
		submit.addEventListener('mouseup', () => submit.style.transform = 'scale(1)');

		const handleSubmit = async () => {
			const username = input.value.trim();
			if (!username) return;

			submit.textContent = '...';
			submit.disabled = true;

			try {
				const rank = await fetchLeaderboardRank(username);
				alert(`${rank}`);
				document.body.removeChild(overlay);
			} catch (err) {
				console.error('Failed to fetch leaderboard rank:', err);
				alert('Failed to fetch rank');
				document.body.removeChild(overlay);
			}
		};

		submit.addEventListener('click', handleSubmit);

		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') handleSubmit();
			if (e.key === 'Escape') document.body.removeChild(overlay);
		});

		overlay.addEventListener('click', (e) => {
			if (e.target === overlay) document.body.removeChild(overlay);
		});

		box.appendChild(header);
		box.appendChild(label);
		box.appendChild(input);
		box.appendChild(submit);
		overlay.appendChild(box);
		document.body.appendChild(overlay);
		input.focus();
	}

	createTabs();
	renderContent();
	isOverlaySupposedToBeOn();
	document.body.appendChild(gui);
	utils.makeDraggable(gui);
	ensureOverlays();
	updateCrosshair();
	updateGif();

	addEventListener('keydown', (e) => {
		if (e.key.toLowerCase() === (settings.toggleKey || 'o').toLowerCase()) {
			gui.style.display = gui.style.display === 'none' ? '' : 'none';
		}
	});
}