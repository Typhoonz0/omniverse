function GUI(utils, theme, themes, currentPreset, CrosshairOverlay) {

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
    ];

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


    const settingsOverlay = utils.el('div', {
        id: 'omniverseSettingsOverlay'
    });
    Object.assign(settingsOverlay.style, {
        display: 'none',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    });


    const box = utils.el('div');
    Object.assign(box.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '10px',
        color: theme.text1,
        borderRadius: '10px',
        width: '100%',
        boxSizing: 'border-box',
    });


    settingsOverlay.appendChild(box);



    function saveTheme() {
        utils.setRaw('theme', JSON.stringify(theme));
    }

    function createColorEditor(box, theme) {
        const inputs = {};

        // --- THEME PRESET WINDOW ---
        function openPresetWindow() {
            // Remove existing window if any
            const existing = document.getElementById('themePresetWindow');
            if (existing) existing.remove();

            const presetWindow = document.createElement('div');
            presetWindow.id = 'themePresetWindow';
            Object.assign(presetWindow.style, {
                position: 'absolute',
                top: '50px',
                right: '200px',
                width: '200px',
                padding: '10px',
                background: '#222',
                color: '#fff',
                border: '1px solid #fff',
                borderRadius: '8px',
                zIndex: '9999',
                boxShadow: '0 0 10px rgba(0,0,0,0.7)',
            });
            document.body.appendChild(presetWindow);

            const title = document.createElement('h4');
            title.textContent = 'Theme Preset';
            Object.assign(title.style, { margin: '0 0 10px 0', fontSize: '1em' });
            presetWindow.appendChild(title);

            const presetSelect = document.createElement('select');
            presetSelect.id = 'themePresetSelect';
            Object.keys(themes).forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                if (name === currentPreset) option.selected = true;
                presetSelect.appendChild(option);
            });
            const customOption = document.createElement('option');
            customOption.value = 'custom';
            customOption.textContent = 'Custom';
            if (currentPreset === 'custom') customOption.selected = true;
            presetSelect.appendChild(customOption);
            presetWindow.appendChild(presetSelect);

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

            // Close button
            const closeBtn = document.createElement('button');
            closeBtn.textContent = 'Close';
            Object.assign(closeBtn.style, { marginTop: '10px', padding: '4px 8px', cursor: 'pointer' });
            closeBtn.addEventListener('click', () => presetWindow.remove());
            presetWindow.appendChild(closeBtn);
        }

        // Add a button to open the preset window
        const openPresetBtn = document.createElement('button');
        openPresetBtn.textContent = 'Open Theme Preset';
        Object.assign(openPresetBtn.style, { marginBottom: '10px', cursor: 'pointer' });
        openPresetBtn.addEventListener('click', openPresetWindow);
        box.appendChild(openPresetBtn);
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


    // === STATS TOGGLES ===
    const statsContainer = utils.el('div');
    Object.assign(statsContainer.style, {
        borderRadius: '6px',
        marginBottom: '10px'
    });

    const statsTitle = utils.el('div', { text: 'Stats Display' });
    Object.assign(statsTitle.style, {
        fontWeight: 'bold',
        marginBottom: '8px'
    });
    statsContainer.appendChild(statsTitle);

    const checkboxContainer = utils.el('div');
    Object.assign(checkboxContainer.style, {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px'
    });
    statsContainer.appendChild(checkboxContainer);

    const statOptions = [
        { id: 'showDate', label: 'Date' },
        { id: 'showTime', label: 'Time' },
        { id: 'showOS', label: 'OS' },
        { id: 'showCPU', label: 'CPU' },
        { id: 'showServer', label: 'Server' },
        { id: 'showSens', label: 'Sens' },
        { id: 'showFPS', label: 'FPS' },
        { id: 'showPing', label: 'Ping' }
    ];

    statOptions.forEach(stat => {
        const row = utils.el('div');
        Object.assign(row.style, {
            display: 'flex',
            alignItems: 'center',
            minWidth: 'fit-content'
        });

        const checkbox = utils.el('input');
        Object.assign(checkbox, {
            type: 'checkbox',
            id: stat.id,
            checked: utils.getRaw(stat.id) !== 'false' // default to true
        });
        Object.assign(checkbox.style, {
            marginRight: '4px'
        });

        const label = utils.el('label', { text: stat.label });
        Object.assign(label.style, {
            color: theme.text1,
            fontSize: '0.9em'
        });

        checkbox.addEventListener('change', () => {
            utils.setRaw(stat.id, checkbox.checked ? 'true' : 'false');
            updateStatsVisibility(); // Function to be implemented in stats.js
        });

        row.appendChild(checkbox);
        row.appendChild(label);
        checkboxContainer.appendChild(row);
    });

    box.appendChild(statsContainer);



    const warntitle = utils.el('div', {
        text: 'NOTE: Restart client to apply changes'
    });
    Object.assign(warntitle.style, {
        fontSize: '12px',
        textAlign: 'center',
        marginBottom: '8px'
    });
    box.appendChild(warntitle);

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

    let adblocker = settings.adblocker ?? false; // default false

    const adblockBtn = utils.el('button', {
        text: `Manual .webp swapper: ${adblocker ? 'ON' : 'OFF'}`
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
        adblockBtn.textContent = `Manual .webp swapper: ${adblocker ? 'ON' : 'OFF'}`;
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

    // === SETTINGS TOGGLE BUTTON ===
    settingsBtn.addEventListener('click', () => {
        settingsOverlay.style.display =
            settingsOverlay.style.display === 'none' ? 'flex' : 'none';
    });


    const gui = utils.el('div', {
        id: 'dsGuiContainer'
    });

    Object.assign(gui.style, {
        position: 'fixed',
        top: '10px',
        right: '10px',
        width: '200px',                        // same as your box
        paddingTop: '20px',
        paddingBottom: '20px',
        //background: 'rgba(0,0,0,0.4)',
        //backdropFilter: 'blur(10px)',
        color: theme.text1,
        borderRadius: '10px',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'move',
    });

    document.body.appendChild(gui);


    // --- Tabs container ---
    const tabs = utils.el('div');
    Object.assign(tabs.style, {
        display: 'flex',
        gap: '4px',
        marginBottom: '8px',
        flexDirection: 'column', // stack title above buttons
    });

    const title = utils.el('div', {
        text: `Omniverse | Toggle: ${settings.toggleKey}`
    });
    title.style.fontWeight = 'bold';
    title.style.textAlign = 'center';
    tabs.appendChild(title);

    // Tab buttons
    const mainTabBtn = utils.el('button', { text: 'Main' });
    const settingsTabBtn = utils.el('button', { text: 'Settings' });
    const themeTabBtn = utils.el('button', { text: 'Theme' });
    const crosshairTabBtn = utils.el('button', { text: 'Crosshair Editor' });
    const funTabBtn = utils.el('button', { text: 'Fun' });
    const bindsTabBtn = utils.el('button', { text: 'GIF' });

    [mainTabBtn, settingsTabBtn, themeTabBtn, crosshairTabBtn, funTabBtn, bindsTabBtn].forEach(btn => {
        Object.assign(btn.style, {
            flex: 1,
            padding: '6px 12px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold',
            color: theme.red1,
        });
        tabs.appendChild(btn);
    });

    gui.insertBefore(tabs, gui.firstChild);

    // --- Main GUI content ---
    const mainGui = utils.el('div');
    Object.assign(mainGui.style, {
        padding: '20px',
        width: '200px',
        backdropFilter: 'blur(10px)',
        color: theme.text1,
        borderRadius: '10px',
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'move',
    });

    // Move all existing children (except tabs) into mainGui
    while (gui.children.length > 1) {
        mainGui.appendChild(gui.children[1]);
    }
    gui.appendChild(mainGui);

    // --- Theme tab ---
    const themeTabContainer = utils.el('div');
    Object.assign(themeTabContainer.style, {
        display: 'none',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
    });
    createColorEditor(themeTabContainer, theme);
    gui.appendChild(themeTabContainer);
    // --- Fun tab container ---
    const funTabContainer = utils.el('div');
    Object.assign(funTabContainer.style, {
        display: 'none',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
    });

    // Create inner box for Fun tab content
    const funBox = utils.el('div');
    Object.assign(funBox.style, {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '10px',
        borderRadius: '10px',
        width: '100%',
        boxSizing: 'border-box',
    });

    if (settings.rainbow) {
        try {
        window.toggleRainbow();
        } catch {

        }
    }
    // --- Rainbow toggle button ---
    const rainbowBtn = utils.el('button', {
        text: `Rainbow: ${settings.rainbow ? 'ON' : 'OFF'}`
    });
    Object.assign(rainbowBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        background: settings.rainbow ? theme.blue1 : theme.red1,
        color: theme.text1,
    });

    // --- Toggle logic ---
    rainbowBtn.addEventListener('click', () => {
        settings.rainbow = !settings.rainbow; // flip state
        rainbowBtn.textContent = `Rainbow: ${settings.rainbow ? 'ON' : 'OFF'}`;
        rainbowBtn.style.background = settings.rainbow ? theme.blue1 : theme.red1;
            writeSettings(settings);
            window.toggleRainbow();
    });
    // --- Rainbow toggle button ---
    const funBtn = utils.el('button', {
        text: `Fun Mode (This tab's content) (reload client): ${settings.funMode ? 'ON' : 'OFF'}`
    });
    Object.assign(funBtn.style, {
        padding: '6px 12px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
        background: settings.funMode ? theme.blue1 : theme.red1,
        color: theme.text1,
    });

    // --- Toggle logic ---
    funBtn.addEventListener('click', () => {
        settings.funMode = !settings.funMode; // flip state
        funBtn.textContent = `Fun Mode (This tab's content): ${settings.funMode ? 'ON' : 'OFF'}`;
        funBtn.style.background = settings.funMode ? theme.blue1 : theme.red1;
            writeSettings(settings);
    });

    // Append button to funBox, then box to container
    funBox.appendChild(funBtn);
    funBox.appendChild(rainbowBtn);


Object.assign(bindsTabBtn.style, {
    flex: 1,
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: theme.red1,
});

tabs.appendChild(bindsTabBtn);
const bindsTabContainer = utils.el('div');
Object.assign(bindsTabContainer.style, {
    display: 'none',
    flexDirection: 'column',
    gap: '12px',
    padding: '8px',
    zIndex: 100000
});
gui.appendChild(bindsTabContainer);



// --- create GIF ---
const img = document.createElement("img");
img.src = `${base}/anime.gif`; // your base path variable
img.style.position = "absolute";
img.style.left = "200px";
img.style.top = "200px";
img.style.cursor = "grab";
img.style.zIndex = "999999";
document.body.appendChild(img);

// --- make draggable helper ---
utils.makeDraggable(img);

// --- apply initial scale and visibility ---
function applyGifScale() {
    img.style.width = `${img.naturalWidth * settings.animeGifScale}px`;
    img.style.height = `${img.naturalHeight * settings.animeGifScale}px`;
    img.style.display = settings.showAnimeGif ? "block" : "none";
}
img.onload = applyGifScale;
const gifNote = utils.el('div', {
    text: 'Change this by swapping out /resources/app/src/anime.gif'
});
Object.assign(gifNote.style, {
    padding: '6px 12px',
    borderRadius: '6px',
    background: theme.bgLight,
    color: theme.text1,
    fontSize: '12px',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '8px'
});

bindsTabContainer.appendChild(gifNote);
// --- toggle GIF visibility button ---
const toggleGifBtn = utils.el('button', {
    text: `Anime GIF: ${settings.showAnimeGif ? 'ON' : 'OFF'}`
});
Object.assign(toggleGifBtn.style, {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    background: settings.showAnimeGif ? theme.blue1 : theme.red1,
    color: theme.text1,
});
toggleGifBtn.addEventListener('click', () => {
    settings.showAnimeGif = !settings.showAnimeGif;
    toggleGifBtn.textContent = `Anime GIF: ${settings.showAnimeGif ? 'ON' : 'OFF'}`;
    toggleGifBtn.style.background = settings.showAnimeGif ? theme.blue1 : theme.red1;
    applyGifScale();
    writeSettings(settings);
});
bindsTabContainer.appendChild(toggleGifBtn);

// --- cycle size button ---
const sizeBtn = utils.el('button', {
    text: 'Size: Medium'
});
Object.assign(sizeBtn.style, {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    background: theme.bgLight,
    color: theme.text1,
});

// possible states
const sizes = [
    { name: 'Small', scale: 0.25 },
    { name: 'Medium', scale: 0.5 },
    { name: 'Large', scale: 1 }
];

// set initial button text based on current scale
let currentIndex = sizes.findIndex(s => s.scale === settings.animeGifScale);
if (currentIndex === -1) currentIndex = 1; // default to Medium
sizeBtn.textContent = `Size: ${sizes[currentIndex].name}`;

sizeBtn.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % sizes.length;
    const size = sizes[currentIndex];
    settings.animeGifScale = size.scale;
    sizeBtn.textContent = `Size: ${size.name}`;
    applyGifScale();
    writeSettings(settings);
});

