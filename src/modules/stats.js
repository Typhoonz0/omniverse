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
        const start = performance.now();
        try {
            await fetch("https://deadshot.io/favicon.ico", {
                method: "HEAD",
                cache: "no-store"
            });
            ping = Math.round(performance.now() - start);
        } catch {
            ping = -1;
        }
    }

    function getCPU() {
        return navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} cores` : 'N/A';
    }

    function getOS() {
        return navigator.platform ? `${navigator.platform}` : 'N/A';
    }

    function getSens() {
        return utils.get('settings', {})?.sensitivity ?? 'N/A';
    }

    const regionMap = {
        "Europe": "EU",
        "North America": "NA",
        "Asia": "AS",
        "South America": "SA",
        "Australia": "AU",
        "South India": "IN"
    };

    function getServer() {
        const region = utils.get('settings', {})?.region ?? '-';
        return regionMap[region] ?? "-";
    }

    function updateStatsVisibility() {
        const showOS = utils.getRaw("showOS") !== "false";
        const showCPU = utils.getRaw("showCPU") !== "false";
        const showFPS = utils.getRaw("showFPS") !== "false";
        const showPing = utils.getRaw("showPing") !== "false";
        const showSens = utils.getRaw("showSens") !== "false";
        const showServer = utils.getRaw("showServer") !== "false";
        
        let html = '';
        
        if (showOS) html += `OS: ${getOS()}<br>`;
        if (showCPU) html += `CPU: ${getCPU()}<br>`;
        if (showFPS) html += `FPS: ${fps}<br>`;
        if (showPing) html += `Ping: ${ping === -1 ? 'offline' : ping + ' ms'}<br>`;
        if (showSens) html += `Sens: ${getSens()}<br>`;
        if (showServer) html += `Server: ${getServer()}<br>`;

        overlayStats.innerHTML = html.trim();
    }

    setInterval(() => {
        updatePing();
        updateStatsVisibility();
    }, 1000);

    utils.makeDraggable(overlayStats, { storageKey: 'dsOverlayStats' });
}
module.exports = { StatsOverlay };