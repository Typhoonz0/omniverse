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
        // opts: storageKey (string) - key to save pos, handle (Element) - optional handle element to start drag,
        // onSave: callback(pos) optional
        let dragging = false;
        let offsetX = 0;
        let offsetY = 0;
        const handle = opts.handle || targetEl;
        const storageKey = opts.storageKey || targetEl.id || null;
        const onSave = opts.onSave || (() => { });

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
                } catch { }
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