bindsTabContainer.appendChild(sizeBtn);

// --- SKIN PRESET WINDOW ---
function openSkinPresetWindow() {
    // Remove existing if open
    const existing = document.getElementById('skinPresetWindow');
    if (existing) existing.remove();

    // Base window
    const presetWindow = document.createElement('div');
    presetWindow.id = 'skinPresetWindow';
    Object.assign(presetWindow.style, {
        position: 'absolute',
        top: '50px',
        right: '200px',
        width: '240px',
        padding: '10px',
        background: '#222',
        color: '#fff',
        border: '1px solid #fff',
        borderRadius: '8px',
        zIndex: '9999',
        boxShadow: '0 0 10px rgba(0,0,0,0.7)',
        fontFamily: 'sans-serif',
    });
    document.body.appendChild(presetWindow);

    const title = document.createElement('h4');
    title.textContent = 'Skin Presets (only works when signed in, choose default to use custom webp swapper)';
    Object.assign(title.style, { margin: '0 0 10px 0', fontSize: '1em', textAlign: 'center' });
    presetWindow.appendChild(title);

    // --- Available skins (even numbers only) ---
    const skins = {
        "384": "default", "385": "Default",
        "386": "bacon", "387": "Bacon",
        "388": "linen", "389": "Fresh Linen",
        "390": "greencamo", "391": "Green Camo",
        "392": "redcamo", "393": "Red Camo",
        "394": "tiger", "395": "Tigris",
        "396": "carbon", "397": "Carbon Fiber",
        "398": "cherry", "399": "Blossom",
        "400": "prism", "401": "Gem Stone",
        "402": "splatter", "403": "Marble",
        "404": "swirl", "405": "Swirl",
        "406": "vapor", "407": "Vapor Wave",
        "408": "astro", "409": "Astro",
        "410": "payday", "411": "Pay Day",
        "412": "safari", "413": "Safari",
        "414": "snowcamo", "415": "Snow Camo",
        "416": "rustic", "417": "Royal",
        "418": "hydro", "419": "Hydrodip",
        "420": "ice", "421": "Frostbite",
        "422": "silly", "423": "Silly",
        "424": "alez", "425": "Alez",
        "426": "horizon", "427": "Horizon",
        "428": "quackster", "429": "QuaK",
        "430": "matrix", "431": "Matrix",
        "432": "neon", "433": "Neon",
        "434": "winter", "435": "Winter '22",
        "436": "hlwn", "437": "HLWN '23",
        "438": "summer", "439": "Summer '24",
        "440": "birthday", "441": "1st Birthday",
    };

    const evenSkins = {};
    for (const [key, value] of Object.entries(skins)) {
        if (parseInt(key) % 2 === 0) {
            evenSkins[key] = value;
        }
    }

    // --- Load or default saved selection ---
    const saved = JSON.parse(localStorage.getItem('aura_selectedSkins') || '{}');
    const selected = Object.assign(
        { ar: 'default', smg: 'default', shotgun: 'default', awp: 'default' },
        saved
    );

    // --- Dropdown builder ---
    function createDropdown(labelText, key) {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '8px';

        const label = document.createElement('label');
        label.textContent = labelText;
        label.style.display = 'block';
        label.style.marginBottom = '4px';
        label.style.fontSize = '0.9em';

        const select = document.createElement('select');
        Object.assign(select.style, {
            width: '100%',
            padding: '4px',
            borderRadius: '4px',
            border: 'none',
            background: '#333',
            color: '#fff',
        });

        for (const val of Object.values(evenSkins)) {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = val.charAt(0).toUpperCase() + val.slice(1);
            if (selected[key] === val) option.selected = true;
            select.appendChild(option);
        }

        select.addEventListener('change', () => {
            selected[key] = select.value;
            localStorage.setItem('aura_selectedSkins', JSON.stringify(selected));
        });

        wrapper.appendChild(label);
        wrapper.appendChild(select);
        presetWindow.appendChild(wrapper);
    }

    createDropdown('AR Skin', 'ar');
    createDropdown('SMG Skin', 'smg');
    createDropdown('Shotgun Skin', 'shotgun');
    createDropdown('AWP Skin', 'awp');

    // --- Close button ---
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    Object.assign(closeBtn.style, {
        marginTop: '10px',
        padding: '4px 8px',
        cursor: 'pointer',
        width: '100%',
    });
    closeBtn.addEventListener('click', () => presetWindow.remove());
    presetWindow.appendChild(closeBtn);
}

