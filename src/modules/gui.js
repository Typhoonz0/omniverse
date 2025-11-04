function GUI(utils, theme, themes, currentPreset) {
    // Find the omniverse folder automatically
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

let dir  = __dirname;
console.log(__dirname);
let omniversePath = findFolder(dir, 'omniverse');
let base;
if (!omniversePath) {
    // If omniverse not found, repeat search for 'app'
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
    const settingsPath = path.join(omniversePath, 'src', "settings.json");

    // Helper to read/write JSON safely
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

    const overlayDefs = [{
            id: 'dsOverlayStats',
            name: 'Overlay Stats',
            settingsId: null
        },
        {
            id: 'keyDisplayOverlay',
            name: 'Key Display',
            settingsId: null
        },
        {
            id: 'crosshairSettings',
            name: 'Crosshair Editor',
            settingsId: 'crosshairSettings'
        }
    ];

    const gui = utils.el('div', {
        id: 'dsGuiContainer'
    });

    Object.assign(gui.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        padding: '10px',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
        color: theme.text1,
        borderRadius: '8px',
        zIndex: '100000',
        border: `3px solid #${theme.red1}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: '180px',
        cursor: 'move'
    });
    
    document.body.appendChild(gui);
    let settings = readSettings();
    const title = utils.el('div', {
        text: `Omniverse | Toggle: ${settings.toggleKey}`
    });

    title.style.fontWeight = 'bold';
    title.style.textAlign = 'center';
    gui.appendChild(title);

    // overlay buttons container & state
    const overlayButtons = {};
    const state = {};
    overlayDefs.forEach(def => {
        const saved = utils.getRaw(def.id);
        state[def.id] = saved === null ? true : (saved === 'true' || saved === true);
    });

    for (const def of overlayDefs) {
        const btn = utils.el('button', {
            text: `${def.name}: ${state[def.id] ? 'ON' : 'OFF'}`
        });
        Object.assign(btn.style, {
            padding: '6px 12px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            color: theme.text1
        });
        gui.appendChild(btn);
        overlayButtons[def.id] = btn;
    }

    // Fetch rank button
    const fetchRankBtn = utils.el('button', {
        text: 'Fetch My Rank'
    });
    Object.assign(fetchRankBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        background: theme.blue1,
        color: theme.text1
    });
    gui.appendChild(fetchRankBtn);
    fetchRankBtn.addEventListener('click', async () => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = 0;
        overlay.style.left = 0;
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.background = 'rgba(0,0,0,0.6)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = 9999;

        const box = document.createElement('div');
        box.style.background = '#1e1e1e';
        box.style.padding = '30px';
        box.style.borderRadius = '10px';
        box.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
        box.style.textAlign = 'center';
        box.style.color = theme.text1;
        box.style.fontFamily = 'Arial, sans-serif';

        const label = document.createElement('div');
        label.textContent = 'Enter your username:';
        label.style.marginBottom = '10px';

        const input = document.createElement('input');
        input.type = 'text';
        input.style.padding = '10px';
        input.style.borderRadius = '5px';
        input.style.border = 'none';
        input.style.width = '200px';
        input.style.marginBottom = '10px';
        input.style.fontSize = '16px';

        const submit = document.createElement('button');
        submit.textContent = 'Submit';
        submit.style.padding = '10px 20px';
        submit.style.border = 'none';
        submit.style.borderRadius = '5px';
        submit.style.background = '#4CAF50';
        submit.style.color = theme.text1;
        submit.style.cursor = 'pointer';
        submit.style.fontSize = '16px';

        submit.addEventListener('click', async () => {
            const username = input.value.trim();
            console.log(username);
            if (!username) return;

            try {
                const rank = await fetchLeaderboardRank(username);
                alert(`${rank}`);
                document.body.removeChild(overlay);
            } catch (err) {
                console.error('Failed to fetch leaderboard rank:', err);
                alert('Failed to fetch rank');
                document.body.removeChild(overlay);
            }
        });


        box.appendChild(label);
        box.appendChild(input);
        box.appendChild(submit);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        input.focus();
    });

    // Reset button
    const resetBtn = utils.el('button', {
        text: 'Reset Omniverse'
    });
    Object.assign(resetBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        background: theme.red3,
        color: theme.text1
    });
    gui.appendChild(resetBtn);
    resetBtn.addEventListener('click', () => {
        const idsToReset = ['dsOverlayStats', 'keyDisplayOverlay', 'dsGuiContainer', 'minimalstats', 'theme'];
        idsToReset.forEach(id => {
            utils.remove(id + '_pos');
            utils.remove(id);
        });
        location.reload();
    });

    // Create the update button
    const updateBtn = utils.el('button', {
        text: 'Checking updates...'
    });
    Object.assign(updateBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        background: theme.yellow1,
        color: theme.text1
    });
    // Append it to the existing GUI container
    gui.appendChild(updateBtn);




    async function checkForUpdates() {
        try {
            // Fetch latest version from GitHub
            const res = await fetch('https://raw.githubusercontent.com/Typhoonz0/omniverse/main/version.txt');
            const remoteVersion = (await res.text()).trim();
            let dir = __dirname;
            while (!fs.existsSync(path.join(dir, 'omniverse')) && path.dirname(dir) !== dir)
                dir = path.dirname(dir);
        
            let versionPath = path.join(omniversePath, "version.txt");
            console.log(base, versionPath);
            if (base === omniversePath) {
                versionPath = path.join(omniversePath, "..","version.txt");
            }
            console.log(versionPath);
            let localVersion = 'unknown';

            try {
                localVersion = fs.readFileSync(versionPath, 'utf8').trim();
            } catch (err) {
                console.error('Failed to read version.txt:', err);
            }

            console.log('Local version:', localVersion);
            if (remoteVersion !== localVersion) {
                updateBtn.textContent = "Update Available!";
                updateBtn.style.background = "#4caf50";
                updateBtn.addEventListener('click', () => {
                    window.open('https://github.com/Typhoonz0/omniverse', '_blank');
                });
            } else {
                updateBtn.textContent = "Up to Date";
                updateBtn.style.background = theme.blue1;
                updateBtn.disabled = true;
            }
        } catch (err) {
            console.error("Update check failed:", err);
            updateBtn.textContent = "Update Check Failed";
            updateBtn.style.background = theme.red3;
        }
    }

    // Run update check after GUI has loaded
    checkForUpdates();

    const settingsBtn = utils.el('button', {
        text: 'Settings'
    });
    Object.assign(settingsBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        background: theme.purple1,
        color: theme.text1
    });
    gui.appendChild(settingsBtn);

    const settingsOverlay = utils.el('div', {
        id: 'omniverseSettingsOverlay'
    });
    Object.assign(settingsOverlay.style, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'none',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    });
    document.body.appendChild(settingsOverlay);

    const box = utils.el('div');
    Object.assign(box.style, {
        padding: '20px',
        borderRadius: '10px',
   //     width: '100px',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
        color: theme.text1,
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    });
    settingsOverlay.appendChild(box);

    const settingstitle = utils.el('div', {
        text: 'Omniverse Settings'
    });
    Object.assign(settingstitle.style, {
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: '8px'
    });
    box.appendChild(settingstitle);

    
    function saveTheme() {
        utils.setRaw('theme', JSON.stringify(theme));
    }

    function createColorEditor(box, theme) {
        const inputs = {};

        // Only add preset selector once
        if (!box.querySelector('#themePresetSelect')) {
            const presetRow = utils.el('div');
            Object.assign(presetRow.style, {
                display: 'flex',
                alignItems: 'center',
                marginBottom: '8px'
            });

            const presetLabel = utils.el('label', { text: 'Theme Preset:' });
            Object.assign(presetLabel.style, {
                flex: '1',
                fontSize: '0.9em'
            });

            const presetSelect = utils.el('select');
            presetSelect.id = 'themePresetSelect';
            Object.keys(themes).forEach(name => {
                const option = utils.el('option', { text: name, value: name });
                if (name === currentPreset) option.selected = true;
                presetSelect.appendChild(option);
            });
            const customOption = utils.el('option', { text: 'Custom', value: 'custom' });
            if (currentPreset === 'custom') customOption.selected = true;
            presetSelect.appendChild(customOption);

            presetRow.appendChild(presetLabel);
            presetRow.appendChild(presetSelect);
            box.appendChild(presetRow);

            presetSelect.addEventListener('change', () => {
                const selected = presetSelect.value;
                if (selected === 'custom') return;
                currentPreset = selected;
                const presetTheme = themes[selected];
                for (const key in presetTheme) {
                    if (inputs[key]) {
                        inputs[key].value = presetTheme[key];
                        theme[key] = presetTheme[key];
                        document.documentElement.style.setProperty(`--${key}`, presetTheme[key]);
                    }
                }
                saveTheme();
            });
        }

        // Add color inputs
        for (const key in theme) {
            if (!/^#[0-9A-Fa-f]{3,6}$/.test(theme[key])) continue;
            if (box.querySelector(`input[title="${key}"]`)) continue; // skip duplicates

            const row = utils.el('div');
            Object.assign(row.style, {
                display: 'flex',
                alignItems: 'center',
                marginBottom: '4px'
            });

            const label = utils.el('label', { text: key });
            Object.assign(label.style, {
                flex: '1',
                marginRight: '6px',
                fontSize: '0.85em'
            });

            const input = utils.el('input');
            Object.assign(input, { type: 'color', value: theme[key], title: key });
            Object.assign(input.style, {
                width: '24px',
                height: '24px',
                border: 'none',
                padding: '0',
                cursor: 'pointer'
            });

            inputs[key] = input;
            row.appendChild(label);
            row.appendChild(input);
            box.appendChild(row);

            input.addEventListener('input', () => {
                theme[key] = input.value;
                document.documentElement.style.setProperty(`--${key}`, input.value);
                if (currentPreset !== 'custom') {
                    currentPreset = 'custom';
                    const presetSelect = box.querySelector('#themePresetSelect');
                    if (presetSelect) presetSelect.value = 'custom';
                }
                saveTheme();
            });
        }

        for (const key in inputs) {
            document.documentElement.style.setProperty(`--${key}`, theme[key]);
        }
    }

    // Usage
    createColorEditor(box, theme);

    // === MINIMAL STATS TOGGLE ===
    let minimalStats = utils.getRaw('minimalstats') === 'true';

    const minimalBtn = utils.el('button', {
        text: `Minimal Stats: ${minimalStats ? 'ON' : 'OFF'}`
    });
    Object.assign(minimalBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: theme.text1,
        background: minimalStats ? theme.green1 : theme.red3
    });
    box.appendChild(minimalBtn);

    minimalBtn.addEventListener('click', () => {
        minimalStats = !minimalStats;
        utils.setRaw('minimalstats', minimalStats ? 'true' : 'false');
        minimalBtn.textContent = `Minimal Stats: ${minimalStats ? 'ON' : 'OFF'}`;
        minimalBtn.style.background = minimalStats ? theme.green1 : theme.red3;
        toggleMinimalStats(minimalStats); // apply changes immediately
    });



    const warntitle = utils.el('div', {
        text: 'NOTE: Restart client to apply changes'
    });
    Object.assign(warntitle.style, {
        fontSize: '12px',
        textAlign: 'center',
        marginBottom: '8px'
    });
    box.appendChild(warntitle);
        // === JS Executor Button ===
    const execBtn = utils.el('button', { text: 'Open JS Executor' });
    Object.assign(execBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        background: theme.red3,
        color: theme.text1
    });
    box.appendChild(execBtn);

    execBtn.addEventListener('click', () => {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 99999
        });

        const box = document.createElement('div');
        Object.assign(box.style, {
            background: '#1e1e1e',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 0 20px rgba(0,0,0,0.5)',
            width: '400px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            color: theme.text1,
            fontFamily: 'Arial, sans-serif'
        });

        const label = document.createElement('div');
        label.textContent = 'Enter JavaScript code:';
        label.style.fontWeight = 'bold';

        const input = document.createElement('textarea');
        Object.assign(input.style, {
            width: '100%',
            height: '120px',
            padding: '8px',
            borderRadius: '5px',
            border: 'none',
            background: '#111',
            color: theme.text1,
            fontFamily: 'monospace',
            fontSize: '14px'
        });

        const runBtn = document.createElement('button');
        runBtn.textContent = 'Run';
        Object.assign(runBtn.style, {
            padding: '8px 12px',
            border: 'none',
            borderRadius: '5px',
            background: theme.red1,
            color: theme.text1,
            cursor: 'pointer',
            fontWeight: 'bold'
        });

        const output = document.createElement('div');
        Object.assign(output.style, {
            background: '#000',
            color: '#0f0',
            padding: '6px',
            borderRadius: '5px',
            fontFamily: 'monospace',
            fontSize: '12px',
            minHeight: '60px',
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
        });

        runBtn.addEventListener('click', () => {
            const code = input.value.trim();
            if (!code) return;
            try {
                const result = eval(code);
                output.textContent = String(result);
            } catch (err) {
                output.textContent = 'Error: ' + err.message;
            }
        });

        // Optional: close overlay by clicking outside box
        overlay.addEventListener('click', e => {
            if (e.target === overlay) document.body.removeChild(overlay);
        });

        box.appendChild(label);
        box.appendChild(input);
        box.appendChild(runBtn);
        box.appendChild(output);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        input.focus();
    });
    // === TOGGLE GUI KEY BUTTON ===
    let toggleKey = settings.toggleKey ?? 'p'; // default key

    const toggleBtn = utils.el('button', {
        text: `Toggle GUI Key: ${toggleKey}`
    });
    Object.assign(toggleBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: theme.text1,
        background: theme.blue1
    });
    box.appendChild(toggleBtn);

    let waitingForKey = false;

    toggleBtn.addEventListener('click', () => {
        waitingForKey = true;
        toggleBtn.textContent = `Press any key...`;
        toggleBtn.style.background = theme.yellow1;
    });

    // Listen for key press to set the new toggle key
    window.addEventListener('keydown', (ev) => {
        if (!waitingForKey) return;

        const key = ev.key;
        toggleKey = key;
        settings.toggleKey = toggleKey;
        writeSettings(settings);

        toggleBtn.textContent = `Toggle GUI Key: ${toggleKey}`;
        toggleBtn.style.background = theme.blue1;
        waitingForKey = false;
    });


    // === ADBLOCKER BUTTON ===
    
    let adblocker = settings.adblocker ?? true; // default true

    const adblockBtn = utils.el('button', {
        text: `Adblocker (breaks skin swapper): ${adblocker ? 'ON' : 'OFF'}`
    });
    Object.assign(adblockBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: theme.text1,
        background: adblocker ? theme.green1 : theme.red3
    });
    box.appendChild(adblockBtn);

    adblockBtn.addEventListener('click', () => {
        adblocker = !adblocker;
        settings.adblocker = adblocker;
        writeSettings(settings);
        adblockBtn.textContent = `Adblocker (breaks skin swapper): ${adblocker ? 'ON' : 'OFF'}`;
        adblockBtn.style.background = adblocker ? theme.green1 : theme.red3;
    });

    // === RPC BUTTON ===
    let rpc = settings.rpc ?? true; // default true

    const rpcBtn = utils.el('button', {
        text: `Discord Status: ${rpc ? 'ON' : 'OFF'}`
    });
    Object.assign(rpcBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: theme.text1,
        background: rpc ? theme.green1 : theme.red3
    });
    box.appendChild(rpcBtn);

    rpcBtn.addEventListener('click', () => {
        rpc = !rpc;
        settings.rpc = rpc;
        writeSettings(settings);
        rpcBtn.textContent = `Discord Status: ${rpc ? 'ON' : 'OFF'}`;
        rpcBtn.style.background = rpc ? theme.green1 : theme.red3;
    });

    // === HIGH PERFORMANCE GPU BUTTON ===
    let highPerf = settings.forceHighPerformanceGPU ?? false; // default false

    const highPerfBtn = utils.el('button', {
        text: `High Performance Mode: ${highPerf ? 'ON' : 'OFF'}`
    });
    Object.assign(highPerfBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        color: theme.text1,
        background: highPerf ? theme.green1 : theme.red3
    });
    box.appendChild(highPerfBtn);

    highPerfBtn.addEventListener('click', () => {
        highPerf = !highPerf;

        // Sync both settings
        settings.forceHighPerformanceGPU = highPerf;
        settings.disableFrameRateLimit = highPerf;

        writeSettings(settings);

        highPerfBtn.textContent = `High Performance Mode: ${highPerf ? 'ON' : 'OFF'}`;
        highPerfBtn.style.background = highPerf ? theme.green1 : theme.red3;
    });

    // === APPLY BUTTON ===
    const applyThemeButton = utils.el('button', {
        text: 'Apply Theme (reloads page)'
    });
    Object.assign(applyThemeButton.style, {
        padding: '8px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        background: theme.purple1,
        color: theme.text1,
        fontWeight: 'bold'
    });
    applyThemeButton.addEventListener('click', () => {
        window.location.reload();
    });
    box.appendChild(applyThemeButton);

    // === CLOSE BUTTON ===
    const closeBtn = utils.el('button', {
        text: 'Close'
    });
    Object.assign(closeBtn.style, {
        padding: '8px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        background: theme.red3,
        color: theme.text1,
        fontWeight: 'bold'
    });
    closeBtn.addEventListener('click', () => {
        settingsOverlay.style.display = 'none';
    });
    box.appendChild(closeBtn);

    // === SETTINGS TOGGLE BUTTON ===
    settingsBtn.addEventListener('click', () => {
        settingsOverlay.style.display =
            settingsOverlay.style.display === 'none' ? 'flex' : 'none';
    });

    utils.makeDraggable(settingsOverlay);

    // Helper to update visibility and button text/style
    function updateVisibility(id, settingsId) {
        const elTarget = document.getElementById(id);
        if (elTarget) elTarget.style.display = state[id] ? '' : 'none';
        if (settingsId) {
            const settingsEl = document.getElementById(settingsId);
            if (settingsEl) settingsEl.style.display = state[id] ? 'block' : 'none';
        }
        const btn = overlayButtons[id];
        const def = overlayDefs.find(o => o.id === id);
        if (btn && def) {
            btn.textContent = `${def.name}: ${state[id] ? 'ON' : 'OFF'}`;
            btn.style.background = state[id] ? theme.green1 : theme.red3;
            utils.setRaw(id, state[id] ? 'true' : 'false');
        }
    }

    // initialize visibility and add click handlers
    overlayDefs.forEach(def => {
        updateVisibility(def.id, def.settingsId);
        const btn = overlayButtons[def.id];
        if (!btn) return;
        btn.addEventListener('click', () => {
            state[def.id] = !state[def.id];
            updateVisibility(def.id, def.settingsId);
        });
    });

    // Toggle GUI with P
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === settings.toggleKey) {
            gui.style.display = gui.style.display === 'none' ? 'flex' : 'none';
        }
    });

    // Make GUI draggable and persist
    utils.makeDraggable(gui, {
        storageKey: 'dsGuiContainer'
    });

    ['dsOverlayStats', 'keyDisplayOverlay', 'dsGuiContainer'].forEach(id => {
        const elNode = document.getElementById(id);
        if (!elNode) return;
        const pos = utils.loadPosition(id);
        if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
            elNode.style.left = pos.x + 'px';
            elNode.style.top = pos.y + 'px';
            elNode.style.right = 'auto';
        }
    });

    async function fetchLeaderboardRank(username) {
        try {
            const response = await fetch('https://login.deadshot.io/leaderboards');
            const data = await response.json();
            const categories = ["daily", "weekly", "alltime"];
            const result = {};

            for (const category of categories) {
                if (data[category] && data[category].kills) {
                    const leaderboard = data[category].kills;
                    leaderboard.sort((a, b) => b.kills - a.kills);
                    const player = leaderboard.find(p => p.name === username);
                    result[category] = player ? `#${leaderboard.indexOf(player) + 1}` : "Not found";
                } else {
                    result[category] = "Not found";
                }
            }

            // Convert to a string
            return `Daily: ${result.daily}\nWeekly: ${result.weekly}\nAll-time: ${result.alltime}`;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return "Daily: Error\nWeekly: Error\nAll-time: Error";
        }
    }



    const footer = utils.el('div', {
        text: 'xliam.space'
    });
    footer.style.textAlign = 'center';
    gui.appendChild(footer);
}

module.exports = { GUI }