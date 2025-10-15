//  __   _  _  __ _  __  _  _  ____  ____  ____  ____
// /  \ ( \/ )(  ( \(  )/ )( \(  __)(  _ \/ ___)(  __)
//(  O )/ \/ \/    / )( \ \/ / ) _)  )   /\___ \ ) _) 
// \__/ \_)(_/\_)__)(__) \__/ (____)(__\_)(____/(____)
//
// DO NOT DISTRIBUTE WITHOUT CREDIT

// CREDITS:
// By xLiam1 | xliam.space

const fs = require('fs')
const path = require('path');

let dir = __dirname;
while (!fs.existsSync(path.join(dir, 'omniverse')) && path.dirname(dir) !== dir)
    dir = path.dirname(dir);

const omniversePath = path.join(dir, 'omniverse');
const base = path.join(omniversePath, 'src');

const utils = require(path.join(base, 'modules', 'utils.js'));
const themes = require(path.join(base, 'themes.json'));
const { StatsOverlay } = require(path.join(base, 'modules', 'stats.js'));
const { KeysOverlay } = require(path.join(base, 'modules', 'keysoverlay.js'));
const { CrosshairOverlay } = require(path.join(base, 'modules', 'crosshair.js'));
const { GUI } = require(path.join(base, 'modules', 'gui.js'));

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
CrosshairOverlay(utils);
GUI(utils, theme, themes, currentPreset);
