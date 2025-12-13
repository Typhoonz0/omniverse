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
            </div>`
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

	const TABS = [{
		id: 'main',
		label: 'Main'
	}, {
		id: 'keys',
		label: 'Keys'
	}, {
		id: 'cross',
		label: 'Crosshair'
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
		label: 'Debug'
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
			const {
				row: r1
			} = rowLabel('Show Keys Overlay');
			const t1 = makeToggle(settings.showOverlay, v => {
				settings.showOverlay = v;
				save();
				updateOverlay("keyDisplayOverlay");
			});
			r1.appendChild(t1);
			contentEl.appendChild(r1);
			const {
				row: r2
			} = rowLabel('Resource Swapper (Reload Client)');
			const t2 = makeToggle(settings.adblocker, v => {
				settings.adblocker = v;
				save();
			});
			r2.appendChild(t2);
			contentEl.appendChild(r2);
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
			contentEl.appendChild(utils.el('div', {
				html: '<em>Preview</em>'
			}));
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
			const pathRow = utils.el('div', {
				cls: 'ov-row'
			});
			pathRow.appendChild(utils.el('label', {
				text: 'GIF Path / URL'
			}));
			const pathInp = utils.el('input', {
				cls: 'ov-input',
				attrs: {
					type: 'text',
					value: settings.animeGifPath || ''
				}
			});
			pathInp.addEventListener('change', e => {
				settings.animeGifPath = e.target.value;
				save();
				updateGif();
			});
			pathRow.appendChild(pathInp);
			contentEl.appendChild(pathRow);
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
			contentEl.appendChild(utils.el('div', {
				html: '<em>Local file paths work in desktop runs; otherwise provide a URL.</em>'
			}));
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
	let	overlayEl;

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
		const abs = path.isAbsolute(raw) ? raw : path.join(base, raw);

		if (!settings.showAnimeGif || !fs.existsSync(abs)) return;

		const full = "file:///" + abs.replace(/\\/g, "/");

		const existing = document.getElementById("customGifEl");
		if (existing) existing.remove();

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

	createTabs();
	renderContent();
	document.body.appendChild(gui);
	utils.makeDraggable(gui);
	ensureOverlays();
	updateCrosshair();
	updateOverlay();
	updateGif();
}

module.exports = { GUI }