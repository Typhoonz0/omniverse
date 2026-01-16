// if ur just looking here to make sure this isnt malware or ur curious go for it, but if youre the loser who keeps stealing my code fuck off or credit omniverse

const fs = require('fs');
const path = require('path');

(function () {
  function resolveBase(startDir) {
    function findFolder(dir, name) {
      while (!fs.existsSync(path.join(dir, name)) && path.dirname(dir) !== dir) {
        dir = path.dirname(dir);
      }
      return fs.existsSync(path.join(dir, name))
        ? path.join(dir, name)
        : null;
    }

    let omniversePath =
      findFolder(startDir, 'omniverse') ||
      findFolder(startDir, 'app') ||
      findFolder(startDir, 'src');

    if (!omniversePath) return null;

    return path.basename(omniversePath) === 'src'
      ? omniversePath
      : path.join(omniversePath, 'src');
  }

  const base = resolveBase(__dirname);
  if (!base) return;

  const settingsPath = path.join(base, 'settings.json');

  let selectedSkins = {};

  try {
    const raw = fs.readFileSync(settingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.selectedSkins) {
      selectedSkins = parsed.selectedSkins;
    }
  } catch (_) {}

  const originalJSONParse = JSON.parse;

  window.JSON.parse = function (text, reviver) {
    const result = originalJSONParse.call(this, text, reviver);

    if (
      result &&
      Array.isArray(result.skins) &&
      Array.isArray(result.equippedSkins) &&
      typeof result.username === 'string'
    ) {
      for (const [weapon, skinName] of Object.entries(selectedSkins)) {
        if (!skinName || skinName === 'default') continue;

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
})();
