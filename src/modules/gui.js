function GUI(utils) {
	function resolvePath(raw, base) {
		if (raw.startsWith("/") || /^[A-Za-z]:[\\/]/.test(raw)) return raw;
		return base + "/" + raw;
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
	header.innerHTML = `<div style="font-weight:700">Omniverse | xliam.xyz</div><div style="opacity:0.9">Toggle: <span id="ov-toggle-key">${settings.toggleKey}</span></div>`;
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
	const TABS = [{
		id: 'main',
		label: 'Main'
	}, {
		id: 'stats',
		label: 'Stats'
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
		id: 'other',
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
			contentEl.appendChild(utils.el('div', {
				html: '<strong>Check xliam.xyz for updates every week</strong>'
			}));
			const resRow = utils.el('div', {
				cls: 'ov-row'
			});
			resRow.appendChild(utils.el('label', {
				text: 'Resource Swapper (Reload Client)'
			}));
			resRow.appendChild(makeToggle(settings.swapper, v => {
				settings.swapper = v;
				save();
			}));

			const fullscreenRow = utils.el('div', {
				cls: 'ov-row'
			});
			fullscreenRow.appendChild(utils.el('label', {
				text: 'Open in fullscreen'
			}));
			fullscreenRow.appendChild(makeToggle(settings.largewindow, v => {
				settings.largewindow = v;
				save();
			}));
			contentEl.appendChild(fullscreenRow);

			const upcapFPSRow = utils.el('div', {
				cls: 'ov-row'
			});
			upcapFPSRow.appendChild(utils.el('label', {
				text: 'Uncap FPS'
			}));
			upcapFPSRow.appendChild(makeToggle(settings.disableFrameRateLimit, v => {
				settings.disableFrameRateLimit = v;
				settings.forceHighPerformanceGPU = v;
				save();
			}));
			contentEl.appendChild(upcapFPSRow);

			const statRow = utils.el('div', {
				cls: 'ov-row'
			});
			statRow.appendChild(utils.el('label', {
				text: 'Stats Overlay'
			}));
			statRow.appendChild(makeToggle(settings.showStats, v => {
				settings.showStats = v;
				save();
				updateOverlay("dsOverlayStats");
			}));
			contentEl.appendChild(statRow);

			const keyRow = utils.el('div', {
				cls: 'ov-row'
			});
			keyRow.appendChild(utils.el('label', {
				text: 'Keys Overlay'
			}));
			keyRow.appendChild(makeToggle(settings.showOverlay, v => {
				settings.showOverlay = v;
				save();
				updateOverlay("keyDisplayOverlay");
			}));
			contentEl.appendChild(keyRow);

			const crossRow = utils.el('div', {
				cls: 'ov-row'
			});
			crossRow.appendChild(utils.el('label', {
				text: 'Crosshair'
			}));
			crossRow.appendChild(makeToggle(settings.crossEnable, v => {
				settings.crossEnable = v;
				save();
				updateCrosshair();
			}));
			contentEl.appendChild(crossRow);

			const gifRow = utils.el('div', {
				cls: 'ov-row'
			});
			gifRow.appendChild(utils.el('label', {
				text: 'GIF'
			}));
			gifRow.appendChild(makeToggle(settings.showAnimeGif, v => {
				settings.showAnimeGif = v;
				save();
				updateGif();
			}));
			contentEl.appendChild(gifRow);

		}

		if (activeTab === 'stats') {
			contentEl.appendChild(utils.el('div', {
				html: '<strong>Stats Overlay</strong>'
			}));

			const enRow = utils.el('div', {
				cls: 'ov-row'
			});
			enRow.appendChild(utils.el('label', {
				text: 'Enable'
			}));
			enRow.appendChild(makeToggle(settings.showStats, v => {
				settings.showStats = v;
				save();
				updateOverlay("dsOverlayStats");
			}));
			contentEl.appendChild(enRow);

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

				const row = utils.el('div', {
					cls: 'ov-row'
				});
				row.appendChild(utils.el('label', {
					text: opt.label
				}));
				row.appendChild(makeToggle(utils.getRaw(opt.key) !== "false", v => {
					utils.setRaw(opt.key, v);
				}));
				contentEl.appendChild(row);

			});
		}

		if (activeTab === 'keys') {
			contentEl.appendChild(utils.el('div', {
				html: '<strong>Keys Overlay</strong>'
			}));

			const enRow = utils.el('div', {
				cls: 'ov-row'
			});
			enRow.appendChild(utils.el('label', {
				text: 'Enable'
			}));
			enRow.appendChild(makeToggle(settings.showOverlay, v => {
				settings.showOverlay = v;
				save();
				updateOverlay("keyDisplayOverlay");
			}));
			contentEl.appendChild(enRow);

			const movRow = utils.el('div', {
				cls: 'ov-row'
			});
			movRow.appendChild(utils.el('label', {
				text: 'Movement Keys Color (Reload Client)'
			}));
			const movInp = utils.el('input', {
				attrs: {
					type: 'color',
					value: settings.themeData?.red1 || '#8da4ff'
				}
			});
			movInp.addEventListener('input', e => {
				settings.themeData = settings.themeData || {};
				settings.themeData.red1 = e.target.value;
				save();
			});
			movRow.appendChild(movInp);
			contentEl.appendChild(movRow);

			const actRow = utils.el('div', {
				cls: 'ov-row'
			});
			actRow.appendChild(utils.el('label', {
				text: 'Actions Keys Color (Reload Client)'
			}));
			const actInp = utils.el('input', {
				attrs: {
					type: 'color',
					value: settings.themeData?.red2 || '#8da4ff'
				}
			});
			actInp.addEventListener('input', e => {
				settings.themeData = settings.themeData || {};
				settings.themeData.red2 = e.target.value;
				save();
			});
			actRow.appendChild(actInp);
			contentEl.appendChild(actRow);
		}

		if (activeTab === 'skins') {
			console.log('activeTab:', activeTab);

			contentEl.appendChild(utils.el('div', {
				html: '<strong>Skin Selector</strong>'
			}));

			contentEl.appendChild(utils.el('div', {
				html: 'Reload to apply changes<br>Order: AR, SMG, AWP, Shotgun'
			}));

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

		if (activeTab === 'other') {
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

			const debugRow = utils.el('div', { cls: 'ov-row' });
			debugRow.appendChild(utils.el('label', { text: 'Debug' }));
			const debugBtn = utils.el('button', {
				text: 'Show State',
				cls: 'ov-btn',
				listeners: {
					click: () => alert(JSON.stringify(settings, null, 2))
				}
			});
			debugRow.appendChild(debugBtn);
			contentEl.appendChild(debugRow);

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
		const raw = settings.animeGifPath || "anime.gif";
		const abs = resolvePath(raw, _payload.base);
		const full = "file:///" + abs.replace(/\\/g, "/");

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
		if (!settings.showOverlay) updateOverlay("keyDisplayOverlay")
		if (!settings.showStats) updateOverlay("dsOverlayStats")
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
		title.textContent = 'Rank Lookup';
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
	}});
}


module.exports = { GUI }
