function StatsOverlay(utils, theme) {
    const statsCSS = `
    #dsOverlayStats {
        position: fixed;
        top: 80px;
        left: 20px;
        gap: 10px;
        background: rgba(0, 0, 0, 0.4);
        padding: 12px;
        border-radius: 10px;
        color: ${theme.text1};
        z-index: 99999;
        cursor: move;
        white-space: nowrap;
    }`;

    utils.injectStyle(statsCSS);

    const overlayStats = utils.el('div', {
        id: 'dsOverlayStats',
        text: 'Loading stats...'
    });
    document.body.appendChild(overlayStats);

    let fps = 0;
    (function fpsLoop() {
        let last = performance.now();
        function tick() {
            const now = performance.now();
            fps = Math.round(1000 / (now - last));
            last = now;
            requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    })();

    let ping = 0;
    async function updatePing() {
        if (utils.getRaw("dsOverlayStats") !== "false") {
            const start = performance.now();
            try {
                await fetch("https://deadshot.io/", {
                    method: "HEAD",
                    cache: "no-store"
                });
                ping = Math.round(performance.now() - start);
            } catch {
                ping = -1;
            }
        }
    }

    function getCPU() {
        return navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'N/A';
    }

    function getOS() {
        return navigator.platform ? `${navigator.platform}` : 'N/A';
    }

    function getSens() {
        const data = utils.get('dsio:settings:2', null);
        return data?.[1]?.[7]?.[1]?.[1] ?? 'N/A';
    }

    function getDate() {
        try {
            const d = new Date();
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const yyyy = d.getFullYear();
            return `${yyyy}/${mm}/${dd}`;
        } catch { return 'N/A'; }
    }

    function getTime() {
        try {
            const d = new Date();
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            return `${hh}:${mm}`;
        } catch { return 'N/A'; }
    }

    function updateStatsVisibility() {
        const showDate = utils.getRaw("showDate") !== "false";
        const showTime = utils.getRaw("showTime") !== "false";
        const showOS = utils.getRaw("showOS") !== "false";
        const showCPU = utils.getRaw("showCPU") !== "false";
        const showSens = utils.getRaw("showSens") !== "false";
        const showFPS = utils.getRaw("showFPS") !== "false";
        const showPing = utils.getRaw("showPing") !== "false";
        
        let html = '';
        
        if (showDate) html += `Date: ${getDate()}<br>`;
        if (showTime) html += `Time: ${getTime()}<br>`;
        if (showOS) html += `OS: ${getOS()}<br>`;
        if (showCPU) html += `CPU: ${getCPU()}<br>`;
        if (showSens) html += `Sens: ${getSens()}<br>`;
        if (showFPS) html += `FPS: ${fps}<br>`;
        if (showPing) html += `Ping: ${ping === -1 ? 'offline' : ping + ' ms'}<br>`;

        overlayStats.innerHTML = html.trim();
    }

    setInterval(() => {
        updatePing();
        updateStatsVisibility();
    }, 1000);

    utils.makeDraggable(overlayStats, { storageKey: 'dsOverlayStats' });
}
module.exports = { StatsOverlay };