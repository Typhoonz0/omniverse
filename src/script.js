//  __   _  _  __ _  __  _  _  ____  ____  ____  ____
// /  \ ( \/ )(  ( \(  )/ )( \(  __)(  _ \/ ___)(  __)
//(  O )/ \/ \/    / )( \ \/ / ) _)  )   /\___ \ ) _) 
// \__/ \_)(_/\_)__)(__) \__/ (____)(__\_)(____/(____)
//
// DO NOT DISTRIBUTE WITHOUT CREDIT

// CREDITS:
// By xLiam1 | xliam.space

const fs = require('fs');
const path = require('path');

// Checks a few locations for the rest of the code as path.dirname and __dirname by default is different on the compiled release and the interpreted release 
// This is an Electron issue and i can't fix it
// This function would go in utils.js as it will belong in multiple files but I can't find utils.js without it 
function resolveBase(startDir) {
    function findFolder(dir, name) {
        while (!fs.existsSync(path.join(dir, name)) && path.dirname(dir) !== dir) {
            dir = path.dirname(dir);
        }
        return fs.existsSync(path.join(dir, name))
            ? path.join(dir, name)
            : null;
    }

    console.log(startDir);

    let omniversePath =
        findFolder(startDir, "omniverse") ||
        findFolder(startDir, "app") ||
        findFolder(startDir, "src");

    if (!omniversePath) {
        console.error('Neither "omniverse", "app", nor "src" was found!');
        return null;
    }

    console.log("Using folder:", omniversePath);

    return path.basename(omniversePath) === "src"
        ? omniversePath
        : path.join(omniversePath, "src");
}
base = resolveBase(__dirname);

const utils = require(path.join(base, 'modules', 'utils.js'));
const themes = require(path.join(base, 'themes.json'));
const { StatsOverlay } = require(path.join(base, 'modules', 'stats.js'));
const { KeysOverlay } = require(path.join(base, 'modules', 'keysoverlay.js'));
const { GUI } = require(path.join(base, 'modules', 'gui.js')); // Gui is created on import, lol

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

utils.injectStyle(`
@import 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap';
*{
    margin:0;
    padding:0;
    box-sizing:border-box;
    font-family:'DM Sans',sans-serif
}`)


StatsOverlay(utils, theme);
KeysOverlay(utils, theme);
GUI(utils); 

let version = 'Unknown';
try {
    const versionPath = path.resolve(omniversePath, 'version.txt');
    version = fs.readFileSync(versionPath, 'utf8').trim();
} catch (err) {
    console.error('Failed to read version.txt:', err);
}

const date = new Date().toLocaleDateString();
const osInfo = (utils && utils.OSInfo()) ? utils.OSInfo() : 'Unknown OS';

const watermark = document.createElement('div');
watermark.textContent = `Omniverse v${version} | ${date} | ${osInfo}`;

Object.assign(watermark.style, {
    position: 'fixed',
    bottom: '8px',
    left: '8px',
    opacity: '0.3',
    color: '#fff',
    fontSize: '20px',
    zIndex: '999999',
    pointerEvents: 'none',
    userSelect: 'none',
    textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
});

document.body.appendChild(watermark);
