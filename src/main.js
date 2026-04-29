//  __   _  _  __ _  __  _  _  ____  ____  ____  ____
// /  \ ( \/ )(  ( \(  )/ )( \(  __)(  _ \/ ___)(  __)
//(  O )/ \/ \/    / )( \ \/ / ) _)  )   /\___ \ ) _) 
// \__/ \_)(_/\_)__)(__) \__/ (____)(__\_)(____/(____)
//
// DO NOT DISTRIBUTE WITHOUT CREDIT
// CREDITS: By xLiam1 | xliam.xyz

const { app, BrowserWindow, protocol, session, ipcMain } = require("electron");
const RPC = require("discord-rpc");
const path = require("path");
const fs = require("fs");
const { ElectronBlocker } = require("@ghostery/adblocker-electron");
const fetch = require("cross-fetch");
const betterWebRequest = require("electron-better-web-request");

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
  "AppleWebKit/537.36 (KHTML, like Gecko) " +
  "Chrome/135.0.0.0 Safari/537.36";

app.commandLine.appendSwitch("disable-blink-features", "AutomationControlled");

protocol.registerSchemesAsPrivileged([
  { scheme: "custom", privileges: { secure: true, standard: true, supportFetchAPI: true } }
]);

function resolveBase(startDir) {
  function findFolder(dir, name) {
	while (!fs.existsSync(path.join(dir, name)) && path.dirname(dir) !== dir) {
	  dir = path.dirname(dir);
	}
	return fs.existsSync(path.join(dir, name)) ? path.join(dir, name) : null;
  }

  const omniversePath =
	findFolder(startDir, "omniverse") ||
	findFolder(startDir, "app") ||
	findFolder(startDir, "src");

  if (!omniversePath) {
	console.error('Neither "omniverse", "app", nor "src" was found!');
	return null;
  }

  return path.basename(omniversePath) === "src"
	? omniversePath
	: path.join(omniversePath, "src");
}

const base = resolveBase(__dirname);
const omniversePath = path.dirname(base);

function loadSettings() {
  const settingsPath = path.join(base, "settings.json");
  try {
	return JSON.parse(fs.readFileSync(settingsPath, "utf8"));
  } catch {
	return { selectedSkins: {} };
  }
}

const settings = loadSettings();

if (settings.disableFrameRateLimit)
  app.commandLine.appendSwitch("disable-frame-rate-limit");
if (settings.forceHighPerformanceGPU)
  app.commandLine.appendSwitch("force_high_performance_gpu");

ipcMain.handle("get-settings", () => settings);

ipcMain.handle("save-settings", (event, newSettings) => {
  try {
	Object.assign(settings, newSettings);
	fs.writeFileSync(
	  path.join(base, "settings.json"),
	  JSON.stringify(settings, null, 2),
	  "utf8"
	);
	return { ok: true };
  } catch (err) {
	console.error("Failed to save settings:", err);
	return { ok: false, error: err.message };
  }
});

ipcMain.handle("resolve-path", (event, raw) => {
  return path.isAbsolute(raw) ? raw : path.join(base, raw);
});

let version = "Unknown";
try {
  version = fs.readFileSync(path.join(omniversePath, "version.txt"), "utf8").trim();
} catch (err) {
  console.warn("Failed to read version.txt:", err.message);
}

if (settings.rpc) {
  const clientId = "1426074176518881373";
  try {
	const rpcClient = new RPC.Client({ transport: "ipc" });
	rpcClient.on("ready", () => {
	  console.log("Discord RPC connected");
	  rpcClient.setActivity({
		details: "Playing Deadshot.io",
		state: "https://github.com/Typhoonz0/omniverse",
		largeImageKey: "logo",
		largeImageText: "Deadshot.io",
		startTimestamp: Date.now(),
		instance: true,
		buttons: [{ label: "download", url: "https://github.com/Typhoonz0/omniverse" }],
	  });
	});
	rpcClient.login({ clientId }).catch((err) => {
	  console.warn("Discord RPC failed to connect:", err.message);
	});
  } catch (err) {
	console.warn("Discord RPC initialization failed:", err.message);
  }
}


