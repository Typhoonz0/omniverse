const raw = process.argv.find(a => a.startsWith("--settings="));
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("omniverse", {
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (newSettings) => ipcRenderer.invoke("save-settings", newSettings),
});

const settings = raw ? JSON.parse(raw.slice("--settings=".length)) : {};
const selectedSkins = settings.selectedSkins ?? {};

if (Object.keys(selectedSkins).length > 0) {
  const _parse = JSON.parse;

  JSON.parse = function (text, reviver) {
    let result;
    
    try {
      result = _parse.call(this, text, reviver);
    } catch (e) {
      throw e;
    }
    console.log(result);
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