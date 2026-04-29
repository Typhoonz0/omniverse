//  __   _  _  __ _  __  _  _  ____  ____  ____  ____
// /  \ ( \/ )(  ( \(  )/ )( \(  __)(  _ \/ ___)(  __)
//(  O )/ \/ \/    / )( \ \/ / ) _)  )   /\___ \ ) _) 
// \__/ \_)(_/\_)__)(__) \__/ (____)(__\_)(____/(____)
//
// DO NOT DISTRIBUTE WITHOUT CREDIT

// CREDITS:
// By xLiam1 | xliam.xyz

/* ----------------------------
   PAYLOAD (injected by main.js)
---------------------------- */

const _raw = process.argv.find(a => a.startsWith("--omniverse="));
const _payload = _raw ? JSON.parse(_raw.slice("--omniverse=".length)) : {};

const selectedSkins = _payload.selectedSkins ?? {};
const theme         = _payload.themeData    ?? null;
const version       = _payload.version      ?? "Unknown";

/* ----------------------------
   SKIN INJECTION
---------------------------- */

if (Object.keys(selectedSkins).length > 0) {
  const _parse = JSON.parse;

  JSON.parse = function (text, reviver) {
    let result;
    try {
      result = _parse.call(this, text, reviver);
    } catch (e) {
      throw e;
    }

    if (
      result &&
      Array.isArray(result.skins) &&
      Array.isArray(result.equippedSkins) &&
      typeof result.username === "string"
    ) {
      for (const [weapon, skinName] of Object.entries(selectedSkins)) {
        if (!skinName || skinName === "default") continue;

        const skinObj = { name: skinName, weapon, wear: 0 };

        if (!result.skins.some(s => s.name === skinName && s.weapon === weapon)) {
          result.skins.push(skinObj);
        }

        const idx = result.equippedSkins.findIndex(s => s.weapon === weapon);
        if (idx !== -1) {
          result.equippedSkins[idx] = skinObj;
        } else {
          result.equippedSkins.push(skinObj);
        }
      }
    }

    return result;
  };
}

/* ----------------------------
   MODULES (browser-safe, no fs/require)
---------------------------- */

const utils = window.__omniverseUtils;         // expected to be set by preload.js
const { StatsOverlay } = window.__omniverseStats;
const { KeysOverlay }  = window.__omniverseKeys;
const { GUI }          = window.__omniverseGUI;

utils.injectStyle(`
@import 'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap';
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'DM Sans', sans-serif;
}
`);

StatsOverlay(utils, theme);
KeysOverlay(utils, theme);
GUI(utils);

/* ----------------------------
   WATERMARK
---------------------------- */

const date   = new Date().toLocaleDateString();
const osInfo = utils?.OSInfo?.() ?? "Unknown OS";

const watermark = document.createElement("div");
watermark.textContent = `Omniverse v${version} | ${date} | ${osInfo}`;

Object.assign(watermark.style, {
  position:    "fixed",
  bottom:      "8px",
  left:        "8px",
  opacity:     "0.3",
  color:       "#fff",
  fontSize:    "15px",
  zIndex:      "999999",
  pointerEvents: "none",
  userSelect:  "none",
  textShadow:  "1px 1px 2px rgba(0,0,0,0.6)",
});

document.body.appendChild(watermark);