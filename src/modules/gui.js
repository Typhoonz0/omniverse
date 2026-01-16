function GUI(utils) {
	const fs = require('fs');
	const path = require('path');

	// Checks a few locations for the rest of the code as path.dirname and __dirname by default is different on the compiled release and the interpreted release 
	// This is an Electron issue and i can't fix it
	// This function would go in utils.js as it will belong in multiple files but I can't find utils.js without it 
	function resolveBase(startDir) {
		function findFolder(dir, name) {
			while (!fs.existsSync(path.join(dir, name)) && path.dirname(dir) !== dir) {
				dir = path.dirname(dir);
			}
			return fs.existsSync(path.join(dir, name)) ?
				path.join(dir, name) :
				null;
		}

		console.log(startDir);

		let omniversePath =
			findFolder(startDir, "omniverse") ||
			findFolder(startDir, "app") ||
			findFolder(startDir, "src");

		if (!omniversePath) {
			console.error('Neither "omniverse", "app", nor "src" was found!');
			return null;
		}

		console.log("Using folder:", omniversePath);

		return omniversePath;
	}
	omniversePath = resolveBase(__dirname);

	console.log('Using folder:', omniversePath);
	if (omniversePath !== base) {
		base = path.join(omniversePath, 'src');
	}

	const settingsPath = path.join(omniversePath, 'src', "settings.json");

	function readSettings() {
		try {
			if (!fs.existsSync(settingsPath)) return {};
			return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
		} catch {
			return {};
		}
	}

	function writeSettings(obj) {
		try {
			fs.writeFileSync(settingsPath, JSON.stringify(obj, null, 2), 'utf-8');
		} catch (err) {
			console.error('Error writing settings:', err);
		}
	}

	let settings = readSettings();

	let css;
	try {
		css = fs.readFileSync(path.resolve(base, 'modules', 'style.css'), 'utf8');
	} catch (err) {
		console.error('Failed to get CSS:', err);
	}
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

	const gui = utils.el('div', {
		attrs: {
			id: 'ovGui'
		}
	});
	const header = utils.el('header');
	header.innerHTML = `<div style="font-weight:700">Omniverse | xliam.space</div><div style="opacity:0.9">Toggle: <span id="ov-toggle-key">${settings.toggleKey}</span></div>`;
	gui.appendChild(header);

	const wrap = utils.el('div', {
		cls: 'wrap'
	});
	const tabsEl = utils.el('div', {
		cls: 'tabs'
	});
	const contentEl = utils.el('div', {
		cls: 'content'
	});
	wrap.appendChild(tabsEl);
	wrap.appendChild(contentEl);
	gui.appendChild(wrap);

	// Skin options with lowercase keys and display names
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
		"neon": "Neon",
		"winter": "Winter '22",
		"hlwn": "HLWN '23",
		"summer": "Summer '24",
		"birthday": "1st Birthday"
	};
	const TABS = [{
		id: 'main',
		label: 'Main'
	}, {
		id: 'keys',
		label: 'Keys'
	}, {
		id: 'cross',
		label: 'Crosshair'
	},
	 {
		id: 'skins',
		label: 'Skins'
	}, {
		id: 'gif',
		label: 'GIF'
	}, {
		id: 'theme',
		label: 'Theme'
	}, {
		id: 'settings',
		label: 'Settings'
	}, {
		id: 'debug',
		label: 'Other'
	}];
	let activeTab = 'main';

	function createTabs() {
		tabsEl.innerHTML = '';
		TABS.forEach(t => {
			const b = utils.el('div', {
				cls: 'tab',
				text: t.label,
				listeners: {
					click: () => {
						setActiveTab(t.id);
					}
				}
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

	function rowLabel(text) {
		const r = utils.el('div', {
			cls: 'ov-row'
		});
		const l = utils.el('label', {
			text
		});
		l.style.fontSize = '13px';
		r.appendChild(l);
		return {
			row: r,
			label: l
		};
	}

	function makeToggle(state, onChange) {
		const t = utils.el('div', {
			cls: 'ov-toggle'
		});
		const k = utils.el('div', {
			cls: 'knob'
		});
		t.appendChild(k);
		t.dataset.on = state ? 1 : 0;
		if (state) k.style.transform = 'translateX(22px)';
		t.addEventListener('click', () => {
			const now = t.dataset.on === '1' ? false : true;
			t.dataset.on = now ? 1 : 0;
			k.style.transform = now ? 'translateX(22px)' : '';
			onChange(now);
		});
		return t;
	}


	function renderContent() {
		contentEl.innerHTML = '';
		if (activeTab === 'main') {
			contentEl.appendChild(utils.el('div', {
				html: '<strong>Quick Controls</strong>'
			}));

			const { row: r1 } = rowLabel('Show Keys Overlay');
			const t1 = makeToggle(settings.showOverlay, v => {
				settings.showOverlay = v;
				save();
				updateOverlay("keyDisplayOverlay");
			});
			r1.appendChild(t1);
			contentEl.appendChild(r1);

			const { row: r2 } = rowLabel('Resource Swapper (Reload Client)');
			const t2 = makeToggle(settings.swapper, v => {
				settings.swapper = v;
				save();
			});
			r2.appendChild(t2);
			contentEl.appendChild(r2);

			// --- Get Rank button ---
			const rankRow = utils.el('div', { cls: 'ov-row' });
			rankRow.appendChild(utils.el('label', { text: 'Player Rank' }));

			const rankBtn = utils.el('button', {
				text: 'Get Rank',
				cls: 'ov-btn',
				listeners: {
					click: () => {
						if (typeof getRank === 'function') {
							getRank();
						} else {
							console.warn('getRank() is not defined');
						}
					}
				}
			});

			rankRow.appendChild(rankBtn);
			contentEl.appendChild(rankRow);
		}


		if (activeTab === 'keys') {
			const {
				row: r2
			} = rowLabel('Show Stats Overlay');
			const t2 = makeToggle(settings.showStats, v => {
				settings.showStats = v;
				save();
				updateOverlay("dsOverlayStats");
			});
			r2.appendChild(t2);
			contentEl.appendChild(r2);
			[{
				label: "Show Date",
				key: "showDate"
			},
			{
				label: "Show Time",
				key: "showTime"
			},
			{
				label: "Show OS",
				key: "showOS"
			},
			{
				label: "Show CPU",
				key: "showCPU"
			},
			{
				label: "Show Server",
				key: "showServer"
			},
			{
				label: "Show Sens",
				key: "showSens"
			},
			{
				label: "Show FPS",
				key: "showFPS"
			},
			{
				label: "Show Ping",
				key: "showPing"
			}
			].forEach(opt => {
				const {
					row
				} = rowLabel(opt.label);
				const toggle = makeToggle(utils.getRaw(opt.key) !== "false", v => {
					utils.setRaw(opt.key, v);
				});
				row.appendChild(toggle);
				contentEl.appendChild(row);
			});
		}

		if (activeTab === 'skins') {
			console.log('activeTab:', activeTab);

			contentEl.appendChild(utils.el('div', {
				html: '<strong>Skin Selector</strong>'
			}));

			// Note about reloading
			const noteEl = utils.el('div', {
				style: {
					padding: '8px 12px',
					background: 'rgba(255, 193, 7, 0.15)',
					borderRadius: '6px',
					marginBottom: '12px',
					fontSize: '12px',
					color: '#ffc107',
					border: '1px solid rgba(255, 193, 7, 0.3)'
				}
			});
			noteEl.textContent = '⚠️ Reload client to apply skin changes';
			contentEl.appendChild(noteEl);

			// Create dropdowns for each weapon type
			const weapons = [
				{ key: 'ar', label: 'Assault Rifle' },
				{ key: 'smg', label: 'SMG' },
				{ key: 'awp', label: 'AWP' },
				{ key: 'shotgun', label: 'Shotgun' }
			];

			weapons.forEach(weapon => {
				const row = utils.el('div', { cls: 'ov-row' });
				row.appendChild(utils.el('label', { text: weapon.label }));

				const select = utils.el('select', { cls: 'ov-select' });
				
				// Add all skin options
				Object.entries(SKIN_OPTIONS).forEach(([value, displayName]) => {
			
					const option = utils.el('option', { text: displayName });
					option.value = value;
					if (settings.selectedSkins[weapon.key] === value) {
						option.selected = true;
					}
					select.appendChild(option);
				});

				select.addEventListener('change', (e) => {
					settings.selectedSkins[weapon.key] = e.target.value;
					save();
					console.log(`Selected ${weapon.label}: ${e.target.value}`);
				});

				row.appendChild(select);
				contentEl.appendChild(row);
			});
		}
		if (activeTab === 'cross') {
			contentEl.appendChild(utils.el('div', {
				html: '<strong>Crosshair Editor</strong>'
			}));
			const enRow = utils.el('div', {
				cls: 'ov-row'
			});
			enRow.appendChild(utils.el('label', {
				text: 'Enable'
			}));
			enRow.appendChild(makeToggle(settings.crossEnable, v => {
				settings.crossEnable = v;
				save();
				updateCrosshair();
			}));
			contentEl.appendChild(enRow);
			const colorRow = utils.el('div', {
				cls: 'ov-row'
			});
			colorRow.appendChild(utils.el('label', {
				text: 'Color'
			}));
			const colorInput = utils.el('input', {
				attrs: {
					type: 'color',
					value: settings.crossColor
				}
			});
			colorInput.addEventListener('input', e => {
				settings.crossColor = e.target.value;
				save();
				updateCrosshair();
			});
			colorRow.appendChild(colorInput);
			contentEl.appendChild(colorRow);
			const sizeRow = utils.el('div', {
				cls: 'ov-row'
			});
			sizeRow.appendChild(utils.el('label', {
				text: 'Size'
			}));
			const sizeInp = utils.el('input', {
				attrs: {
					type: 'range',
					min: 4,
					max: 300,
					value: settings.crossSize
				}
			});
			sizeInp.addEventListener('input', e => {
				settings.crossSize = Number(e.target.value);
				save();
				updateCrosshair();
			});
			sizeRow.appendChild(sizeInp);
			contentEl.appendChild(sizeRow);
			const thickRow = utils.el('div', {
				cls: 'ov-row'
			});
			thickRow.appendChild(utils.el('label', {
				text: 'Thickness'
			}));
			const tInp = utils.el('input', {
				attrs: {
					type: 'range',
					min: 1,
					max: 28,
					value: settings.crossThickness
				}
			});
			tInp.addEventListener('input', e => {
				settings.crossThickness = Number(e.target.value);
				save();
				updateCrosshair();
			});
			thickRow.appendChild(tInp);
			contentEl.appendChild(thickRow);
			const typeRow = utils.el('div', {
				cls: 'ov-row'
			});
			typeRow.appendChild(utils.el('label', {
				text: 'Type'
			}));
			const sel = utils.el('select', {
				cls: 'ov-select'
			});
			Object.keys(CROSSHAIR_TEMPLATES).forEach(k => {
				const o = utils.el('option', {
					text: k
				});
				o.value = k;
				if (settings.crossType === k) o.selected = true;
				sel.appendChild(o);
			});
			sel.addEventListener('change', e => {
				settings.crossType = e.target.value;
				save();
				updateCrosshair();
			});
			typeRow.appendChild(sel);
			contentEl.appendChild(typeRow);
			updateCrosshair();
		}

		if (activeTab === 'gif') {
			contentEl.appendChild(utils.el('div', {
				html: '<strong>GIF Overlay</strong>'
			}));
			const sRow = utils.el('div', {
				cls: 'ov-row'
			});
			sRow.appendChild(utils.el('label', {
				text: 'Enable'
			}));
			sRow.appendChild(makeToggle(settings.showAnimeGif, v => {
				settings.showAnimeGif = v;
				save();
				updateGif();
			}));
			contentEl.appendChild(sRow);

			const scaleRow = utils.el('div', {
				cls: 'ov-row'
			});
			scaleRow.appendChild(utils.el('label', {
				text: 'Scale'
			}));
			const scaleRange = utils.el('input', {
				attrs: {
					type: 'range',
					min: 0.1,
					max: 2,
					step: 0.05,
					value: settings.animeGifScale || 0.6
				}
			});
			scaleRange.addEventListener('input', e => {
				settings.animeGifScale = Number(e.target.value);
				save();
				updateGif();
			});
			scaleRow.appendChild(scaleRange);
			contentEl.appendChild(scaleRow);
		}

		if (activeTab === 'theme') {
			contentEl.appendChild(utils.el('div', {
				html: '<strong>Theme Editor</strong>'
			}));
			const accRow = utils.el('div', {
				cls: 'ov-row'
			});
			accRow.appendChild(utils.el('label', {
				text: 'Accent Color'
			}));
			const accInp = utils.el('input', {
				attrs: {
					type: 'color',
					value: settings.themeData?.accent || '#8da4ff'
				}
			});
			accInp.addEventListener('input', e => {
				settings.themeData = settings.themeData || {};
				settings.themeData.accent = e.target.value;
				applyTheme(settings.themeData);
				save();
			});
			accRow.appendChild(accInp);
			contentEl.appendChild(accRow);
			const textRow = utils.el('div', {
				cls: 'ov-row'
			});
			textRow.appendChild(utils.el('label', {
				text: 'Overlay Text Color (Reload Client)'
			}));
			const textInp = utils.el('input', {
				attrs: {
					type: 'color',
					value: settings.themeData?.text1 || '#8da4ff'
				}
			});
			textInp.addEventListener('input', e => {
				settings.themeData = settings.themeData || {};
				settings.themeData.text1 = e.target.value;
				applyTheme(settings.themeData);
				save();
			});
			textRow.appendChild(textInp);
			contentEl.appendChild(textRow);
			const bgRow = utils.el('div', {
				cls: 'ov-row'
			});
			bgRow.appendChild(utils.el('label', {
				text: 'Background Opacity'
			}));
			const bgInp = utils.el('input', {
				attrs: {
					type: 'range',
					min: 0.15,
					max: 1,
					step: 0.05,
					value: settings.themeData?.bgOpacity || 0.6
				}
			});
			bgInp.addEventListener('input', e => {
				settings.themeData = settings.themeData || {};
				settings.themeData.bgOpacity = Number(e.target.value);
				applyTheme(settings.themeData);
				save();
			});
			bgRow.appendChild(bgInp);
			contentEl.appendChild(bgRow);
		}

		if (activeTab === 'settings') {
			contentEl.appendChild(utils.el('div', {
				html: '<strong>Settings & Hotkeys</strong>'
			}));

			const kb = utils.el('div', {
				cls: 'ov-row',
				style: {
					display: 'flex',
					flexDirection: 'column',
					gap: '4px'
				}
			});

			kb.appendChild(utils.el('label', {
				text: 'Toggle Key'
			}));

			const i = utils.el('input', {
				cls: 'ov-input',
				attrs: {
					type: 'text',
					value: settings.toggleKey || ''
				}
			});

			i.onchange = e => {
				settings.toggleKey = e.target.value.trim();
				document.getElementById('ov-toggle-key').textContent = settings.toggleKey;
				save();
			};

			kb.appendChild(i);
			contentEl.appendChild(kb);

			const r = utils.el('div', {
				style: {
					display: 'flex',
					gap: '8px'
				}
			});

			r.appendChild(utils.el('button', {
				text: 'Save',
				cls: 'ov-btn',
				listeners: {
					click: () => {
						save(true);
						alert('Settings saved');
					}
				}
			}));

			r.appendChild(utils.el('button', {
				text: 'Reset',
				cls: 'ov-btn',
				listeners: {
					click: () => {
						if (confirm('Reset to defaults?')) {
							settings = Object.assign({}, DEFAULTS);
							save(true);
							renderContent();
							updateCrosshair();
							updateOverlay();
							updateGif();
						}
					}
				}
			}));

			contentEl.appendChild(r);
		}

		if (activeTab === 'debug') {
			contentEl.appendChild(utils.el('div', {
				html: '<strong>Debug</strong>'
			}));
			const dump = utils.el('button', {
				text: 'Show State',
				cls: 'ov-btn',
				listeners: {
					click: () => alert(JSON.stringify(settings, null, 2))
				}
			});
			contentEl.appendChild(dump);
		}
	}


	function applyTheme(td) {
		if (!td) return;
		if (td.accent) document.documentElement.style.setProperty('--ov-accent', td.accent);
		if (td.bgOpacity !== undefined) document.documentElement.style.setProperty('--ov-bg', `rgba(12,12,12,${td.bgOpacity})`);
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
		console.log(settings.showAnimeGif);
		const raw = settings.animeGifPath || "anime.gif";
		const abs = path.isAbsolute(raw) ? raw : path.join(base, raw);


		const full = "file:///" + abs.replace(/\\/g, "/");

		const existing = document.getElementById("customGifEl");
		if (existing) existing.remove();
		if (!settings.showAnimeGif || !fs.existsSync(abs)) return;

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
		if (!settings.showOverlay) updateOverlay("keyDisplayOverlay")
		if (!settings.showStats) updateOverlay("dsOverlayStats")
	}
	async function fetchLeaderboardRank(username) {

		try {
			const response = await fetch('https://login.deadshot.io/leaderboards');
			const data = await response.json();
			const categories = ["daily", "weekly", "alltime"];
			const result = {};

			for (const category of categories) {
				if (data[category] && data[category].kills) {
					const leaderboard = data[category].kills;
					leaderboard.sort((a, b) => b.kills - a.kills);
					const player = leaderboard.find(p => p.name === username);
					result[category] = player ? `#${leaderboard.indexOf(player) + 1}` : "Not found";
				} else {
					result[category] = "Not found";
				}

			}
			return `Daily: ${result.daily}\nWeekly: ${result.weekly}\nAll-time: ${result.alltime}`;
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
			background: #1e1e1e;
			padding: 30px;
			border-radius: 12px;
			box-shadow: 0 0 20px rgba(0,0,0,0.5);
			text-align: center;
			color: ${theme.text1};
			min-width: 260px;
		`;

		const label = document.createElement('div');
		label.textContent = 'Enter your username:';
		label.style.cssText = `
			margin-bottom: 10px;
			font-size: 15px;
			opacity: 0.9;
		`;

		const input = document.createElement('input');
		input.type = 'text';
		input.style.cssText = `
			padding: 10px;
			border-radius: 6px;
			border: none;
			width: 100%;
			max-width: 220px;
			margin-bottom: 12px;
			font-size: 16px;
			outline: none;
		`;

		const submit = document.createElement('button');
		submit.textContent = 'Submit';
		submit.style.cssText = `
			padding: 10px 22px;
			border: none;
			border-radius: 6px;
			background: #4CAF50;
			color: ${theme.text1};
			cursor: pointer;
			font-size: 16px;
			transition: background 0.15s ease, transform 0.05s ease;
		`;

		submit.addEventListener('mouseenter', () => {
			submit.style.background = '#43a047';
		});

		submit.addEventListener('mouseleave', () => {
			submit.style.background = '#4CAF50';
		});

		submit.addEventListener('mousedown', () => {
			submit.style.transform = 'scale(0.97)';
		});

		submit.addEventListener('mouseup', () => {
			submit.style.transform = 'scale(1)';
		});

		submit.addEventListener('click', async () => {
			const username = input.value.trim();
			if (!username) return;

			try {
				const rank = await fetchLeaderboardRank(username);
				alert(`${rank}`);
				document.body.removeChild(overlay);
			} catch (err) {
				console.error('Failed to fetch leaderboard rank:', err);
				alert('Failed to fetch rank');
				document.body.removeChild(overlay);
			}
		});

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
	}});
}


module.exports = { GUI }
