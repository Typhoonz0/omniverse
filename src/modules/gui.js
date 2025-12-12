function GUI(utils) {
	const fs = require('fs');
	const path = require('path');

	function findFolder(startDir, folderName) {
		let dir = startDir;
		while (!fs.existsSync(path.join(dir, folderName)) && path.dirname(dir) !== dir) {
			dir = path.dirname(dir);
		}
		if (fs.existsSync(path.join(dir, folderName))) return path.join(dir, folderName);
		return null;
	}

	let dir = __dirname;
	console.log(__dirname);
	let omniversePath = findFolder(dir, 'omniverse');
	let base;
	if (!omniversePath) {
		omniversePath = findFolder(dir, 'app');
	}
	if (!omniversePath) {
		omniversePath = findFolder(dir, 'src');
		base = omniversePath;
	}


	if (!omniversePath) {
		console.error('Neither "omniverse" nor "app" was found!');
	} else {
		console.log('Using folder:', omniversePath);
	}

	console.log('Using folder:', omniversePath);
	if (omniversePath !== base) {
		base = path.join(omniversePath, 'src');
	}

	const _utils = {
		el: (tag, opts = {}) => {
			const e = document.createElement(tag);
			if (opts.text) e.textContent = opts.text;
			if (opts.html) e.innerHTML = opts.html;
			if (opts.cls) e.className = opts.cls;
			if (opts.attrs) for (const k in opts.attrs) e.setAttribute(k, opts.attrs[k]);
			if (opts.style) Object.assign(e.style, opts.style);
			if (opts.listeners) for (const [k, v] of Object.entries(opts.listeners)) e.addEventListener(k, v);
			return e;
		},
		injectStyle: (css) => { const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s); },
		get: (k, fallback) => { try { if (typeof window !== 'undefined' && window.localStorage) { const raw = localStorage.getItem('ov:' + k); if (raw === null) return fallback; return JSON.parse(raw); } } catch (e) { } return fallback; },
		set: (k, v) => { try { if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem('ov:' + k, JSON.stringify(v)); } catch (e) { } },
		setRaw: (key, value) => {
			try {
				localStorage.setItem(key, value);
			} catch { }
		},
		getRaw: (key, defaultVal = null) => {
			try {
				const raw = localStorage.getItem(key);
				return raw === null ? defaultVal : raw;
			} catch {
				return defaultVal;
			}
		},
    makeDraggable(targetEl, opts = {}) {
        // opts: storageKey (string) - key to save pos, handle (Element) - optional handle element to start drag,
        // onSave: callback(pos) optional
        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;
        const handle = opts.handle || targetEl;
        const storageKey = opts.storageKey || targetEl.id || null;
        const onSave = opts.onSave || (() => {});

        function start(e) {
            // only left mouse button or touch
            if ((e.type === 'mousedown' && e.button !== 0) && e.type !== 'touchstart') return;
            dragging = true;
            const rect = targetEl.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;
            e.preventDefault();
        }

        function move(e) {
            if (!dragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            targetEl.style.left = (clientX - offsetX) + 'px';
            targetEl.style.top = (clientY - offsetY) + 'px';
            targetEl.style.right = 'auto';
        }

        function end() {
            if (!dragging) return;
            dragging = false;
            if (storageKey) {
                utils.savePosition(storageKey, targetEl.offsetLeft, targetEl.offsetTop);
                onSave({
                    x: targetEl.offsetLeft,
                    y: targetEl.offsetTop
                });
            }
        }

        handle.addEventListener('mousedown', start);
        handle.addEventListener('touchstart', start, {
            passive: false
        });
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move, {
            passive: false
        });
        window.addEventListener('mouseup', end);
        window.addEventListener('touchend', end);

        // restore pos if any
        if (storageKey) {
            const pos = utils.loadPosition(storageKey);
            if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
                try {
                    targetEl.style.left = pos.x + 'px';
                    targetEl.style.top = pos.y + 'px';
                    targetEl.style.right = 'auto';
                } catch {}
            }
        }

        return {
            destroy() {
                handle.removeEventListener('mousedown', start);
                handle.removeEventListener('touchstart', start);
                window.removeEventListener('mousemove', move);
                window.removeEventListener('touchmove', move);
                window.removeEventListener('mouseup', end);
                window.removeEventListener('touchend', end);
            }
        };
    },
	}
	const U = Object.assign({}, _utils, utils || {});
	// --- Dragging for GUI ---
	function makeDraggable(el) { let dragging = false, sx = 0, sy = 0, ox = 0, oy = 0; const hdr = el.querySelector('header'); if (!hdr) return; hdr.style.cursor = 'grab'; hdr.addEventListener('pointerdown', e => { dragging = true; hdr.setPointerCapture(e.pointerId); sx = e.clientX; sy = e.clientY; const r = el.getBoundingClientRect(); ox = r.left; oy = r.top; hdr.style.cursor = 'grabbing'; }); window.addEventListener('pointermove', e => { if (!dragging) return; el.style.left = (ox + (e.clientX - sx)) + 'px'; el.style.top = (oy + (e.clientY - sy)) + 'px'; }); window.addEventListener('pointerup', e => { if (!dragging) return; dragging = false; try { hdr.releasePointerCapture(e.pointerId); } catch (e) { } hdr.style.cursor = 'grab'; }); }

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
	// --- default settings derived from oldgui ---
	const DEFAULTS = {
		"toggleKey": "o",
		"showOverlay": true,
		"showStats": true,
		"crossEnable": true,
		"crossColor": "#ff0000",
		"crossSize": 30,
		"crossThickness": 4,
		"crossType": "CircleWithDot",
		"showAnimeGif": true,
		"animeGifPath": "",
		"animeGifScale": 0.2,
		"theme": "default",
		"themeData": {
			"accent": "#8da4ff",
			"bgOpacity": 0.6
		},
		"funMode": false,
		"rainbow": false,
		"disableFrameRateLimit": false,
		"forceHighPerformanceGPU": false,
		"adblocker": false,
		"rpc": false,
		"animeGifSize": 100
	}

	// load and merge
	let settings = Object.assign({}, DEFAULTS, readSettings());



	// --- CSS (modernized but flexible) ---
	const css = `
  :root{--ov-accent: ${settings.themeData?.accent || '#8da4ff'}; --ov-bg: rgba(12,12,12,${settings.themeData?.bgOpacity || 0.6}); --ov-panel: rgba(0,0,0,0.45); --ov-text:#ebf0ff}
  #ovGui{position:fixed;left:24px;top:24px;width:340px;border-radius:12px;border:2px solid var(--ov-accent);background:var(--ov-bg);color:var(--ov-text);z-index:999999;display:flex;flex-direction:column;box-shadow:0 16px 40px rgba(0,0,0,0.6)}
  #ovGui header{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--ov-panel);border-top-left-radius:10px;border-top-right-radius:10px;cursor:grab}
  #ovGui .wrap{display:flex}
  #ovGui .tabs{width:130px;background:var(--ov-panel);display:flex;flex-direction:column;border-right:1px solid rgba(255,255,255,0.03)}
  #ovGui .tab{padding:8px 10px;cursor:pointer;color:#cfd7ff;border-left:3px solid transparent}
  #ovGui .tab.active{background:transparent;color:#fff;border-left:3px solid var(--ov-accent)}
  #ovGui .content{flex:1;padding:12px;display:flex;flex-direction:column;gap:8px;max-height:540px;overflow:auto}
  .ov-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
  .ov-row label{flex:1}
  .ov-btn{padding:6px 8px;border-radius:6px;border:none;background:var(--ov-accent);color:#031133;cursor:pointer}
  .ov-input{padding:6px;border-radius:6px;border:1px solid rgba(255,255,255,0.06);background:transparent;color:var(--ov-text)}
  .ov-select{padding:6px;border-radius:6px}
  .ov-toggle{width:44px;height:22px;border-radius:22px;background:rgba(255,255,255,0.12);position:relative;cursor:pointer}
  .ov-toggle .knob{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;transition:transform 0.18s}
  `;
	U.injectStyle(css);

	// --- Crosshair templates (full set) ---
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

	// --- Build GUI skeleton ---
	const gui = U.el('div', { attrs: { id: 'ovGui' } });
	const header = U.el('header'); header.innerHTML = `<div style="font-weight:700">Omniverse | xliam.space</div><div style="opacity:0.9">Toggle: <span id="ov-toggle-key">${settings.toggleKey}</span></div>`;
	gui.appendChild(header);

	const wrap = U.el('div', { cls: 'wrap' });
	const tabsEl = U.el('div', { cls: 'tabs' });
	const contentEl = U.el('div', { cls: 'content' });
	wrap.appendChild(tabsEl); wrap.appendChild(contentEl); gui.appendChild(wrap);

	// tabs list - mirrors oldgui features 
	const TABS = [
		{ id: 'main', label: 'Main' }, { id: 'keys', label: 'Keys' }, { id: 'cross', label: 'Crosshair' }, { id: 'gif', label: 'GIF' }, { id: 'theme', label: 'Theme' }, { id: 'settings', label: 'Settings' }, { id: 'debug', label: 'Debug' }
	];
	let activeTab = 'main';

	function createTabs() { tabsEl.innerHTML = ''; TABS.forEach(t => { const b = U.el('div', { cls: 'tab', text: t.label, listeners: { click: () => { setActiveTab(t.id); } } }); b.dataset.tabId = t.id; if (t.id === activeTab) b.classList.add('active'); tabsEl.appendChild(b); }); }
	function setActiveTab(id) { activeTab = id; Array.from(tabsEl.children).forEach(c => c.classList.toggle('active', c.dataset.tabId === id)); renderContent(); }

	// small UI helpers
	function rowLabel(text) { const r = U.el('div', { cls: 'ov-row' }); const l = U.el('label', { text }); l.style.fontSize = '13px'; r.appendChild(l); return { row: r, label: l }; }
	function makeToggle(state, onChange) { const t = U.el('div', { cls: 'ov-toggle' }); const k = U.el('div', { cls: 'knob' }); t.appendChild(k); t.dataset.on = state ? 1 : 0; if (state) k.style.transform = 'translateX(22px)'; t.addEventListener('click', () => { const now = t.dataset.on === '1' ? false : true; t.dataset.on = now ? 1 : 0; k.style.transform = now ? 'translateX(22px)' : ''; onChange(now); }); return t; }


	// render per-tab content
	function renderContent() {
		contentEl.innerHTML = '';
		if (activeTab === 'main') {
			contentEl.appendChild(U.el('div', { html: '<strong>Quick Controls</strong>' }));
			const { row: r1 } = rowLabel('Show Keys Overlay'); const t1 = makeToggle(settings.showOverlay, v => { settings.showOverlay = v; save(); updateOverlay("keyDisplayOverlay"); }); r1.appendChild(t1); contentEl.appendChild(r1);
			const { row: r2 } = rowLabel('Resource Swapper (Reload Client)'); const t2 = makeToggle(settings.adblocker, v => { settings.adblocker = v; save(); }); r2.appendChild(t2); contentEl.appendChild(r2);
		}

		if (activeTab === 'keys') {
			const { row: r2 } = rowLabel('Show Stats Overlay'); const t2 = makeToggle(settings.showStats, v => { settings.showStats = v; save(); updateOverlay("dsOverlayStats"); }); r2.appendChild(t2); contentEl.appendChild(r2);
			[
				{ label: "Show Date", key: "showDate" },
				{ label: "Show Time", key: "showTime" },
				{ label: "Show OS", key: "showOS" },
				{ label: "Show CPU", key: "showCPU" },
				{ label: "Show Server", key: "showServer" },
				{ label: "Show Sens", key: "showSens" },
				{ label: "Show FPS", key: "showFPS" },
				{ label: "Show Ping", key: "showPing" }
			].forEach(opt => {
				const { row } = rowLabel(opt.label);
				const toggle = makeToggle(U.getRaw(opt.key) !== "false", v => {
					U.setRaw(opt.key, v);
				});
				row.appendChild(toggle);
				contentEl.appendChild(row);
			});
		}

		if (activeTab === 'cross') {
			contentEl.appendChild(U.el('div', { html: '<strong>Crosshair Editor</strong>' }));
			const enRow = U.el('div', { cls: 'ov-row' }); enRow.appendChild(U.el('label', { text: 'Enable' })); enRow.appendChild(makeToggle(settings.crossEnable, v => { settings.crossEnable = v; save(); updateCrosshair(); })); contentEl.appendChild(enRow);
			const colorRow = U.el('div', { cls: 'ov-row' }); colorRow.appendChild(U.el('label', { text: 'Color' })); const colorInput = U.el('input', { attrs: { type: 'color', value: settings.crossColor } }); colorInput.addEventListener('input', e => { settings.crossColor = e.target.value; save(); updateCrosshair(); }); colorRow.appendChild(colorInput); contentEl.appendChild(colorRow);
			const sizeRow = U.el('div', { cls: 'ov-row' }); sizeRow.appendChild(U.el('label', { text: 'Size' })); const sizeInp = U.el('input', { attrs: { type: 'range', min: 4, max: 300, value: settings.crossSize } }); sizeInp.addEventListener('input', e => { settings.crossSize = Number(e.target.value); save(); updateCrosshair(); }); sizeRow.appendChild(sizeInp); contentEl.appendChild(sizeRow);
			const thickRow = U.el('div', { cls: 'ov-row' }); thickRow.appendChild(U.el('label', { text: 'Thickness' })); const tInp = U.el('input', { attrs: { type: 'range', min: 1, max: 28, value: settings.crossThickness } }); tInp.addEventListener('input', e => { settings.crossThickness = Number(e.target.value); save(); updateCrosshair(); }); thickRow.appendChild(tInp); contentEl.appendChild(thickRow);
			const typeRow = U.el('div', { cls: 'ov-row' }); typeRow.appendChild(U.el('label', { text: 'Type' })); const sel = U.el('select', { cls: 'ov-select' }); Object.keys(CROSSHAIR_TEMPLATES).forEach(k => { const o = U.el('option', { text: k }); o.value = k; if (settings.crossType === k) o.selected = true; sel.appendChild(o); }); sel.addEventListener('change', e => { settings.crossType = e.target.value; save(); updateCrosshair(); }); typeRow.appendChild(sel); contentEl.appendChild(typeRow);
			contentEl.appendChild(U.el('div', { html: '<em>Preview</em>' })); updateCrosshair();
		}

		if (activeTab === 'gif') {
			contentEl.appendChild(U.el('div', { html: '<strong>GIF Overlay</strong>' }));
			const sRow = U.el('div', { cls: 'ov-row' }); sRow.appendChild(U.el('label', { text: 'Enable' })); sRow.appendChild(makeToggle(settings.showAnimeGif, v => { settings.showAnimeGif = v; save(); updateGif(); })); contentEl.appendChild(sRow);
			const pathRow = U.el('div', { cls: 'ov-row' }); pathRow.appendChild(U.el('label', { text: 'GIF Path / URL' })); const pathInp = U.el('input', { cls: 'ov-input', attrs: { type: 'text', value: settings.animeGifPath || '' } }); pathInp.addEventListener('change', e => { settings.animeGifPath = e.target.value; save(); updateGif(); }); pathRow.appendChild(pathInp); contentEl.appendChild(pathRow);
			const scaleRow = U.el('div', { cls: 'ov-row' }); scaleRow.appendChild(U.el('label', { text: 'Scale' })); const scaleRange = U.el('input', { attrs: { type: 'range', min: 0.1, max: 2, step: 0.05, value: settings.animeGifScale || 0.6 } }); scaleRange.addEventListener('input', e => { settings.animeGifScale = Number(e.target.value); save(); updateGif(); }); scaleRow.appendChild(scaleRange); contentEl.appendChild(scaleRow);
			contentEl.appendChild(U.el('div', { html: '<em>Local file paths work in desktop runs; otherwise provide a URL.</em>' }));
		}

		if (activeTab === 'theme') {
			contentEl.appendChild(U.el('div', { html: '<strong>Theme Editor</strong>' }));
			const accRow = U.el('div', { cls: 'ov-row' }); accRow.appendChild(U.el('label', { text: 'Accent Color' })); const accInp = U.el('input', { attrs: { type: 'color', value: settings.themeData?.accent || '#8da4ff' } }); accInp.addEventListener('input', e => { settings.themeData = settings.themeData || {}; settings.themeData.accent = e.target.value; applyTheme(settings.themeData); save(); }); accRow.appendChild(accInp); contentEl.appendChild(accRow);
			const bgRow = U.el('div', { cls: 'ov-row' }); bgRow.appendChild(U.el('label', { text: 'Background Opacity' })); const bgInp = U.el('input', { attrs: { type: 'range', min: 0.15, max: 1, step: 0.05, value: settings.themeData?.bgOpacity || 0.6 } }); bgInp.addEventListener('input', e => { settings.themeData = settings.themeData || {}; settings.themeData.bgOpacity = Number(e.target.value); applyTheme(settings.themeData); save(); }); bgRow.appendChild(bgInp); contentEl.appendChild(bgRow);
		}

		if (activeTab === 'settings') {
			contentEl.appendChild(U.el('div', { html: '<strong>Settings & Hotkeys</strong>' }));

			const kb = U.el('div', {
				cls: 'ov-row',
				style: { display: 'flex', flexDirection: 'column', gap: '4px' }
			});

			kb.appendChild(U.el('label', { text: 'Toggle Key' }));

			const i = U.el('input', {
				cls: 'ov-input',
				attrs: { type: 'text', value: settings.toggleKey || '' }
			});

			i.onchange = e => {
				settings.toggleKey = e.target.value.trim();
				document.getElementById('ov-toggle-key').textContent = settings.toggleKey;
				save();
			};

			kb.appendChild(i);
			contentEl.appendChild(kb);

			const r = U.el('div', { style: { display: 'flex', gap: '8px' } });

			r.appendChild(U.el('button', {
				text: 'Save',
				cls: 'ov-btn',
				listeners: { click: () => { save(true); alert('Settings saved'); } }
			}));

			r.appendChild(U.el('button', {
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
			contentEl.appendChild(U.el('div', { html: '<strong>Debug</strong>' }));
			const dump = U.el('button', { text: 'Show State', cls: 'ov-btn', listeners: { click: () => alert(JSON.stringify(settings, null, 2)) } });
			contentEl.appendChild(dump);
		}
	}

	
	function applyTheme(td) { if (!td) return; if (td.accent) document.documentElement.style.setProperty('--ov-accent', td.accent); if (td.bgOpacity !== undefined) document.documentElement.style.setProperty('--ov-bg', `rgba(12,12,12,${td.bgOpacity})`); }
	if (settings.themeData) applyTheme(settings.themeData);

	// --- overlays (crosshair, keys, gif) ---
	let crossEl = null, overlayEl = null, gifEl = null;
	function ensureOverlays() { if (!crossEl) { crossEl = U.el('div', { style: { position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 999998 } }); document.body.appendChild(crossEl); } if (!overlayEl) { overlayEl = U.el('div', { style: { position: 'fixed', right: '14px', bottom: '14px', pointerEvents: 'none', zIndex: 999998 } }); document.body.appendChild(overlayEl);  } }

	function updateCrosshair() { ensureOverlays(); crossEl.innerHTML = ''; if (!settings.crossEnable) return; const tpl = CROSSHAIR_TEMPLATES[settings.crossType] || CROSSHAIR_TEMPLATES.Cross; crossEl.innerHTML = tpl(settings.crossSize, settings.crossColor, settings.crossThickness); }

	function updateOverlay(id) {
		const el = document.getElementById(id);
		if (!el) return;

		const currentlyHidden = el.style.display === 'none';

		// Toggle visibility
		el.style.display = currentlyHidden ? '' : 'none';

		console.log(`[OVERLAY] ${id} => ${currentlyHidden ? 'ON' : 'OFF'}`);
	}
function updateGif() {
    ensureOverlays();

    const fs = require('fs');
    const path = require('path');

    const raw = settings.animeGifPath || 'anime.gif';
    const abs = path.isAbsolute(raw) ? raw : path.join(base, raw);

    if (!settings.showAnimeGif || !fs.existsSync(abs)) return;

    const full = 'file:///' + abs.replace(/\\/g, '/');

    // Remove previous GIF element if it exists
    let gifEl = document.getElementById('customGifEl');
    if (gifEl) gifEl.remove();

    // Create a new GIF container
    gifEl = document.createElement('div');
    gifEl.id = 'customGifEl';
    gifEl.style.position = 'absolute';
    gifEl.style.left = '0px';
    gifEl.style.top = '0px';
    gifEl.style.cursor = 'move';
    gifEl.style.zIndex = 9999;

    // Create the GIF image
    const img = document.createElement('img');
    img.src = full;
    img.style.maxWidth = '45vw';
    img.style.transform = `scale(${settings.animeGifScale})`;
    img.style.borderRadius = '8px';
    img.style.opacity = '0.95';
    img.style.display = 'block';


    gifEl.appendChild(img);
    document.body.appendChild(gifEl);

    // Make the container draggable
    U.makeDraggable(gifEl, { storageKey: 'animeGif_pos' });

}


	if (settings.rainbow) {
		try {
			window.toggleRainbow();
		} catch {

		}
	}
	// --- FPS and keys overlay logic ---
	let lastTick = performance.now(), frameCount = 0; function fpsLoop() { const now = performance.now(); frameCount++; if (now - lastTick >= 500) { const fps = Math.round((frameCount * 1000) / (now - lastTick)); frameCount = 0; lastTick = now; const fEl = document.getElementById('ov-fps'); if (fEl) fEl.textContent = fps; } requestAnimationFrame(fpsLoop); } requestAnimationFrame(fpsLoop);

	const pressed = new Set(); window.addEventListener('keydown', e => { pressed.add(e.key); updateKeys(); if (e.key === settings.toggleKey) gui.style.display = gui.style.display === 'none' ? 'flex' : 'none'; }); window.addEventListener('keyup', e => { pressed.delete(e.key); updateKeys(); });
	function updateKeys() { const el = document.getElementById('ov-keys'); if (el) el.textContent = Array.from(pressed).slice(0, 6).join(', ') || '-'; }

	// --- Save / periodic auto-save ---
	function save(forceFile) { writeSettings(settings); U.set('toggleKey', settings.toggleKey); }
	setInterval(() => { writeSettings(settings); }, 5000);


	// --- API exposure (compatibility with oldgui globals) ---
	const API = { show: () => gui.style.display = 'flex', hide: () => gui.style.display = 'none', toggle: () => { gui.style.display = gui.style.display === 'none' ? 'flex' : 'none'; }, saveSettings: () => save(true), getSettings: () => settings, setSetting: (k, v) => { settings[k] = v; save(); } };
	window.OV_GUI = API; window.OV_SETTINGS = settings; window.OV_SAVE = save;

	// initialize and mount
	createTabs(); renderContent(); document.body.appendChild(gui); makeDraggable(gui); ensureOverlays(); updateCrosshair(); updateOverlay(); updateGif(); 

	return API;
}

// So the GUI gets created on import very broken but it works
try { if (typeof window !== 'undefined') window.OMNIVERSE_GUI = GUI(window.utils || null, window.theme || {}, window.themes || {}, null, null); } catch (e) { console.log(e) }