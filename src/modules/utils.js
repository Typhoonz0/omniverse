const utils = {
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch { }
    },
    get(key, defaultVal = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : defaultVal;
        } catch {
            return defaultVal;
        }
    },
    setRaw(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch { }
    },
    getRaw(key, defaultVal = null) {
        try {
            const raw = localStorage.getItem(key);
            return raw === null ? defaultVal : raw;
        } catch {
            return defaultVal;
        }
    },
    remove(key) {
        try {
            localStorage.removeItem(key);
        } catch { }
    },
    loadPosition(key) {
        return utils.get(`${key}_pos`, null);
    },
    savePosition(key, x, y) {
        utils.set(`${key}_pos`, {
            x,
            y
        });
    },
    injectStyle(css) {
        const s = document.createElement('style');
        s.textContent = css;
        document.head.appendChild(s);
        return s;
    },
    el(tag, opts = {}) {
        const e = document.createElement(tag);

        if (opts.id !== undefined) e.id = opts.id;
        if (opts.cls !== undefined) e.className = opts.cls;

        if (opts.html !== undefined) e.innerHTML = opts.html;
        if (opts.text !== undefined) e.textContent = opts.text;

        if (opts.attrs) {
            for (const [k, v] of Object.entries(opts.attrs)) {
                e.setAttribute(k, v);
            }
        }

        if (opts.style) {
            Object.assign(e.style, opts.style);
        }

        if (opts.listeners) {
            for (const [event, handler] of Object.entries(opts.listeners)) {
                e.addEventListener(event, handler);
            }
        }

        return e;
    },

makeDraggable(targetEl, opts = {}) {
    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;

    const handle = opts.handle || targetEl;
    const storageKey = opts.storageKey || targetEl.id || null;
    const onSave = opts.onSave || (() => {});

    function isInteractive(el) {
        return el.closest(
            'input, textarea, select, button, label, option'
        );
    }

    function start(e) {
        // left click / primary pointer only
        if (e.type === 'mousedown' && e.button !== 0) return;

        // never start drag from interactive elements (sliders, inputs, etc.)
        if (isInteractive(e.target)) return;

        dragging = true;

        const rect = targetEl.getBoundingClientRect();
        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY;

        offsetX = clientX - rect.left;
        offsetY = clientY - rect.top;

        // prevent text selection, but do NOT break inputs
        e.preventDefault?.();
    }

    function move(e) {
        if (!dragging) return;

        const clientX = e.clientX ?? e.touches?.[0]?.clientX;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY;

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

    // pointer events cover mouse + touch cleanly
    handle.addEventListener('pointerdown', start);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);

    // restore saved position
    if (storageKey) {
        const pos = utils.loadPosition(storageKey);
        if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
            targetEl.style.left = pos.x + 'px';
            targetEl.style.top = pos.y + 'px';
            targetEl.style.right = 'auto';
        }
    }

    return {
        destroy() {
            handle.removeEventListener('pointerdown', start);
            window.removeEventListener('pointermove', move);
            window.removeEventListener('pointerup', end);
        }
    };
},

    getTheme(base) {
        const themes = require(path.join(base, 'themes.json'));
        let themeRaw = utils.getRaw('theme');
        let theme;
        let currentPreset;

        try {
            if (!themeRaw) {
                theme = { ...themes.default };
                currentPreset = 'default';
            } else if (themes[themeRaw]) {
                theme = { ...themes[themeRaw] };
                currentPreset = themeRaw;
            } else {
                theme = JSON.parse(themeRaw);
                currentPreset = 'custom';
            }
        } catch {
            theme = { ...themes.default };
            currentPreset = 'default';
        }
        return theme, themes, currentPreset;
    },

    OSInfo() {
        return navigator.platform ? `${navigator.platform}` : 'N/A';
    }

}

module.exports = utils;