function CrosshairOverlay(utils) {

    /* -------------------------
       Component: Crosshair Editor
       ------------------------- */
    const STORAGE_KEY = 'crosshairSettings_v1';
    const crosshairCSS = `
    #customCrosshair {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 9999;
    }
    #toggleButton {
        position: fixed;
        top: 15px;
        left: 15px;
        background: linear-gradient(135deg, #ff416c, #ff4b2b);
        color: #fff;
        padding: 8px 14px;
        font-size: 14px;
        font-weight: bold;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        z-index: 9999;
        box-shadow: 0 0 8px rgba(255,75,43,0.6);
        transition: all 0.3s ease;
    }
    #toggleButton:hover { transform: scale(1.05); box-shadow: 0 0 12px rgba(255,75,43,0.9); }
    #crosshairSettings {
        position: fixed;
        top: 60px;
        right: 20px;
        width: 240px;
        background: rgba(20,20,20,0.6);
        backdrop-filter: blur(10px);
        color: #fff;
        font-family: 'Segoe UI', sans-serif;
        border-radius: 12px;
        box-shadow: 0 0 12px rgba(0,0,0,0.4);
        padding: 12px;
        display: none;
        transition: all 0.3s ease;
        z-index: 9999;
    }
    #crosshairSettings label { display: block; margin-top: 8px; font-size: 13px; }
    #crosshairSettings input, #crosshairSettings select { width: 100%; margin: 4px 0 10px; padding: 6px; font-size: 13px; color: #fff; background: rgba(255,255,255,0.1); border: none; border-radius: 6px; }
    #crosshairSettings select, #crosshairSettings option { color: #fff; background: rgba(30,30,30,0.9); font-weight: bold; }`;
    utils.injectStyle(crosshairCSS);

    // Crosshair generators (kept same as original)
    const crosshairTypes = {
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

    function createCrosshair(type, size, color, thickness, opacity) {
        const container = utils.el('div', {
            id: 'customCrosshair'
        });
        container.style.opacity = opacity;
        const generator = crosshairTypes[type] || (() => '');
        container.innerHTML = generator(size, color, thickness);
        return container;
    }

    function saveCrosshairSettings() {
        const data = {
            type: document.getElementById('chType').value,
            size: document.getElementById('chSize').value,
            color: document.getElementById('chColor').value,
            thickness: document.getElementById('chThickness').value,
            opacity: document.getElementById('chOpacity').value
        };
        utils.set(STORAGE_KEY, data);
    }

    function loadCrosshairSettings() {
        return utils.get(STORAGE_KEY, null);
    }

    function createSettingsPanel() {
        const panel = utils.el('div', {
            id: 'crosshairSettings'
        });
        panel.innerHTML = `
            <label>Type:</label>
            <select id="chType">
                ${Object.keys(crosshairTypes).map(t => `<option value="${t}">${t}</option>`).join('')}
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
        // live update + save
        panel.addEventListener('input', () => {
            updateCrosshair();
            saveCrosshairSettings();
        });
        return panel;
    }

    function updateCrosshair() {
        const type = document.getElementById('chType').value;
        const size = parseInt(document.getElementById('chSize').value, 10);
        const color = document.getElementById('chColor').value;
        const thickness = parseInt(document.getElementById('chThickness').value, 10);
        const opacity = parseFloat(document.getElementById('chOpacity').value);
        const old = document.getElementById('customCrosshair');
        if (old) old.remove();
        document.body.appendChild(createCrosshair(type, size, color, thickness, opacity));
    }

    // Initialize crosshair UI
    const chPanel = createSettingsPanel();
    document.body.appendChild(chPanel);
    // Load saved settings
    (function initCrosshairFromSaved() {
        const saved = loadCrosshairSettings();
        if (saved) {
            try {
                document.getElementById('chType').value = saved.type;
                document.getElementById('chSize').value = saved.size;
                document.getElementById('chColor').value = saved.color;
                document.getElementById('chThickness').value = saved.thickness;
                document.getElementById('chOpacity').value = saved.opacity;
            } catch {}
        }
        updateCrosshair();
    })();
}

module.exports = { CrosshairOverlay };