function findFileRecursive(baseDir, targetName) {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });
  for (const entry of entries) {
	const fullPath = path.join(baseDir, entry.name);
	if (entry.isFile() && entry.name === targetName) return fullPath;
	if (entry.isDirectory()) {
	  const result = findFileRecursive(fullPath, targetName);
	  if (result) return result;
	}
  }
  return null;
}

function stripModuleExports(code) {
  return code.replace(/^\s*module\.exports\s*=\s*.+;?\s*$/gm, "");
}

function buildRendererScript(payload, modules) {
  const p = JSON.stringify(payload);

  const utilsCode = stripModuleExports(modules.utilsCode);
  const statsCode = stripModuleExports(modules.statsCode);
  const keysCode = stripModuleExports(modules.keysCode);
  const guiCode = stripModuleExports(modules.guiCode);

  return [
	"(() => {",

	// Payload
	"const _payload = " + p + ";",
	"const selectedSkins = _payload.selectedSkins ?? {};",
	"const theme         = _payload.themeData    ?? null;",
	"const version       = _payload.version      ?? 'Unknown';",
	"const css           = _payload.css          ?? '';",
	"const settings      = _payload.settings     ?? {};",
	"const base          = _payload.base         ?? '';",

	// Settings helpers
	"function readSettings() {",
	"  return settings;",
	"}",
	"function writeSettings(obj) {",
	"  Object.assign(settings, obj);",
	"  window.omniverse.saveSettings(obj);",
	"}",

	// Modules
	utilsCode,
	statsCode,
	keysCode,
	guiCode,

	// Skin injection
	"if (Object.keys(selectedSkins).length > 0) {",
	"  const _parse = JSON.parse;",
	"  JSON.parse = function (text, reviver) {",
	"    let result;",
	"    try { result = _parse.call(this, text, reviver); }",
	"    catch (e) { throw e; }",
	"    if (",
	"      result &&",
	"      Array.isArray(result.skins) &&",
	"      Array.isArray(result.equippedSkins) &&",
	"      typeof result.username === 'string'",
	"    ) {",
	"      for (const [weapon, skinName] of Object.entries(selectedSkins)) {",
	"        if (!skinName || skinName === 'default') continue;",
	"        const skinObj = { name: skinName, weapon, wear: 0 };",
	"        if (!result.skins.some(s => s.name === skinName && s.weapon === weapon)) {",
	"          result.skins.push(skinObj);",
	"        }",
	"        const idx = result.equippedSkins.findIndex(s => s.weapon === weapon);",
	"        if (idx !== -1) result.equippedSkins[idx] = skinObj;",
	"        else result.equippedSkins.push(skinObj);",
	"      }",
	"    }",
	"    return result;",
	"  };",
	"}",

	// CSS
	"const _style = document.createElement('style');",
	"_style.textContent = css;",
	"document.head.appendChild(_style);",

	// Module calls
	"StatsOverlay(utils, theme);",
	"KeysOverlay(utils, theme);",
	"GUI(utils);",

	// Watermark
	"const _date = new Date().toLocaleDateString();",
	"const _osInfo = (utils && utils.OSInfo) ? utils.OSInfo() : 'Unknown OS';",
	"const _watermark = document.createElement('div');",
	"_watermark.textContent = 'Omniverse v' + version + ' | ' + _date + ' | ' + _osInfo;",
	"Object.assign(_watermark.style, {",
	"  position: 'fixed', bottom: '8px', left: '8px', opacity: '0.3',",
	"  color: '#fff', fontSize: '15px', zIndex: '999999',",
	"  pointerEvents: 'none', userSelect: 'none',",
	"  textShadow: '1px 1px 2px rgba(0,0,0,0.6)',",
	"});",
	"document.body.appendChild(_watermark);",

	"})();",
  ].join("\n");
}

