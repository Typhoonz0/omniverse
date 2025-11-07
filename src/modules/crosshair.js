class CrosshairOverlay {
    constructor(utils) {
        this.utils = utils;
        this.STORAGE_KEY = 'crosshairSettings_v1';
        this.crosshairTypes = this.createCrosshairTypes();
        this.injectStyles();
    }

    // --- STYLES ---
    injectStyles() {
        const css = `
        #customCrosshair {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            pointer-events: none;
            z-index: 9999;
        }
        #crosshairSettings {
            background: rgba(20,20,20,0.6);
            backdrop-filter: blur(10px);
            color: #fff;
            font-family: 'Segoe UI', sans-serif;
            border-radius: 12px;
            box-shadow: 0 0 12px rgba(0,0,0,0.4);
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 8px;
            transition: all 0.3s ease;
            z-index: 9999;
        }
        #crosshairSettings label { font-size: 13px; }
        #crosshairSettings input, #crosshairSettings select {
            width: 100%;
            padding: 6px;
            font-size: 13px;
            color: #fff;
            background: rgba(255,255,255,0.1);
            border: none;
            border-radius: 6px;
        }
        #crosshairSettings select, #crosshairSettings option {
            color: #fff;
            background: rgba(30,30,30,0.9);
            font-weight: bold;
        }`;
        this.utils.injectStyle(css);
    }

    // --- SHAPES ---
    createCrosshairTypes() {
        return {
        "None": (s, c) => ``,
        "Dot": (s, c) => `<div style="width:${s}px;height:${s}px;background:${c};border-radius:50%;"></div>`,
        "Cross": (s, c, t) => `
            <div style="position:relative;width:${s}px;height:${s}px;">
                <div style="position:absolute;top:50%;left:0;width:100%;height:${t}px;background:${c};transform:translateY(-50%)"></div>
                <div style="position:absolute;left:50%;top:0;height:100%;width:${t}px;background:${c};transform:translateX(-50%)"></div>
            </div>`,
        "T-Shaped": (s, c, t) => `
            <div style="position:relative;width:${s}px;height:${s}px;">
                <div style="position:absolute;top:50%;left:0;width:100%;height:${t}px;background:${c};transform:translateY(-50%)"></div>
                <div style="position:absolute;left:50%;top:50%;width:${t}px;height:50%;background:${c};transform:translate(-50%, -50%)"></div>
            </div>`,
        "Circle": (s, c, t) => `<div style="width:${s}px;height:${s}px;border:${t}px solid ${c};border-radius:50%;"></div>`,
        "Chevron": (s, c) => `<div style="width:0;height:0;border-left:${s/2}px solid transparent;border-right:${s/2}px solid transparent;border-bottom:${s}px solid ${c};"></div>`,
        "Box": (s, c, t) => `<div style="width:${s}px;height:${s}px;border:${t}px solid ${c};"></div>`,
        "X-Shaped": (s, c, t) => `
            <div style="position:relative;width:${s}px;height:${s}px;">
                <div style="position:absolute;width:${t}px;height:100%;background:${c};transform:rotate(45deg);left:50%;top:0;transform-origin:center;"></div>
                <div style="position:absolute;width:${t}px;height:100%;background:${c};transform:rotate(-45deg);left:50%;top:0;transform-origin:center;"></div>
            </div>`,
        "Four Corners": (s, c, t) => `
            <div style="position:relative;width:${s}px;height:${s}px;">
                ${["top:0;left:0","top:0;right:0","bottom:0;left:0","bottom:0;right:0"].map(pos=>`
                    <div style="position:absolute;${pos};width:${s/4}px;height:${t}px;background:${c};"></div>
                    <div style="position:absolute;${pos};width:${t}px;height:${s/4}px;background:${c};"></div>`).join('')}
            </div>`,
        "Split Cross": (s, c, t) => `
            <div style="position:relative;width:${s}px;height:${s}px;">
                <div style="position:absolute;top:0;left:50%;width:${t}px;height:${s/2-5}px;background:${c};transform:translateX(-50%)"></div>
                <div style="position:absolute;bottom:0;left:50%;width:${t}px;height:${s/2-5}px;background:${c};transform:translateX(-50%)"></div>
                <div style="position:absolute;left:0;top:50%;width:${s/2-5}px;height:${t}px;background:${c};transform:translateY(-50%)"></div>
                <div style="position:absolute;right:0;top:50%;width:${s/2-5}px;height:${t}px;background:${c};transform:translateY(-50%)"></div>
            </div>`,
        "Star": (s, c, t) => `
            <div style="position:relative;width:${s}px;height:${s}px;">
                <div style="position:absolute;left:50%;top:0;width:${t}px;height:100%;background:${c};transform:translateX(-50%)"></div>
                <div style="position:absolute;top:50%;left:0;width:100%;height:${t}px;background:${c};transform:translateY(-50%)"></div>
                <div style="position:absolute;width:${t}px;height:100%;background:${c};transform:rotate(45deg);left:50%;top:0;transform-origin:center;"></div>
                <div style="position:absolute;width:${t}px;height:100%;background:${c};transform:rotate(-45deg);left:50%;top:0;transform-origin:center;"></div>
            </div>`,
        "Diamond": (s, c) => `<div style="width:${s}px;height:${s}px;background:${c};transform:rotate(45deg);"></div>`,
        "Triangle": (s, c) => `<div style="width:0;height:0;border-left:${s/2}px solid transparent;border-right:${s/2}px solid transparent;border-bottom:${s}px solid ${c};"></div>`,
        "Horizontal Line": (s, c, t) => `<div style="width:${s}px;height:${t}px;background:${c};"></div>`,
        "Vertical Line": (s, c, t) => `<div style="width:${t}px;height:${s}px;background:${c};"></div>`,
        "Circle with Dot": (s, c, t) => `
            <div style="position:relative;width:${s}px;height:${s}px;border:${t}px solid ${c};border-radius:50%;">
                <div style="position:absolute;top:50%;left:50%;width:${s/5}px;height:${s/5}px;background:${c};border-radius:50%;transform:translate(-50%,-50%);"></div>
            </div>`,
        "Ringed Cross": (s, c, t) => `
            <div style="position:relative;width:${s}px;height:${s}px;">
                <div style="position:absolute;inset:0;border:${t}px solid ${c};border-radius:50%;box-sizing:border-box;"></div>
                <div style="position:absolute;top:50%;left:${t * 1.5}px;width:calc(100% - ${t * 3}px);height:${t}px;background:${c};transform:translateY(-50%);"></div>
                <div style="position:absolute;left:50%;top:${t * 1.5}px;height:calc(100% - ${t * 3}px);width:${t}px;background:${c};transform:translateX(-50%);"></div>
            </div>`
    };

    }

    // --- CREATE ---
    createCrosshair(type, size, color, thickness, opacity) {
        const crosshair = this.utils.el('div', { id: 'customCrosshair' });
        crosshair.style.opacity = opacity;
        const generator = this.crosshairTypes[type] || (() => '');
        crosshair.innerHTML = generator(size, color, thickness);
        return crosshair;
    }

    // --- SETTINGS STORAGE ---
    saveSettings() {
        const settings = {
            type: document.getElementById('chType').value,
            size: document.getElementById('chSize').value,
            color: document.getElementById('chColor').value,
            thickness: document.getElementById('chThickness').value,
            opacity: document.getElementById('chOpacity').value
        };
        this.utils.set(this.STORAGE_KEY, settings);
    }

    loadSettings() {
        return this.utils.get(this.STORAGE_KEY, null);
    }

    // --- SETTINGS PANEL ---
createSettingsPanel() {
    const panel = this.utils.el('div', { id: 'crosshairSettings' });
    panel.innerHTML = `
        <label>Type:</label>
        <select id="chType">
            ${Object.keys(this.crosshairTypes)
                .map(t => `<option value="${t}">${t}</option>`)
                .join('')}
        </select>
        <label>Size (px):</label>
        <input id="chSize" type="number" value="30" min="5" max="200">
        <label>Color:</label>
        <input id="chColor" type="color" value="#ff0000">
        <label>Thickness (px):</label>
        <input id="chThickness" type="number" value="2" min="1" max="10">
        <label>Opacity (0–1):</label>
        <input id="chOpacity" type="number" value="1" step="0.1" min="0.1" max="1">
    `;

    // Attach live update listeners after the DOM elements exist
    const inputs = panel.querySelectorAll('input, select');
    inputs.forEach(el => {
        el.addEventListener('input', () => {
            this.updateCrosshair();
            this.saveSettings();
        });
        el.addEventListener('change', () => {
            this.updateCrosshair();
            this.saveSettings();
        });
    });
    this.loadSettings();
    return panel;
}


    // --- UPDATE & INIT ---
    updateCrosshair() {
        const type = document.getElementById('chType')?.value || 'Dot';
        const size = parseInt(document.getElementById('chSize')?.value || 30, 10);
        const color = document.getElementById('chColor')?.value || '#ff0000';
        const thickness = parseInt(document.getElementById('chThickness')?.value || 2, 10);
        const opacity = parseFloat(document.getElementById('chOpacity')?.value || 1);

        const old = document.getElementById('customCrosshair');
        if (old) old.remove();

        const crosshair = this.createCrosshair(type, size, color, thickness, opacity);
        document.body.appendChild(crosshair);
    }

    init() {
        const saved = this.loadSettings();
        console.log(saved);
        if (saved) {
            try {
                document.getElementById('chType').value = saved.type;
                document.getElementById('chSize').value = saved.size;
                document.getElementById('chColor').value = saved.color;
                document.getElementById('chThickness').value = saved.thickness;
                document.getElementById('chOpacity').value = saved.opacity;
            } catch (e) {
                console.warn('CrosshairOverlay: failed to restore settings', e);
            }
        }

        this.updateCrosshair();
    }
}

module.exports = { CrosshairOverlay };
