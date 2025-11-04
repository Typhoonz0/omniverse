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

    setInterval(() => {
        const minimalMode = utils.getRaw("minimalstats") === "true";

        if (minimalMode) {
            overlayStats.innerHTML = `
                FPS: ${fps}<br>
                Ping: ${ping === -1 ? 'offline' : ping + ' ms'}
            `;
        } else {
            overlayStats.innerHTML = `
                OS: ${getOS()}<br>
                CPU: ${getCPU()}<br>
                FPS: ${fps}<br>
                Ping: ${ping === -1 ? 'offline' : ping + ' ms'}
            `;
        }

        updatePing();
    }, 1000);

    utils.makeDraggable(overlayStats, { storageKey: 'dsOverlayStats' });
}
module.exports = { StatsOverlay };