function createWindow() {
  const win = new BrowserWindow({
	width: 1280,
	height: 800,
	title: "Omniverse",
	webPreferences: {
	  preload: path.join(__dirname, "preload.js"),
	  nodeIntegration: false,
	  contextIsolation: true,
	  webSecurity: false,
	  enableRemoteModule: true,
	  sandbox: false,
	},
  });

  win.setMenuBarVisibility(false);
  win.webContents.setUserAgent(USER_AGENT);

  /* Header sanitisation */
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
	const headers = details.requestHeaders;
	if (headers["User-Agent"]) {
	  headers["User-Agent"] = headers["User-Agent"]
		.replace(/Electron\/[^\s]+/g, "")
		.trim();
	}
	callback({ requestHeaders: headers });
  });

  if (settings.swapper) {
	const resourceFilter = {
	  urls: [
		"*://deadshot.io/weapons/*",
		"*://deadshot.io/skins/*",
		"*://deadshot.io/promo/*",
		"*://deadshot.io/textures/*",
		"*://deadshot.io/character/*",
		"*://deadshot.io/maps/*",
		"*://deadshot.io/audio/*",
	  ],
	};

	session.defaultSession.webRequest.onBeforeRequest(resourceFilter, (reqDetails, next) => {
	  const url = new URL(reqDetails.url);
	  const fileName = path.basename(url.pathname);
	  const swapRoot = path.join(__dirname, "swap");
	  console.log("intercepted:", fileName);
	  let foundFile = null;
	  if (fs.existsSync(swapRoot)) foundFile = findFileRecursive(swapRoot, fileName);
	  console.log("found:", foundFile);
	  if (foundFile) {
		const relative = path.relative(swapRoot, foundFile);
		next({ redirectURL: "custom://" + relative.replace(/\\/g, "/") });
	  } else {
		next({ cancel: false });
	  }
	});
  }


  /* Script injection */
  win.webContents.on("did-finish-load", () => {
	const utilsCode = fs.readFileSync(path.join(base, "modules", "utils.js"), "utf8");
	const statsCode = fs.readFileSync(path.join(base, "modules", "stats.js"), "utf8");
	const keysCode = fs.readFileSync(path.join(base, "modules", "keysoverlay.js"), "utf8");
	const guiCode = fs.readFileSync(path.join(base, "modules", "gui.js"), "utf8");

	let css = "";
	try {
	  css = fs.readFileSync(path.join(base, "modules", "style.css"), "utf8");
	} catch (err) {
	  console.warn("Failed to read style.css:", err.message);
	}

	const payload = {
	  selectedSkins: settings.selectedSkins ?? {},
	  themeData: settings.themeData ?? null,
	  version,
	  css,
	  settings,
	  base,
	};

	const script = buildRendererScript(payload, { utilsCode, statsCode, keysCode, guiCode });

	win.webContents
	  .executeJavaScript(script)
	  .then(() => console.log("Renderer script injected"))
	  .catch((err) => console.error("Failed to inject renderer script:", err));
  });

  // Adblocker also on defaultSession
  ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then((blocker) => {
	blocker.enableBlockingInSession(session.defaultSession);
  });

  win.loadURL("https://deadshot.io");
  return win;
}

app.whenReady().then(() => {
  // Allow multiple onBeforeRequest listeners (adblocker + swapper)
  betterWebRequest.default(session.defaultSession);
  session.defaultSession.webRequest.setResolver("onBeforeRequest", async (listeners) => {
	let finalResponse = { cancel: false };
	for (const listener of listeners) {
	  const result = await listener.apply();
	  finalResponse = { ...finalResponse, ...result };
	}
	return finalResponse;
  });

  if (settings.swapper) {
	protocol.handle("custom", async (req) => {
	  const relativePath = req.url.slice(9);
	  const localPath = path.join(__dirname, "swap", relativePath);
	  console.log("serving:", localPath);
	  try {
		const fileData = await fs.promises.readFile(localPath);
		return new Response(fileData, { headers: { "Content-Type": "image/webp" } });
	  } catch (err) {
		console.error("Failed to serve swap file:", err.message);
		return new Response("Not Found", { status: 404 });
	  }
	});
  }

  createWindow();

  app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});