// --- Button to open ---
const openSkinBtn = document.createElement('button');
openSkinBtn.textContent = 'Open Skin Preset';
Object.assign(openSkinBtn.style, {
    marginBottom: '10px',
    cursor: 'pointer',
});
openSkinBtn.addEventListener('click', openSkinPresetWindow);
funBox.appendChild(openSkinBtn);

    funTabContainer.appendChild(funBox);

    // Later, append funTabContainer to gui (after mainGui and other tab containers)
    gui.appendChild(funTabContainer);

    // --- Settings tab ---
    const settingsTabContainer = utils.el('div');
    Object.assign(settingsTabContainer.style, {
        display: 'none',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
    });
    settingsTabContainer.appendChild(box); // your original settings overlay content
    gui.appendChild(settingsTabContainer);

    // --- Crosshair tab ---
    const crosshairTabContainer = utils.el('div');
    Object.assign(crosshairTabContainer.style, {
        display: 'none',
        flexDirection: 'column',
        gap: '8px',
        padding: '8px',
    });
    const a = new CrosshairOverlay(utils); // from your crosshair editor
    let chPanel = a.createSettingsPanel();

    chPanel.style.position = 'relative'; // IMPORTANT: override fixed positioning
    console.log(chPanel);
    crosshairTabContainer.appendChild(chPanel);
    gui.appendChild(crosshairTabContainer);
    a.init();

    // --- Tab switching ---
    function showTab(tab) {
        // Hide all tabs
        mainGui.style.display = 'none';
        settingsTabContainer.style.display = 'none';
        themeTabContainer.style.display = 'none';
        crosshairTabContainer.style.display = 'none';
           funTabContainer.style.display = 'none'; // <-- new
        // Reset button styles
        [mainTabBtn, settingsTabBtn, themeTabBtn, crosshairTabBtn, funTabBtn, bindsTabBtn].forEach(btn => {
            btn.style.background = theme.red1;
            btn.style.color = theme.text1;
        });

        // Show selected tab
        if (tab === 'main') {
            mainGui.style.display = 'flex';
            mainTabBtn.style.background = theme.blue1;
        } else if (tab === 'settings') {
            settingsTabContainer.style.display = 'flex';
            settingsTabBtn.style.background = theme.blue1;
        } else if (tab === 'theme') {
            themeTabContainer.style.display = 'flex';
            themeTabBtn.style.background = theme.blue1;
        } else if (tab === 'crosshair') {
            crosshairTabContainer.style.display = 'flex';
            crosshairTabBtn.style.background = theme.blue1;
        }else if (tab === 'fun') { // <-- new
        funTabContainer.style.display = 'flex';
        funTabBtn.style.background = theme.blue1;
    }
            else if (tab === 'keybind') { // <-- new
        bindsTabContainer.style.display = 'flex';
        bindsTabBtn.style.background = theme.blue1;
    }
    }

    // Initial tab
    showTab('main');

    // Tab button listeners
    mainTabBtn.addEventListener('click', () => showTab('main'));
    settingsTabBtn.addEventListener('click', () => showTab('settings'));
    themeTabBtn.addEventListener('click', () => showTab('theme'));
    crosshairTabBtn.addEventListener('click', () => showTab('crosshair'));
    funTabBtn.addEventListener('click', () => showTab('fun'));
    bindsTabBtn.addEventListener('click', () => showTab('keybind'));
    // Hide old settings overlay if exists
    if (settingsBtn) settingsBtn.remove();
    if (settingsOverlay) settingsOverlay.style.display = 'none';


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
        mainGui.appendChild(btn);
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
    mainGui.appendChild(fetchRankBtn);
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
    mainGui.appendChild(resetBtn);
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
    mainGui.appendChild(updateBtn);




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
                versionPath = path.join(omniversePath, "..", "version.txt");
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